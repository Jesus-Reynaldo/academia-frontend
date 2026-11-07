import type { SxProps, Theme } from '@mui/material/styles'

/** Oculta el texto a la vista pero lo deja disponible para lectores de pantalla. */
export const visuallyHidden: SxProps<Theme> = {
  border: 0,
  clip: 'rect(0 0 0 0)',
  height: '1px',
  margin: '-1px',
  overflow: 'hidden',
  padding: 0,
  position: 'absolute',
  whiteSpace: 'nowrap',
  width: '1px',
}
