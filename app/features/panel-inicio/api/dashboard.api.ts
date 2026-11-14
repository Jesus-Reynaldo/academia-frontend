import { apiFetch } from '../../../shared/api/http'
import type { Paginated } from '../../../shared/api/pagination'
import type {
  AdminResumen,
  CalificacionDashboard,
  DistribucionNotasResponse,
  EstudianteEnRiesgo,
  OcupacionCurso,
  PromedioCurso,
  ResumenDocente,
  ResumenEstudiante,
} from '../model/types'

const DASHBOARD = '/dashboard'

export const dashboardApi = {
  resumenAdmin: () => apiFetch<AdminResumen>(`${DASHBOARD}/resumen`),
  ocupacionCursos: (periodoAcademicoId?: number) =>
    apiFetch<{ periodo: unknown; data: OcupacionCurso[] }>(`${DASHBOARD}/ocupacion-cursos`, {
      query: { periodoAcademicoId },
    }),
  promediosCursos: (periodoAcademicoId?: number) =>
    apiFetch<{ periodo: unknown; data: PromedioCurso[] }>(`${DASHBOARD}/promedios-por-curso`, {
      query: { periodoAcademicoId },
    }),
  distribucionNotas: (periodoAcademicoId?: number, materiaId?: number) =>
    apiFetch<DistribucionNotasResponse>(`${DASHBOARD}/distribucion-notas`, {
      query: { periodoAcademicoId, materiaId },
    }),
  estudiantesEnRiesgo: (periodoAcademicoId: number | undefined, umbral: number, page: number) =>
    apiFetch<{
      umbral: number
      data: EstudianteEnRiesgo[]
      meta: { page: number; limit: number; total: number; totalPages: number }
    }>(`${DASHBOARD}/estudiantes-en-riesgo`, {
      query: { periodoAcademicoId, umbral, page, limit: 20 },
    }),
  resumenEstudiante: (id: number) => apiFetch<ResumenEstudiante>(`${DASHBOARD}/estudiantes/${id}/resumen`),
  resumenDocente: (id: number) => apiFetch<ResumenDocente>(`${DASHBOARD}/docentes/${id}/resumen`),
  calificacionesAdmin: () =>
    apiFetch<Paginated<CalificacionDashboard>>('/calificaciones', {
      query: { sortBy: 'id', order: 'desc', limit: 10 },
    }),
  calificacionesDocente: (id: number) =>
    apiFetch<Paginated<CalificacionDashboard>>(`/docentes/${id}/calificaciones`, {
      query: { page: 1, limit: 100, order: 'desc' },
    }),
  /** Cursos activos donde el docente tiene calificaciones, con su total (un conteo por curso). */
  cursosDocente: async (id: number) => {
    const cursos = await apiFetch<Paginated<{ id: number; nombre: string }>>('/cursos', {
      query: { page: 1, limit: 100, estado: 'ACTIVO', sortBy: 'nombre', order: 'asc' },
    })
    const conTotal = await Promise.all(
      cursos.data.map(async (curso) => {
        const notas = await apiFetch<Paginated<unknown>>('/calificaciones', {
          query: { docenteId: id, cursoId: curso.id, page: 1, limit: 1 },
        })
        return { id: curso.id, nombre: curso.nombre, total: notas.meta.total }
      }),
    )
    return conTotal.filter((curso) => curso.total > 0)
  },
  calificacionesDocentePorCurso: (id: number, cursoId: number, limit: number) =>
    apiFetch<Paginated<CalificacionDashboard>>('/calificaciones', {
      query: { docenteId: id, cursoId, page: 1, limit, sortBy: 'id', order: 'desc' },
    }),
  calificacionesEstudiante: (id: number) =>
    apiFetch<Paginated<CalificacionDashboard>>(`/estudiantes/${id}/calificaciones`, {
      query: { page: 1, limit: 10, order: 'desc' },
    }),
}
