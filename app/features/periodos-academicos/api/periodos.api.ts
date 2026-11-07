import { apiFetch } from '../../../shared/api/http'
import type { Paginated } from '../../../shared/api/pagination'
import type { PeriodoAcademico, PeriodoInput, PeriodoListParams, ResultadoEliminacion } from '../model/types'

const BASE = '/periodos-academicos'

export const periodosApi = {
  list: (params: Partial<PeriodoListParams>, signal?: AbortSignal) =>
    apiFetch<Paginated<PeriodoAcademico>>(BASE, { query: params, signal }),

  get: (id: number, signal?: AbortSignal) => apiFetch<PeriodoAcademico>(`${BASE}/${id}`, { signal }),

  create: (input: PeriodoInput) => apiFetch<PeriodoAcademico>(BASE, { method: 'POST', body: input }),

  update: (id: number, input: PeriodoInput) =>
    apiFetch<PeriodoAcademico>(`${BASE}/${id}`, {
      method: 'PATCH',
      body: input,
    }),

  /** 204 (sin cuerpo) → eliminado; 200 (con la entidad) → desactivado. */
  remove: async (id: number): Promise<ResultadoEliminacion> => {
    const result = await apiFetch<PeriodoAcademico | undefined>(`${BASE}/${id}`, { method: 'DELETE' })
    return result ? { tipo: 'desactivado', periodo: result } : { tipo: 'eliminado' }
  },
}
