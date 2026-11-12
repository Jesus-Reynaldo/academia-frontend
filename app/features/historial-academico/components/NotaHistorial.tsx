import ErrorOutlined from '@mui/icons-material/ErrorOutlined'
import Box from '@mui/material/Box'
import { formatNota } from '../../../shared/lib/format'
import { visuallyHidden } from '../../../shared/ui/visuallyHidden'
import { estaDebajo } from '../model/desglose'

interface NotaHistorialProps {
  nota: number | null
  /** Promedios en negrita. */
  destacada?: boolean
}

/**
 * Nota de la libreta. Si está por debajo de 51 se marca con color, icono y texto para lectores de pantalla,
 * así se entiende también impresa en blanco y negro.
 */
export function NotaHistorial({ nota, destacada = false }: NotaHistorialProps) {
  if (nota === null) return <>—</>
  const debajo = estaDebajo(nota)
  return (
    <Box
      component="span"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.25,
        whiteSpace: 'nowrap',
        fontWeight: destacada ? 700 : undefined,
        color: debajo ? 'error.main' : 'inherit',
      }}
    >
      {debajo && <ErrorOutlined sx={{ fontSize: '1em' }} aria-hidden />}
      {formatNota(nota)}
      {debajo && (
        <Box component="span" sx={visuallyHidden}>
          (por debajo de 51)
        </Box>
      )}
    </Box>
  )
}

/** Varias notas del mismo tipo, una debajo de otra. */
export function NotasHistorial({ notas }: { notas: number[] }) {
  if (notas.length === 0) return <>—</>
  return (
    <Box sx={{ display: 'grid', gap: 0.25, justifyItems: 'center' }}>
      {notas.map((nota, i) => (
        <NotaHistorial key={i} nota={nota} />
      ))}
    </Box>
  )
}
