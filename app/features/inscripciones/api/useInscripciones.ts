import { keepPreviousData, useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import type { EstadoInscripcion, InscripcionInput, InscripcionListParams } from '../model/types'
import { inscripcionesApi } from './inscripciones.api'

export const inscripcionesKeys = {
  all: ['inscripciones'] as const,
  list: (params: InscripcionListParams) => [...inscripcionesKeys.all, 'list', params] as const,
}

/** Una inscripción cambia la ocupación de los cursos y la ficha del estudiante: se refrescan también. */
function refrescar(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: inscripcionesKeys.all }),
    queryClient.invalidateQueries({ queryKey: ['cursos'] }),
    queryClient.invalidateQueries({ queryKey: ['estudiantes'] }),
  ])
}

/** Listado paginado. Mantiene la página anterior visible mientras llega la nueva (sin parpadeo). */
export function useInscripcionesList(params: InscripcionListParams) {
  return useQuery({
    queryKey: inscripcionesKeys.list(params),
    queryFn: ({ signal }) => inscripcionesApi.list(params, signal),
    placeholderData: keepPreviousData,
  })
}

export function useCrearInscripcion() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: InscripcionInput) => inscripcionesApi.create(input),
    onSuccess: () => refrescar(queryClient),
  })
}

export function useCambiarEstadoInscripcion() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, estado }: { id: number; estado: EstadoInscripcion }) => inscripcionesApi.cambiarEstado(id, estado),
    onSuccess: () => refrescar(queryClient),
  })
}

export function useEliminarInscripcion() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => inscripcionesApi.remove(id),
    onSuccess: () => refrescar(queryClient),
  })
}
