import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { CursoInput, CursoListParams, PaginaDetalleParams } from '../model/types'
import { cursosApi } from './cursos.api'

// Claves jerárquicas: invalidar ['cursos'] refresca el listado y los detalles a la vez.
export const cursosKeys = {
  all: ['cursos'] as const,
  list: (params: CursoListParams) => [...cursosKeys.all, 'list', params] as const,
  detail: (id: number) => [...cursosKeys.all, 'detail', id] as const,
  estudiantes: (id: number, params: PaginaDetalleParams) =>
    [...cursosKeys.detail(id), 'estudiantes', params] as const,
  materias: (id: number, params: PaginaDetalleParams) => [...cursosKeys.detail(id), 'materias', params] as const,
}

/** Listado paginado. Mantiene la página anterior visible mientras llega la nueva (sin parpadeo). */
export function useCursosList(params: CursoListParams) {
  return useQuery({
    queryKey: cursosKeys.list(params),
    queryFn: ({ signal }) => cursosApi.list(params, signal),
    placeholderData: keepPreviousData,
  })
}

export function useCurso(id: number) {
  return useQuery({
    queryKey: cursosKeys.detail(id),
    queryFn: ({ signal }) => cursosApi.get(id, signal),
  })
}

export function useEstudiantesDelCurso(id: number, params: PaginaDetalleParams) {
  return useQuery({
    queryKey: cursosKeys.estudiantes(id, params),
    queryFn: ({ signal }) => cursosApi.estudiantes(id, params, signal),
    placeholderData: keepPreviousData,
  })
}

export function useMateriasDelCurso(id: number, params: PaginaDetalleParams) {
  return useQuery({
    queryKey: cursosKeys.materias(id, params),
    queryFn: ({ signal }) => cursosApi.materias(id, params, signal),
    placeholderData: keepPreviousData,
  })
}

export function useCrearCurso() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CursoInput) => cursosApi.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: cursosKeys.all }),
  })
}

export function useActualizarCurso() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: CursoInput }) => cursosApi.update(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: cursosKeys.all }),
  })
}

export function useEliminarCurso() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => cursosApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: cursosKeys.all }),
  })
}
