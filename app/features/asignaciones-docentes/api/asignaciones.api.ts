import { apiFetch } from '../../../shared/api/http'
import type { Paginated } from '../../../shared/api/pagination'
import type { AsignacionDocente, AsignacionInput, AsignacionListParams } from '../model/types'

const BASE = '/asignaciones-docentes'

export const asignacionesApi = {
  /** Un DOCENTE recibe solo las suyas (el servidor lo impone). */
  list: (params: Partial<AsignacionListParams>, signal?: AbortSignal) =>
    apiFetch<Paginated<AsignacionDocente>>(BASE, { query: { ...params }, signal }),

  create: (input: AsignacionInput) => apiFetch<AsignacionDocente>(BASE, { method: 'POST', body: input }),

  update: (id: number, input: Partial<AsignacionInput>) =>
    apiFetch<AsignacionDocente>(`${BASE}/${id}`, { method: 'PATCH', body: input }),
}
