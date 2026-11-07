export interface PeriodoReferencia {
  id: number
  nombre: string
  estado: 'PLANIFICADO' | 'ACTIVO' | 'FINALIZADO'
}

export interface AdminResumen {
  totales: {
    estudiantesActivos: number
    docentesActivos: number
    cursosActivos: number
    materiasActivas: number
  }
  periodoActivo: PeriodoReferencia | null
  inscripcionesActivas: number
}

export interface OcupacionCurso {
  cursoId: number
  nombre: string
  capacidad: number | null
  inscritosActivos: number
  porcentaje: number | null
}

export interface PromedioCurso {
  cursoId: number
  curso: string
  promedio: number
  cantidadCalificaciones: number
}

export interface DistribucionNota {
  rango: string
  cantidad: number
}

export interface DistribucionNotasResponse {
  periodo: PeriodoReferencia | null
  materiaId: number | null
  data: DistribucionNota[]
}

export interface EstudianteEnRiesgo {
  estudianteId: number
  codigo: string
  nombre: string
  promedio: number
  cantidadCalificaciones: number
}

export interface ResumenEstudiante {
  estudiante: { id: number; codigo: string; nombre: string }
  promedioGeneral: number | null
  cantidadCalificaciones: number
  materiasCursadas: number
  porPeriodo: Array<{
    periodoId: number
    periodo: string
    promedio: number | null
    cantidadCalificaciones: number
  }>
}

export interface ResumenDocente {
  docente: { id: number; codigo: string; nombre: string }
  calificacionesRegistradas: number
  promedioOtorgado: number | null
  materias: Array<{
    materiaId: number
    materia: string | null
    calificaciones: number
    promedio: number | null
  }>
}

export interface CalificacionDashboard {
  id: number
  nota: number
  tipo: string
  fecha: string | null
  materia: { id: number; nombre: string }
  docente?: { id: number; nombres: string; apellidos: string } | null
  inscripcion: {
    estudiante?: { id: number; nombres: string; apellidos: string; codigo: string }
    curso?: { id: number; nombre: string }
  }
}
