import { createContext, useContext } from 'react'

export type NotificationSeverity = 'success' | 'info' | 'warning' | 'error'

export interface NotificationsContextValue {
  /** Toast de 5 s en la esquina inferior (docs/UI-UX-PLAN.md, 6.6). Para errores que hay que leer, usa una Alert en línea. */
  notify: (message: string, severity?: NotificationSeverity) => void
}

export const NotificationsContext = createContext<NotificationsContextValue | null>(null)

export function useNotify(): NotificationsContextValue['notify'] {
  const value = useContext(NotificationsContext)
  if (!value) throw new Error('useNotify debe usarse dentro de <NotificationsProvider>')
  return value.notify
}
