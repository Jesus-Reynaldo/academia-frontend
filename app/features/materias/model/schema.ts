import { z } from 'zod'
import { ESTADOS_MATERIA, type Materia, type MateriaActualizar, type MateriaCrear } from './types'

// codigo, nombre y descripcion son VARCHAR(191) en la base de datos.
export const LIMITE_TEXTO = 191

export const materiaSchema = z.object({
  codigo: z
    .string()
    .trim()
    .min(1, 'Ingresa el código de la materia')
    .max(LIMITE_TEXTO, `Usa como máximo ${LIMITE_TEXTO} caracteres`),
  nombre: z
    .string()
    .trim()
    .min(1, 'Ingresa el nombre de la materia')
    .max(LIMITE_TEXTO, `Usa como máximo ${LIMITE_TEXTO} caracteres`),
  descripcion: z.string().trim().max(LIMITE_TEXTO, `Usa como máximo ${LIMITE_TEXTO} caracteres`),
  // Vacío = sin dato. Si se escribe, entero ≥ 1 (igual que la API: @IsInt @Min(1)).
  horasSemanales: z
    .string()
    .trim()
    .refine(
      (valor) => valor === '' || (/^\d{1,9}$/.test(valor) && Number(valor) >= 1),
      'Ingresa un número entero de 1 o más',
    ),
  estado: z.enum(ESTADOS_MATERIA),
})

export type MateriaFormValues = z.infer<typeof materiaSchema>

export function valoresIniciales(materia: Materia | null): MateriaFormValues {
  return {
    codigo: materia?.codigo ?? '',
    nombre: materia?.nombre ?? '',
    descripcion: materia?.descripcion ?? '',
    horasSemanales: materia?.horasSemanales != null ? String(materia.horasSemanales) : '',
    estado: materia?.estado ?? 'ACTIVA',
  }
}

/** Alta: lo vacío se omite para que la API use sus valores por defecto. */
export function aCrear(values: MateriaFormValues): MateriaCrear {
  const descripcion = values.descripcion.trim()
  const horas = values.horasSemanales.trim()
  return {
    codigo: values.codigo.trim(),
    nombre: values.nombre.trim(),
    ...(descripcion ? { descripcion } : {}),
    ...(horas ? { horasSemanales: Number(horas) } : {}),
    estado: values.estado,
  }
}

/** Edición: lo vacío se envía como `null` para poder borrar un dato que antes existía. */
export function aActualizar(values: MateriaFormValues): MateriaActualizar {
  const descripcion = values.descripcion.trim()
  const horas = values.horasSemanales.trim()
  return {
    codigo: values.codigo.trim(),
    nombre: values.nombre.trim(),
    descripcion: descripcion || null,
    horasSemanales: horas ? Number(horas) : null,
    estado: values.estado,
  }
}
