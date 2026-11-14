import DeleteOutlined from '@mui/icons-material/DeleteOutlined'
import SaveOutlined from '@mui/icons-material/SaveOutlined'
import UploadFileOutlined from '@mui/icons-material/UploadFileOutlined'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Grid from '@mui/material/Grid'
import Skeleton from '@mui/material/Skeleton'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRef, useState, type FormEvent } from 'react'
import { apiFetch, apiSubir } from '../../../shared/api/http'
import { friendlyMessage } from '../../../shared/api/errors'
import { LogoInstitucion } from '../../../shared/institucion/LogoInstitucion'
import { institucionKey, useInstitucion, type Institucion } from '../../../shared/institucion/useInstitucion'
import { useNotify } from '../../../shared/notifications/notifications-context'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { SectionCard } from '../../../shared/ui/SectionCard'

const TIPOS = ['image/png', 'image/jpeg', 'image/webp']
const MAXIMO = 1024 * 1024

/** Configuración (solo ADMIN): nombre, sigla y logotipo de la institución, visibles en todo el sistema. */
export function ConfiguracionPage() {
  const notify = useNotify()
  const queryClient = useQueryClient()
  const institucion = useInstitucion()
  const actualizar = (datos: Institucion) => queryClient.setQueryData(institucionKey, datos)

  // --- Logotipo ---
  const entrada = useRef<HTMLInputElement>(null)
  const [errorArchivo, setErrorArchivo] = useState<string | null>(null)
  const subir = useMutation({
    mutationFn: (archivo: File) => {
      const datos = new FormData()
      datos.append('logo', archivo)
      return apiSubir<Institucion>('/configuracion/logo', datos, 'PUT')
    },
    onSuccess: (datos) => {
      actualizar(datos)
      notify('Se cambió el logotipo.')
    },
    onSettled: () => {
      if (entrada.current) entrada.current.value = ''
    },
  })
  const quitar = useMutation({
    mutationFn: () => apiFetch<Institucion>('/configuracion/logo', { method: 'DELETE' }),
    onSuccess: (datos) => {
      actualizar(datos)
      notify('Se quitó el logotipo.')
    },
  })
  const elegir = (archivo: File | undefined) => {
    setErrorArchivo(null)
    subir.reset()
    if (!archivo) return
    // Se revisa aquí para avisar al instante; el servidor vuelve a comprobarlo.
    if (!TIPOS.includes(archivo.type)) return setErrorArchivo('El logotipo debe ser una imagen PNG, JPG o WEBP.')
    if (archivo.size > MAXIMO) return setErrorArchivo('El logotipo no puede pesar más de 1 MB.')
    subir.mutate(archivo)
  }

  return (
    <>
      <PageHeader modulo="configuracion" title="Configuración" subtitle="Datos de la institución que se muestran en todo el sistema" />

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 7 }}>
          <SectionCard title="Datos de la institución">
            {!institucion.data ? (
              <Skeleton variant="rounded" height={160} />
            ) : (
              <FormularioDatos datos={institucion.data} onGuardado={actualizar} />
            )}
          </SectionCard>
        </Grid>

        <Grid size={{ xs: 12, md: 5 }}>
          <SectionCard title="Logotipo">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="grid h-40 w-40 place-items-center rounded-2xl border border-dashed border-borde bg-fondo">
                <LogoInstitucion tamano={128} className="bg-primary text-white" />
              </div>
              <Typography variant="body2" color="text.secondary">
                {institucion.logoUrl ? 'Logotipo actual.' : 'Sin logotipo: se muestra el ícono por defecto.'} PNG, JPG o WEBP de hasta
                1 MB; mejor cuadrado y con fondo transparente.
              </Typography>
              <input
                ref={entrada}
                id="archivo-logo"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="sr-only"
                onChange={(e) => elegir(e.target.files?.[0])}
              />
              <div className="flex flex-wrap justify-center gap-2">
                <Button
                  component="label"
                  htmlFor="archivo-logo"
                  variant="contained"
                  startIcon={subir.isPending ? <CircularProgress size={18} color="inherit" /> : <UploadFileOutlined />}
                  disabled={subir.isPending}
                  sx={{ minHeight: 44 }}
                >
                  {institucion.logoUrl ? 'Cambiar logotipo' : 'Subir logotipo'}
                </Button>
                {institucion.logoUrl && (
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteOutlined />}
                    disabled={quitar.isPending}
                    onClick={() => quitar.mutate()}
                    sx={{ minHeight: 44 }}
                  >
                    Quitar
                  </Button>
                )}
              </div>
              {(errorArchivo || subir.isError || quitar.isError) && (
                <Alert severity="error" sx={{ width: '100%', textAlign: 'left' }}>
                  {errorArchivo ?? friendlyMessage(subir.error ?? quitar.error)}
                </Alert>
              )}
            </div>
          </SectionCard>
        </Grid>
      </Grid>
    </>
  )
}

/** Formulario de nombre y sigla. Arranca con los datos guardados (se monta cuando ya llegaron). */
function FormularioDatos({ datos, onGuardado }: { datos: Institucion; onGuardado: (d: Institucion) => void }) {
  const notify = useNotify()
  const [nombre, setNombre] = useState(datos.nombreInstitucion)
  const [sigla, setSigla] = useState(datos.sigla ?? '')
  const guardar = useMutation({
    mutationFn: () => apiFetch<Institucion>('/configuracion', { method: 'PATCH', body: { nombreInstitucion: nombre.trim(), sigla: sigla.trim() } }),
    onSuccess: (guardados) => {
      onGuardado(guardados)
      notify('Se guardaron los datos de la institución.')
    },
  })
  const nombreError = nombre.trim() === '' ? 'Escribe el nombre de la institución.' : null
  const sinCambios = nombre.trim() === datos.nombreInstitucion && sigla.trim() === (datos.sigla ?? '')
  const enviar = (e: FormEvent) => {
    e.preventDefault()
    if (!nombreError) guardar.mutate()
  }
  return (
    <form onSubmit={enviar} noValidate className="flex flex-col gap-4">
      <TextField
        label="Nombre de la institución"
        required
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        error={Boolean(nombreError)}
        helperText={nombreError ?? 'Aparece en el inicio de sesión, el menú y la pestaña del navegador.'}
        slotProps={{ htmlInput: { maxLength: 150 } }}
        fullWidth
      />
      <TextField
        label="Sigla (opcional)"
        value={sigla}
        onChange={(e) => setSigla(e.target.value)}
        helperText="Versión corta para el menú, p. ej. UESA. Si la dejas vacía se usa el nombre completo."
        slotProps={{ htmlInput: { maxLength: 20 } }}
        fullWidth
      />
      {guardar.isError && <Alert severity="error">{friendlyMessage(guardar.error)}</Alert>}
      <div>
        <Button
          type="submit"
          variant="contained"
          startIcon={guardar.isPending ? <CircularProgress size={18} color="inherit" /> : <SaveOutlined />}
          disabled={guardar.isPending || Boolean(nombreError) || Boolean(sinCambios)}
          sx={{ minHeight: 44 }}
        >
          Guardar
        </Button>
      </div>
    </form>
  )
}
