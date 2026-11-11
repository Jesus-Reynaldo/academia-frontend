export interface HistorialCalificacion {
  tipo: string
  nota: number
}

export interface HistorialMateria {
  materiaId: number
  materia: string
  promedio: number | null
  calificaciones: HistorialCalificacion[]
}

export interface HistorialCurso {
  cursoId: number
  curso: string
  promedio: number | null
  materias: HistorialMateria[]
}

export interface HistorialPeriodo {
  periodoId: number
  periodo: string
  cursos: HistorialCurso[]
}

export interface HistorialAcademico {
  estudiante: {
    id: number
    codigo: string
    nombre: string
  }
  promedioGeneral: number | null
  periodos: Array<{
    periodoId: number
    periodo: string
    cursoId: number
    curso: string
    promedio: number | null
    materias: HistorialMateria[]
  }>
}
