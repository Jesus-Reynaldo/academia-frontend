import DeleteOutlined from '@mui/icons-material/DeleteOutlined'
import EditOutlined from '@mui/icons-material/EditOutlined'
import { AccionesFila } from '../../../shared/ui/AccionesFila'
import type { CuentaUsuario } from '../model/types'

interface UsuarioRowMenuProps {
  cuenta: CuentaUsuario
  esPropia: boolean
  onEdit: (cuenta: CuentaUsuario) => void
  onDelete: (cuenta: CuentaUsuario) => void
}

/** Acciones como íconos. La cuenta propia no se puede eliminar: el ícono aparece deshabilitado y explica por qué. */
export function UsuarioRowMenu({ cuenta, esPropia, onEdit, onDelete }: UsuarioRowMenuProps) {
  return (
    <AccionesFila
      sujeto={cuenta.email}
      acciones={[
        { etiqueta: 'Editar', icono: <EditOutlined />, onClick: () => onEdit(cuenta) },
        {
          etiqueta: 'Eliminar',
          icono: <DeleteOutlined />,
          tono: 'peligro',
          deshabilitada: esPropia && 'No puedes eliminar tu propia cuenta',
          onClick: () => onDelete(cuenta),
        },
      ]}
    />
  )
}
