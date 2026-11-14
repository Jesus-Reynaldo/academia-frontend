import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { activosPrimero } from '../../../shared/api/activosPrimero'
import { apiFetch } from '../../../shared/api/http'
import type { Paginated } from '../../../shared/api/pagination'
import type { Aula, AulaInput, AulaListParams } from '../model/types'

const BASE = '/aulas'

export const aulasApi = {
  list: (params: Partial<AulaListParams>, signal?: AbortSignal) => apiFetch<Paginated<Aula>>(BASE, { query: { ...params }, signal }),
  create: (input: AulaInput) => apiFetch<Aula>(BASE, { method: 'POST', body: input }),
  update: (id: number, input: Partial<AulaInput>) => apiFetch<Aula>(`${BASE}/${id}`, { method: 'PATCH', body: input }),
}

export const aulasKeys = {
  all: ['aulas'] as const,
  list: (params: AulaListParams) => [...aulasKeys.all, 'list', params] as const,
  activas: () => [...aulasKeys.all, 'activas'] as const,
}

const ORDEN_ESTADOS = ['ACTIVA', 'INACTIVA'] as const

/** Sin filtro de estado: las activas primero y las inactivas al final. */
export function useAulasList(params: AulaListParams) {
  return useQuery({
    queryKey: aulasKeys.list(params),
    queryFn: ({ signal }) =>
      params.estado
        ? aulasApi.list(params, signal)
        : activosPrimero(ORDEN_ESTADOS, (estado, page, limit) => aulasApi.list({ ...params, estado, page, limit }, signal), params.page, params.limit),
    placeholderData: keepPreviousData,
  })
}

/** Todas las aulas activas (para elegir en el horario). */
export function useAulasActivas() {
  return useQuery({
    queryKey: aulasKeys.activas(),
    queryFn: async ({ signal }) => {
      const filas: Aula[] = []
      for (let page = 1; ; page++) {
        const r = await aulasApi.list({ estado: 'ACTIVA', sortBy: 'codigo', order: 'asc', page, limit: 100 }, signal)
        filas.push(...r.data)
        if (page >= r.meta.totalPages) return filas
      }
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useGuardarAula() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id?: number; input: AulaInput }) => (id ? aulasApi.update(id, input) : aulasApi.create(input)),
    onSuccess: () => queryClient.invalidateQueries(),
  })
}
