import type { Rol } from '../../../shared/config/roles'

export interface Usuario {
  id: number
  email: string
  rol: Rol
  estudianteId: number | null
  docenteId: number | null
  /** Nombre del perfil vinculado; `null` para el administrador. */
  nombre: string | null
}

export interface LoginResponse {
  accessToken: string
  tokenType: 'Bearer'
  expiresIn: number
  usuario: Omit<Usuario, 'nombre'>
}
