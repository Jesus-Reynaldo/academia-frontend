import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { activosPrimero } from '../../../shared/api/activosPrimero'
import type { EstadoEstudiante, EstudianteInput, EstudianteListParams, PaginaFichaParams } from '../model/types'
import { estudiantesApi } from './estudiantes.api'

// Claves jerárquicas: invalidar ['estudiantes'] refresca el listado, las fichas y los selectores a la vez.
export const estudiantesKeys = {
  all: ['estudiantes'] as const,
  list: (params: EstudianteListParams) => [...estudiantesKeys.all, 'list', params] as const,
  buscar: (texto: string, estado?: EstadoEstudiante) => [...estudiantesKeys.all, 'buscar', texto, estado] as const,
  detail: (id: number) => [...estudiantesKeys.all, 'detail', id] as const,
  inscripciones: (id: number, params: PaginaFichaParams) =>
    [...estudiantesKeys.detail(id), 'inscripciones', params] as const,
  calificaciones: (id: number, params: PaginaFichaParams) =>
    [...estudiantesKeys.detail(id), 'calificaciones', params] as const,
}

const CINCO_MINUTOS = 5 * 60 * 1000

/** Listado paginado. Mantiene la página anterior visible mientras llega la nueva (sin parpadeo). */
/** Orden de los grupos cuando no se filtra por estado: los inactivos van al final. */
const ORDEN_ESTADOS = ['ACTIVO', 'EGRESADO', 'RETIRADO', 'INACTIVO'] as const

export function useEstudiantesList(params: EstudianteListParams) {
  return useQuery({
    queryKey: estudiantesKeys.list(params),
    // Sin filtro de estado: los activos primero y los inactivos al final (cada grupo en el orden elegido).
    queryFn: ({ signal }) =>
      params.estado
        ? estudiantesApi.list(params, signal)
        : activosPrimero(ORDEN_ESTADOS, (estado, page, limit) => estudiantesApi.list({ ...params, estado, page, limit }, signal), params.page, params.limit),
    placeholderData: keepPreviousData,
  })
}

/** `id` nulo: consulta desactivada (p. ej. un selector sin nada elegido). */
export function useEstudiante(id: number | null) {
  return useQuery({
    queryKey: estudiantesKeys.detail(id ?? 0),
    queryFn: ({ signal }) => estudiantesApi.get(id as number, signal),
    enabled: id !== null,
  })
}

/** Búsqueda para el selector: cachea por texto y mantiene los resultados previos mientras llega la nueva. */
export function useEstudiantesBuscar(texto: string, estado?: EstadoEstudiante) {
  return useQuery({
    queryKey: estudiantesKeys.buscar(texto, estado),
    queryFn: async ({ signal }) =>
      (await estudiantesApi.list({ page: 1, limit: 20, sortBy: 'apellidos', order: 'asc', q: texto || undefined, estado }, signal))
        .data,
    placeholderData: keepPreviousData,
    staleTime: CINCO_MINUTOS,
  })
}

export function useInscripcionesDelEstudiante(id: number, params: PaginaFichaParams) {
  return useQuery({
    queryKey: estudiantesKeys.inscripciones(id, params),
    queryFn: ({ signal }) => estudiantesApi.inscripciones(id, params, signal),
    placeholderData: keepPreviousData,
  })
}

export function useCalificacionesDelEstudiante(id: number, params: PaginaFichaParams) {
  return useQuery({
    queryKey: estudiantesKeys.calificaciones(id, params),
    queryFn: ({ signal }) => estudiantesApi.calificaciones(id, params, signal),
    placeholderData: keepPreviousData,
  })
}

export function useCrearEstudiante() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: EstudianteInput) => estudiantesApi.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: estudiantesKeys.all }),
  })
}

export function useActualizarEstudiante() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: EstudianteInput }) => estudiantesApi.update(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: estudiantesKeys.all }),
  })
}

export function useEliminarEstudiante() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => estudiantesApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: estudiantesKeys.all }),
  })
}
