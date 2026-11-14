// Tipos que reflejan el contrato de la API (backend: src/usuario). La API nunca devuelve la contraseña.
import type { Rol } from '../../../shared/config/roles'

export interface CuentaUsuario {
  id: number
  email: string
  rol: Rol
  activo: boolean
  estudianteId: number | null
  docenteId: number | null
  createdAt: string
  updatedAt: string
}

/** Cuerpo de POST: un ESTUDIANTE lleva solo estudianteId, un DOCENTE solo docenteId y un ADMIN ninguno. */
export interface CrearUsuarioInput {
  email: string
  password: string
  rol: Rol
  estudianteId?: number
  docenteId?: number
}

/** Cuerpo de PATCH: el rol y el vínculo no se pueden cambiar. Sin `password`, la contraseña se conserva. */
export interface EditarUsuarioInput {
  email: string
  activo: boolean
  password?: string
}

/** Campos por los que el backend permite ordenar y que se muestran en la tabla. */
export const CAMPOS_ORDENABLES = ['email', 'rol'] as const
export type CampoOrdenable = (typeof CAMPOS_ORDENABLES)[number]

export interface UsuarioListParams {
  page: number
  limit: number
  sortBy: CampoOrdenable
  order: 'asc' | 'desc'
  rol?: Rol
  /** Texto a buscar en el email. La API no lo admite: se filtra en el navegador (ver usuariosApi.list). */
  q?: string
}
