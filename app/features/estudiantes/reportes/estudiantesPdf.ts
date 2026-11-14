import { reporteListado } from '../../../shared/reportes/motor'
import { estudiantesApi } from '../api/estudiantes.api'
import { ETIQUETA_ESTADO_ESTUDIANTE, type EstudianteListParams } from '../model/types'

/** Listado de estudiantes con los filtros actuales (estado y búsqueda). */
export function reporteEstudiantes(params: EstudianteListParams) {
  return reporteListado({
    titulo: 'Listado de estudiantes',
    archivo: 'estudiantes',
    filtros: [
      { etiqueta: 'Estado', valor: params.estado && ETIQUETA_ESTADO_ESTUDIANTE[params.estado] },
      { etiqueta: 'Búsqueda', valor: params.q && `«${params.q}»` },
    ],
    cargar: (page, limit) => estudiantesApi.list({ ...params, page, limit }),
    columnas: [
      { titulo: 'Código', valor: (e) => e.codigo, ancho: 58 },
      { titulo: 'Apellidos y nombres', valor: (e) => `${e.apellidos}, ${e.nombres}`, ancho: '*' },
      { titulo: 'Documento', valor: (e) => e.documento, ancho: 70 },
      { titulo: 'Email', valor: (e) => e.email, ancho: 130 },
      { titulo: 'Estado', valor: (e) => ETIQUETA_ESTADO_ESTUDIANTE[e.estado], ancho: 52 },
    ],
  })
}
