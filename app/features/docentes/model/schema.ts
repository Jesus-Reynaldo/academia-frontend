import { z } from 'zod'
import { ESTADOS_DOCENTE } from './types'

/** Reglas del formulario de docente (mismas que valida el backend en CreateDocenteDto). */
export const docenteSchema = z.object({
  codigo: z.string().trim().min(1, 'Ingresa el código').max(191, 'Usa como máximo 191 caracteres'),
  nombres: z.string().trim().min(1, 'Ingresa los nombres').max(191, 'Usa como máximo 191 caracteres'),
  apellidos: z.string().trim().min(1, 'Ingresa los apellidos').max(191, 'Usa como máximo 191 caracteres'),
  // Opcional: vacío o un email válido.
  email: z
    .string()
    .trim()
    .refine((valor) => valor === '' || z.email().safeParse(valor).success, 'Ingresa un email válido'),
  telefono: z.string().trim().max(191, 'Usa como máximo 191 caracteres'),
  estado: z.enum(ESTADOS_DOCENTE),
})

export type DocenteFormValues = z.infer<typeof docenteSchema>
