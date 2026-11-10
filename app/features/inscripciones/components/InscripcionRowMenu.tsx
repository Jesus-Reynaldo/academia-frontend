import DeleteOutlined from '@mui/icons-material/DeleteOutlined'
import MoreVert from '@mui/icons-material/MoreVert'
import SwapHoriz from '@mui/icons-material/SwapHoriz'
import IconButton from '@mui/material/IconButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import { useId, useState } from 'react'
import { ESTADOS_INSCRIPCION, ETIQUETA_ESTADO_INSCRIPCION, type EstadoInscripcion, type Inscripcion } from '../model/types'

interface InscripcionRowMenuProps {
  inscripcion: Inscripcion
  onCambiarEstado: (inscripcion: Inscripcion, estado: EstadoInscripcion) => void
  onDelete: (inscripcion: Inscripcion) => void
}

/** Menú ⋮ de acciones por fila. Solo se renderiza para ADMIN (la API también lo exige). */
export function InscripcionRowMenu({ inscripcion, onCambiarEstado, onDelete }: InscripcionRowMenuProps) {
  const menuId = useId()
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const open = Boolean(anchor)
  const close = () => setAnchor(null)
  const { nombres, apellidos } = inscripcion.estudiante

  return (
    <>
      <IconButton
        aria-label={`Acciones de la inscripción de ${nombres} ${apellidos}`}
        aria-haspopup="menu"
        aria-controls={open ? menuId : undefined}
        aria-expanded={open ? 'true' : undefined}
        onClick={(event) => setAnchor(event.currentTarget)}
        sx={{ width: 44, height: 44 }}
      >
        <MoreVert />
      </IconButton>
      <Menu id={menuId} anchorEl={anchor} open={open} onClose={close}>
        {ESTADOS_INSCRIPCION.filter((estado) => estado !== inscripcion.estado).map((estado) => (
          <MenuItem
            key={estado}
            onClick={() => {
              close()
              onCambiarEstado(inscripcion, estado)
            }}
          >
            <ListItemIcon>
              <SwapHoriz fontSize="small" />
            </ListItemIcon>
            <ListItemText>{`Marcar como ${ETIQUETA_ESTADO_INSCRIPCION[estado]}`}</ListItemText>
          </MenuItem>
        ))}
        <MenuItem
          onClick={() => {
            close()
            onDelete(inscripcion)
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
