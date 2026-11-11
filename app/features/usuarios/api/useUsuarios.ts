import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { CrearUsuarioInput, EditarUsuarioInput, UsuarioListParams } from '../model/types'
import { usuariosApi } from './usuarios.api'

export const usuariosKeys = {
  all: ['usuarios'] as const,
  list: (params: UsuarioListParams) => [...usuariosKeys.all, 'list', params] as const,
}

/** Listado paginado. Mantiene la página anterior visible mientras llega la nueva (sin parpadeo). */
export function useUsuariosList(params: UsuarioListParams) {
  return useQuery({
    queryKey: usuariosKeys.list(params),
    queryFn: ({ signal }) => usuariosApi.list(params, signal),
    placeholderData: keepPreviousData,
  })
}

export function useCrearUsuario() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CrearUsuarioInput) => usuariosApi.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: usuariosKeys.all }),
  })
}

export function useActualizarUsuario() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: EditarUsuarioInput }) => usuariosApi.update(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: usuariosKeys.all }),
  })
}

export function useEliminarUsuario() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => usuariosApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: usuariosKeys.all }),
  })
}
