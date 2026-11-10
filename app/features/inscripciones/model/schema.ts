import { z } from 'zod'

/** `YYYY-MM-DD` (lo que entrega <input type="date">) que además es un día real del calendario. */
function esFechaReal(valor: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false
  const fecha = new Date(`${valor}T00:00:00.000Z`)
  return !Number.isNaN(fecha.getTime()) && fecha.toISOString().slice(0, 10) === valor
}

/** Un selector empieza en null; al enviar debe tener un id. */
const seleccion = (mensaje: string) =>
  z
    .number()
    .nullable()
    .refine((valor) => valor !== null, mensaje)
    .transform((valor) => valor as number)

/** Reglas del formulario de nueva inscripción. Las reglas de negocio (cupo, duplicados) las valida el servidor. */
export const inscripcionSchema = z.object({
  estudianteId: seleccion('Elige un estudiante'),
  cursoId: seleccion('Elige un curso'),
  periodoAcademicoId: seleccion('Elige un período'),
  fechaInscripcion: z.string().refine((valor) => valor === '' || esFechaReal(valor), 'Ingresa una fecha válida'),
})

/** Valores mientras se llena el formulario (selectores en null). */
export type InscripcionFormInput = z.input<typeof inscripcionSchema>
/** Valores ya validados, listos para enviar. */
export type InscripcionFormValues = z.output<typeof inscripcionSchema>
