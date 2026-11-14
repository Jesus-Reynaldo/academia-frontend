import ContentCopyOutlined from '@mui/icons-material/ContentCopyOutlined'
import NetworkCheckOutlined from '@mui/icons-material/NetworkCheckOutlined'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import FormControlLabel from '@mui/material/FormControlLabel'
import IconButton from '@mui/material/IconButton'
import Skeleton from '@mui/material/Skeleton'
import Switch from '@mui/material/Switch'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '../../../shared/api/http'
import { friendlyMessage } from '../../../shared/api/errors'
import { useNotify } from '../../../shared/notifications/notifications-context'
import { SectionCard } from '../../../shared/ui/SectionCard'

interface EstadoDespertador {
  activo: boolean
  url: string
  urlPublica: boolean
  intervaloMinutos: number
  ultimo: { fecha: string; ok: boolean; detalle: string } | null
}

const clave = ['configuracion', 'despertador'] as const
const hora = new Intl.DateTimeFormat('es-BO', { dateStyle: 'short', timeStyle: 'short' })

/**
 * Despertador del servidor (como en cea-pro): encendido, el backend se visita cada 10 minutos por su URL pública
 * para que Render (se duerme a los ~15 min) y Aiven (la base) no se apaguen por inactividad.
 */
export function Despertador() {
  const notify = useNotify()
  const queryClient = useQueryClient()
  const estado = useQuery({
    queryKey: clave,
    queryFn: ({ signal }) => apiFetch<EstadoDespertador>('/configuracion/despertador', { signal }),
    // Mientras está encendido se actualiza solo, para ver la última visita sin recargar.
    refetchInterval: (q) => (q.state.data?.activo ? 60_000 : false),
  })
  const guardar = (datos: EstadoDespertador) => queryClient.setQueryData(clave, datos)
  const cambiar = useMutation({
    mutationFn: (activo: boolean) => apiFetch<EstadoDespertador>('/configuracion/despertador', { method: 'PATCH', body: { activo } }),
    onSuccess: (datos) => {
      guardar(datos)
      notify(datos.activo ? 'Despertador encendido.' : 'Despertador apagado.')
    },
  })
  const probar = useMutation({
    mutationFn: () => apiFetch<EstadoDespertador>('/configuracion/despertador/probar', { method: 'POST' }),
    onSuccess: (datos) => {
      guardar(datos)
      notify(datos.ultimo?.ok ? 'El servidor respondió bien.' : 'La visita falló: revisa el detalle.', datos.ultimo?.ok ? 'success' : 'error')
    },
  })

  const d = estado.data
  return (
    <SectionCard title="Despertador del servidor">
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        En el plan gratis, Render apaga el servidor tras unos 15 minutos sin visitas y Aiven apaga la base tras varios días
        sin uso. Encendido, el servidor se visita a sí mismo cada 10 minutos (consultando la base) y no se duerme.
      </Typography>
      {estado.isPending ? (
        <Skeleton variant="rounded" height={120} />
      ) : estado.isError || !d ? (
        <Alert severity="error">{friendlyMessage(estado.error)}</Alert>
      ) : (
        <div className="flex flex-col gap-3">
          <FormControlLabel
            control={<Switch checked={d.activo} disabled={cambiar.isPending} onChange={(e) => cambiar.mutate(e.target.checked)} />}
            label={<strong>{d.activo ? `Encendido · cada ${d.intervaloMinutos} min` : 'Apagado'}</strong>}
          />

          <div className={`rounded-lg px-3 py-2 text-sm ${!d.ultimo ? 'bg-fondo text-texto-suave' : d.ultimo.ok ? 'bg-ok-tint text-ok' : 'bg-peligro-tint text-peligro'}`} role="status">
            {d.ultimo
              ? `Última visita: ${hora.format(new Date(d.ultimo.fecha))} · ${d.ultimo.ok ? 'respondió bien' : 'falló'} (${d.ultimo.detalle})`
              : 'Todavía no hubo visitas desde que arrancó el servidor.'}
          </div>

          {!d.urlPublica && (
            <Alert severity="info">
              Ahora el servidor corre en tu computadora y se visita en <strong>localhost</strong>: sirve para probar. Publicado
              en Render usa sola su dirección pública (RENDER_EXTERNAL_URL).
            </Alert>
          )}

          <div>
            <Typography variant="caption" color="text.secondary">
              Dirección que se visita (también sirve para un monitor externo como UptimeRobot):
            </Typography>
            <div className="mt-1 flex items-center gap-1 rounded-lg border border-borde bg-fondo pl-3">
              <code tabIndex={0} aria-label="Dirección que se visita" className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap text-sm">{d.url}</code>
              <Tooltip title="Copiar dirección">
                <IconButton
                  aria-label="Copiar dirección"
                  sx={{ width: 44, height: 44 }}
                  onClick={() => void navigator.clipboard.writeText(d.url).then(() => notify('Dirección copiada.'))}
                >
                  <ContentCopyOutlined fontSize="small" />
                </IconButton>
              </Tooltip>
            </div>
          </div>

          <div>
            <Button
              variant="outlined"
              startIcon={probar.isPending ? <CircularProgress size={18} /> : <NetworkCheckOutlined />}
              disabled={probar.isPending}
              onClick={() => probar.mutate()}
              sx={{ minHeight: 44 }}
            >
              Probar ahora
            </Button>
          </div>
          {(cambiar.isError || probar.isError) && <Alert severity="error">{friendlyMessage(cambiar.error ?? probar.error)}</Alert>}
        </div>
      )}
    </SectionCard>
  )
}
