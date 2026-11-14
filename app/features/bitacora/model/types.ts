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
  | 'asignaciones-docentes'
  | 'configuracion'

export const RECURSOS: readonly RecursoBitacora[] = [
  'estudiantes', 'docentes', 'usuarios', 'cursos', 'materias', 'periodos-academicos', 'inscripciones', 'calificaciones', 'asignaciones-docentes', 'configuracion',
]

/** Nombre en singular y módulo (para el ícono, el mismo del menú). */
export const RECURSO: Record<RecursoBitacora, { etiqueta: string; articulo: 'el' | 'la'; plural: string; modulo: Modulo; ruta?: string }> = {
  estudiantes: { etiqueta: 'estudiante', articulo: 'el', plural: 'Estudiantes', modulo: 'estudiantes', ruta: '/estudiantes' },
  docentes: { etiqueta: 'docente', articulo: 'el', plural: 'Docentes', modulo: 'docentes', ruta: '/docentes' },
  usuarios: { etiqueta: 'usuario', articulo: 'el', plural: 'Usuarios', modulo: 'usuarios' },
  cursos: { etiqueta: 'curso', articulo: 'el', plural: 'Cursos', modulo: 'cursos', ruta: '/cursos' },
  materias: { etiqueta: 'materia', articulo: 'la', plural: 'Materias', modulo: 'materias', ruta: '/materias' },
  'periodos-academicos': { etiqueta: 'período', articulo: 'el', plural: 'Períodos', modulo: 'periodos' },
  inscripciones: { etiqueta: 'inscripción', articulo: 'la', plural: 'Inscripciones', modulo: 'inscripciones' },
  calificaciones: { etiqueta: 'calificación', articulo: 'la', plural: 'Calificaciones', modulo: 'calificaciones' },
  'asignaciones-docentes': { etiqueta: 'asignación docente', articulo: 'la', plural: 'Asignación docente', modulo: 'asignaciones' },
  configuracion: { etiqueta: 'configuración', articulo: 'la', plural: 'Configuración', modulo: 'configuracion', ruta: undefined },
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
  /** Búsqueda por contenido: descripción, módulo o email de quien lo hizo. */
  q?: string
  accion?: AccionBitacora
}
