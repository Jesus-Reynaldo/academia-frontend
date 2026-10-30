import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import InboxOutlined from '@mui/icons-material/InboxOutlined'
import type { ReactNode } from 'react'

interface EmptyStateProps {
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <Box sx={{ textAlign: 'center', py: 4, px: 2, color: 'text.secondary' }}>
      <InboxOutlined sx={{ fontSize: 40, mb: 1 }} aria-hidden />
      <Typography variant="body1" color="text.primary" sx={{ fontWeight: 600 }}>
        {title}
      </Typography>
      {description && <Typography variant="body2">{description}</Typography>}
      {action && <Box sx={{ mt: 2 }}>{action}</Box>}
    </Box>
  )
}
