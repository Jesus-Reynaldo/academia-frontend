import type { TipoEvaluacion } from './types'

export const ETIQUETA_TIPO_EVALUACION: Record<TipoEvaluacion, string> = {
  PARCIAL: 'Parcial',
  FINAL: 'Final',
  PRACTICA: 'Práctica',
  TAREA: 'Tarea',
  PROYECTO: 'Proyecto',
  PARTICIPACION: 'Participación',
  OTRA: 'Otra',
}

/** "1ro Secundaria" + paralelo "A" → "1ro Secundaria A"; si el nombre ya trae el paralelo, no lo repite. */
export function nombreCurso(curso: { nombre: string; paralelo: string | null }): string {
  const { nombre, paralelo } = curso
  if (!paralelo || nombre.trim().endsWith(` ${paralelo}`)) return nombre
  return `${nombre} ${paralelo}`
}
