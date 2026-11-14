import CheckCircleOutlined from '@mui/icons-material/CheckCircleOutlined'
import DownloadOutlined from '@mui/icons-material/DownloadOutlined'
import ErrorOutlined from '@mui/icons-material/ErrorOutlined'
import PersonAddAltOutlined from '@mui/icons-material/PersonAddAltOutlined'
import UploadFileOutlined from '@mui/icons-material/UploadFileOutlined'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import LinearProgress from '@mui/material/LinearProgress'
import Typography from '@mui/material/Typography'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useId, useRef, useState } from 'react'
import { friendlyMessage } from '../../../shared/api/errors'
import { useInstitucion } from '../../../shared/institucion/useInstitucion'
import {
  cargarContexto,
  descargarPlantilla,
  importarFilas,
  leerPlanilla,
  type FilaImportacion,
  type ResultadoFila,
} from '../importar/importarExcel'

type Etapa = 'inicio' | 'revisando' | 'importando' | 'terminado'

/** Paso numerado de la ventana. */
function Paso({ numero, titulo, children }: { numero: number; titulo: string; children: React.ReactNode }) {
  return (
    <section className="mb-5 flex gap-3" aria-label={`Paso ${numero}: ${titulo}`}>
      <span aria-hidden className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary text-sm font-bold text-white">{numero}</span>
      <div className="min-w-0 flex-1">
        <Typography variant="subtitle1" component="h3" sx={{ fontWeight: 700, mb: 0.5 }}>{titulo}</Typography>
        {children}
      </div>
    </section>
  )
}

