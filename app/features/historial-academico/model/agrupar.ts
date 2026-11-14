import type { HistorialAcademico, HistorialCurso, HistorialPeriodo } from './types'

/** La API devuelve una fila por inscripción; aquí se agrupan por gestión (puede haber varios cursos). */
export function agruparPeriodos(historial: HistorialAcademico): HistorialPeriodo[] {
  const grupos = new Map<number, HistorialPeriodo>()
  for (const registro of historial.periodos) {
    const periodo = grupos.get(registro.periodoId) ?? { periodoId: registro.periodoId, periodo: registro.periodo, cursos: [] }
    const curso: HistorialCurso = {
      cursoId: registro.cursoId,
      curso: registro.curso,
      promedio: registro.promedio,
      materias: registro.materias,
    }
    periodo.cursos.push(curso)
    grupos.set(registro.periodoId, periodo)
  }
  return [...grupos.values()]
}
