import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
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
export function useDocentesList(params: DocenteListParams) {
  return useQuery({
    queryKey: docentesKeys.list(params),
    queryFn: ({ signal }) => docentesApi.list(params, signal),
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
