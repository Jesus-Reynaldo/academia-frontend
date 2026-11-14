import { API_URL } from '../config/env'
import { ApiError, normalizeMessages } from './errors'

type QueryValue = string | number | boolean | null | undefined
export type QueryParams = Record<string, QueryValue>

interface HttpHandlers {
  getToken: () => string | null
  onUnauthorized: () => void
}

let handlers: HttpHandlers = { getToken: () => null, onUnauthorized: () => {} }

/** Lo configura el proveedor de sesión: así `shared` no depende de ningún feature. */
export function configureHttp(next: Partial<HttpHandlers>) {
  handlers = { ...handlers, ...next }
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  query?: object
  body?: unknown
  signal?: AbortSignal
  /** false en el login: un 401 allí significa "credenciales inválidas", no "sesión vencida". */
  auth?: boolean
}

function buildUrl(path: string, query?: object) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries((query ?? {}) as QueryParams)) {
    if (value !== undefined && value !== null && value !== '') params.set(key, String(value))
  }
  const qs = params.toString()
  return `${API_URL}${path}${qs ? `?${qs}` : ''}`
}

/** Único punto de contacto con la API. Los componentes nunca llaman a `fetch` directamente. */
export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', query, body, signal, auth = true } = options
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  const token = auth ? handlers.getToken() : null
  if (token) headers.Authorization = `Bearer ${token}`

  let response: Response
  try {
    response = await fetch(buildUrl(path, query), {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new ApiError(0, ['No se pudo conectar con el servidor'])
  }

  if (response.status === 204) return undefined as T

  const data: unknown = await response.json().catch(() => null)

  if (!response.ok) {
    if (response.status === 401 && auth) handlers.onUnauthorized()
    throw new ApiError(response.status, normalizeMessages(data, `Error ${response.status}`))
  }
  return data as T
}

/** Respuesta de la API cuando no es JSON: falla con ApiError igual que apiFetch. */
async function fallar(response: Response): Promise<never> {
  const data: unknown = await response.json().catch(() => null)
  if (response.status === 401) handlers.onUnauthorized()
  throw new ApiError(response.status, normalizeMessages(data, `Error ${response.status}`))
}

function autorizacion(): Record<string, string> {
  const token = handlers.getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

/**
 * Descarga un archivo de la API (p. ej. el respaldo) y lo guarda en el equipo con el nombre que manda el servidor.
 * Devuelve ese nombre. Con `nombreFijo` se usa ese nombre en lugar del que manda el servidor.
 */
export async function apiDescargar(path: string, nombrePorDefecto = 'archivo', nombreFijo?: string): Promise<string> {
  let response: Response
  try {
    response = await fetch(buildUrl(path), { headers: autorizacion() })
  } catch {
    throw new ApiError(0, ['No se pudo conectar con el servidor'])
  }
  if (!response.ok) return fallar(response)
  const nombre = nombreFijo ?? /filename="([^"]+)"/.exec(response.headers.get('Content-Disposition') ?? '')?.[1] ?? nombrePorDefecto
  const url = URL.createObjectURL(await response.blob())
  const enlace = document.createElement('a')
  enlace.href = url
  enlace.download = nombre
  document.body.append(enlace)
  enlace.click()
  enlace.remove()
  URL.revokeObjectURL(url)
  return nombre
}

/** Sube archivos con multipart/form-data (el navegador pone el Content-Type con su separador). */
export async function apiSubir<T>(path: string, datos: FormData, method: 'POST' | 'PUT' = 'POST'): Promise<T> {
  let response: Response
  try {
    response = await fetch(buildUrl(path), { method, headers: { Accept: 'application/json', ...autorizacion() }, body: datos })
  } catch {
    throw new ApiError(0, ['No se pudo conectar con el servidor'])
  }
  if (!response.ok) return fallar(response)
  return (await response.json().catch(() => undefined)) as T
}
