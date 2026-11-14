import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '../api/http'
import { API_URL } from '../config/env'

export interface Institucion {
  nombreInstitucion: string
  sigla: string | null
  tieneLogo: boolean
  /** Cambia cada vez que se guarda la configuración: va en la URL del logo para que la caché nunca muestre uno viejo. */
  version: number
}

export const NOMBRE_POR_DEFECTO = 'Sistema Académico'
export const institucionKey = ['configuracion'] as const

/** Nombre y logotipo de la institución (público: también lo usa el login). Se pide una vez y se guarda 10 minutos. */
export function useInstitucion() {
  const query = useQuery({
    queryKey: institucionKey,
    queryFn: ({ signal }) => apiFetch<Institucion>('/configuracion', { signal, auth: false }),
    staleTime: 10 * 60 * 1000,
    // Si la API no responde, el sistema sigue con el nombre por defecto.
    retry: 1,
  })
  const datos = query.data
  return {
    ...query,
    nombre: datos?.nombreInstitucion ?? NOMBRE_POR_DEFECTO,
    sigla: datos?.sigla ?? null,
    logoUrl: datos?.tieneLogo ? `${API_URL}/configuracion/logo?v=${datos.version}` : null,
  }
}
