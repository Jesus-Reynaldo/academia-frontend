export const ESTADOS_ASIGNACION = ['ACTIVA', 'INACTIVA'] as const
export type EstadoAsignacion = (typeof ESTADOS_ASIGNACION)[number]

export const ETIQUETA_ESTADO_ASIGNACION: Record<EstadoAsignacion, string> = {
  ACTIVA: 'Activa',
  INACTIVA: 'Inactiva',
}

/** Qué materia dicta un docente, en qué curso y en qué período académico (tabla asignaciones_docentes). */
export interface AsignacionDocente {
  id: number
  docenteId: number
  materiaId: number
  cursoId: number
  periodoAcademicoId: number
  estado: EstadoAsignacion
  createdAt: string
  updatedAt: string
  docente: { id: number; codigo: string; nombres: string; apellidos: string; estado: string }
  materia: { id: number; codigo: string; nombre: string; estado: string }
  curso: { id: number; nombre: string; nivel: string; paralelo: string | null; estado: string }
  periodoAcademico: { id: number; nombre: string; estado: string; fechaInicio: string; fechaFin: string }
}

export const CAMPOS_ORDENABLES = ['docente', 'materia', 'curso', 'periodo', 'estado'] as const
export type CampoOrdenable = (typeof CAMPOS_ORDENABLES)[number]

export interface AsignacionListParams {
  page: number
  limit: number
  /** Sin orden elegido: activas primero y la gestión más reciente arriba (lo decide el servidor). */
  sortBy?: CampoOrdenable
  order: 'asc' | 'desc'
  q?: string
  estado?: EstadoAsignacion
  docenteId?: number
  materiaId?: number
  cursoId?: number
  periodoAcademicoId?: number
}

export interface AsignacionInput {
  docenteId: number
  materiaId: number
  cursoId: number
  periodoAcademicoId: number
  estado?: EstadoAsignacion
}

export const nombreDocente = (d: { nombres: string; apellidos: string }) => `${d.apellidos}, ${d.nombres}`
