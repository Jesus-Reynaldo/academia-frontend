import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '../../../shared/api/http'
import type { Paginated } from '../../../shared/api/pagination'
import type { Horario, HorarioFiltros, HorarioInput } from '../model/types'

const BASE = '/horarios'

export const horariosApi = {
  /** DOCENTE: solo los suyos; ESTUDIANTE: los de sus cursos (lo impone el servidor). */
  list: (params: HorarioFiltros & { page: number; limit: number }, signal?: AbortSignal) =>
    apiFetch<Paginated<Horario>>(BASE, { query: { ...params }, signal }),
  create: (input: HorarioInput) => apiFetch<Horario>(BASE, { method: 'POST', body: input }),
  update: (id: number, input: Partial<HorarioInput>) => apiFetch<Horario>(`${BASE}/${id}`, { method: 'PATCH', body: input }),
}

/** Todos los bloques que cumplen los filtros (una semana completa cabe de sobra). */
export async function todosLosHorarios(filtros: HorarioFiltros, signal?: AbortSignal) {
  const filas: Horario[] = []
  for (let page = 1; page <= 30; page++) {
    const r = await horariosApi.list({ ...filtros, page, limit: 100 }, signal)
    filas.push(...r.data)
    if (page >= r.meta.totalPages) break
  }
  return filas
}

export const horariosKeys = {
  all: ['horarios'] as const,
  lista: (filtros: HorarioFiltros) => [...horariosKeys.all, filtros] as const,
}

export function useHorarios(filtros: HorarioFiltros, habilitado = true) {
  return useQuery({
    queryKey: horariosKeys.lista(filtros),
    queryFn: ({ signal }) => todosLosHorarios(filtros, signal),
    enabled: habilitado,
  })
}

export function useGuardarHorario() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id?: number; input: Partial<HorarioInput> }) =>
      id ? horariosApi.update(id, input) : horariosApi.create(input as HorarioInput),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: horariosKeys.all }),
  })
}
