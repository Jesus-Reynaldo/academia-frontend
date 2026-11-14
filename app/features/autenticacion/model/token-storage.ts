// Único lugar de la app que toca localStorage para la sesión (RF-AUTH-02).
// Ojo: guardar el token aquí lo expone a ataques XSS; decisión documentada en el README.
const TOKEN_KEY = 'notas.accessToken'

export function readToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function saveToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token)
  } catch {
    // Sin almacenamiento disponible (modo privado, etc.): la sesión dura hasta recargar.
  }
}

export function clearToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY)
  } catch {
    // Nada que limpiar.
  }
}

/** Marca que se cerró sesión a propósito (botón «Cerrar sesión»), para que quien entre después empiece en el Inicio. */
export const SALIO_A_PROPOSITO = 'notas.salioAProposito'

/** ¿Se cerró sesión a propósito? Lo lee una sola vez (borra la marca). */
export function tomarSalidaAProposito(): boolean {
  try {
    const salio = sessionStorage.getItem(SALIO_A_PROPOSITO) === '1'
    sessionStorage.removeItem(SALIO_A_PROPOSITO)
    return salio
  } catch {
    return false
  }
}
