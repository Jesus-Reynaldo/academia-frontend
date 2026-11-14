import { useMemo } from 'react'
import { usePeriodosReferencia } from '../../periodos-academicos'
import { agruparPeriodos } from '../model/agrupar'
import type { HistorialPeriodo } from '../model/types'
import { useHistorialAcademico } from './useHistorialAcademico'

/**
 * Avance del estudiante a partir de su historial (promedios del servidor): todas sus gestiones y la
 * «gestión actual», que es la ACTIVA si está inscrito en ella o, si no, la última que cursó.
 */
export function useAvanceEstudiante(estudianteId: number | null) {
  const historial = useHistorialAcademico(estudianteId)
  const referencia = usePeriodosReferencia()

  const datos = useMemo(() => {
    const periodos: HistorialPeriodo[] = historial.data ? agruparPeriodos(historial.data) : []
    const activo = referencia.data?.find((p) => p.estado === 'ACTIVO')
    const enCurso = activo ? periodos.find((p) => p.periodoId === activo.id) : undefined
    return {
      periodos,
      actual: enCurso ?? periodos.at(-1) ?? null,
      /** true si la gestión actual es la ACTIVA del sistema (no una ya terminada). */
      actualEnCurso: Boolean(enCurso),
      periodoActivoId: activo?.id ?? null,
    }
  }, [historial.data, referencia.data])

  return {
    ...datos,
    historial: historial.data,
    isPending: historial.isPending || referencia.isPending,
    isError: historial.isError,
    error: historial.error,
    refetch: () => void historial.refetch(),
  }
}
