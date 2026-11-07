import { useCallback } from 'react'
import { useSearchParams } from 'react-router'

type ParamValue = string | number | null | undefined

interface UpdateOptions {
  /** Reemplaza la entrada actual del historial en vez de agregar otra (útil al escribir en un buscador). */
  replace?: boolean
}

/**
 * El estado de una tabla (página, filtros, orden) vive en la URL: enlaces compartibles,
 * botón "atrás" correcto y recarga sin perder contexto (docs/UI-UX-PLAN.md, 6.2).
 *
 * `update` aplica los cambios y quita de la URL los valores vacíos. Si cambia algo distinto de
 * `page`, vuelve a la página 1 para no quedar en una página que ya no existe.
 */
export function useUrlParams() {
  const [searchParams, setSearchParams] = useSearchParams()

  const update = useCallback(
    (changes: Record<string, ParamValue>, options: UpdateOptions = {}) => {
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current)
          for (const [key, value] of Object.entries(changes)) {
            if (value === null || value === undefined || value === '') next.delete(key)
            else next.set(key, String(value))
          }
          if (!('page' in changes)) next.delete('page')
          return next
        },
        { replace: options.replace ?? false },
      )
    },
    [setSearchParams],
  )

  return [searchParams, update] as const
}
