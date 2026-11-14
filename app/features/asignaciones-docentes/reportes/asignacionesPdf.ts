import { reporteListado } from '../../../shared/reportes/motor'
import { asignacionesApi } from '../api/asignaciones.api'
import { ETIQUETA_ESTADO_ASIGNACION, nombreDocente, type AsignacionListParams } from '../model/types'

/** Listado de asignaciones docentes con los filtros de la pantalla. */
export async function reporteAsignaciones(params: AsignacionListParams, deDocente: boolean) {
  // Los filtros llegan como ids: el nombre se toma de una fila que los cumple.
  const muestra = params.docenteId || params.cursoId || params.materiaId || params.periodoAcademicoId
    ? (await asignacionesApi.list({ ...params, page: 1, limit: 1 })).data[0]
    : undefined
  return reporteListado({
    titulo: deDocente ? 'Mis asignaciones' : 'Asignación docente',
    subtitulo: deDocente && muestra ? nombreDocente(muestra.docente) : undefined,
    archivo: deDocente ? 'mis-asignaciones' : 'asignaciones-docentes',
    filtros: [
      { etiqueta: 'Docente', valor: !deDocente && params.docenteId ? (muestra ? nombreDocente(muestra.docente) : `#${params.docenteId}`) : undefined },
      { etiqueta: 'Período', valor: params.periodoAcademicoId ? (muestra?.periodoAcademico.nombre ?? `#${params.periodoAcademicoId}`) : undefined },
      { etiqueta: 'Curso', valor: params.cursoId ? (muestra?.curso.nombre ?? `#${params.cursoId}`) : undefined },
      { etiqueta: 'Materia', valor: params.materiaId ? (muestra?.materia.nombre ?? `#${params.materiaId}`) : undefined },
      { etiqueta: 'Estado', valor: params.estado && ETIQUETA_ESTADO_ASIGNACION[params.estado] },
      { etiqueta: 'Búsqueda', valor: params.q && `«${params.q}»` },
    ],
    cargar: (page, limit) => asignacionesApi.list({ ...params, page, limit }),
    columnas: [
      ...(deDocente ? [] : [{ titulo: 'Docente', valor: (a: import('../model/types').AsignacionDocente) => nombreDocente(a.docente), ancho: '*' as const }]),
      { titulo: 'Materia', valor: (a) => a.materia.nombre, ancho: '*' },
      { titulo: 'Curso', valor: (a) => a.curso.nombre, ancho: '*' },
      { titulo: 'Período', valor: (a) => a.periodoAcademico.nombre, ancho: 90 },
      { titulo: 'Estado', valor: (a) => ETIQUETA_ESTADO_ASIGNACION[a.estado], ancho: 55 },
    ],
  })
}
