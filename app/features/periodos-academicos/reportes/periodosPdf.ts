import { reporteListado } from '../../../shared/reportes/motor'
import { formatFecha } from '../../../shared/lib/format'
import { periodosApi } from '../api/periodos.api'
import { ETIQUETA_ESTADO_PERIODO, type PeriodoListParams } from '../model/types'

/** Listado de períodos académicos (gestiones). */
export function reportePeriodos(params: PeriodoListParams) {
  return reporteListado({
    titulo: 'Períodos académicos',
    archivo: 'periodos',
    filtros: [
      { etiqueta: 'Estado', valor: params.estado && ETIQUETA_ESTADO_PERIODO[params.estado] },
      { etiqueta: 'Búsqueda', valor: params.q && `«${params.q}»` },
    ],
    cargar: (page, limit) => periodosApi.list({ ...params, page, limit }),
    columnas: [
      { titulo: 'Gestión', valor: (p) => p.nombre, ancho: '*' },
      { titulo: 'Inicio', valor: (p) => formatFecha(p.fechaInicio), ancho: 80, alinear: 'center' },
      { titulo: 'Fin', valor: (p) => formatFecha(p.fechaFin), ancho: 80, alinear: 'center' },
      { titulo: 'Estado', valor: (p) => ETIQUETA_ESTADO_PERIODO[p.estado], ancho: 70 },
    ],
  })
}
