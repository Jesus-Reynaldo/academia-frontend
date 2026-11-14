import type { Content, TableCell } from 'pdfmake/interfaces'
import { descargarPdf, documento, tabla } from '../../../shared/reportes/motor'
import { DIAS, NOMBRE_DIA, nombreDocente, type Horario, type VistaHorario } from '../model/types'

/**
 * Horario semanal en PDF (hoja horizontal): una columna por día y una fila por franja horaria.
 * Cada celda: materia, docente o curso (según quién lo pide) y aula.
 */
export async function descargarHorario(o: {
  horarios: Horario[]
  vista: VistaHorario
  titulo: string
  subtitulo?: string
  archivo: string
  filtros?: { etiqueta: string; valor?: string }[]
}) {
  const activos = o.horarios.filter((h) => h.estado === 'ACTIVO')
  const dias = DIAS.filter((d) => d !== 'SABADO' || activos.some((h) => h.diaSemana === 'SABADO'))
  const franjas = [...new Set(activos.map((h) => `${h.horaInicio}–${h.horaFin}`))].sort()
  const celda = (h: Horario): Content[] => {
    const a = h.asignacion
    const linea = o.vista === 'docente' ? a.curso.nombre : o.vista === 'aula' ? `${a.curso.nombre} · ${nombreDocente(a.docente)}` : nombreDocente(a.docente)
    return [
      { text: a.materia.nombre, bold: true },
      { text: linea, fontSize: 7.5 },
      ...(o.vista === 'aula' ? [] : [{ text: h.aula.nombre, fontSize: 7, color: '#64748B' } as Content]),
    ]
  }
  const filas: TableCell[][] = franjas.map((f) => [
    { text: f, bold: true, noWrap: true },
    ...dias.map((d): TableCell => {
      const bloques = activos.filter((h) => h.diaSemana === d && `${h.horaInicio}–${h.horaFin}` === f)
      return bloques.length ? { stack: bloques.flatMap(celda) } : { text: '' }
    }),
  ])
  const contenido: Content[] = franjas.length
    ? [tabla([{ titulo: 'Hora' }, ...dias.map((d) => ({ titulo: NOMBRE_DIA[d], alinear: 'center' as const }))], filas, [58, ...dias.map(() => '*' as const)])]
    : [{ text: 'No hay clases registradas con estos filtros.', italics: true, color: '#64748B' }]
  const def = await documento({ titulo: o.titulo, subtitulo: o.subtitulo, filtros: o.filtros, total: activos.length, contenido, horizontal: true })
  await descargarPdf(def, o.archivo)
}
