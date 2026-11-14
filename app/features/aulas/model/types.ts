export const ESTADOS_AULA = ['ACTIVA', 'INACTIVA'] as const
export type EstadoAula = (typeof ESTADOS_AULA)[number]
export const ETIQUETA_ESTADO_AULA: Record<EstadoAula, string> = { ACTIVA: 'Activa', INACTIVA: 'Inactiva' }

export interface Aula {
  id: number
  codigo: string
  nombre: string
  capacidad: number | null
  ubicacion: string | null
  estado: EstadoAula
}

export const CAMPOS_ORDENABLES = ['codigo', 'nombre', 'capacidad', 'ubicacion', 'estado'] as const
export type CampoOrdenable = (typeof CAMPOS_ORDENABLES)[number]

export interface AulaListParams {
  page: number
  limit: number
  sortBy: CampoOrdenable
  order: 'asc' | 'desc'
  q?: string
  estado?: EstadoAula
}

export interface AulaInput {
  codigo: string
  nombre: string
  capacidad?: number | null
  ubicacion?: string | null
}
