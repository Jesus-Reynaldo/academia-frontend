import { ApiError, friendlyMessage } from '../../../shared/api/errors'

/** Errores 400, 404 y 409 del servidor tal cual; el resto, texto amigable. */
export function mensajesDeError(error: unknown): string[] {
  if (error instanceof ApiError && [400, 404, 409].includes(error.status)) return error.messages
  return [friendlyMessage(error)]
}
