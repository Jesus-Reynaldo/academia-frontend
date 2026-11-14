import type { Modulo } from '../../../shared/config/modulos'

export type AccionBitacora = 'CREAR' | 'MODIFICAR' | 'DESACTIVAR' | 'ELIMINAR'

export const ACCIONES: readonly AccionBitacora[] = ['CREAR', 'MODIFICAR', 'DESACTIVAR', 'ELIMINAR']

export const ETIQUETA_ACCION: Record<AccionBitacora, string> = {
  CREAR: 'Creó',
  MODIFICAR: 'Modificó',
  DESACTIVAR: 'Desactivó',
  ELIMINAR: 'Eliminó',
}

/** Recursos de la API que registra la bitácora (backend: src/bitacora/bitacora.util.ts). */
export type RecursoBitacora =
  | 'estudiantes'
  | 'docentes'
  | 'usuarios'
  | 'cursos'
  | 'materias'
  | 'periodos-academicos'
  | 'inscripciones'
  | 'calificaciones'

export const RECURSOS: readonly RecursoBitacora[] = [
  'estudiantes', 'docentes', 'usuarios', 'cursos', 'materias', 'periodos-academicos', 'inscripciones', 'calificaciones',
]

/** Nombre en singular y módulo (para el ícono, el mismo del menú). */
export const RECURSO: Record<RecursoBitacora, { etiqueta: string; plural: string; modulo: Modulo; ruta?: string }> = {
  estudiantes: { etiqueta: 'estudiante', plural: 'Estudiantes', modulo: 'estudiantes', ruta: '/estudiantes' },
  docentes: { etiqueta: 'docente', plural: 'Docentes', modulo: 'docentes', ruta: '/docentes' },
  usuarios: { etiqueta: 'usuario', plural: 'Usuarios', modulo: 'usuarios' },
  cursos: { etiqueta: 'curso', plural: 'Cursos', modulo: 'cursos', ruta: '/cursos' },
  materias: { etiqueta: 'materia', plural: 'Materias', modulo: 'materias', ruta: '/materias' },
  'periodos-academicos': { etiqueta: 'período', plural: 'Períodos', modulo: 'periodos' },
  inscripciones: { etiqueta: 'inscripción', plural: 'Inscripciones', modulo: 'inscripciones' },
  calificaciones: { etiqueta: 'calificación', plural: 'Calificaciones', modulo: 'calificaciones' },
}

/** Un registro de GET /bitacora. */
export interface RegistroBitacora {
  id: number
  fecha: string
  accion: AccionBitacora
  recurso: RecursoBitacora
  recursoId: number | null
  descripcion: string
  usuarioId: number | null
  usuario: { id: number; email: string; rol: 'ADMIN' | 'DOCENTE' | 'ESTUDIANTE' } | null
}

export interface BitacoraParams {
  page: number
  limit: number
  recurso?: RecursoBitacora
  accion?: AccionBitacora
}
