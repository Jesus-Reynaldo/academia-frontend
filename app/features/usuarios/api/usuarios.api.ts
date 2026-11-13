import { apiFetch } from '../../../shared/api/http'
import type { Paginated } from '../../../shared/api/pagination'
import type { CrearUsuarioInput, CuentaUsuario, EditarUsuarioInput, UsuarioListParams } from '../model/types'

const BASE = '/usuarios'
/** Máximo que acepta la API por página. */
const POR_PAGINA_API = 100

/**
 * La API de usuarios solo filtra por rol. Para buscar por email y dejar las cuentas desactivadas al final se piden
 * todas las páginas (con el mismo rol y orden), se filtran y ordenan aquí y se pagina con la misma forma que la API.
 */
async function todasOrdenadas(params: Omit<UsuarioListParams, 'q'>, texto: string, signal?: AbortSignal) {
  const todas: CuentaUsuario[] = []
  for (let page = 1; ; page++) {
    const respuesta = await apiFetch<Paginated<CuentaUsuario>>(BASE, {
      query: { ...params, page, limit: POR_PAGINA_API },
      signal,
    })
    todas.push(...respuesta.data)
    if (page >= respuesta.meta.totalPages) break
  }
  const buscado = texto.toLowerCase()
  // Activas primero y desactivadas al final; dentro de cada grupo se respeta el orden de la API.
  const coinciden = todas
    .filter((cuenta) => cuenta.email.toLowerCase().includes(buscado))
    .sort((a, b) => Number(b.activo) - Number(a.activo))
  const inicio = (params.page - 1) * params.limit
  return {
    data: coinciden.slice(inicio, inicio + params.limit),
    meta: {
      page: params.page,
      limit: params.limit,
      total: coinciden.length,
      totalPages: Math.max(1, Math.ceil(coinciden.length / params.limit)),
    },
  } satisfies Paginated<CuentaUsuario>
}

export const usuariosApi = {
  list: ({ q, ...params }: UsuarioListParams, signal?: AbortSignal) =>
    todasOrdenadas(params, q ?? '', signal),

  create: (input: CrearUsuarioInput) => apiFetch<CuentaUsuario>(BASE, { method: 'POST', body: input }),

  update: (id: number, input: EditarUsuarioInput) =>
    apiFetch<CuentaUsuario>(`${BASE}/${id}`, { method: 'PATCH', body: input }),

  remove: (id: number) => apiFetch<undefined>(`${BASE}/${id}`, { method: 'DELETE' }),
}
