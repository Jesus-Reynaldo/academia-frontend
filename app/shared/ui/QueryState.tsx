import Skeleton from '@mui/material/Skeleton'
import Stack from '@mui/material/Stack'
import type { UseQueryResult } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { EmptyState } from './EmptyState'
import { ErrorState } from './ErrorState'

interface QueryStateProps<T> {
  query: UseQueryResult<T>
  /** Devuelve true si la respuesta no tiene nada que mostrar. */
  isEmpty?: (data: T) => boolean
  emptyTitle?: string
  emptyDescription?: string
  /** Alto aproximado del esqueleto de carga. */
  skeletonHeight?: number
  children: (data: T) => ReactNode
}

/** Resuelve los cuatro estados de una consulta: cargando, error (con Reintentar), vacío y éxito (RNF-01). */
export function QueryState<T>({
  query,
  isEmpty,
  emptyTitle = 'Sin datos',
  emptyDescription,
  skeletonHeight = 160,
  children,
}: QueryStateProps<T>) {
  if (query.isPending) {
    return (
      <Stack spacing={1} aria-busy="true" aria-label="Cargando">
        <Skeleton variant="rounded" height={skeletonHeight} />
      </Stack>
    )
  }
  if (query.isError) {
    return <ErrorState error={query.error} onRetry={() => void query.refetch()} />
  }
  if (isEmpty?.(query.data)) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />
  }
  return <>{children(query.data)}</>
}
