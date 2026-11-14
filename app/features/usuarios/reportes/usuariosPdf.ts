import { reporteListado } from '../../../shared/reportes/motor'
import { formatFecha } from '../../../shared/lib/format'
import { ETIQUETA_ROL } from '../../../shared/config/roles'
import { usuariosApi } from '../api/usuarios.api'
import type { UsuarioListParams } from '../model/types'

/** Cuentas de acceso con los filtros actuales (rol, estado, búsqueda). No incluye contraseñas. */
export function reporteUsuarios(params: UsuarioListParams) {
  return reporteListado({
    titulo: 'Cuentas de usuario',
    archivo: 'usuarios',
    filtros: [
      { etiqueta: 'Rol', valor: params.rol && ETIQUETA_ROL[params.rol] },
      { etiqueta: 'Estado', valor: params.activo === undefined ? undefined : params.activo ? 'Activas' : 'Desactivadas' },
      { etiqueta: 'Búsqueda', valor: params.q && `«${params.q}»` },
    ],
    cargar: (page, limit) => usuariosApi.list({ ...params, page, limit }),
    columnas: [
      { titulo: 'Email', valor: (u) => u.email, ancho: '*' },
      { titulo: 'Rol', valor: (u) => ETIQUETA_ROL[u.rol], ancho: 80 },
      { titulo: 'Estado', valor: (u) => (u.activo ? 'Activa' : 'Desactivada'), ancho: 70 },
      { titulo: 'Creada', valor: (u) => formatFecha(u.createdAt), ancho: 65, alinear: 'center' },
    ],
  })
}
