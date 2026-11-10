import { apiFetch } from '../../../shared/api/http'
import type { Paginated } from '../../../shared/api/pagination'
import type {
  CalificacionDelEstudiante,
  Estudiante,
  EstudianteInput,
  EstudianteListParams,
  InscripcionDelEstudiante,
  PaginaFichaParams,
  ResultadoEliminacion,
} from '../model/types'

const BASE = '/estudiantes'

export const estudiantesApi = {
  list: (params: Partial<EstudianteListParams>, signal?: AbortSignal) =>
    apiFetch<Paginated<Estudiante>>(BASE, { query: params, signal }),

  get: (id: number, signal?: AbortSignal) => apiFetch<Estudiante>(`${BASE}/${id}`, { signal }),

  /** Se usa GET /inscripciones porque, a diferencia de /estudiantes/:id/inscripciones, incluye curso y período. */
  inscripciones: (estudianteId: number, params: PaginaFichaParams, signal?: AbortSignal) =>
    apiFetch<Paginated<InscripcionDelEstudiante>>('/inscripciones', {
      query: { ...params, estudianteId, sortBy: 'fechaInscripcion' },
      signal,
    }),

  calificaciones: (id: number, params: PaginaFichaParams, signal?: AbortSignal) =>
    apiFetch<Paginated<CalificacionDelEstudiante>>(`${BASE}/${id}/calificaciones`, { query: params, signal }),

  create: (input: EstudianteInput) => apiFetch<Estudiante>(BASE, { method: 'POST', body: input }),

  update: (id: number, input: EstudianteInput) =>
    apiFetch<Estudiante>(`${BASE}/${id}`, { method: 'PATCH', body: input }),

  /** 204 (sin cuerpo) → eliminado; 200 (con la entidad) → desactivado. */
  remove: async (id: number): Promise<ResultadoEliminacion> => {
    const result = await apiFetch<Estudiante | undefined>(`${BASE}/${id}`, { method: 'DELETE' })
    return result ? { tipo: 'desactivado', estudiante: result } : { tipo: 'eliminado' }
  },
}
