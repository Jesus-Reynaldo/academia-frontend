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
import type { Curso } from '../model/types'

interface CursoRowMenuProps {
  curso: Curso
  onEdit: (curso: Curso) => void
  onDelete: (curso: Curso) => void
}

/** Menú ⋮ de acciones por fila. Solo se renderiza para ADMIN (la API también lo exige). */
export function CursoRowMenu({ curso, onEdit, onDelete }: CursoRowMenuProps) {
  const menuId = useId()
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const open = Boolean(anchor)
  const close = () => setAnchor(null)

  return (
    <>
      <IconButton
        aria-label={`Acciones de ${curso.nombre}`}
        aria-haspopup="menu"
        aria-controls={open ? menuId : undefined}
        aria-expanded={open ? 'true' : undefined}
        onClick={(event) => setAnchor(event.currentTarget)}
        sx={{ width: 44, height: 44 }}
      >
        <MoreVert />
      </IconButton>
      <Menu id={menuId} anchorEl={anchor} open={open} onClose={close}>
        <MenuItem component={RouterLink} to={`/cursos/${curso.id}`} onClick={close}>
          <ListItemIcon>
            <VisibilityOutlined fontSize="small" />
          </ListItemIcon>
          <ListItemText>Ver detalle</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            close()
            onEdit(curso)
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
            onDelete(curso)
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
