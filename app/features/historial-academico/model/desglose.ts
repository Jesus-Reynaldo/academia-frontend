import { NOTA_APROBACION } from '../../../shared/config/env'
import type { HistorialCurso, HistorialMateria, HistorialPeriodo } from './types'

/** Tipos de evaluación que no tienen columna propia en la libreta. */
const ETIQUETA_TIPO: Record<string, string> = {
  TAREA: 'Tarea',
  PROYECTO: 'Proyecto',
  PARTICIPACION: 'Participación',
  OTRA: 'Otra',
}

export interface OtraEvaluacion {
  etiqueta: string
  nota: number
}

/** Notas de una materia repartidas en las columnas de la libreta. */
export interface DesgloseMateria {
  /** Un parcial por trimestre (3 posiciones); `null` si aún no hay nota. */
  parciales: (number | null)[]
  practicas: number[]
  finales: number[]
  otras: OtraEvaluacion[]
}

export function desglosar(materia: HistorialMateria): DesgloseMateria {
  const deTipo = (tipo: string) => materia.calificaciones.filter((c) => c.tipo === tipo).map((c) => c.nota)
  const parciales = deTipo('PARCIAL')
  const otras: OtraEvaluacion[] = materia.calificaciones
    .filter((c) => !['PARCIAL', 'PRACTICA', 'FINAL'].includes(c.tipo))
    .map((c) => ({ etiqueta: ETIQUETA_TIPO[c.tipo] ?? c.tipo, nota: c.nota }))
  // Un cuarto parcial o más no tiene columna: se muestra junto a las demás evaluaciones.
  parciales.slice(3).forEach((nota, i) => otras.push({ etiqueta: `Parcial ${i + 4}`, nota }))

  return {
    parciales: [0, 1, 2].map((i) => parciales[i] ?? null),
    practicas: deTipo('PRACTICA'),
    finales: deTipo('FINAL'),
    otras,
  }
}

/** Columnas opcionales: solo se muestran si al menos una materia del curso tiene datos. */
export function columnasDelCurso(curso: HistorialCurso) {
  const desgloses = curso.materias.map(desglosar)
  return {
    examenFinal: desgloses.some((d) => d.finales.length > 0),
    otras: desgloses.some((d) => d.otras.length > 0),
  }
}

export const estaDebajo = (nota: number | null | undefined) =>
  nota !== null && nota !== undefined && nota < NOTA_APROBACION

/**
 * Resumen de una gestión a partir de los promedios por materia que calcula el servidor:
 * aquí solo se cuentan y se comparan con la nota de aprobación, no se recalculan.
 */
export function resumenPeriodo(periodo: HistorialPeriodo) {
  const materias = periodo.cursos.flatMap((curso) => curso.materias).filter((m) => m.promedio !== null)
  const debajo = materias.filter((m) => estaDebajo(m.promedio))
  return {
    materias: materias.length,
    aprobadas: materias.length - debajo.length,
    debajo: debajo.map((m) => ({ nombre: m.materia, promedio: m.promedio as number })),
  }
}
