import EditOutlined from '@mui/icons-material/EditOutlined'
import { AccionesFila, type AccionFila } from '../../../shared/ui/AccionesFila'
import { useCambioEstado } from '../../../shared/ui/useCambioEstado'
import type { CuentaUsuario } from '../model/types'

interface UsuarioRowMenuProps {
  cuenta: CuentaUsuario
  esPropia: boolean
  onEdit: (cuenta: CuentaUsuario) => void
  /** Ya no se usa: en lugar de eliminar se desactiva la cuenta (no se borra). */
  onDelete?: (cuenta: CuentaUsuario) => void
}

/** Acciones como íconos. La cuenta se desactiva (no puede iniciar sesión) en lugar de borrarse. */
export function UsuarioRowMenu({ cuenta, esPropia, onEdit }: UsuarioRowMenuProps) {
  const estado = useCambioEstado({
    ruta: '/usuarios',
    id: cuenta.id,
    sujeto: cuenta.email,
    activo: cuenta.activo,
    alDesactivar: { activo: false },
    alActivar: { activo: true },
    efecto: 'La cuenta no podrá iniciar sesión y pasará al final de la lista.',
    bloqueado: esPropia && 'No puedes desactivar tu propia cuenta',
  })
  const acciones: AccionFila[] = [{ etiqueta: 'Editar', icono: <EditOutlined />, onClick: () => onEdit(cuenta) }]
  if (estado.accion) acciones.push(estado.accion)
  return (
    <>
      <AccionesFila sujeto={cuenta.email} acciones={acciones} />
      {estado.dialogo}
    </>
  )
}
