import type { Content, TableCell } from 'pdfmake/interfaces'
import { celdaNota, descargarPdf, documento, reporteListado, tabla } from '../../../shared/reportes/motor'
import { dashboardApi } from '../api/dashboard.api'

const numero = new Intl.NumberFormat('es-BO')

/** Tarjetas de totales en una fila (como en el Inicio). */
function tarjetas(items: { etiqueta: string; valor: number }[]): Content {
  return {
    table: {
      widths: items.map(() => '*'),
      body: [items.map((i) => ({ stack: [{ text: numero.format(i.valor), fontSize: 16, bold: true, color: '#2740B8' }, { text: i.etiqueta, fontSize: 8, color: '#475569' }] }))],
    },
    layout: { fillColor: () => '#F6F7FB', hLineColor: () => 'white', vLineColor: () => 'white', hLineWidth: () => 3, vLineWidth: () => 3, paddingTop: () => 8, paddingBottom: () => 8, paddingLeft: () => 10 },
    margin: [0, 0, 0, 12],
  }
}

/**
 * Resumen académico de una gestión (Inicio del administrador): totales, ocupación por curso, promedio por curso
 * y distribución de notas. Los promedios son los que calcula el servidor.
 */
export async function descargarResumenAcademico(periodoId: number | undefined, nombrePeriodo: string) {
  const [resumen, ocupacion, promedios, distribucion] = await Promise.all([
    dashboardApi.resumenAdmin(),
    dashboardApi.ocupacionCursos(periodoId),
    dashboardApi.promediosCursos(periodoId),
    dashboardApi.distribucionNotas(periodoId),
  ])
  const totalNotas = distribucion.data.reduce((s, d) => s + d.cantidad, 0)
  const promedioDe = new Map(promedios.data.map((p) => [p.cursoId, p]))
  const filasCursos: TableCell[][] = ocupacion.data.map((c) => {
    const p = promedioDe.get(c.cursoId)
    return [
      { text: c.nombre, bold: true },
      { text: `${c.inscritosActivos}${c.capacidad ? ` / ${c.capacidad}` : ''}`, alignment: 'center' },
      { text: c.porcentaje == null ? '—' : `${c.porcentaje} %`, alignment: 'center', color: (c.porcentaje ?? 0) >= 100 ? '#B91C1C' : undefined },
      celdaNota(p?.promedio, { negrita: true }),
      { text: p ? numero.format(p.cantidadCalificaciones) : '—', alignment: 'center' },
    ]
  })
  const filasDistribucion: TableCell[][] = distribucion.data.map((d) => [
    { text: d.rango, bold: true },
    { text: numero.format(d.cantidad), alignment: 'center' },
    { text: totalNotas ? `${((d.cantidad / totalNotas) * 100).toLocaleString('es-BO', { maximumFractionDigits: 1 })} %` : '—', alignment: 'center' },
  ])
  const definicion = await documento({
    titulo: 'Resumen académico',
    subtitulo: nombrePeriodo,
    contenido: [
      tarjetas([
        { etiqueta: 'Estudiantes activos', valor: resumen.totales.estudiantesActivos },
        { etiqueta: 'Docentes activos', valor: resumen.totales.docentesActivos },
        { etiqueta: 'Cursos activos', valor: resumen.totales.cursosActivos },
        { etiqueta: 'Materias activas', valor: resumen.totales.materiasActivas },
        { etiqueta: 'Inscripciones activas', valor: resumen.inscripcionesActivas },
      ]),
      { text: 'Cursos: ocupación y rendimiento', style: 'seccion' },
      tabla(
        [{ titulo: 'Curso' }, { titulo: 'Inscritos / capacidad', alinear: 'center' }, { titulo: 'Ocupación', alinear: 'center' }, { titulo: 'Promedio', alinear: 'center' }, { titulo: 'Notas', alinear: 'center' }],
        filasCursos,
        ['*', 90, 60, 60, 50],
      ),
      { text: 'Distribución de notas', style: 'seccion' },
      tabla([{ titulo: 'Rango' }, { titulo: 'Cantidad', alinear: 'center' }, { titulo: 'Porcentaje', alinear: 'center' }], filasDistribucion, ['*', 90, 90]),
    ],
    leyendaNotas: true,
  })
  await descargarPdf(definicion, 'resumen-academico')
}

/** Estudiantes cuyo promedio está por debajo del umbral en la gestión elegida. */
export function reporteEnRiesgo(periodoId: number | undefined, nombrePeriodo: string, umbral: number) {
  return reporteListado({
    titulo: 'Estudiantes en riesgo académico',
    subtitulo: `Promedio general menor a ${umbral}`,
    archivo: 'estudiantes-en-riesgo',
    filtros: [
      { etiqueta: 'Gestión', valor: nombrePeriodo },
      { etiqueta: 'Umbral', valor: umbral },
    ],
    cargar: async (page) => {
      const r = await dashboardApi.estudiantesEnRiesgo(periodoId, umbral, page)
      return { data: r.data, meta: r.meta }
    },
    columnas: [
      { titulo: 'Código', valor: (e) => e.codigo, ancho: 70 },
      { titulo: 'Estudiante', valor: (e) => e.nombre, ancho: '*' },
      { titulo: 'Promedio', valor: (e) => e.promedio, nota: true, ancho: 70 },
      { titulo: 'N.º de notas', valor: (e) => e.cantidadCalificaciones, alinear: 'center', ancho: 70 },
    ],
  })
}
