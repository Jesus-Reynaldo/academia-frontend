// Tipos que reflejan el contrato de la API (backend: src/docente).

export type EstadoDocente = 'ACTIVO' | 'INACTIVO'

export const ESTADOS_DOCENTE: readonly EstadoDocente[] = ['ACTIVO', 'INACTIVO']

export const ETIQUETA_ESTADO_DOCENTE: Record<EstadoDocente, string> = {
  ACTIVO: 'Activo',
  INACTIVO: 'Inactivo',
}

export interface Docente {
  id: number
  codigo: string
  nombres: string
  apellidos: string
  email: string | null
  telefono: string | null
  estado: EstadoDocente
  createdAt: string
  updatedAt: string
}

/** Lo que se envía al crear o editar un docente. `null` borra el email o teléfono al editar. */
export interface DocenteInput {
  codigo: string
  nombres: string
  apellidos: string
  email?: string | null
  telefono?: string | null
  estado?: EstadoDocente
}

/** Campos por los que el backend permite ordenar. */
export const CAMPOS_ORDENABLES = ['codigo', 'nombres', 'apellidos', 'estado'] as const
export type CampoOrdenable = (typeof CAMPOS_ORDENABLES)[number]

export interface DocenteListParams {
  page: number
  limit: number
  sortBy: CampoOrdenable
  order: 'asc' | 'desc'
  estado?: EstadoDocente
  nombre?: string
}

// ── Calificaciones registradas por el docente (GET /docentes/:id/calificaciones) ──

export type TipoEvaluacion = 'PARCIAL' | 'FINAL' | 'PRACTICA' | 'TAREA' | 'PROYECTO' | 'PARTICIPACION' | 'OTRA'

export const ETIQUETA_TIPO_EVALUACION: Record<TipoEvaluacion, string> = {
  PARCIAL: 'Parcial',
  FINAL: 'Final',
  PRACTICA: 'Práctica',
  TAREA: 'Tarea',
  PROYECTO: 'Proyecto',
  PARTICIPACION: 'Participación',
  OTRA: 'Otra',
}

/** Solo los campos que muestra la ficha; la API envía además la materia, la inscripción, el estudiante y el curso completos. */
export interface CalificacionDocente {
  id: number
  nota: number
  tipo: TipoEvaluacion
  /** ISO 8601 (UTC). */
  fecha: string
  observacion: string | null
  materia: { id: number; nombre: string }
  inscripcion: {
    id: number
    estudiante: { id: number; nombres: string; apellidos: string }
    curso: { id: number; nombre: string; paralelo: string | null }
  }
}

export interface CalificacionesDocenteParams {
  page: number
  limit: number
  order: 'asc' | 'desc'
}

/** Resultado de eliminar: 204 → eliminado; 200 → desactivado. */
export type ResultadoEliminacion = { tipo: 'eliminado' } | { tipo: 'desactivado'; docente: Docente }
