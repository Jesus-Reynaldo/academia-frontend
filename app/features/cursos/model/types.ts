// Tipos que reflejan el contrato de la API (backend: src/curso).

export type EstadoCurso = 'ACTIVO' | 'INACTIVO'

export const ESTADOS_CURSO: readonly EstadoCurso[] = ['ACTIVO', 'INACTIVO']

export const ETIQUETA_ESTADO_CURSO: Record<EstadoCurso, string> = {
  ACTIVO: 'Activo',
  INACTIVO: 'Inactivo',
}

/**
 * El backend guarda el nivel como texto libre y lo filtra por coincidencia exacta.
 * Se ofrece una lista cerrada para que un error de tipeo no deje un curso fuera del filtro.
 */
export const NIVELES_CURSO = ['Inicial', 'Primaria', 'Secundaria'] as const

export interface Curso {
  id: number
  nombre: string
  nivel: string
  paralelo: string | null
  /** Sin capacidad: el curso no tiene límite de inscritos. */
  capacidad: number | null
  estado: EstadoCurso
  /** Inscripciones ACTIVAS en el período ACTIVO. */
  inscritosActivos: number
  createdAt: string
  updatedAt: string
}

/** Cuerpo de POST y PATCH. `null` borra el paralelo o la capacidad al editar. */
export interface CursoInput {
  nombre: string
  nivel: string
  paralelo?: string | null
  capacidad?: number | null
  estado?: EstadoCurso
}

/** Campos por los que se puede ordenar desde la tabla (el backend los permite en `SORTABLE_FIELDS`). */
export const CAMPOS_ORDENABLES = ['nombre', 'nivel', 'paralelo', 'estado'] as const
export type CampoOrdenable = (typeof CAMPOS_ORDENABLES)[number]

export interface CursoListParams {
  page: number
  limit: number
  sortBy: CampoOrdenable
  order: 'asc' | 'desc'
  nivel?: string
  estado?: EstadoCurso
  nombre?: string
}

/** Resultado de DELETE: 204 → eliminado; 200 → la API lo desactivó porque tiene inscripciones. */
export type ResultadoEliminacion = { tipo: 'eliminado' } | { tipo: 'desactivado'; curso: Curso }

// ── Pestañas del detalle ──

/** Parámetros de GET /cursos/:id/estudiantes y /cursos/:id/materias. */
export interface PaginaDetalleParams {
  page: number
  limit: number
}

export interface EstudianteDelCurso {
  id: number
  codigo: string
  nombres: string
  apellidos: string
  email: string | null
  estado: string
}

export interface MateriaDelCurso {
  id: number
  codigo: string
  nombre: string
  horasSemanales: number | null
  estado: string
}
