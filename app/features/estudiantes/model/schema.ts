import { z } from 'zod'
import { ESTADOS_ESTUDIANTE } from './types'

const MAXIMO = 'Usa como máximo 191 caracteres'

/** `YYYY-MM-DD` (lo que entrega <input type="date">) que además es un día real del calendario. */
function esFechaReal(valor: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false
  const fecha = new Date(`${valor}T00:00:00.000Z`)
  return !Number.isNaN(fecha.getTime()) && fecha.toISOString().slice(0, 10) === valor
}

/** Reglas del formulario de estudiante (las mismas que valida el backend). El código lo asigna el servidor. */
export const estudianteSchema = z.object({
  documento: z.string().trim().min(1, 'Ingresa el documento').max(191, MAXIMO),
  nombres: z.string().trim().min(1, 'Ingresa los nombres').max(191, MAXIMO),
  apellidos: z.string().trim().min(1, 'Ingresa los apellidos').max(191, MAXIMO),
  // Opcional: vacío o un email válido.
  email: z
    .string()
    .trim()
    .refine((valor) => valor === '' || z.email().safeParse(valor).success, 'Ingresa un email válido'),
  telefono: z.string().trim().max(191, MAXIMO),
  fechaNacimiento: z
    .string()
    .refine((valor) => valor === '' || esFechaReal(valor), 'Ingresa una fecha válida')
    .refine((valor) => valor === '' || valor <= new Date().toISOString().slice(0, 10), 'La fecha no puede ser futura'),
  estado: z.enum(ESTADOS_ESTUDIANTE),
})

export type EstudianteFormValues = z.infer<typeof estudianteSchema>
