import Block from '@mui/icons-material/Block'
import Box from '@mui/material/Box'
import LinearProgress from '@mui/material/LinearProgress'
import Typography from '@mui/material/Typography'

interface OcupacionCursoProps {
  inscritos: number
  capacidad: number | null
}

/**
 * Inscritos de la gestión activa frente a la capacidad. Un curso lleno se indica con texto e icono,
 * además del color, para que no dependa solo de distinguir colores.
 */
export function OcupacionCurso({ inscritos, capacidad }: OcupacionCursoProps) {
  if (capacidad === null) {
    return <Typography variant="body2">{`${inscritos} ${inscritos === 1 ? 'inscrito' : 'inscritos'} · sin límite`}</Typography>
  }

  const lleno = inscritos >= capacidad
  const porcentaje = Math.min(100, (inscritos / capacidad) * 100)

  return (
    <Box sx={{ minWidth: 130, maxWidth: 240 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
        <Typography variant="body2">{`${inscritos} / ${capacidad}`}</Typography>
        {lleno && (
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.25, color: 'error.main' }}>
            <Block sx={{ fontSize: 16 }} aria-hidden />
            <Typography variant="body2" sx={{ fontWeight: 600, color: 'inherit' }}>
              Lleno
            </Typography>
          </Box>
        )}
      </Box>
      <LinearProgress
        variant="determinate"
        value={porcentaje}
        color={lleno ? 'error' : 'primary'}
        aria-label={`Ocupación: ${inscritos} de ${capacidad}`}
        sx={{ height: 6, borderRadius: 3 }}
      />
    </Box>
  )
}
