import { reporteListado } from '../../../shared/reportes/motor'
import { cursosApi } from '../api/cursos.api'
import { ETIQUETA_ESTADO_CURSO, type CursoListParams } from '../model/types'

/** Listado de cursos con su ocupación (inscritos activos / capacidad). */
export function reporteCursos(params: CursoListParams) {
  return reporteListado({
    titulo: 'Listado de cursos',
    subtitulo: 'Inscritos activos en la gestión en curso',
    archivo: 'cursos',
    filtros: [
      { etiqueta: 'Nivel', valor: params.nivel },
      { etiqueta: 'Estado', valor: params.estado && ETIQUETA_ESTADO_CURSO[params.estado] },
      { etiqueta: 'Búsqueda', valor: params.nombre && `«${params.nombre}»` },
    ],
    cargar: (page, limit) => cursosApi.list({ ...params, page, limit }),
    columnas: [
      { titulo: 'Curso', valor: (c) => c.nombre, ancho: '*' },
      { titulo: 'Nivel', valor: (c) => c.nivel, ancho: 70 },
      { titulo: 'Paralelo', valor: (c) => c.paralelo, ancho: 50, alinear: 'center' },
      { titulo: 'Inscritos', valor: (c) => c.inscritosActivos, ancho: 50, alinear: 'center' },
      { titulo: 'Capacidad', valor: (c) => c.capacidad ?? 'Sin límite', ancho: 55, alinear: 'center' },
      { titulo: 'Ocupación', valor: (c) => (c.capacidad ? `${Math.round((c.inscritosActivos / c.capacidad) * 100)} %` : '—'), ancho: 55, alinear: 'center' },
      { titulo: 'Estado', valor: (c) => ETIQUETA_ESTADO_CURSO[c.estado], ancho: 50 },
    ],
  })
}
