import CloudDownloadOutlined from '@mui/icons-material/CloudDownloadOutlined'
import RestoreOutlined from '@mui/icons-material/RestoreOutlined'
import UploadFileOutlined from '@mui/icons-material/UploadFileOutlined'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Grid from '@mui/material/Grid'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRef, useState } from 'react'
import { apiDescargar, apiFetch, apiSubir } from '../../../shared/api/http'
import { friendlyMessage } from '../../../shared/api/errors'
import { useNotify } from '../../../shared/notifications/notifications-context'
import { ConfirmDialog } from '../../../shared/ui/ConfirmDialog'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { SectionCard } from '../../../shared/ui/SectionCard'

/** Nombres legibles de las tablas del respaldo (backend: src/respaldo/respaldo.util.ts). */
const TABLAS: Record<string, string> = {
  estudiante: 'Estudiantes',
  docente: 'Docentes',
  usuario: 'Cuentas de usuario',
  curso: 'Cursos',
  materia: 'Materias',
  periodoAcademico: 'Períodos',
  inscripcion: 'Inscripciones',
  calificacion: 'Calificaciones',
  asignacionDocente: 'Asignaciones docentes',
  bitacora: 'Registros de bitácora',
}

const numero = new Intl.NumberFormat('es-BO')

/** Respaldo (solo ADMIN): descargar toda la información y restaurarla desde un archivo. */
export function RespaldoPage() {
  const notify = useNotify()
  const queryClient = useQueryClient()
  const resumen = useQuery({
    queryKey: ['respaldo', 'resumen'],
    queryFn: ({ signal }) => apiFetch<Record<string, number>>('/respaldo/resumen', { signal }),
    staleTime: 0,
  })

  const descargar = useMutation({
    mutationFn: () => apiDescargar('/respaldo', 'backup-academico.json.gz'),
    onSuccess: (nombre) => notify(`Backup descargado: ${nombre}`),
  })

  const entrada = useRef<HTMLInputElement>(null)
  const [archivo, setArchivo] = useState<File | null>(null)
  const [confirmando, setConfirmando] = useState(false)
  const [texto, setTexto] = useState('')

  const restaurar = useMutation({
    mutationFn: async (elegido: File) => {
      // Primero se guarda el estado actual: si el archivo elegido no era el correcto, se puede volver atrás.
      const marca = new Date().toISOString().slice(0, 19).replace(/[-:]/g, '').replace('T', '-')
      await apiDescargar('/respaldo', '', `backup-antes-de-restaurar-${marca}.json.gz`)
      const datos = new FormData()
      datos.append('archivo', elegido)
      return apiSubir<{ generado: string; conteos: Record<string, number> }>('/respaldo/restaurar', datos)
    },
    onSuccess: (r) => {
      setConfirmando(false)
      setArchivo(null)
      setTexto('')
      if (entrada.current) entrada.current.value = ''
      // Todo cambió: se vuelve a pedir cada pantalla.
      void queryClient.invalidateQueries()
      notify(`Información restaurada al backup del ${new Date(r.generado).toLocaleString('es-BO')}`)
    },
  })

  const total = resumen.data ? Object.values(resumen.data).reduce((a, b) => a + b, 0) : null

  return (
    <>
      <PageHeader modulo="respaldo" title="Backup" subtitle="Copia de seguridad (backup) de toda la información del sistema" />

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <SectionCard title="Descargar backup" modulo="respaldo">
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Descarga un backup con todos los datos. Guárdalo en un lugar seguro (incluye las cuentas de acceso).
              Recomendado: uno por semana y antes de cambios grandes.
            </Typography>
            {resumen.isPending ? (
              <CircularProgress size={24} aria-label="Contando registros" />
            ) : resumen.isError ? (
              <Alert severity="error">{friendlyMessage(resumen.error)}</Alert>
            ) : (
              <dl className="m-0 mb-4 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                {Object.entries(TABLAS).map(([clave, etiqueta]) => (
                  <div key={clave} className="flex justify-between gap-2 border-b border-borde py-1">
                    <dt className="text-texto-suave">{etiqueta}</dt>
                    <dd className="m-0 font-semibold">{numero.format(resumen.data[clave] ?? 0)}</dd>
                  </div>
                ))}
              </dl>
            )}
            <Button
              variant="contained"
              startIcon={descargar.isPending ? <CircularProgress size={18} color="inherit" /> : <CloudDownloadOutlined />}
              disabled={descargar.isPending}
              onClick={() => descargar.mutate()}
              sx={{ minHeight: 44 }}
            >
              {descargar.isPending ? 'Preparando…' : `Descargar backup${total ? ` (${numero.format(total)} registros)` : ''}`}
            </Button>
            {descargar.isError && <Alert severity="error" sx={{ mt: 2 }}>{friendlyMessage(descargar.error)}</Alert>}
          </SectionCard>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <SectionCard title="Restaurar desde un backup">
            <Alert severity="warning" sx={{ mb: 2 }}>
              Restaurar <strong>reemplaza toda la información actual</strong> por la del archivo. Antes de hacerlo se
              descarga solo un backup del estado actual, por si necesitas volver atrás.
            </Alert>
            <input
              ref={entrada}
              id="archivo-respaldo"
              type="file"
              accept=".gz,.json,application/gzip,application/json"
              className="sr-only"
              onChange={(e) => {
                setArchivo(e.target.files?.[0] ?? null)
                restaurar.reset()
              }}
            />
            <div className="flex flex-wrap items-center gap-3">
              <Button component="label" htmlFor="archivo-respaldo" variant="outlined" startIcon={<UploadFileOutlined />} sx={{ minHeight: 44 }}>
                Elegir archivo
              </Button>
              <Typography variant="body2" color={archivo ? 'text.primary' : 'text.secondary'} sx={{ overflowWrap: 'anywhere' }}>
                {archivo ? `${archivo.name} (${numero.format(Math.ceil(archivo.size / 1024))} KB)` : 'Ningún archivo elegido'}
              </Typography>
            </div>
            <Button
              variant="contained"
              color="error"
              startIcon={<RestoreOutlined />}
              disabled={!archivo}
              onClick={() => setConfirmando(true)}
              sx={{ minHeight: 44, mt: 2 }}
            >
              Restaurar este backup
            </Button>
          </SectionCard>
        </Grid>
      </Grid>

      <ConfirmDialog
        open={confirmando}
        title="¿Restaurar este backup?"
        description={`Se reemplazarán TODOS los datos actuales por los de «${archivo?.name ?? ''}». Primero se descargará un backup del estado actual. Si el archivo trae datos inválidos no se cambia nada.`}
        confirmLabel={restaurar.isPending ? 'Restaurando…' : 'Restaurar'}
        loading={restaurar.isPending}
        hideConfirm={texto.trim().toUpperCase() !== 'CONFIRMAR'}
        onConfirm={() => archivo && restaurar.mutate(archivo)}
        onClose={() => {
          if (restaurar.isPending) return
          setConfirmando(false)
          setTexto('')
          restaurar.reset()
        }}
      >
        <TextField
          label="Escribe CONFIRMAR para continuar"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          fullWidth
          autoComplete="off"
          disabled={restaurar.isPending}
          sx={{ mt: 2 }}
        />
        {restaurar.isPending && (
          <Alert severity="info" sx={{ mt: 2 }}>Restaurando… puede tardar hasta un minuto. No cierres esta página.</Alert>
        )}
        {restaurar.isError && <Alert severity="error" sx={{ mt: 2 }}>{friendlyMessage(restaurar.error)}</Alert>}
      </ConfirmDialog>
    </>
  )
}
