import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import type { ReactNode } from 'react'

interface SectionCardProps {
  title: string
  actions?: ReactNode
  children: ReactNode
}

/** Tarjeta de sección: cada bloque del dashboard maneja sus propios estados (RF-INI-06). */
export function SectionCard({ title, actions, children }: SectionCardProps) {
  return (
    <Card sx={{ height: '100%' }} component="section" aria-label={title}>
      <CardContent>
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1,
            mb: 2,
          }}
        >
          <Typography variant="h2" component="h2" sx={{ fontSize: '1.125rem' }}>
            {title}
          </Typography>
          {actions}
        </Box>
        {children}
      </CardContent>
    </Card>
  )
}
