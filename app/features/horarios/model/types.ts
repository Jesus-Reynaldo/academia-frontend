export const DIAS = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'] as const
export type DiaSemana = (typeof DIAS)[number]
export const NOMBRE_DIA: Record<DiaSemana, string> = {
  LUNES: 'Lunes',
  MARTES: 'Martes',
  MIERCOLES: 'Miércoles',
  JUEVES: 'Jueves',
  VIERNES: 'Viernes',
  SABADO: 'Sábado',
}

export const ESTADOS_HORARIO = ['ACTIVO', 'INACTIVO'] as const
export type EstadoHorario = (typeof ESTADOS_HORARIO)[number]
export const ETIQUETA_ESTADO_HORARIO: Record<EstadoHorario, string> = { ACTIVO: 'Activo', INACTIVO: 'Inactivo' }

/** Un bloque del horario: la asignación (materia + docente + curso + período) en un aula, día y horas. */
export interface Horario {
  id: number
  asignacionId: number
  aulaId: number
  diaSemana: DiaSemana
  horaInicio: string
  horaFin: string
  estado: EstadoHorario
  aula: { id: number; codigo: string; nombre: string; estado: string }
  asignacion: {
    id: number
    estado: string
    docenteId: number
    materiaId: number
    cursoId: number
    periodoAcademicoId: number
    docente: { id: number; codigo: string; nombres: string; apellidos: string }
    materia: { id: number; codigo: string; nombre: string }
    curso: { id: number; nombre: string; nivel: string; paralelo: string | null }
    periodoAcademico: { id: number; nombre: string; estado: string }
  }
}

export interface HorarioFiltros {
  periodoAcademicoId?: number
  cursoId?: number
  docenteId?: number
  aulaId?: number
  materiaId?: number
  diaSemana?: DiaSemana
  estado?: EstadoHorario
  q?: string
}

export interface HorarioInput {
  asignacionId: number
  aulaId: number
  diaSemana: DiaSemana
  horaInicio: string
  horaFin: string
}

/** Qué se muestra como dato secundario de cada bloque según quién mira. */
export type VistaHorario = 'curso' | 'docente' | 'aula' | 'estudiante'

export const nombreDocente = (d: { nombres: string; apellidos: string }) => `${d.nombres} ${d.apellidos}`
