import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { dashboardApi } from './dashboard.api'

export const dashboardKeys = {
  all: ['dashboard'] as const,
  admin: (periodoId?: number, materiaId?: number, umbral = 51, page = 1) =>
    ['dashboard', 'admin', periodoId, materiaId, umbral, page] as const,
}

export function useAdminResumen() {
  return useQuery({ queryKey: [...dashboardKeys.all, 'resumen'], queryFn: dashboardApi.resumenAdmin })
}

export function useOcupacionCursos(periodoId?: number) {
  return useQuery({
    queryKey: [...dashboardKeys.admin(periodoId), 'ocupacion'],
    queryFn: () => dashboardApi.ocupacionCursos(periodoId),
    placeholderData: keepPreviousData,
  })
}

export function usePromediosCursos(periodoId?: number) {
  return useQuery({
    queryKey: [...dashboardKeys.admin(periodoId), 'promedios'],
    queryFn: () => dashboardApi.promediosCursos(periodoId),
    placeholderData: keepPreviousData,
  })
}

export function useDistribucionNotas(periodoId?: number, materiaId?: number) {
  return useQuery({
    queryKey: [...dashboardKeys.admin(periodoId, materiaId), 'distribucion'],
    queryFn: () => dashboardApi.distribucionNotas(periodoId, materiaId),
    placeholderData: keepPreviousData,
  })
}

export function useEstudiantesEnRiesgo(periodoId: number | undefined, umbral: number, page: number) {
  return useQuery({
    queryKey: dashboardKeys.admin(periodoId, undefined, umbral, page),
    queryFn: () => dashboardApi.estudiantesEnRiesgo(periodoId, umbral, page),
    placeholderData: keepPreviousData,
  })
}

export function useCalificacionesAdmin() {
  return useQuery({
    queryKey: [...dashboardKeys.all, 'ultimas-calificaciones-admin'],
    queryFn: dashboardApi.calificacionesAdmin,
  })
}

export function useResumenEstudiante(id: number | null) {
  return useQuery({
    queryKey: [...dashboardKeys.all, 'estudiante', id],
    queryFn: () => dashboardApi.resumenEstudiante(id as number),
    enabled: id !== null,
  })
}

export function useCalificacionesEstudiante(id: number | null) {
  return useQuery({
    queryKey: [...dashboardKeys.all, 'calificaciones-estudiante', id],
    queryFn: () => dashboardApi.calificacionesEstudiante(id as number),
    enabled: id !== null,
  })
}

export function useResumenDocente(id: number | null) {
  return useQuery({
    queryKey: [...dashboardKeys.all, 'docente', id],
    queryFn: () => dashboardApi.resumenDocente(id as number),
    enabled: id !== null,
  })
}

export function useCalificacionesDocente(id: number | null) {
  return useQuery({
    queryKey: [...dashboardKeys.all, 'calificaciones-docente', id],
    queryFn: () => dashboardApi.calificacionesDocente(id as number),
    enabled: id !== null,
  })
}
