import EditOutlined from '@mui/icons-material/EditOutlined'
import { AccionesFila, type AccionFila } from '../../../shared/ui/AccionesFila'
import { useCambioEstado } from '../../../shared/ui/useCambioEstado'
import type { AsignacionDocente } from '../model/types'

/** Editar y activar/desactivar (las asignaciones no se eliminan). Solo ADMIN. */
export function AsignacionRowMenu({ asignacion: a, onEdit }: { asignacion: AsignacionDocente; onEdit: (a: AsignacionDocente) => void }) {
  const sujeto = `${a.materia.nombre} en ${a.curso.nombre} (${a.docente.nombres} ${a.docente.apellidos})`
  const estado = useCambioEstado({
    ruta: '/asignaciones-docentes',
    id: a.id,
    sujeto,
    activo: a.estado === 'ACTIVA',
    alDesactivar: { estado: 'INACTIVA' },
    alActivar: { estado: 'ACTIVA' },
    efecto: 'El docente dejará de ver esta materia en este curso y no podrá registrar nuevas calificaciones en ella. Sus notas ya registradas se conservan.',
  })
  const acciones: AccionFila[] = [{ etiqueta: 'Editar', icono: <EditOutlined />, onClick: () => onEdit(a) }]
  if (estado.accion) acciones.push(estado.accion)
  return (
    <>
      <AccionesFila sujeto={sujeto} acciones={acciones} />
      {estado.dialogo}
    </>
  )
}
