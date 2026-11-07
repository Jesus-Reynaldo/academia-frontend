import { z } from 'zod'
import { ESTADOS_PERIODO } from './types'

const MS_POR_DIA = 24 * 60 * 60 * 1000

/** `YYYY-MM-DD` (lo que entrega <input type="date">) que además es un día real del calendario. */
const fecha = z
  .string()
  .min(1, 'Ingresa la fecha')
  .refine((valor) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false
    const date = new Date(`${valor}T00:00:00.000Z`)
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === valor
  }, 'Ingresa una fecha válida')

export const periodoSchema = z
  .object({
    nombre: z.string().trim().min(1, 'Ingresa el nombre del período').max(191, 'Usa como máximo 191 caracteres'),
    fechaInicio: fecha,
    fechaFin: fecha,
    estado: z.enum(ESTADOS_PERIODO),
  })
  // Mismo criterio que el backend: el inicio debe ser estrictamente anterior al fin.
  .refine((valor) => valor.fechaFin > valor.fechaInicio, {
    path: ['fechaFin'],
    message: 'La fecha de fin debe ser posterior a la de inicio',
  })

export type PeriodoFormValues = z.infer<typeof periodoSchema>

/** `2026-02-01` → `2026-02-01T00:00:00.000Z` (ISO 8601 en UTC, igual que como se muestran las fechas). */
export function toIsoDate(fechaInput: string): string {
  return `${fechaInput}T00:00:00.000Z`
}

/** ISO 8601 de la API → valor para <input type="date">. */
export function toInputDate(iso: string): string {
  return iso.slice(0, 10)
}

/** Días entre el inicio y el fin, ambos incluidos. */
export function duracionEnDias(inicioIso: string, finIso: string): number | null {
  const inicio = new Date(inicioIso).getTime()
  const fin = new Date(finIso).getTime()
  if (Number.isNaN(inicio) || Number.isNaN(fin)) return null
  return Math.round((fin - inicio) / MS_POR_DIA) + 1
}
