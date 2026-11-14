import { motion } from 'motion/react'
import type { ReactNode } from 'react'

interface AparecerProps {
  children: ReactNode
  /** Posición en una lista: cada elemento aparece un poco después del anterior (máximo 12 pasos). */
  indice?: number
  className?: string
}

/**
 * Entrada suave (Motion): aparece subiendo 10 px. Con «reducir movimiento» activado en el sistema,
 * MotionConfig (root.tsx) la desactiva y el contenido aparece directamente.
 */
export function Aparecer({ children, indice = 0, className }: AparecerProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut', delay: Math.min(indice, 12) * 0.035 }}
    >
      {children}
    </motion.div>
  )
}
