import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Skeleton from '@mui/material/Skeleton'
import Typography from '@mui/material/Typography'
import type { ReactNode } from 'react'
import { Link as RouterLink } from 'react-router'

interface KpiCardProps {
  label: string
  value?: ReactNode
  hint?: ReactNode
  loading?: boolean
  to?: string
}

export function KpiCard({ label, value, hint, loading, to }: KpiCardProps) {
  const content = (
    <CardContent>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      {loading ? (
        <Skeleton variant="text" width={80} sx={{ fontSize: '2rem' }} />
      ) : (
        <Typography component="div" sx={{ fontSize: '2rem', fontWeight: 700, lineHeight: 1.3 }}>
          {value}
        </Typography>
      )}
      {hint && (
        <Typography variant="caption" color="text.secondary">
          {hint}
        </Typography>
      )}
    </CardContent>
  )

  if (to) {
    return (
      <Card
        component={RouterLink}
        to={to}
        sx={{
          height: '100%',
          display: 'block',
          color: 'inherit',
          textDecoration: 'none',
          bgcolor: 'background.paper',
          border: 1,
          borderColor: 'divider',
          borderRadius: 3,
          overflow: 'hidden',
          transition: 'border-color 150ms ease, box-shadow 150ms ease',
          '&:hover': { borderColor: 'primary.main', boxShadow: 2, bgcolor: 'background.paper' },
          '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 2 },
        }}
      >
        {content}
      </Card>
    )
  }

  return <Card sx={{ height: '100%' }}>{content}</Card>
}
