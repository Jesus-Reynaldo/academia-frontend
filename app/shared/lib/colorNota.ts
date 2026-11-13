import { NOTA_APROBACION } from '../config/env'
import { colors } from '../theme/tokens'

/** Color de una nota en gráficos: mismos cortes y colores que GradeBadge (reprobado, aprobado, bueno, excelente). */
export function colorNota(nota: number) {
  if (nota < NOTA_APROBACION) return colors.error.main
  if (nota <= 70) return colors.warning.main
  if (nota <= 85) return colors.info.main
  return colors.success.main
}
