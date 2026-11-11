import { useQuery } from '@tanstack/react-query'
import { historialAcademicoApi } from './historial.api'

export const historialAcademicoKeys = {
  detail: (estudianteId: number) => ['historial-academico', estudianteId] as const,
}

export function useHistorialAcademico(estudianteId: number | null) {
  return useQuery({
    queryKey: historialAcademicoKeys.detail(estudianteId ?? 0),
    queryFn: ({ signal }) => historialAcademicoApi.get(estudianteId as number, signal),
    enabled: estudianteId !== null,
  })
}
