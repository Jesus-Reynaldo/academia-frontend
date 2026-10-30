import { apiFetch } from '../../../shared/api/http'
import type { LoginResponse, Usuario } from '../model/types'

export const authApi = {
  login: (email: string, password: string) =>
    apiFetch<LoginResponse>('/auth/login', { method: 'POST', body: { email, password }, auth: false }),

  me: (signal?: AbortSignal) => apiFetch<Usuario>('/auth/me', { signal }),

  cambiarPassword: (passwordActual: string, passwordNueva: string) =>
    apiFetch<void>('/auth/cambiar-password', { method: 'POST', body: { passwordActual, passwordNueva } }),
}
