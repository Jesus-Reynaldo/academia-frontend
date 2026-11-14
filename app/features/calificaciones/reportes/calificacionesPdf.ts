import { apiFetch } from '../../../shared/api/http'
import { reporteListado } from '../../../shared/reportes/motor'
import { formatFecha } from '../../../shared/lib/format'
import { calificacionesApi } from '../api/calificaciones.api'
import { ETIQUETA_TIPO, type CalificacionListParams } from '../model/types'

/**
 * Calificaciones con los filtros actuales (para el docente es su planilla: curso, materia, gestión…).
 * Para el estudiante se omite la columna de estudiante (son todas suyas).
 */
export async function reporteCalificaciones(params: CalificacionListParams, opciones: { titulo: string; deEstudiante?: boolean }) {
  const cargar = (page: number, limit: number) => calificacionesApi.list({ ...params, page, limit })
  const muestra = (await cargar(1, 1)).data[0]
  const periodo = params.periodoAcademicoId
    ? await apiFetch<{ nombre: string }>(`/periodos-academicos/${params.periodoAcademicoId}`).then((p) => p.nombre).catch(() => undefined)
    : undefined
  const persona = (p?: { nombres: string; apellidos: string } | null) => (p ? `${p.apellidos}, ${p.nombres}` : undefined)
  return reporteListado({
    titulo: opciones.titulo,
    archivo: 'calificaciones',
    horizontal: !opciones.deEstudiante,
    filtros: [
      { etiqueta: 'Gestión', valor: periodo },
      { etiqueta: 'Curso', valor: params.cursoId ? muestra?.inscripcion.curso.nombre : undefined },
      { etiqueta: 'Materia', valor: params.materiaId ? muestra?.materia.nombre : undefined },
      { etiqueta: 'Estudiante', valor: params.estudianteId ? persona(muestra?.inscripcion.estudiante) : undefined },
      { etiqueta: 'Docente', valor: params.docenteId ? persona(muestra?.docente) : undefined },
      { etiqueta: 'Tipo', valor: params.tipo && ETIQUETA_TIPO[params.tipo] },
      { etiqueta: 'Desde', valor: params.fechaDesde && formatFecha(params.fechaDesde) },
      { etiqueta: 'Hasta', valor: params.fechaHasta && formatFecha(params.fechaHasta) },
      { etiqueta: 'Búsqueda', valor: params.q && `«${params.q}»` },
    ],
    cargar,
    columnas: [
      { titulo: 'Fecha', valor: (c) => formatFecha(c.fecha), ancho: 54, alinear: 'center' },
      ...(opciones.deEstudiante
        ? []
        : [
            { titulo: 'Estudiante', valor: (c: (typeof muestra & object)) => persona(c.inscripcion.estudiante), ancho: '*' as const },
            { titulo: 'Curso', valor: (c: (typeof muestra & object)) => c.inscripcion.curso.nombre, ancho: 95 },
          ]),
      { titulo: 'Materia', valor: (c) => c.materia.nombre, ancho: opciones.deEstudiante ? '*' : 130 },
      { titulo: 'Tipo', valor: (c) => ETIQUETA_TIPO[c.tipo] ?? c.tipo, ancho: 58 },
      { titulo: 'Nota', valor: (c) => c.nota, nota: true, ancho: 44 },
      { titulo: 'Docente', valor: (c) => persona(c.docente), ancho: 120 },
      { titulo: 'Observación', valor: (c) => c.observacion, ancho: opciones.deEstudiante ? 110 : 120 },
    ],
  })
}
