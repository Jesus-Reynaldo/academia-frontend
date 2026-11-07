// Tipos que reflejan el contrato de la API (backend: src/materia).

export type EstadoMateria = 'ACTIVA' | 'INACTIVA'

export const ESTADOS_MATERIA: readonly EstadoMateria[] = ['ACTIVA', 'INACTIVA']

/** Texto de filtros y selectores. El chip de la tabla usa el mapa de `StatusChip`. */
export const ETIQUETA_ESTADO_MATERIA: Record<EstadoMateria, string> = {
  ACTIVA: 'Activa',
  INACTIVA: 'Inactiva',
}

export interface Materia {
  id: number
  codigo: string
  nombre: string
  descripcion: string | null
  horasSemanales: number | null
  estado: EstadoMateria
  createdAt: string
  updatedAt: string
}

/** Cuerpo de POST: los opcionales se omiten si están vacíos. */
export interface MateriaCrear {
  codigo: string
  nombre: string
  descripcion?: string
  horasSemanales?: number
  estado: EstadoMateria
}

/**
 * Cuerpo de PATCH. `null` borra el valor guardado: la API acepta `null` en los campos opcionales
 * (`@IsOptional` lo trata como ausente) y Prisma lo guarda como NULL.
 */
export interface MateriaActualizar {
  codigo: string
  nombre: string
  descripcion: string | null
  horasSemanales: number | null
  estado: EstadoMateria
}

/** Campos por los que el backend permite ordenar (`SORTABLE_FIELDS`, además de `id`). */
export const CAMPOS_ORDENABLES = ['codigo', 'nombre', 'estado'] as const
export type CampoOrdenable = (typeof CAMPOS_ORDENABLES)[number]

export interface MateriaListParams {
  page: number
  limit: number
  sortBy: CampoOrdenable
  order: 'asc' | 'desc'
  estado?: EstadoMateria
  nombre?: string
}

/** Resultado de DELETE: 204 → eliminada; 200 → la API la desactivó (tiene calificaciones). */
export type ResultadoEliminacion = { tipo: 'eliminada' } | { tipo: 'desactivada'; materia: Materia }

// --- Calificaciones de una materia (GET /materias/:id/calificaciones, solo ADMIN y DOCENTE) ---

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

/** Solo los campos que esta pantalla usa; la API devuelve además el resto de cada entidad. */
export interface CalificacionDeMateria {
  id: number
  nota: number
  tipo: TipoEvaluacion
  fecha: string
  observacion: string | null
  docente: { id: number; nombres: string; apellidos: string } | null
  inscripcion: {
    id: number
    estudiante: { id: number; codigo: string; nombres: string; apellidos: string }
    curso: { id: number; nombre: string; paralelo: string | null }
  }
}

export interface CalificacionesParams {
  page: number
  limit: number
  order: 'asc' | 'desc'
}
