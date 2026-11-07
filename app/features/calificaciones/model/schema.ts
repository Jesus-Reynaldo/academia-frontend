import { z } from 'zod'
import { NOTA_MAX, NOTA_MIN, TIPOS_EVALUACION } from './types'

// PASO 1: la fecha del <input type="date"> llega como `YYYY-MM-DD` y debe ser un día real del calendario.
const fecha = z
  .string()
  .min(1, 'Ingresa la fecha')
  .refine((valor) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false
    const date = new Date(`${valor}T00:00:00.000Z`)
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === valor
  }, 'Ingresa una fecha válida')

// PASO 2: la nota se escribe como texto (acepta coma o punto decimal) y se valida el rango 0–100.
export function leerNota(texto: string): number | null {
  const limpio = texto.trim().replace(',', '.')
  if (limpio === '') return null
  const numero = Number(limpio)
  return Number.isFinite(numero) ? numero : null
}

const nota = z
  .string()
  .min(1, 'Ingresa la nota')
  .refine((texto) => leerNota(texto) !== null, 'La nota debe ser un número')
  .refine((texto) => {
    const valor = leerNota(texto)
    return valor === null || (valor >= NOTA_MIN && valor <= NOTA_MAX)
  }, `La nota debe estar entre ${NOTA_MIN} y ${NOTA_MAX}`)

/**
 * PASO 3: el esquema cambia según el modo.
 * - Alta: inscripción y materia son obligatorias.
 * - Edición: la API no permite cambiarlas (PATCH solo acepta nota, tipo, fecha, observación y docente).
 */
export function crearCalificacionSchema(esEdicion: boolean) {
  return z.object({
    /** Solo sirve para acotar la lista de inscripciones; no se envía a la API. */
    cursoId: z.number().nullable(),
    inscripcionId: z.number().nullable().refine((valor) => esEdicion || valor !== null, 'Elige la inscripción'),
    materiaId: z.number().nullable().refine((valor) => esEdicion || valor !== null, 'Elige la materia'),
    tipo: z.enum(TIPOS_EVALUACION),
    nota,
    fecha,
    docenteId: z.number().nullable(),
    observacion: z.string().max(1000, 'Usa como máximo 1000 caracteres'),
  })
}

export type CalificacionFormValues = z.infer<ReturnType<typeof crearCalificacionSchema>>

/** `2026-06-15` → `2026-06-15T00:00:00.000Z` (igual que como se muestran las fechas: en UTC). */
export function toIsoDate(fechaInput: string): string {
  return `${fechaInput}T00:00:00.000Z`
}

/** Fin del día, para que `fechaHasta` sea inclusiva. */
export function toIsoFinDelDia(fechaInput: string): string {
  return `${fechaInput}T23:59:59.999Z`
}

/** ISO 8601 de la API → valor para <input type="date">. */
export function toInputDate(iso: string): string {
  return iso.slice(0, 10)
}

/** Hoy en formato `YYYY-MM-DD` (UTC, como el resto de fechas de la app). */
export function hoyInput(): string {
  return new Date().toISOString().slice(0, 10)
}
