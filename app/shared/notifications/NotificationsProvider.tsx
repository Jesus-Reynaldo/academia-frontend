import Alert from '@mui/material/Alert'
import Snackbar from '@mui/material/Snackbar'
import { useCallback, useMemo, useState, type ReactNode } from 'react'
import {
  NotificationsContext,
  type NotificationSeverity,
  type NotificationsContextValue,
} from './notifications-context'

interface Toast {
  key: number
  message: string
  severity: NotificationSeverity
}

const DURATION_MS = 5000

/** Un toast a la vez: si llega otro, reemplaza al anterior. */
export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null)
  const [open, setOpen] = useState(false)

  const notify = useCallback((message: string, severity: NotificationSeverity = 'success') => {
    setToast({ key: Date.now(), message, severity })
    setOpen(true)
  }, [])

  const value = useMemo<NotificationsContextValue>(() => ({ notify }), [notify])

  return (
    <NotificationsContext.Provider value={value}>
      {children}
      <Snackbar
        key={toast?.key}
        open={open}
        autoHideDuration={DURATION_MS}
        onClose={(_, reason) => {
          if (reason !== 'clickaway') setOpen(false)
        }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {/* role="status": se anuncia a lectores de pantalla sin interrumpir. */}
        <Alert
          role="status"
          severity={toast?.severity ?? 'success'}
          variant="filled"
          onClose={() => setOpen(false)}
          sx={{ width: '100%' }}
        >
          {toast?.message}
        </Alert>
      </Snackbar>
    </NotificationsContext.Provider>
  )
}
