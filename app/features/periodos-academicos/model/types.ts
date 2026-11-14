// Tipos que reflejan el contrato de la API (backend: src/periodo-academico).

export type EstadoPeriodo = 'PLANIFICADO' | 'ACTIVO' | 'FINALIZADO'

export const ESTADOS_PERIODO: readonly EstadoPeriodo[] = ['PLANIFICADO', 'ACTIVO', 'FINALIZADO']

/** Texto de los filtros y selectores. El chip de la tabla usa el mapa de `StatusChip`. */
export const ETIQUETA_ESTADO_PERIODO: Record<EstadoPeriodo, string> = {
  PLANIFICADO: 'Planificado',
  ACTIVO: 'Activo',
  FINALIZADO: 'Finalizado',
}

export interface PeriodoAcademico {
  id: number
  nombre: string
  /** ISO 8601 (UTC). */
  fechaInicio: string
  /** ISO 8601 (UTC). */
  fechaFin: string
  estado: EstadoPeriodo
  createdAt: string
  updatedAt: string
}

/** Cuerpo de POST y PATCH: solo los campos que la API acepta (nunca `id`, `createdAt`…). */
export interface PeriodoInput {
  nombre: string
  fechaInicio: string
  fechaFin: string
  estado?: EstadoPeriodo
}

/** Campos por los que el backend permite ordenar (`SORTABLE_FIELDS`, además de `id`). */
export const CAMPOS_ORDENABLES = ['nombre', 'fechaInicio', 'fechaFin', 'estado'] as const
export type CampoOrdenable = (typeof CAMPOS_ORDENABLES)[number]

export interface PeriodoListParams {
  page: number
  limit: number
  sortBy: CampoOrdenable
  order: 'asc' | 'desc'
  estado?: EstadoPeriodo
  /** Búsqueda por contenido (nombre de la gestión). */
  q?: string
}

/** Resultado de DELETE: 204 → eliminado; 200 → la API lo desactivó en lugar de borrarlo. */
export type ResultadoEliminacion = { tipo: 'eliminado' } | { tipo: 'desactivado'; periodo: PeriodoAcademico }
