import type { Content, TableCell } from 'pdfmake/interfaces'
import { celdaNota, descargarPdf, documento, tabla } from '../../../shared/reportes/motor'
import { agruparPeriodos } from '../model/agrupar'
import { columnasDelCurso, desglosar, resumenPeriodo } from '../model/desglose'
import type { HistorialAcademico, HistorialCurso, HistorialPeriodo } from '../model/types'

const promedio = (notas: number[]) => (notas.length ? notas.reduce((a, b) => a + b, 0) / notas.length : null)

/** Tabla de un curso: materias × parciales por trimestre, prácticas, examen final y otras (si hay) y promedio. */
function tablaCurso(curso: HistorialCurso): Content {
  const cols = columnasDelCurso(curso)
  const encabezados = [
    { titulo: 'Materia' },
    { titulo: '1.er trim.', alinear: 'center' as const },
    { titulo: '2.º trim.', alinear: 'center' as const },
    { titulo: '3.er trim.', alinear: 'center' as const },
    { titulo: 'Prácticas', alinear: 'center' as const },
    ...(cols.examenFinal ? [{ titulo: 'Examen final', alinear: 'center' as const }] : []),
    ...(cols.otras ? [{ titulo: 'Otras', alinear: 'center' as const }] : []),
    { titulo: 'Promedio', alinear: 'center' as const },
  ]
  const filas: TableCell[][] = curso.materias.map((m) => {
    const d = desglosar(m)
    return [
      { text: m.materia, bold: true },
      ...d.parciales.map((n) => celdaNota(n)),
      // Prácticas: el promedio de las prácticas (la API entrega cada nota; en la libreta va una sola columna).
      celdaNota(promedio(d.practicas)),
      ...(cols.examenFinal ? [celdaNota(promedio(d.finales))] : []),
      ...(cols.otras ? [celdaNota(promedio(d.otras.map((o) => o.nota)))] : []),
      celdaNota(m.promedio, { negrita: true }),
    ]
  })
  const anchos: ('*' | number)[] = ['*', 46, 46, 46, 50, ...(cols.examenFinal ? [50] : []), ...(cols.otras ? [40] : []), 52]
  return tabla(encabezados, filas, anchos)
}

function seccionPeriodo(periodo: HistorialPeriodo): Content[] {
  const r = resumenPeriodo(periodo)
  const resumen =
    r.materias === 0
      ? 'Aún no hay notas en esta gestión.'
      : r.debajo.length === 0
        ? `${r.aprobadas} de ${r.materias} materias con promedio de 51 o más.`
        : `${r.aprobadas} de ${r.materias} materias con promedio de 51 o más. Por debajo de 51: ${r.debajo.map((d) => d.nombre).join(', ')}.`
  return [
    { text: periodo.periodo, style: 'seccion', pageBreak: undefined },
    { text: resumen, fontSize: 8.5, color: r.debajo.length ? '#B91C1C' : '#475569', margin: [0, -2, 0, 6] },
    ...periodo.cursos.flatMap((curso): Content[] => [
      {
        columns: [
          { text: curso.curso, bold: true, fontSize: 10 },
          { text: [{ text: 'Promedio del curso: ', color: '#475569' }, { text: curso.promedio == null ? '—' : curso.promedio.toLocaleString('es-BO', { maximumFractionDigits: 2 }), bold: true }], alignment: 'right', fontSize: 9 },
        ],
        margin: [0, 2, 0, 4],
      },
      curso.materias.length ? tablaCurso(curso) : { text: 'Sin calificaciones en este curso.', italics: true, color: '#475569' },
      { text: ' ', fontSize: 6 },
    ]),
  ]
}

/**
 * Libreta académica en PDF: datos del estudiante y, por cada gestión (de la más reciente a la más antigua),
 * el resumen y la tabla de notas por trimestre de cada curso. Los promedios son los del servidor.
 */
export async function descargarLibreta(historial: HistorialAcademico, soloPeriodoId?: number) {
  const periodos = agruparPeriodos(historial)
    .filter((p) => soloPeriodoId === undefined || p.periodoId === soloPeriodoId)
    .reverse()
  const datos: Content = {
    table: {
      widths: ['auto', '*', 'auto', '*'],
      body: [
        [{ text: 'Estudiante', color: '#475569' }, { text: historial.estudiante.nombre, bold: true }, { text: 'Código', color: '#475569' }, { text: historial.estudiante.codigo, bold: true }],
        [
          { text: 'Promedio general', color: '#475569' },
          celdaNota(historial.promedioGeneral, { negrita: true }),
          { text: 'Gestiones', color: '#475569' },
          { text: periodos.map((p) => p.periodo).join(', ') || '—' },
        ],
      ],
    },
    layout: 'noBorders',
    fontSize: 9,
    margin: [0, 0, 0, 6],
  }
  const definicion = await documento({
    titulo: 'Libreta académica',
    subtitulo: soloPeriodoId === undefined ? 'Historial completo de calificaciones' : `Calificaciones de la ${periodos[0]?.periodo ?? 'gestión'}`,
    contenido: [datos, ...periodos.flatMap(seccionPeriodo)],
    leyendaNotas: true,
  })
  await descargarPdf(definicion, `libreta-${historial.estudiante.codigo}`)
}
