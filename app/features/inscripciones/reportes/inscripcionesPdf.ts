import { reporteListado } from '../../../shared/reportes/motor'
import { formatFecha } from '../../../shared/lib/format'
import { inscripcionesApi } from '../api/inscripciones.api'
import { ETIQUETA_ESTADO_INSCRIPCION, type InscripcionListParams } from '../model/types'

/** Listado de inscripciones con los filtros actuales (estudiante, curso, gestión, estado, búsqueda). */
export async function reporteInscripciones(params: InscripcionListParams, opciones: { titulo?: string; archivo?: string } = {}) {
  const cargar = (page: number, limit: number) => inscripcionesApi.list({ ...params, page, limit })
  // Los nombres del estudiante, curso y gestión filtrados salen de las mismas filas.
  const muestra = (await cargar(1, 1)).data[0]
  return reporteListado({
    titulo: opciones.titulo ?? 'Listado de inscripciones',
    archivo: opciones.archivo ?? 'inscripciones',
    ordenar: (a, b) => `${a.estudiante.apellidos} ${a.estudiante.nombres}`.localeCompare(`${b.estudiante.apellidos} ${b.estudiante.nombres}`, 'es'),
    filtros: [
      { etiqueta: 'Estudiante', valor: params.estudianteId && muestra ? `${muestra.estudiante.apellidos}, ${muestra.estudiante.nombres}` : undefined },
      { etiqueta: 'Curso', valor: params.cursoId && muestra ? muestra.curso.nombre : undefined },
      { etiqueta: 'Gestión', valor: params.periodoAcademicoId && muestra ? muestra.periodoAcademico.nombre : undefined },
      { etiqueta: 'Estado', valor: params.estado && ETIQUETA_ESTADO_INSCRIPCION[params.estado] },
      { etiqueta: 'Búsqueda', valor: params.q && `«${params.q}»` },
    ],
    cargar,
    columnas: [
      { titulo: 'Código', valor: (i) => i.estudiante.codigo, ancho: 58 },
      { titulo: 'Estudiante', valor: (i) => `${i.estudiante.apellidos}, ${i.estudiante.nombres}`, ancho: '*' },
      { titulo: 'Curso', valor: (i) => i.curso.nombre, ancho: 95 },
      { titulo: 'Gestión', valor: (i) => i.periodoAcademico.nombre, ancho: 70 },
      { titulo: 'Fecha', valor: (i) => formatFecha(i.fechaInscripcion), ancho: 58, alinear: 'center' },
      { titulo: 'Estado', valor: (i) => ETIQUETA_ESTADO_INSCRIPCION[i.estado], ancho: 55 },
    ],
  })
}
