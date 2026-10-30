export class ApiError extends Error {
  readonly status: number
  readonly messages: string[]

  constructor(status: number, messages: string[]) {
    super(messages[0] ?? 'Error desconocido')
    this.name = 'ApiError'
    this.status = status
    this.messages = messages
  }
}

/** La API puede devolver `message` como texto o como arreglo de textos: se normaliza siempre a arreglo. */
export function normalizeMessages(body: unknown, fallback: string): string[] {
  if (body && typeof body === 'object' && 'message' in body) {
    const { message } = body as { message: unknown }
    if (Array.isArray(message)) return message.map(String)
    if (typeof message === 'string' && message) return [message]
  }
  return [fallback]
}

/** Texto listo para mostrar al usuario según el tipo de error. */
export function friendlyMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 0) return 'No se pudo conectar con el servidor. Revisa tu conexión.'
    if (error.status >= 500) return 'El servidor tuvo un problema. Inténtalo de nuevo en un momento.'
    if (error.status === 403) return 'No tienes permiso para realizar esta acción.'
    if (error.status === 404) return 'No se encontró lo que buscas.'
    if (error.status === 429) return 'Demasiados intentos, espera un momento.'
    return error.messages.join(' · ')
  }
  return 'Ocurrió un error inesperado.'
}
