import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { CalificacionCrearInput, CalificacionEditarInput, CalificacionListParams } from '../model/types'
import { calificacionesApi, referenciasApi } from './calificaciones.api'

// Claves jerárquicas: invalidar ['calificaciones'] refresca el listado.
export const calificacionesKeys = {
  all: ['calificaciones'] as const,
  list: (params: CalificacionListParams) => [...calificacionesKeys.all, 'list', params] as const,
}

const DIEZ_MINUTOS = 10 * 60 * 1000

/** Listado paginado. Mantiene la página anterior visible mientras llega la nueva (sin parpadeo). */
export function useCalificacionesList(params: CalificacionListParams) {
  return useQuery({
    queryKey: calificacionesKeys.list(params),
    queryFn: ({ signal }) => calificacionesApi.list(params, signal),
    placeholderData: keepPreviousData,
  })
}

export function useCrearCalificacion() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CalificacionCrearInput) => calificacionesApi.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: calificacionesKeys.all }),
  })
}

export function useActualizarCalificacion() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: CalificacionEditarInput }) =>
      calificacionesApi.update(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: calificacionesKeys.all }),
  })
}

// ---- Listas de apoyo (datos de referencia: se cachean y se comparten entre filtros y formulario) ----

/** Inscripciones activas del curso elegido; sin curso no se consulta. */
export function useInscripcionesReferencia(cursoId: number | null, habilitado = true) {
  return useQuery({
    queryKey: ['referencias', 'inscripciones-activas', cursoId],
    queryFn: ({ signal }) => referenciasApi.inscripciones(cursoId as number, signal),
    staleTime: 60 * 1000,
    enabled: habilitado && cursoId !== null,
  })
}

export function useMateriasReferencia() {
  return useQuery({
    queryKey: ['referencias', 'materias'],
    queryFn: async ({ signal }) => (await referenciasApi.materias(signal)).data,
    staleTime: DIEZ_MINUTOS,
  })
}

export function useCursosReferencia() {
  return useQuery({
    queryKey: ['referencias', 'cursos'],
    queryFn: async ({ signal }) => (await referenciasApi.cursos(signal)).data,
    staleTime: DIEZ_MINUTOS,
  })
}

export function useDocentesReferencia(habilitado: boolean) {
  return useQuery({
    queryKey: ['referencias', 'docentes'],
    queryFn: async ({ signal }) => (await referenciasApi.docentes(signal)).data,
    staleTime: DIEZ_MINUTOS,
    enabled: habilitado,
  })
}

export function useBuscarEstudiantes(texto: string, habilitado: boolean) {
  return useQuery({
    queryKey: ['referencias', 'estudiantes-busqueda', texto],
    queryFn: async ({ signal }) => (await referenciasApi.buscarEstudiantes(texto, signal)).data,
    staleTime: 60 * 1000,
    enabled: habilitado,
    placeholderData: keepPreviousData,
  })
}

/** Datos del estudiante elegido en el filtro (viene solo el id en la URL). */
export function useEstudianteReferencia(id: number | undefined) {
  return useQuery({
    queryKey: ['referencias', 'estudiante', id],
    queryFn: ({ signal }) => referenciasApi.estudiante(id!, signal),
    staleTime: DIEZ_MINUTOS,
    enabled: id !== undefined,
  })
}
