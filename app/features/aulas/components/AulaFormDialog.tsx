import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import { useId, useState } from 'react'
import { ApiError, friendlyMessage } from '../../../shared/api/errors'
import { useNotify } from '../../../shared/notifications/notifications-context'
import { useGuardarAula } from '../api/aulas'
import type { Aula } from '../model/types'

/** Alta y edición de un aula. Solo ADMIN. */
export function AulaFormDialog({ aula, onClose }: { aula: Aula | null; onClose: () => void }) {
  const titleId = useId()
  const notify = useNotify()
  const guardar = useGuardarAula()
  const [v, setV] = useState({
    codigo: aula?.codigo ?? '',
    nombre: aula?.nombre ?? '',
    capacidad: aula?.capacidad ? String(aula.capacidad) : '',
    ubicacion: aula?.ubicacion ?? '',
  })
  const [faltan, setFaltan] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const campo = (k: keyof typeof v) => ({
    value: v[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      setV((x) => ({ ...x, [k]: e.target.value }))
      setFaltan((f) => ({ ...f, [k]: '' }))
    },
  })

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const capacidad = v.capacidad.trim() ? Number(v.capacidad) : null
    const f: Record<string, string> = {}
    if (!v.codigo.trim()) f.codigo = 'Ingresa el código'
    if (!v.nombre.trim()) f.nombre = 'Ingresa el nombre'
    if (capacidad !== null && (!Number.isInteger(capacidad) || capacidad < 1 || capacidad > 1000)) f.capacidad = 'Un número entero entre 1 y 1000'
    if (Object.keys(f).length) return setFaltan(f)
    try {
      const r = await guardar.mutateAsync({
        id: aula?.id,
        input: {
          codigo: v.codigo.trim(),
          nombre: v.nombre.trim(),
          capacidad: capacidad ?? undefined,
          ubicacion: v.ubicacion.trim() || undefined,
        },
      })
      notify(aula ? `Se guardaron los cambios de «${r.nombre}».` : `Se registró «${r.nombre}».`)
      onClose()
    } catch (err) {
      setError(err instanceof ApiError && [400, 409].includes(err.status) ? err.messages.join(' ') : friendlyMessage(err))
    }
  }

  return (
    <Dialog open onClose={guardar.isPending ? undefined : onClose} fullWidth maxWidth="xs" aria-labelledby={titleId}>
      <form onSubmit={(e) => void enviar(e)} noValidate style={{ display: 'contents' }}>
        <DialogTitle id={titleId}>{aula ? 'Editar aula' : 'Nueva aula'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            {error && <Alert severity="error" role="alert">{error}</Alert>}
            <TextField label="Código" required autoFocus placeholder="A-101" {...campo('codigo')} error={Boolean(faltan.codigo)} helperText={faltan.codigo} />
            <TextField label="Nombre" required placeholder="Aula 101 / Laboratorio de Química" {...campo('nombre')} error={Boolean(faltan.nombre)} helperText={faltan.nombre} />
            <TextField label="Capacidad" type="number" slotProps={{ htmlInput: { min: 1, max: 1000, inputMode: 'numeric' } }} {...campo('capacidad')} error={Boolean(faltan.capacidad)} helperText={faltan.capacidad || 'Opcional: cuántos estudiantes caben.'} />
            <TextField label="Ubicación" placeholder="Bloque A, planta baja" {...campo('ubicacion')} helperText="Opcional." />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button onClick={onClose} disabled={guardar.isPending} sx={{ minHeight: 44 }}>Cancelar</Button>
          <Button type="submit" variant="contained" disabled={guardar.isPending} startIcon={guardar.isPending ? <CircularProgress size={16} color="inherit" /> : undefined} sx={{ minHeight: 44 }}>
            Guardar
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
