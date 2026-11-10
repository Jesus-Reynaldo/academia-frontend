import { z } from 'zod'
import { ESTADOS_CURSO } from './types'

/** Máximo de una columna INTEGER de MySQL: un número mayor haría fallar al servidor. */
const CAPACIDAD_MAXIMA = 2147483647

/** Reglas del formulario de curso (las mismas que valida el backend en CreateCursoDto). */
export const cursoSchema = z.object({
  nombre: z.string().trim().min(1, 'Ingresa el nombre del curso').max(191, 'Usa como máximo 191 caracteres'),
  nivel: z.string().trim().min(1, 'Elige el nivel'),
  paralelo: z.string().trim().max(191, 'Usa como máximo 191 caracteres'),
  // Se escribe como texto: vacío significa "sin límite".
  capacidad: z
    .string()
    .trim()
    .refine(
      (valor) => valor === '' || (/^\d+$/.test(valor) && Number(valor) >= 1 && Number(valor) <= CAPACIDAD_MAXIMA),
      'La capacidad debe ser un número entero mayor o igual a 1',
    ),
  estado: z.enum(ESTADOS_CURSO),
})

export type CursoFormValues = z.infer<typeof cursoSchema>
