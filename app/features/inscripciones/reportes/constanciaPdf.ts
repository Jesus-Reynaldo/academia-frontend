import type { Content } from 'pdfmake/interfaces'
import { descargarPdf, documento } from '../../../shared/reportes/motor'
import { formatFecha } from '../../../shared/lib/format'
import { ETIQUETA_ESTADO_INSCRIPCION, type Inscripcion } from '../model/types'

const hoyLargo = () => new Intl.DateTimeFormat('es-BO', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())

/**
 * Constancia de inscripción: documento formal de una página que certifica en qué curso y gestión está
 * (o estuvo) inscrito el estudiante. Lleva el logotipo y el nombre de la institución en el encabezado.
 */
export async function descargarConstancia(inscripcion: Inscripcion) {
  const { estudiante, curso, periodoAcademico } = inscripcion
  const nombre = `${estudiante.nombres} ${estudiante.apellidos}`
  const estado = ETIQUETA_ESTADO_INSCRIPCION[inscripcion.estado].toLowerCase()
  const datos: Content = {
    table: {
      widths: [130, '*'],
      body: [
        ['Estudiante', { text: nombre, bold: true }],
        ['Código', estudiante.codigo],
        ['Curso', curso.nombre],
        ['Gestión', periodoAcademico.nombre],
        ['Fecha de inscripción', formatFecha(inscripcion.fechaInscripcion)],
        ['Estado de la inscripción', { text: ETIQUETA_ESTADO_INSCRIPCION[inscripcion.estado], bold: true }],
      ].map(([a, b]) => [{ text: a as string, color: '#475569' }, b]),
    },
    layout: {
      hLineColor: () => '#E2E8F0',
      vLineWidth: () => 0,
      hLineWidth: (i: number, nodo) => (i === 0 || i === nodo.table.body.length ? 1 : 0.5),
      paddingTop: () => 6,
      paddingBottom: () => 6,
    },
    margin: [0, 6, 0, 18],
  }
  const definicion = await documento({
    titulo: 'Constancia de inscripción',
    subtitulo: `N.º ${String(inscripcion.id).padStart(6, '0')}`,
    contenido: [
      {
        text: [
          'Por medio de la presente se hace constar que ',
          { text: nombre, bold: true },
          `, con código ${estudiante.codigo}, `,
          inscripcion.estado === 'ACTIVA' ? 'se encuentra inscrito(a) en ' : `registra una inscripción ${estado} en `,
          { text: curso.nombre, bold: true },
          ' correspondiente a la ',
          { text: periodoAcademico.nombre, bold: true },
          ', según los registros del sistema académico de la institución.',
        ],
        fontSize: 10.5,
        lineHeight: 1.45,
        alignment: 'left',
        margin: [0, 8, 0, 6],
      },
      datos,
      { text: `Se extiende la presente a solicitud del interesado, en fecha ${hoyLargo()}.`, fontSize: 10, margin: [0, 0, 0, 70] },
      {
        columns: [
          { text: '' },
          {
            stack: [
              { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 200, y2: 0, lineWidth: 0.8, lineColor: '#0F172A' }] },
              { text: 'Firma y sello', alignment: 'center', fontSize: 9, margin: [0, 4, 0, 0] },
              { text: 'Dirección / Secretaría académica', alignment: 'center', fontSize: 8, color: '#475569' },
            ],
            width: 200,
          },
          { text: '' },
        ],
      },
    ],
  })
  await descargarPdf(definicion, `constancia-${estudiante.codigo}-${periodoAcademico.nombre.replace(/\s+/g, '-')}`)
}
