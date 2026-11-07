// Tipos que reflejan el contrato de la API (backend: src/calificacion).

export type TipoEvaluacion = 'PARCIAL' | 'FINAL' | 'PRACTICA' | 'TAREA' | 'PROYECTO' | 'PARTICIPACION' | 'OTRA'

export const TIPOS_EVALUACION: readonly TipoEvaluacion[] = [
  'PARCIAL',
  'FINAL',
  'PRACTICA',
  'TAREA',
  'PROYECTO',
  'PARTICIPACION',
  'OTRA',
]

export const ETIQUETA_TIPO: Record<TipoEvaluacion, string> = {
  PARCIAL: 'Parcial',
  FINAL: 'Final',
  PRACTICA: 'Práctica',
  TAREA: 'Tarea',
  PROYECTO: 'Proyecto',
  PARTICIPACION: 'Participación',
  OTRA: 'Otra',
}

export const NOTA_MIN = 0
export const NOTA_MAX = 100

/** Textos reutilizados (RF-CAL-03): no existe el botón "Eliminar". */
export const TEXTO_SIN_ELIMINAR = 'Las calificaciones forman parte del historial y se corrigen editándolas.'

// ---- Entidades que la API incluye dentro de cada calificación ----

export interface EstudianteResumen {
  id: number
  codigo: string
  nombres: string
  apellidos: string
}

export interface CursoResumen {
  id: number
  nombre: string
  nivel: string
  paralelo: string | null
}

export interface MateriaResumen {
  id: number
  codigo: string
  nombre: string
  /** Solo se pueden registrar notas en materias ACTIVAS. */
  estado?: 'ACTIVA' | 'INACTIVA'
}

export interface DocenteResumen {
  id: number
  codigo: string
  nombres: string
  apellidos: string
}

export interface PeriodoResumen {
  id: number
  nombre: string
}

export interface Calificacion {
  id: number
  inscripcionId: number
  materiaId: number
  docenteId: number | null
  nota: number
  tipo: TipoEvaluacion
  /** ISO 8601 (UTC). */
  fecha: string
  observacion: string | null
  createdAt: string
  updatedAt: string
  materia: MateriaResumen
  docente: DocenteResumen | null
  inscripcion: {
    id: number
    estudianteId: number
    cursoId: number
    periodoAcademicoId: number
    estudiante: EstudianteResumen
    curso: CursoResumen
  }
}

/** Inscripción tal como la devuelve GET /inscripciones (para el autocompletar del formulario). */
export interface InscripcionOpcion {
  id: number
  estudianteId: number
  cursoId: number
  periodoAcademicoId: number
  estado: 'ACTIVA' | 'RETIRADA' | 'FINALIZADA'
  estudiante: EstudianteResumen
  curso: CursoResumen
  periodoAcademico: PeriodoResumen
}

// ---- Cuerpos de POST y PATCH: solo los campos que la API acepta ----

export interface CalificacionCrearInput {
  inscripcionId: number
  materiaId: number
  nota: number
  tipo: TipoEvaluacion
  /** ISO 8601. */
  fecha?: string
  observacion?: string
  /** Solo ADMIN; si es DOCENTE la API lo fija a su propio docente. */
  docenteId?: number
}

export interface CalificacionEditarInput {
  nota: number
  tipo: TipoEvaluacion
  fecha?: string
  observacion?: string
  docenteId?: number
}

// ---- Listado ----

/** Campos por los que el backend permite ordenar (SORTABLE_FIELDS, además de `id`). */
export const CAMPOS_ORDENABLES = ['nota', 'tipo', 'fecha', 'createdAt'] as const
export type CampoOrdenable = (typeof CAMPOS_ORDENABLES)[number]

export interface CalificacionListParams {
  page: number
  limit: number
  sortBy: CampoOrdenable
  order: 'asc' | 'desc'
  materiaId?: number
  docenteId?: number
  tipo?: TipoEvaluacion
  estudianteId?: number
  cursoId?: number
  periodoAcademicoId?: number
  /** `YYYY-MM-DD` (igual que en la URL), inclusive. La capa api la convierte a ISO 8601. */
  fechaDesde?: string
  /** `YYYY-MM-DD` (igual que en la URL), inclusive. */
  fechaHasta?: string
}
