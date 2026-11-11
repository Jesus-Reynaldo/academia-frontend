import { z } from 'zod'
import { TODOS_LOS_ROLES, type Rol } from '../../../shared/config/roles'

export const PASSWORD_MINIMO = 8
const PASSWORD_MAXIMO = 128

const email = z.string().trim().min(1, 'Ingresa el email').pipe(z.email('Ingresa un email válido'))

/** Formulario de alta. Según el rol, se exige el estudiante o el docente vinculado. */
export const crearUsuarioSchema = z
  .object({
    email,
    password: z
      .string()
      .min(PASSWORD_MINIMO, `Usa al menos ${PASSWORD_MINIMO} caracteres`)
      .max(PASSWORD_MAXIMO, `Usa como máximo ${PASSWORD_MAXIMO} caracteres`),
    // Vacío mientras no se elige: la validación exige uno de los roles.
    rol: z.string().refine((valor) => TODOS_LOS_ROLES.includes(valor as Rol), 'Elige un rol'),
    estudianteId: z.number().nullable(),
    docenteId: z.number().nullable(),
  })
  .superRefine((valores, ctx) => {
    if (valores.rol === 'ESTUDIANTE' && valores.estudianteId === null) {
      ctx.addIssue({ code: 'custom', path: ['estudianteId'], message: 'Elige el estudiante' })
    }
    if (valores.rol === 'DOCENTE' && valores.docenteId === null) {
      ctx.addIssue({ code: 'custom', path: ['docenteId'], message: 'Elige el docente' })
    }
  })

export type CrearUsuarioValues = z.infer<typeof crearUsuarioSchema>

/** Formulario de edición: la contraseña vacía significa "no cambiarla". */
export const editarUsuarioSchema = z.object({
  email,
  password: z
    .string()
    .refine((valor) => valor === '' || valor.length >= PASSWORD_MINIMO, `Usa al menos ${PASSWORD_MINIMO} caracteres`)
    .refine((valor) => valor.length <= PASSWORD_MAXIMO, `Usa como máximo ${PASSWORD_MAXIMO} caracteres`),
  activo: z.boolean(),
})

export type EditarUsuarioValues = z.infer<typeof editarUsuarioSchema>
