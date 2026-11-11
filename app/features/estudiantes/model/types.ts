// Tipos que reflejan el contrato de la API (backend: src/estudiante).

export type EstadoEstudiante = 'ACTIVO' | 'INACTIVO' | 'EGRESADO' | 'RETIRADO'

export const ESTADOS_ESTUDIANTE: readonly EstadoEstudiante[] = ['ACTIVO', 'INACTIVO', 'EGRESADO', 'RETIRADO']

export const ETIQUETA_ESTADO_ESTUDIANTE: Record<EstadoEstudiante, string> = {
  ACTIVO: 'Activo',
  INACTIVO: 'Inactivo',
  EGRESADO: 'Egresado',
  RETIRADO: 'Retirado',
}

export interface Estudiante {
  id: number
  codigo: string
  nombres: string
  apellidos: string
  documento: string
  email: string | null
  telefono: string | null
  /** ISO 8601 (UTC). */
  fechaNacimiento: string | null
  estado: EstadoEstudiante
  createdAt: string
  updatedAt: string
}

/** Cuerpo de POST y PATCH. `null` borra el email o el teléfono al editar. */
export interface EstudianteInput {
  codigo: string
  nombres: string
  apellidos: string
  documento: string
  email?: string | null
  telefono?: string | null
  fechaNacimiento?: string
  estado?: EstadoEstudiante
}

/** Campos por los que el backend permite ordenar (`SORTABLE_FIELDS`). */
export const CAMPOS_ORDENABLES = ['codigo', 'nombres', 'apellidos', 'documento', 'email', 'estado'] as const
export type CampoOrdenable = (typeof CAMPOS_ORDENABLES)[number]

export interface EstudianteListParams {
  page: number
  limit: number
  sortBy: CampoOrdenable
  order: 'asc' | 'desc'
  estado?: EstadoEstudiante
  /** Busca en nombres, apellidos, código y documento. */
  q?: string
}

/** Resultado de DELETE: 204 → eliminado; 200 → la API lo desactivó porque tiene inscripciones. */
export type ResultadoEliminacion = { tipo: 'eliminado' } | { tipo: 'desactivado'; estudiante: Estudiante }

// ── Pestañas de la ficha ──

export interface PaginaFichaParams {
  page: number
  limit: number
  order: 'asc' | 'desc'
}

interface CursoResumen {
  id: number
  nombre: string
  paralelo: string | null
}

export interface InscripcionDelEstudiante {
  id: number
  estado: string
  /** ISO 8601 (UTC). */
  fechaInscripcion: string
  curso: CursoResumen
  periodoAcademico: { id: number; nombre: string }
}

export type TipoEvaluacion = 'PARCIAL' | 'FINAL' | 'PRACTICA' | 'TAREA' | 'PROYECTO' | 'PARTICIPACION' | 'OTRA'

export interface CalificacionDelEstudiante {
  id: number
  nota: number
  tipo: TipoEvaluacion
  /** ISO 8601 (UTC). */
  fecha: string
  observacion: string | null
  materia: { id: number; nombre: string }
  docente: { id: number; nombres: string; apellidos: string } | null
  inscripcion: { id: number; curso: CursoResumen }
}
