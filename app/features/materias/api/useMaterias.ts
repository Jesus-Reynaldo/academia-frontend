import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  CalificacionesParams,
  EstadoMateria,
  MateriaActualizar,
  MateriaCrear,
  MateriaListParams,
} from '../model/types'
import { materiasApi } from './materias.api'

// Claves jerárquicas: invalidar ['materias'] refresca listados, fichas y selectores a la vez.
export const materiasKeys = {
  all: ['materias'] as const,
  list: (params: MateriaListParams) => [...materiasKeys.all, 'list', params] as const,
  detail: (id: number) => [...materiasKeys.all, 'detail', id] as const,
  buscar: (texto: string, estado: EstadoMateria | undefined) => [...materiasKeys.all, 'buscar', texto, estado] as const,
  calificaciones: (id: number, params: CalificacionesParams) =>
    [...materiasKeys.all, 'calificaciones', id, params] as const,
}

const CINCO_MINUTOS = 5 * 60 * 1000

/** Listado paginado. Mantiene la página anterior visible mientras llega la nueva (sin parpadeo). */
export function useMateriasList(params: MateriaListParams) {
  return useQuery({
    queryKey: materiasKeys.list(params),
    queryFn: ({ signal }) => materiasApi.list(params, signal),
    placeholderData: keepPreviousData,
  })
}

export function useMateria(id: number | null) {
  return useQuery({
    queryKey: materiasKeys.detail(id ?? 0),
    queryFn: ({ signal }) => materiasApi.get(id as number, signal),
    enabled: id !== null,
  })
}

/**
 * Búsqueda para selectores: el filtrado lo hace el servidor (por nombre), así que funciona aunque haya
 * más materias que las que caben en una página. Cacheada por texto y estado.
 */
export function useMateriasBuscar(texto: string, estado: EstadoMateria | undefined) {
  return useQuery({
    queryKey: materiasKeys.buscar(texto, estado),
    queryFn: async ({ signal }) =>
      (
        await materiasApi.list(
          { page: 1, limit: 50, sortBy: 'nombre', order: 'asc', estado, nombre: texto || undefined },
          signal,
        )
      ).data,
    staleTime: CINCO_MINUTOS,
    placeholderData: keepPreviousData,
  })
}

export function useCalificacionesDeMateria(id: number, params: CalificacionesParams, habilitado: boolean) {
  return useQuery({
    queryKey: materiasKeys.calificaciones(id, params),
    queryFn: ({ signal }) => materiasApi.calificaciones(id, params, signal),
    placeholderData: keepPreviousData,
    enabled: habilitado,
  })
}

export function useCrearMateria() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: MateriaCrear) => materiasApi.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: materiasKeys.all }),
  })
}

export function useActualizarMateria() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: MateriaActualizar }) => materiasApi.update(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: materiasKeys.all }),
  })
}

export function useEliminarMateria() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => materiasApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: materiasKeys.all }),
  })
}
