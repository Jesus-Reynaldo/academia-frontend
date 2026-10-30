import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import { friendlyMessage } from '../api/errors'

interface ErrorStateProps {
  error: unknown
  onRetry?: () => void
}

export function ErrorState({ error, onRetry }: ErrorStateProps) {
  return (
    <Alert
      severity="error"
      action={
        onRetry && (
          <Button color="inherit" size="small" onClick={onRetry}>
            Reintentar
          </Button>
        )
      }
    >
      {friendlyMessage(error)}
    </Alert>
  )
}
