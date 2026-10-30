export type Rol = 'ADMIN' | 'DOCENTE' | 'ESTUDIANTE'

export const TODOS_LOS_ROLES: Rol[] = ['ADMIN', 'DOCENTE', 'ESTUDIANTE']

export const ETIQUETA_ROL: Record<Rol, string> = {
  ADMIN: 'Administrador',
  DOCENTE: 'Docente',
  ESTUDIANTE: 'Estudiante',
}
