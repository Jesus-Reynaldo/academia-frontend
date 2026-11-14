import Typography from '@mui/material/Typography'
import InboxOutlined from '@mui/icons-material/InboxOutlined'
import type { ReactNode } from 'react'

interface EmptyStateProps {
  title: string
  description?: string
  action?: ReactNode
}

/** Estado vacío: ícono en círculo, título, explicación y la acción que lo resuelve. */
export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center px-4 py-10 text-center">
      <span aria-hidden className="mb-3 grid h-14 w-14 place-items-center rounded-full bg-primary-tint text-primary">
        <InboxOutlined />
      </span>
      <Typography variant="body1" color="text.primary" sx={{ fontWeight: 600 }}>
        {title}
      </Typography>
      {description && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, maxWidth: 420 }}>
          {description}
        </Typography>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
