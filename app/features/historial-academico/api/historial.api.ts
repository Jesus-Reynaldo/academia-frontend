import { apiFetch } from '../../../shared/api/http'
import type { HistorialAcademico } from '../model/types'

export const historialAcademicoApi = {
  get: (estudianteId: number, signal?: AbortSignal) =>
    apiFetch<HistorialAcademico>(`/estudiantes/${estudianteId}/historial-academico`, { signal }),
}
