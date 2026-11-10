import DeleteOutlined from '@mui/icons-material/DeleteOutlined'
import EditOutlined from '@mui/icons-material/EditOutlined'
import MoreVert from '@mui/icons-material/MoreVert'
import IconButton from '@mui/material/IconButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import { useId, useState } from 'react'
import type { CuentaUsuario } from '../model/types'

interface UsuarioRowMenuProps {
  cuenta: CuentaUsuario
  esPropia: boolean
  onEdit: (cuenta: CuentaUsuario) => void
  onDelete: (cuenta: CuentaUsuario) => void
}

/** Menú ⋮ de acciones. La cuenta propia no se puede eliminar: la opción aparece deshabilitada con su explicación. */
export function UsuarioRowMenu({ cuenta, esPropia, onEdit, onDelete }: UsuarioRowMenuProps) {
  const menuId = useId()
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const open = Boolean(anchor)
  const close = () => setAnchor(null)

  return (
    <>
      <IconButton
        aria-label={`Acciones de ${cuenta.email}`}
        aria-haspopup="menu"
        aria-controls={open ? menuId : undefined}
        aria-expanded={open ? 'true' : undefined}
        onClick={(event) => setAnchor(event.currentTarget)}
        sx={{ width: 44, height: 44 }}
      >
        <MoreVert />
      </IconButton>
      <Menu id={menuId} anchorEl={anchor} open={open} onClose={close}>
        <MenuItem
          onClick={() => {
            close()
            onEdit(cuenta)
          }}
        >
          <ListItemIcon>
            <EditOutlined fontSize="small" />
          </ListItemIcon>
          <ListItemText>Editar</ListItemText>
        </MenuItem>
        <MenuItem
          disabled={esPropia}
          onClick={() => {
            close()
            onDelete(cuenta)
          }}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon sx={{ color: 'inherit' }}>
            <DeleteOutlined fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Eliminar" secondary={esPropia ? 'No puedes eliminar tu propia cuenta' : undefined} />
        </MenuItem>
      </Menu>
    </>
  )
}
