import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { PeriodoInput, PeriodoListParams } from '../model/types'
import { periodosApi } from './periodos.api'

// Claves jerárquicas: invalidar ['periodos-academicos'] refresca listados y selectores a la vez.
export const periodosKeys = {
  all: ['periodos-academicos'] as const,
  list: (params: PeriodoListParams) => [...periodosKeys.all, 'list', params] as const,
  referencia: () => [...periodosKeys.all, 'referencia'] as const,
}

const DIEZ_MINUTOS = 10 * 60 * 1000

/** Listado paginado. Mantiene la página anterior visible mientras llega la nueva (sin parpadeo). */
export function usePeriodosList(params: PeriodoListParams) {
  return useQuery({
    queryKey: periodosKeys.list(params),
    queryFn: ({ signal }) => periodosApi.list(params, signal),
    placeholderData: keepPreviousData,
  })
}

/**
 * Todos los períodos (hasta 100, el máximo de la API) para selectores y formularios.
 * Dato de referencia: se cachea mucho tiempo y se comparte entre pantallas.
 */
export function usePeriodosReferencia() {
  return useQuery({
    queryKey: periodosKeys.referencia(),
    queryFn: async ({ signal }) =>
      (await periodosApi.list({ page: 1, limit: 100, sortBy: 'fechaInicio', order: 'desc' }, signal)).data,
    staleTime: DIEZ_MINUTOS,
  })
}

export function useCrearPeriodo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: PeriodoInput) => periodosApi.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: periodosKeys.all }),
  })
}

export function useActualizarPeriodo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: PeriodoInput }) => periodosApi.update(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: periodosKeys.all }),
  })
}

export function useEliminarPeriodo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => periodosApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: periodosKeys.all }),
  })
}
