import { apiFetch } from '../../../shared/api/http'
import type { Paginated } from '../../../shared/api/pagination'
import { toIsoDate, toIsoFinDelDia } from '../model/schema'
import type {
  Calificacion,
  CalificacionCrearInput,
  CalificacionEditarInput,
  CalificacionListParams,
  CursoResumen,
  DocenteResumen,
  EstudianteResumen,
  InscripcionOpcion,
  MateriaResumen,
} from '../model/types'

const BASE = '/calificaciones'

// PASO 1: endpoints de calificaciones. No hay DELETE: la API siempre responde 409 (RF-CAL-03).
export const calificacionesApi = {
  list: (params: Partial<CalificacionListParams>, signal?: AbortSignal) =>
    apiFetch<Paginated<Calificacion>>(BASE, {
      // Las fechas del filtro viajan como ISO 8601; "hasta" incluye todo ese día.
      query: {
        ...params,
        fechaDesde: params.fechaDesde ? toIsoDate(params.fechaDesde) : undefined,
        fechaHasta: params.fechaHasta ? toIsoFinDelDia(params.fechaHasta) : undefined,
      },
      signal,
    }),

  create: (input: CalificacionCrearInput) => apiFetch<Calificacion>(BASE, { method: 'POST', body: input }),

  update: (id: number, input: CalificacionEditarInput) =>
    apiFetch<Calificacion>(`${BASE}/${id}`, { method: 'PATCH', body: input }),
}

// PASO 2: listas de apoyo para filtros y formulario.
// Viven aquí (y no en otros módulos) porque un feature no importa archivos internos de otro.
// Si más adelante cursos/materias/docentes exportan sus selectores en su index.ts, se pueden reemplazar.
export const referenciasApi = {
  /** Inscripciones ACTIVAS para el autocompletar (la API no tiene búsqueda de texto: se filtra en el navegador). */
  inscripciones: (signal?: AbortSignal) =>
    apiFetch<Paginated<InscripcionOpcion>>('/inscripciones', {
      query: { page: 1, limit: 100, estado: 'ACTIVA', sortBy: 'id', order: 'desc' },
      signal,
    }),

  materias: (signal?: AbortSignal) =>
    apiFetch<Paginated<MateriaResumen>>('/materias', {
      query: { page: 1, limit: 100, sortBy: 'nombre', order: 'asc' },
      signal,
    }),

  cursos: (signal?: AbortSignal) =>
    apiFetch<Paginated<CursoResumen>>('/cursos', {
      query: { page: 1, limit: 100, sortBy: 'nombre', order: 'asc' },
      signal,
    }),

  /** Solo ADMIN puede listar docentes. */
  docentes: (signal?: AbortSignal) =>
    apiFetch<Paginated<DocenteResumen>>('/docentes', {
      query: { page: 1, limit: 100, sortBy: 'apellidos', order: 'asc' },
      signal,
    }),

  /** Búsqueda en el servidor por nombre, apellido, código o documento (ADMIN y DOCENTE). */
  buscarEstudiantes: (texto: string, signal?: AbortSignal) =>
    apiFetch<Paginated<EstudianteResumen>>('/estudiantes', {
      query: { page: 1, limit: 20, q: texto, sortBy: 'apellidos', order: 'asc' },
      signal,
    }),

  estudiante: (id: number, signal?: AbortSignal) => apiFetch<EstudianteResumen>(`/estudiantes/${id}`, { signal }),
}
