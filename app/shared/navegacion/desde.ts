import { useLocation } from 'react-router'

/** Pantalla desde la que se llegó a una sub-pantalla (ficha, detalle), con sus filtros. */
export interface Desde {
  ruta: string
  etiqueta: string
}

/**
 * Para los enlaces que saltan a otro módulo: `<Link to="/estudiantes/5" state={desde}>`. Así la flecha «← …»
 * de la ficha vuelve a ESTA pantalla (con sus filtros) y no a la lista general del otro módulo.
 */
export function useDesde(etiqueta: string): { desde: Desde } {
  const { pathname, search } = useLocation()
  return { desde: { ruta: pathname + search, etiqueta } }
}

/** Lee el «desde» guardado en la navegación; null si no hay o no es válido (p. ej. al abrir un enlace directo). */
export function leerDesde(state: unknown): Desde | null {
  const d = (state as { desde?: Partial<Desde> } | null)?.desde
  return d && typeof d.ruta === 'string' && d.ruta.startsWith('/') && typeof d.etiqueta === 'string' ? { ruta: d.ruta, etiqueta: d.etiqueta } : null
}
