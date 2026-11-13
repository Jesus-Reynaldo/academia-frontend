import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { activosPrimero } from '../../../shared/api/activosPrimero'
import type { CalificacionesDocenteParams, DocenteInput, DocenteListParams } from '../model/types'
import { docentesApi } from './docentes.api'

// Claves jerárquicas: invalidar ['docentes'] refresca el listado y las fichas a la vez.
export const docentesKeys = {
  all: ['docentes'] as const,
  list: (params: DocenteListParams) => [...docentesKeys.all, 'list', params] as const,
  detail: (id: number) => [...docentesKeys.all, 'detail', id] as const,
  calificaciones: (id: number, params: CalificacionesDocenteParams) =>
    [...docentesKeys.detail(id), 'calificaciones', params] as const,
}

/** Listado paginado. Mantiene la página anterior visible mientras llega la nueva (sin parpadeo). */
/** Orden de los grupos cuando no se filtra por estado: los inactivos van al final. */
const ORDEN_ESTADOS = ['ACTIVO', 'INACTIVO'] as const

export function useDocentesList(params: DocenteListParams) {
  return useQuery({
    queryKey: docentesKeys.list(params),
    // Sin filtro de estado: los activos primero y los inactivos al final (cada grupo en el orden elegido).
    queryFn: ({ signal }) =>
      params.estado
        ? docentesApi.list(params, signal)
        : activosPrimero(ORDEN_ESTADOS, (estado, page, limit) => docentesApi.list({ ...params, estado, page, limit }, signal), params.page, params.limit),
    placeholderData: keepPreviousData,
  })
}

/** Un docente por id. `id` nulo: consulta desactivada (p. ej. un selector sin nada elegido). */
export function useDocente(id: number | null) {
  return useQuery({
    queryKey: docentesKeys.detail(id ?? 0),
    queryFn: ({ signal }) => docentesApi.get(id as number, signal),
    enabled: id !== null,
  })
}

/** Búsqueda para el selector: mantiene los resultados previos mientras llega la nueva. */
export function useDocentesBuscar(texto: string) {
  return useQuery({
    queryKey: [...docentesKeys.all, 'buscar', texto] as const,
    queryFn: async ({ signal }) =>
      (await docentesApi.list({ page: 1, limit: 20, sortBy: 'apellidos', order: 'asc', nombre: texto || undefined }, signal)).data,
    placeholderData: keepPreviousData,
  })
}

/** Pestaña "Calificaciones" de la ficha: solo se pide cuando la pestaña está abierta (`enabled`). */
export function useDocenteCalificaciones(id: number, params: CalificacionesDocenteParams, enabled: boolean) {
  return useQuery({
    queryKey: docentesKeys.calificaciones(id, params),
    queryFn: ({ signal }) => docentesApi.calificaciones(id, params, signal),
    placeholderData: keepPreviousData,
    enabled,
  })
}

export function useCrearDocente() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: DocenteInput) => docentesApi.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: docentesKeys.all }),
  })
}

export function useActualizarDocente() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: DocenteInput }) => docentesApi.update(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: docentesKeys.all }),
  })
}

export function useEliminarDocente() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => docentesApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: docentesKeys.all }),
  })
}
