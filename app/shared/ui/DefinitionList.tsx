import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import type { ReactNode } from 'react'

export interface DefinitionItem {
  label: string
  value: ReactNode
}

/** Pares etiqueta/valor para fichas de detalle. Una columna en móvil, dos desde 600 px. */
export function DefinitionList({ items }: { items: DefinitionItem[] }) {
  return (
    <Box
      component="dl"
      sx={{ m: 0, display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' } }}
    >
      {items.map((item) => (
        <Box key={item.label}>
          <Typography component="dt" variant="body2" color="text.secondary">
            {item.label}
          </Typography>
          <Typography component="dd" variant="body1" sx={{ m: 0, mt: 0.25, wordBreak: 'break-word' }}>
            {item.value ?? '—'}
          </Typography>
        </Box>
      ))}
    </Box>
  )
}
