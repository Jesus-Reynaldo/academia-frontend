import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import { useId, useState } from 'react'
import { ApiError, friendlyMessage } from '../../../shared/api/errors'
import { useNotify } from '../../../shared/notifications/notifications-context'
import { CursoSelect } from '../../cursos'
import { DocenteSelect } from '../../docentes'
import { MateriaSelect } from '../../materias'
import { PeriodoSelect } from '../../periodos-academicos'
import { useActualizarAsignacion, useCrearAsignacion } from '../api/useAsignaciones'
import type { AsignacionDocente } from '../model/types'

interface AsignacionFormDialogProps {
  /** Con una asignación: edición. Sin ella: alta. */
  asignacion: AsignacionDocente | null
  /** Valores iniciales para un alta (p. ej. el docente filtrado en la lista). */
  inicial?: { docenteId?: number; cursoId?: number; periodoAcademicoId?: number }
  onClose: () => void
}

type Campo = 'docenteId' | 'periodoAcademicoId' | 'cursoId' | 'materiaId'
const OBLIGATORIO: Record<Campo, string> = {
  docenteId: 'Elige el docente',
  periodoAcademicoId: 'Elige el período académico',
  cursoId: 'Elige el curso',
  materiaId: 'Elige la materia',
}

/** Asignar (o cambiar) qué materia dicta un docente, en qué curso y período. Solo ADMIN. */
export function AsignacionFormDialog({ asignacion, inicial, onClose }: AsignacionFormDialogProps) {
  const titleId = useId()
  const theme = useTheme()
  const esMovil = useMediaQuery(theme.breakpoints.down('sm'))
  const notify = useNotify()
  const crear = useCrearAsignacion()
  const actualizar = useActualizarAsignacion()
  const guardando = crear.isPending || actualizar.isPending

  const [valores, setValores] = useState<Record<Campo, number | null>>({
    docenteId: asignacion?.docenteId ?? inicial?.docenteId ?? null,
    periodoAcademicoId: asignacion?.periodoAcademicoId ?? inicial?.periodoAcademicoId ?? null,
    cursoId: asignacion?.cursoId ?? inicial?.cursoId ?? null,
    materiaId: asignacion?.materiaId ?? null,
  })
  const [faltan, setFaltan] = useState<Partial<Record<Campo, string>>>({})
  const [error, setError] = useState<string | null>(null)
  const [hechas, setHechas] = useState<string[]>([])
  const cambiar = (campo: Campo) => (id: number | null) => {
    setValores((v) => ({ ...v, [campo]: id }))
    setFaltan((f) => ({ ...f, [campo]: undefined }))
  }

  const guardar = async (asignarOtra: boolean) => {
    setError(null)
    const vacios = (Object.keys(OBLIGATORIO) as Campo[]).filter((c) => valores[c] === null)
    if (vacios.length) {
      setFaltan(Object.fromEntries(vacios.map((c) => [c, OBLIGATORIO[c]])))
      return
    }
    const input = {
      docenteId: valores.docenteId!,
      periodoAcademicoId: valores.periodoAcademicoId!,
      cursoId: valores.cursoId!,
      materiaId: valores.materiaId!,
    }
    try {
      if (asignacion) {
        const r = await actualizar.mutateAsync({ id: asignacion.id, input })
        notify(`Se guardaron los cambios: ${r.materia.nombre} en ${r.curso.nombre}.`)
        onClose()
        return
      }
      const r = await crear.mutateAsync(input)
      const texto = `${r.materia.nombre} en ${r.curso.nombre} (${r.periodoAcademico.nombre})`
      notify(`Se asignó ${texto} a ${r.docente.nombres} ${r.docente.apellidos}.`)
      if (asignarOtra) {
        // Se conservan docente, período y curso: así se asignan varias materias seguidas.
        setHechas((h) => [...h, r.materia.nombre])
        setValores((v) => ({ ...v, materiaId: null }))
      } else {
        onClose()
      }
    } catch (e) {
      setError(e instanceof ApiError && [400, 403, 404, 409].includes(e.status) ? e.messages.join(' ') : friendlyMessage(e))
    }
  }

  return (
    <Dialog open onClose={guardando ? undefined : onClose} fullWidth maxWidth="sm" fullScreen={esMovil} aria-labelledby={titleId}>
      <DialogTitle id={titleId}>{asignacion ? 'Editar asignación' : 'Nueva asignación docente'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            El docente verá solo las materias y cursos que tenga asignados, y solo podrá registrar calificaciones en ellos.
          </Typography>
          {error && (
            <Alert severity="error" role="alert">
              {error}
            </Alert>
          )}
          {hechas.length > 0 && (
            <Alert severity="success">
              Ya asignadas en esta ventana: {hechas.join(', ')}. Elige otra materia o cierra.
            </Alert>
          )}
          <DocenteSelect
            value={valores.docenteId}
            onChange={cambiar('docenteId')}
            required
            error={Boolean(faltan.docenteId)}
            helperText={faltan.docenteId}
          />
          <PeriodoSelect
            value={valores.periodoAcademicoId}
            onChange={cambiar('periodoAcademicoId')}
            excluirFinalizados={!asignacion}
            label="Período académico"
            required
            error={Boolean(faltan.periodoAcademicoId)}
            helperText={faltan.periodoAcademicoId}
          />
          <CursoSelect
            value={valores.cursoId}
            onChange={cambiar('cursoId')}
            soloActivos
            required
            error={Boolean(faltan.cursoId)}
            helperText={faltan.cursoId}
          />
          <MateriaSelect
            value={valores.materiaId}
            onChange={cambiar('materiaId')}
            soloActivas
            required
            error={Boolean(faltan.materiaId)}
            helperText={faltan.materiaId ?? 'Una materia, en un curso y período, la dicta un solo docente.'}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Button onClick={onClose} disabled={guardando} sx={{ minHeight: 44 }}>
          {hechas.length ? 'Cerrar' : 'Cancelar'}
        </Button>
        {!asignacion && (
          <Button variant="outlined" disabled={guardando} onClick={() => void guardar(true)} sx={{ minHeight: 44 }}>
            Guardar y asignar otra materia
          </Button>
        )}
        <Button
          variant="contained"
          disabled={guardando}
          onClick={() => void guardar(false)}
          startIcon={guardando ? <CircularProgress size={16} color="inherit" /> : undefined}
          sx={{ minHeight: 44 }}
        >
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  )
}