/** Importar inscripciones desde Excel: descargar planilla → subirla llena → revisar → importar. Solo ADMIN. */
export function ImportarInscripcionesDialog({ onClose }: { onClose: () => void }) {
  const theme = useTheme()
  const pantallaChica = useMediaQuery(theme.breakpoints.down('sm'))
  const tituloId = useId()
  const queryClient = useQueryClient()
  const institucion = useInstitucion()
  const contexto = useQuery({ queryKey: ['importar-inscripciones', 'contexto'], queryFn: cargarContexto, staleTime: 0 })
  const entrada = useRef<HTMLInputElement>(null)
  const [etapa, setEtapa] = useState<Etapa>('inicio')
  const [error, setError] = useState<string | null>(null)
  const [descargando, setDescargando] = useState(false)
  const [archivo, setArchivo] = useState<string>('')
  const [filas, setFilas] = useState<FilaImportacion[]>([])
  const [hechas, setHechas] = useState(0)
  const [resultados, setResultados] = useState<ResultadoFila[]>([])

  const validas = filas.filter((f) => f.errores.length === 0)
  const conErrores = filas.length - validas.length
  const nuevos = new Set(validas.filter((f) => f.accion === 'nuevo').map((f) => f.codigo.toLowerCase())).size

  const descargar = async () => {
    if (!contexto.data) return
    setDescargando(true)
    setError(null)
    try {
      await descargarPlantilla(contexto.data, institucion.nombre)
    } catch (e) {
      setError(friendlyMessage(e))
    } finally {
      setDescargando(false)
    }
  }

  const leer = async (elegido: File | undefined) => {
    if (!elegido || !contexto.data) return
    setError(null)
    setArchivo(elegido.name)
    setEtapa('revisando')
    try {
      setFilas(await leerPlanilla(elegido, contexto.data))
    } catch (e) {
      setFilas([])
      setError(e instanceof Error ? e.message : friendlyMessage(e))
    } finally {
      if (entrada.current) entrada.current.value = ''
    }
  }

  const importar = async () => {
    setEtapa('importando')
    setHechas(0)
    const r = await importarFilas(validas, setHechas)
    setResultados(r)
    setEtapa('terminado')
    // Inscripciones, estudiantes, cursos (cupos) e Inicio cambian: se vuelven a pedir.
    void queryClient.invalidateQueries()
  }

  const exitosas = resultados.filter((r) => r.ok).length

  return (
    <Dialog open onClose={etapa === 'importando' ? undefined : onClose} fullScreen={pantallaChica} maxWidth="md" fullWidth aria-labelledby={tituloId}>
      <DialogTitle id={tituloId}>Importar inscripciones desde Excel</DialogTitle>
      <DialogContent dividers>
        {contexto.isPending ? (
          <div className="grid place-items-center py-10"><CircularProgress aria-label="Preparando" /></div>
        ) : contexto.isError ? (
          <Alert severity="error">{friendlyMessage(contexto.error)}</Alert>
        ) : etapa === 'importando' || etapa === 'terminado' ? (
          <>
            <Typography sx={{ mb: 1 }}>
              {etapa === 'importando' ? `Importando… ${hechas} de ${validas.length}` : `Listo: ${exitosas} de ${validas.length} inscripciones registradas.`}
            </Typography>
            <LinearProgress variant="determinate" value={validas.length ? (hechas / validas.length) * 100 : 100} aria-label="Avance de la importación" sx={{ mb: 2, height: 8, borderRadius: 4 }} />
            {etapa === 'terminado' && (
              <>
                {exitosas < validas.length && (
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    El servidor rechazó {validas.length - exitosas} {validas.length - exitosas === 1 ? 'fila' : 'filas'}: revisa el motivo, corrige la planilla y súbela de nuevo (las ya registradas no se duplican: el servidor las rechaza).
                  </Alert>
                )}
                <ListaResultados resultados={resultados} />
              </>
            )}
          </>
        ) : (
          <>
            <Paso numero={1} titulo="Descarga la planilla">
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                Trae listas desplegables con los {contexto.data.cursos.length} cursos activos y las {contexto.data.periodos.length} gestiones vigentes, e instrucciones.
                Si el código del estudiante ya existe se usa; si es nuevo, se crea con sus datos.
              </Typography>
              <Button variant="outlined" startIcon={descargando ? <CircularProgress size={18} /> : <DownloadOutlined />} disabled={descargando} onClick={() => void descargar()} sx={{ minHeight: 44 }}>
                Descargar planilla vacía
              </Button>
            </Paso>
            <Paso numero={2} titulo="Sube la planilla llena">
              <input ref={entrada} id="planilla-inscripciones" type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" className="sr-only" onChange={(e) => void leer(e.target.files?.[0])} />
              <div className="flex flex-wrap items-center gap-3">
                <Button component="label" htmlFor="planilla-inscripciones" variant="contained" startIcon={<UploadFileOutlined />} sx={{ minHeight: 44 }}>
                  {archivo ? 'Elegir otro archivo' : 'Elegir archivo .xlsx'}
                </Button>
                {archivo && <Typography variant="body2" sx={{ overflowWrap: 'anywhere' }}>{archivo}</Typography>}
              </div>
            </Paso>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {filas.length > 0 && (
              <Paso numero={3} titulo="Revisa antes de importar">
                <div className="mb-2 flex flex-wrap gap-2" role="status">
                  <Chip icon={<CheckCircleOutlined />} color="success" variant="outlined" label={`${validas.length} ${validas.length === 1 ? "lista" : "listas"}`} />
                  {nuevos > 0 && <Chip icon={<PersonAddAltOutlined />} color="primary" variant="outlined" label={`${nuevos} ${nuevos === 1 ? "estudiante nuevo" : "estudiantes nuevos"}`} />}
                  {conErrores > 0 && <Chip icon={<ErrorOutlined />} color="error" variant="outlined" label={`${conErrores} con errores (no se importan)`} />}
                </div>
                <VistaPrevia filas={filas} />
              </Paso>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 1.5, gap: 1, flexWrap: 'wrap' }}>
        {etapa === 'terminado' ? (
          <Button variant="contained" onClick={onClose} sx={{ minHeight: 44 }}>Cerrar</Button>
        ) : (
          <>
            <Button onClick={onClose} disabled={etapa === 'importando'} sx={{ minHeight: 44 }}>Cancelar</Button>
            <Button variant="contained" disabled={validas.length === 0 || etapa === 'importando'} onClick={() => void importar()} sx={{ minHeight: 44 }}>
              {etapa === 'importando' ? 'Importando…' : `Importar ${validas.length} ${validas.length === 1 ? 'inscripción' : 'inscripciones'}`}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  )
}

/** Tabla de revisión: cada fila con su estado y, si tiene errores, el motivo. */
function VistaPrevia({ filas }: { filas: FilaImportacion[] }) {
  return (
    <div className="max-h-80 overflow-auto rounded-lg border border-borde" tabIndex={0} aria-label="Vista previa de la planilla">
      <table className="w-full border-collapse text-sm">
        <thead className="sticky top-0 bg-fondo">
          <tr className="text-left">
            {['Fila', 'Estudiante', 'Curso', 'Gestión', 'Estado'].map((t) => <th key={t} scope="col" className="px-2 py-2 font-semibold">{t}</th>)}
          </tr>
        </thead>
        <tbody>
          {filas.map((f) => (
            <tr key={f.fila} className={`border-t border-borde align-top ${f.errores.length ? 'bg-peligro-tint/40' : ''}`}>
              <td className="px-2 py-1.5">{f.fila}</td>
              <td className="px-2 py-1.5">
                <span className="font-semibold">{f.codigo || '—'}</span> {f.nombre}
                {f.accion === 'nuevo' && f.codigo && <span className="ml-1 rounded bg-primary-tint px-1.5 text-xs text-primary">nuevo</span>}
              </td>
              <td className="px-2 py-1.5">{f.curso || '—'}</td>
              <td className="px-2 py-1.5">{f.gestion || '—'}</td>
              <td className="px-2 py-1.5">
                {f.errores.length === 0 ? (
                  <span className="font-semibold text-ok">✓ Lista</span>
                ) : (
                  <ul className="m-0 list-none p-0 text-peligro">{f.errores.map((e) => <li key={e}>✗ {e}</li>)}</ul>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ListaResultados({ resultados }: { resultados: ResultadoFila[] }) {
  return (
    <div className="max-h-80 overflow-auto rounded-lg border border-borde" tabIndex={0} aria-label="Resultado de la importación">
      <table className="w-full border-collapse text-sm">
        <thead className="sticky top-0 bg-fondo">
          <tr className="text-left">{['Fila', 'Estudiante', 'Resultado'].map((t) => <th key={t} scope="col" className="px-2 py-2 font-semibold">{t}</th>)}</tr>
        </thead>
        <tbody>
          {resultados.map((r) => (
            <tr key={r.fila} className="border-t border-borde align-top">
              <td className="px-2 py-1.5">{r.fila}</td>
              <td className="px-2 py-1.5">{r.nombre}</td>
              <td className={`px-2 py-1.5 font-medium ${r.ok ? 'text-ok' : 'text-peligro'}`}>{r.ok ? '✓' : '✗'} {r.mensaje}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
