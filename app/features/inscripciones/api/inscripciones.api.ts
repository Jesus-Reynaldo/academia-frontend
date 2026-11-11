import { apiFetch } from '../../../shared/api/http'
import type { Paginated } from '../../../shared/api/pagination'
import type { EstadoInscripcion, Inscripcion, InscripcionInput, InscripcionListParams } from '../model/types'

const BASE = '/inscripciones'

export const inscripcionesApi = {
  /** Con rol ESTUDIANTE, la API devuelve solo las suyas sin importar los filtros enviados. */
  list: (params: Partial<InscripcionListParams>, signal?: AbortSignal) =>
    apiFetch<Paginated<Inscripcion>>(BASE, { query: params, signal }),

  create: (input: InscripcionInput) => apiFetch<Inscripcion>(BASE, { method: 'POST', body: input }),

  cambiarEstado: (id: number, estado: EstadoInscripcion) =>
    apiFetch<Inscripcion>(`${BASE}/${id}`, { method: 'PATCH', body: { estado } }),

  /** 204 eliminada; 409 si tiene calificaciones. */
  remove: (id: number) => apiFetch<undefined>(`${BASE}/${id}`, { method: 'DELETE' }),
}
