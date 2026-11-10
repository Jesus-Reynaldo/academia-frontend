import { apiFetch } from '../../../shared/api/http'
import type { Paginated } from '../../../shared/api/pagination'
import type { CrearUsuarioInput, CuentaUsuario, EditarUsuarioInput, UsuarioListParams } from '../model/types'

const BASE = '/usuarios'

export const usuariosApi = {
  list: (params: UsuarioListParams, signal?: AbortSignal) =>
    apiFetch<Paginated<CuentaUsuario>>(BASE, { query: params, signal }),

  create: (input: CrearUsuarioInput) => apiFetch<CuentaUsuario>(BASE, { method: 'POST', body: input }),

  update: (id: number, input: EditarUsuarioInput) =>
    apiFetch<CuentaUsuario>(`${BASE}/${id}`, { method: 'PATCH', body: input }),

  remove: (id: number) => apiFetch<undefined>(`${BASE}/${id}`, { method: 'DELETE' }),
}
