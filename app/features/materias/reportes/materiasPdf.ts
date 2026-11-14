import { reporteListado } from '../../../shared/reportes/motor'
import { materiasApi } from '../api/materias.api'
import { ETIQUETA_ESTADO_MATERIA, type MateriaListParams } from '../model/types'

/** Listado de materias con los filtros actuales. */
export function reporteMaterias(params: MateriaListParams) {
  return reporteListado({
    titulo: 'Listado de materias',
    archivo: 'materias',
    filtros: [
      { etiqueta: 'Estado', valor: params.estado && ETIQUETA_ESTADO_MATERIA[params.estado] },
      { etiqueta: 'Búsqueda', valor: params.nombre && `«${params.nombre}»` },
    ],
    cargar: (page, limit) => materiasApi.list({ ...params, page, limit }),
    columnas: [
      { titulo: 'Código', valor: (m) => m.codigo, ancho: 58 },
      { titulo: 'Materia', valor: (m) => m.nombre, ancho: 160 },
      { titulo: 'Descripción', valor: (m) => m.descripcion, ancho: '*' },
      { titulo: 'Horas/sem.', valor: (m) => m.horasSemanales, ancho: 50, alinear: 'center' },
      { titulo: 'Estado', valor: (m) => ETIQUETA_ESTADO_MATERIA[m.estado], ancho: 50 },
    ],
  })
}
