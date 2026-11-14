import { reporteListado } from '../../../shared/reportes/motor'
import { docentesApi } from '../api/docentes.api'
import { ETIQUETA_ESTADO_DOCENTE, type DocenteListParams } from '../model/types'

/** Listado de docentes con los filtros actuales. */
export function reporteDocentes(params: DocenteListParams) {
  return reporteListado({
    titulo: 'Listado de docentes',
    archivo: 'docentes',
    filtros: [
      { etiqueta: 'Estado', valor: params.estado && ETIQUETA_ESTADO_DOCENTE[params.estado] },
      { etiqueta: 'Búsqueda', valor: params.nombre && `«${params.nombre}»` },
    ],
    cargar: (page, limit) => docentesApi.list({ ...params, page, limit }),
    columnas: [
      { titulo: 'Código', valor: (d) => d.codigo, ancho: 58 },
      { titulo: 'Apellidos y nombres', valor: (d) => `${d.apellidos}, ${d.nombres}`, ancho: '*' },
      { titulo: 'Email', valor: (d) => d.email, ancho: 150 },
      { titulo: 'Teléfono', valor: (d) => d.telefono, ancho: 65 },
      { titulo: 'Estado', valor: (d) => ETIQUETA_ESTADO_DOCENTE[d.estado], ancho: 50 },
    ],
  })
}
