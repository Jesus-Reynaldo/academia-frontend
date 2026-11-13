import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { activosPrimero } from '../../../shared/api/activosPrimero'
import type { CursoInput, CursoListParams, EstadoCurso, PaginaDetalleParams } from '../model/types'
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
/** Orden de los grupos cuando no se filtra por estado: los inactivos van al final. */
const ORDEN_ESTADOS = ['ACTIVO', 'INACTIVO'] as const

export function useCursosList(params: CursoListParams) {
  return useQuery({
    queryKey: cursosKeys.list(params),
    // Sin filtro de estado: los activos primero y los inactivos al final (cada grupo en el orden elegido).
    queryFn: ({ signal }) =>
      params.estado
        ? cursosApi.list(params, signal)
        : activosPrimero(ORDEN_ESTADOS, (estado, page, limit) => cursosApi.list({ ...params, estado, page, limit }, signal), params.page, params.limit),
    placeholderData: keepPreviousData,
  })
}

/** `id` nulo: consulta desactivada (p. ej. un selector sin nada elegido). */
export function useCurso(id: number | null) {
  return useQuery({
    queryKey: cursosKeys.detail(id ?? 0),
    queryFn: ({ signal }) => cursosApi.get(id as number, signal),
    enabled: id !== null,
  })
}

/** Búsqueda para el selector: cachea por texto y mantiene los resultados previos mientras llega la nueva. */
export function useCursosBuscar(texto: string, estado?: EstadoCurso) {
  return useQuery({
    queryKey: [...cursosKeys.all, 'buscar', texto, estado] as const,
    queryFn: async ({ signal }) =>
      (await cursosApi.list({ page: 1, limit: 50, sortBy: 'nombre', order: 'asc', nombre: texto || undefined, estado }, signal))
        .data,
    placeholderData: keepPreviousData,
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
