import { apiFetch } from '../../../shared/api/http'
import type { Paginated } from '../../../shared/api/pagination'
import type {
  Curso,
  CursoInput,
  CursoListParams,
  EstudianteDelCurso,
  MateriaDelCurso,
  PaginaDetalleParams,
  ResultadoEliminacion,
} from '../model/types'

const BASE = '/cursos'

export const cursosApi = {
  // El texto del buscador viaja como «q»: el servidor lo busca palabra por palabra en todas las columnas visibles.
  list: ({ nombre, ...params }: Partial<CursoListParams>, signal?: AbortSignal) =>
    apiFetch<Paginated<Curso>>(BASE, { query: { ...params, q: nombre }, signal }),

  get: (id: number, signal?: AbortSignal) => apiFetch<Curso>(`${BASE}/${id}`, { signal }),

  /** Solo ADMIN y DOCENTE. El backend devuelve los inscritos de todas las gestiones. */
  estudiantes: (id: number, params: PaginaDetalleParams, signal?: AbortSignal) =>
    apiFetch<Paginated<EstudianteDelCurso>>(`${BASE}/${id}/estudiantes`, { query: params, signal }),

  /** Materias que ya tienen calificaciones en este curso (el modelo no relaciona curso y materia directamente). */
  materias: (id: number, params: PaginaDetalleParams, signal?: AbortSignal) =>
    apiFetch<Paginated<MateriaDelCurso>>(`${BASE}/${id}/materias`, { query: params, signal }),

  create: (input: CursoInput) => apiFetch<Curso>(BASE, { method: 'POST', body: input }),

  update: (id: number, input: CursoInput) => apiFetch<Curso>(`${BASE}/${id}`, { method: 'PATCH', body: input }),

  /** 204 (sin cuerpo) → eliminado; 200 (con la entidad) → desactivado. */
  remove: async (id: number): Promise<ResultadoEliminacion> => {
    const result = await apiFetch<Curso | undefined>(`${BASE}/${id}`, { method: 'DELETE' })
    return result ? { tipo: 'desactivado', curso: result } : { tipo: 'eliminado' }
  },
}
