import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { apiFetch } from '../../../shared/api/http'
import type { Paginated } from '../../../shared/api/pagination'
import type { BitacoraParams, RegistroBitacora } from '../model/types'

/** Una página de la bitácora (solo ADMIN). El servidor ya la entrega ordenada, más reciente primero. */
export function useBitacora(params: BitacoraParams) {
  return useQuery({
    queryKey: ['bitacora', params],
    queryFn: ({ signal }) => apiFetch<Paginated<RegistroBitacora>>('/bitacora', { query: { ...params }, signal }),
    placeholderData: keepPreviousData,
    // Es un registro de lo que pasa ahora: se refresca al volver a la pantalla.
    staleTime: 0,
  })
}
