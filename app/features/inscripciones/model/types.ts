// Tipos que reflejan el contrato de la API (backend: src/inscripcion).

export type EstadoInscripcion = 'ACTIVA' | 'RETIRADA' | 'FINALIZADA'

export const ESTADOS_INSCRIPCION: readonly EstadoInscripcion[] = ['ACTIVA', 'RETIRADA', 'FINALIZADA']

export const ETIQUETA_ESTADO_INSCRIPCION: Record<EstadoInscripcion, string> = {
  ACTIVA: 'Activa',
  RETIRADA: 'Retirada',
  FINALIZADA: 'Finalizada',
}

export interface Inscripcion {
  id: number
  estudianteId: number
  cursoId: number
  periodoAcademicoId: number
  /** ISO 8601 (UTC). */
  fechaInscripcion: string
  estado: EstadoInscripcion
  estudiante: { id: number; codigo: string; nombres: string; apellidos: string }
  curso: { id: number; nombre: string; paralelo: string | null }
  periodoAcademico: { id: number; nombre: string; estado: string }
}

/** Cuerpo de POST. El estado no se envía: toda inscripción nueva empieza ACTIVA. */
export interface InscripcionInput {
  estudianteId: number
  cursoId: number
  periodoAcademicoId: number
  fechaInscripcion?: string
}

/** Campos por los que el backend permite ordenar y que se muestran en la tabla. */
export const CAMPOS_ORDENABLES = ['fechaInscripcion', 'estado'] as const
export type CampoOrdenable = (typeof CAMPOS_ORDENABLES)[number]

export interface InscripcionListParams {
  page: number
  limit: number
  sortBy: CampoOrdenable
  order: 'asc' | 'desc'
  estudianteId?: number
  cursoId?: number
  periodoAcademicoId?: number
  estado?: EstadoInscripcion
  /** Búsqueda por contenido: estudiante (nombre, código, documento), curso o gestión. */
  q?: string
}
