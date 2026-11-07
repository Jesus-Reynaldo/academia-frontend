import { apiFetch } from '../../../shared/api/http'
import type { Paginated } from '../../../shared/api/pagination'
import type {
  CalificacionDeMateria,
  CalificacionesParams,
  Materia,
  MateriaActualizar,
  MateriaCrear,
  MateriaListParams,
  ResultadoEliminacion,
} from '../model/types'

const BASE = '/materias'

export const materiasApi = {
  list: (params: Partial<MateriaListParams>, signal?: AbortSignal) =>
    apiFetch<Paginated<Materia>>(BASE, { query: params, signal }),

  get: (id: number, signal?: AbortSignal) => apiFetch<Materia>(`${BASE}/${id}`, { signal }),

  create: (input: MateriaCrear) => apiFetch<Materia>(BASE, { method: 'POST', body: input }),

  update: (id: number, input: MateriaActualizar) =>
    apiFetch<Materia>(`${BASE}/${id}`, { method: 'PATCH', body: input }),

  /** 204 (sin cuerpo) → eliminada; 200 (con la entidad) → desactivada por tener calificaciones. */
  remove: async (id: number): Promise<ResultadoEliminacion> => {
    const result = await apiFetch<Materia | undefined>(`${BASE}/${id}`, { method: 'DELETE' })
    return result ? { tipo: 'desactivada', materia: result } : { tipo: 'eliminada' }
  },

  /** Solo ADMIN y DOCENTE (un ESTUDIANTE recibe 403). */
  calificaciones: (id: number, params: CalificacionesParams, signal?: AbortSignal) =>
    apiFetch<Paginated<CalificacionDeMateria>>(`${BASE}/${id}/calificaciones`, { query: params, signal }),
}
