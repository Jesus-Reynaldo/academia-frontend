import { reporteListado } from '../../../shared/reportes/motor'
import { apiFetch } from '../../../shared/api/http'
import type { Paginated } from '../../../shared/api/pagination'
import { ETIQUETA_ACCION, RECURSO, type BitacoraParams, type RegistroBitacora } from '../model/types'

const fechaHora = new Intl.DateTimeFormat('es-BO', { dateStyle: 'short', timeStyle: 'short' })

/** Bitácora (quién hizo qué y cuándo) con los filtros actuales. */
export function reporteBitacora(params: BitacoraParams) {
  return reporteListado({
    titulo: 'Bitácora del sistema',
    subtitulo: 'Quién creó, modificó, desactivó o eliminó qué y cuándo',
    archivo: 'bitacora',
    horizontal: true,
    filtros: [
      { etiqueta: 'Módulo', valor: params.recurso && RECURSO[params.recurso].plural },
      { etiqueta: 'Acción', valor: params.accion && ETIQUETA_ACCION[params.accion] },
      { etiqueta: 'Búsqueda', valor: params.q && `«${params.q}»` },
    ],
    cargar: (page, limit) => apiFetch<Paginated<RegistroBitacora>>('/bitacora', { query: { ...params, page, limit } }),
    columnas: [
      { titulo: 'Fecha y hora', valor: (r) => fechaHora.format(new Date(r.fecha)), ancho: 85 },
      { titulo: 'Usuario', valor: (r) => r.usuario?.email ?? 'Usuario eliminado', ancho: 160 },
      { titulo: 'Acción', valor: (r) => ETIQUETA_ACCION[r.accion], ancho: 70 },
      { titulo: 'Módulo', valor: (r) => RECURSO[r.recurso]?.plural ?? r.recurso, ancho: 85 },
      { titulo: 'Detalle', valor: (r) => r.descripcion, ancho: '*' },
    ],
  })
}
