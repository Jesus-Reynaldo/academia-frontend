import DeleteOutlined from '@mui/icons-material/DeleteOutlined'
import EditOutlined from '@mui/icons-material/EditOutlined'
import MoreVert from '@mui/icons-material/MoreVert'
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined'
import IconButton from '@mui/material/IconButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import { useId, useState } from 'react'
import { Link as RouterLink } from 'react-router'
import type { Docente } from '../model/types'

interface DocenteRowMenuProps {
  docente: Docente
  onEdit: (docente: Docente) => void
  onDelete: (docente: Docente) => void
}

/** Menú ⋮ de acciones por fila (la pantalla de docentes es solo para ADMIN). */
export function DocenteRowMenu({ docente, onEdit, onDelete }: DocenteRowMenuProps) {
  const menuId = useId()
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const open = Boolean(anchor)
  const close = () => setAnchor(null)

  return (
    <>
      <IconButton
        aria-label={`Acciones de ${docente.nombres} ${docente.apellidos}`}
        aria-haspopup="menu"
        aria-controls={open ? menuId : undefined}
        aria-expanded={open ? 'true' : undefined}
        onClick={(event) => setAnchor(event.currentTarget)}
        sx={{ width: 44, height: 44 }}
      >
        <MoreVert />
      </IconButton>
      <Menu id={menuId} anchorEl={anchor} open={open} onClose={close}>
        <MenuItem component={RouterLink} to={`/docentes/${docente.id}`} onClick={close}>
          <ListItemIcon>
            <VisibilityOutlined fontSize="small" />
          </ListItemIcon>
          <ListItemText>Ver ficha</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            close()
            onEdit(docente)
          }}
        >
          <ListItemIcon>
            <EditOutlined fontSize="small" />
          </ListItemIcon>
          <ListItemText>Editar</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            close()
            onDelete(docente)
          }}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon sx={{ color: 'inherit' }}>
            <DeleteOutlined fontSize="small" />
          </ListItemIcon>
          <ListItemText>Eliminar</ListItemText>
        </MenuItem>
      </Menu>
    </>
  )
}
