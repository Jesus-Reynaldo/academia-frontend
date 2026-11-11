import { useEffect } from 'react'
import type { PaginationMeta } from '../api/pagination'

/**
 * Un enlace con una página que ya no existe devolvería filas vacías con total > 0: lleva al usuario a la
 * última página real. Devuelve true mientras ocurre, para no mostrar "no hay datos" en ese instante.
 */
export function usePaginaEnRango(
  meta: PaginationMeta | undefined,
  filas: number | undefined,
  onChange: (changes: { page: number }) => void,
): boolean {
  const fueraDeRango = meta !== undefined && filas === 0 && meta.total > 0 && meta.totalPages > 0
  const ultimaPagina = meta?.totalPages
  useEffect(() => {
    if (fueraDeRango && ultimaPagina) onChange({ page: ultimaPagina })
  }, [fueraDeRango, ultimaPagina, onChange])
  return fueraDeRango
}
