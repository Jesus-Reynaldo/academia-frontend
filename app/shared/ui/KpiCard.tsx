import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Skeleton from '@mui/material/Skeleton'
import Typography from '@mui/material/Typography'
import type { ReactNode } from 'react'

interface KpiCardProps {
  label: string
  value?: ReactNode
  hint?: ReactNode
  loading?: boolean
}

export function KpiCard({ label, value, hint, loading }: KpiCardProps) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
        {loading ? (
          <Skeleton variant="text" width={80} sx={{ fontSize: '2rem' }} />
        ) : (
          <Typography component="div" sx={{ fontSize: "2rem", fontWeight: 700, lineHeight: 1.3 }}>
            {value}
          </Typography>
        )}
        {hint && (
          <Typography variant="caption" color="text.secondary">
            {hint}
          </Typography>
        )}
      </CardContent>
    </Card>
  )
}
