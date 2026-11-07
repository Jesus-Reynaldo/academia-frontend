import { apiFetch } from '../../../shared/api/http'
import type { Paginated } from '../../../shared/api/pagination'
import type {
  CalificacionDocente,
  CalificacionesDocenteParams,
  Docente,
  DocenteInput,
  DocenteListParams,
  ResultadoEliminacion,
} from '../model/types'

const BASE = '/docentes'

export const docentesApi = {
  list: (params: Partial<DocenteListParams>, signal?: AbortSignal) =>
    apiFetch<Paginated<Docente>>(BASE, { query: params, signal }),

  get: (id: number, signal?: AbortSignal) => apiFetch<Docente>(`${BASE}/${id}`, { signal }),

  /** Calificaciones que registró el docente, paginadas (el backend las ordena por id). */
  calificaciones: (id: number, params: CalificacionesDocenteParams, signal?: AbortSignal) =>
    apiFetch<Paginated<CalificacionDocente>>(`${BASE}/${id}/calificaciones`, { query: params, signal }),

  create: (input: DocenteInput) => apiFetch<Docente>(BASE, { method: 'POST', body: input }),

  update: (id: number, input: DocenteInput) =>
    apiFetch<Docente>(`${BASE}/${id}`, {
      method: 'PATCH',
      body: input,
    }),

  /** 204 (sin cuerpo) → eliminado; 200 (con la entidad) → desactivado. */
  remove: async (id: number): Promise<ResultadoEliminacion> => {
    const result = await apiFetch<Docente | undefined>(`${BASE}/${id}`, { method: 'DELETE' })
    return result ? { tipo: 'desactivado', docente: result } : { tipo: 'eliminado' }
  },
}
