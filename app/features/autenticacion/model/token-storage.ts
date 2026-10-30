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
