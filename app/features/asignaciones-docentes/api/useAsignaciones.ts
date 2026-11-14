import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { AsignacionInput, AsignacionListParams } from '../model/types'
import { asignacionesApi } from './asignaciones.api'

export const asignacionesKeys = {
  all: ['asignaciones-docentes'] as const,
  list: (params: AsignacionListParams) => [...asignacionesKeys.all, 'list', params] as const,
  delCurso: (cursoId: number) => [...asignacionesKeys.all, 'curso', cursoId] as const,
}

export function useAsignacionesList(params: AsignacionListParams) {
  return useQuery({
    queryKey: asignacionesKeys.list(params),
    queryFn: ({ signal }) => asignacionesApi.list(params, signal),
    placeholderData: keepPreviousData,
  })
}

/**
 * Asignaciones ACTIVAS de un curso (todas sus gestiones). Para un DOCENTE, solo las suyas.
 * Lo usa el registro de calificaciones: qué materias puede elegir el docente y qué docente sugerir al admin.
 */
export function useAsignacionesDelCurso(cursoId: number | null) {
  return useQuery({
    queryKey: asignacionesKeys.delCurso(cursoId ?? 0),
    queryFn: async ({ signal }) => {
      const filas = []
      for (let page = 1; ; page++) {
        const r = await asignacionesApi.list({ cursoId: cursoId as number, estado: 'ACTIVA', page, limit: 100 }, signal)
        filas.push(...r.data)
        if (page >= r.meta.totalPages) return filas
      }
    },
    enabled: cursoId !== null,
    staleTime: 60 * 1000,
  })
}

/** Al crear o cambiar una asignación cambian también los cursos, materias y estudiantes que ve el docente. */
function useRefrescarTodo() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries()
}

export function useCrearAsignacion() {
  const refrescar = useRefrescarTodo()
  return useMutation({
    mutationFn: (input: AsignacionInput) => asignacionesApi.create(input),
    onSuccess: refrescar,
  })
}

export function useActualizarAsignacion() {
  const refrescar = useRefrescarTodo()
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: Partial<AsignacionInput> }) => asignacionesApi.update(id, input),
    onSuccess: refrescar,
  })
}
