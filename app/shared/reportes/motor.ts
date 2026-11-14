import type { Content, TableCell, TDocumentDefinitions } from 'pdfmake/interfaces'
import type { Paginated } from '../api/pagination'
import { apiFetch } from '../api/http'
import { API_URL, NOTA_APROBACION } from '../config/env'

/**
 * Motor de reportes PDF (pdfmake). Todos los reportes del sistema comparten la misma plantilla:
 * encabezado con logotipo y datos de la institución, título, filtros aplicados, tabla y pie con
 * quién lo generó, fecha y número de página. pdfmake se descarga solo al generar el primer reporte.
 */

const AZUL = '#2740B8'
const TEXTO = '#0F172A'
const SUAVE = '#475569'
const BORDE = '#E2E8F0'
const FONDO = '#F6F7FB'
const ROJO = '#B91C1C'

export interface Institucion {
  nombre: string
  sigla: string | null
  /** Logotipo como PNG en base64 (pdfmake solo acepta PNG y JPG). */
  logo: string | null
}

export interface Filtro {
  etiqueta: string
  valor: string | number | null | undefined
}

export interface Columna<T> {
  titulo: string
  /** Ancho: número de puntos, '*' (reparte el resto) o 'auto'. */
  ancho?: number | '*' | 'auto'
  alinear?: 'left' | 'center' | 'right'
  valor: (fila: T) => string | number | null | undefined
  /** Columna de nota: se formatea y, si está por debajo de 51, va en rojo con (!). */
  nota?: boolean
}

const fechaHora = () =>
  new Intl.DateTimeFormat('es-BO', { dateStyle: 'short', timeStyle: 'short' }).format(new Date())

const formatoNota = new Intl.NumberFormat('es-BO', { maximumFractionDigits: 2 })

/** Nota para el PDF: con coma decimal y marcada si está por debajo del mínimo (se entiende en blanco y negro). */
export function celdaNota(nota: number | null | undefined, opciones: { negrita?: boolean } = {}): TableCell {
  if (nota === null || nota === undefined) return { text: '—', color: SUAVE, alignment: 'center' }
  const debajo = nota < NOTA_APROBACION
  return {
    text: `${debajo ? '(!) ' : ''}${formatoNota.format(nota)}`,
    color: debajo ? ROJO : TEXTO,
    bold: debajo || opciones.negrita,
    alignment: 'center',
  }
}

/** Convierte una imagen (cualquier formato que el navegador entienda) a PNG en base64 usando un canvas. */
async function imagenComoPng(url: string): Promise<string | null> {
  try {
    const blob = await (await fetch(url)).blob()
    const bitmap = await createImageBitmap(blob)
    const canvas = document.createElement('canvas')
    canvas.width = bitmap.width
    canvas.height = bitmap.height
    canvas.getContext('2d')?.drawImage(bitmap, 0, 0)
    return canvas.toDataURL('image/png')
  } catch {
    return null
  }
}

/** Nombre, sigla y logotipo de la institución (Configuración). Si algo falla, el reporte sale sin logo. */
export async function cargarInstitucion(): Promise<Institucion> {
  try {
    const c = await apiFetch<{ nombreInstitucion: string; sigla: string | null; tieneLogo: boolean; version: number }>(
      '/configuracion',
      { auth: false },
    )
    const logo = c.tieneLogo ? await imagenComoPng(`${API_URL}/configuracion/logo?v=${c.version}`) : null
    return { nombre: c.nombreInstitucion, sigla: c.sigla, logo }
  } catch {
    return { nombre: 'Sistema Académico', sigla: null, logo: null }
  }
}

/** Quién genera el reporte (para el pie de página). */
async function quienGenera(): Promise<string> {
  try {
    const yo = await apiFetch<{ email: string; nombre?: string | null; rol: string }>('/auth/me')
    const rol = { ADMIN: 'Administrador', DOCENTE: 'Docente', ESTUDIANTE: 'Estudiante' }[yo.rol] ?? yo.rol
    return `${yo.nombre || yo.email} (${rol})`
  } catch {
    return 'usuario del sistema'
  }
}

/** Tabla con el estilo de los reportes: encabezado azul que se repite en cada página y filas alternadas. */
export function tabla(encabezados: { titulo: string; alinear?: 'left' | 'center' | 'right' }[], filas: TableCell[][], anchos: (number | '*' | 'auto')[]): Content {
  return {
    table: {
      headerRows: 1,
      dontBreakRows: true,
      widths: anchos,
      body: [
        encabezados.map((e) => ({ text: e.titulo, style: 'encabezadoTabla', alignment: e.alinear ?? 'left' })),
        ...filas,
      ],
    },
    layout: {
      fillColor: (fila: number) => (fila === 0 ? AZUL : fila % 2 === 0 ? FONDO : null),
      hLineColor: () => BORDE,
      vLineColor: () => BORDE,
      hLineWidth: (i: number) => (i === 0 ? 0 : 0.5),
      vLineWidth: () => 0,
      paddingTop: () => 4,
      paddingBottom: () => 4,
      paddingLeft: () => 5,
      paddingRight: () => 5,
    },
    fontSize: 8.5,
  }
}

/** Caja con los filtros aplicados (o «todos los registros» si no hay). */
function cajaFiltros(filtros: Filtro[], total?: number): Content {
  const activos = filtros.filter((f) => f.valor !== undefined && f.valor !== null && f.valor !== '')
  const texto: Content[] = activos.length
    ? activos.flatMap((f, i) => [
        { text: `${f.etiqueta}: `, bold: true },
        { text: `${f.valor}${i < activos.length - 1 ? '   ·   ' : ''}` },
      ])
    : [{ text: 'Sin filtros: todos los registros.' }]
  return {
    table: {
      widths: ['*', 'auto'],
      body: [[
        { text: [{ text: 'Filtros aplicados  ', color: AZUL, bold: true }, ...texto] as Content[], fontSize: 8.5 },
        total === undefined ? { text: '' } : { text: `${total} ${total === 1 ? 'registro' : 'registros'}`, bold: true, fontSize: 9, alignment: 'right' },
      ]],
    },
    layout: { fillColor: () => FONDO, hLineWidth: () => 0, vLineWidth: () => 0, paddingTop: () => 6, paddingBottom: () => 6, paddingLeft: () => 8, paddingRight: () => 8 },
    margin: [0, 0, 0, 10],
  }
}

export interface OpcionesReporte {
  titulo: string
  subtitulo?: string
  filtros?: Filtro[]
  total?: number
  contenido: Content[]
  horizontal?: boolean
  /** Agrega la explicación de las notas marcadas con (!). */
  leyendaNotas?: boolean
}

/** Arma el documento completo con la plantilla institucional. */
export async function documento(o: OpcionesReporte): Promise<TDocumentDefinitions> {
  const [inst, autor] = await Promise.all([cargarInstitucion(), quienGenera()])
  const generado = fechaHora()
  const encabezadoInstitucion: Content = {
    columns: [
      inst.logo ? { image: inst.logo, fit: [40, 40], width: 44 } : { text: '', width: 0 },
      {
        stack: [
          { text: inst.nombre, bold: true, fontSize: 12, color: TEXTO },
          { text: inst.sigla ? `${inst.sigla} · Sistema Académico` : inst.nombre === 'Sistema Académico' ? 'Gestión académica' : 'Sistema Académico', fontSize: 8.5, color: SUAVE },
        ],
        margin: [inst.logo ? 6 : 0, inst.logo ? 6 : 2, 0, 0],
      },
      { text: o.titulo, alignment: 'right', fontSize: 8.5, color: SUAVE, margin: [0, 8, 0, 0], width: 'auto' },
    ],
  }
  return {
    pageSize: 'A4',
    pageOrientation: o.horizontal ? 'landscape' : 'portrait',
    pageMargins: [36, 78, 36, 48],
    info: { title: o.titulo, author: inst.nombre, creator: 'Sistema Académico' },
    header: () => ({
      stack: [
        encabezadoInstitucion,
        { canvas: [{ type: 'line', x1: 0, y1: 4, x2: o.horizontal ? 770 : 523, y2: 4, lineWidth: 1, lineColor: AZUL }] },
      ],
      margin: [36, 22, 36, 0],
    }),
    footer: (pagina: number, total: number) => ({
      columns: [
        { text: `Generado el ${generado} por ${autor}`, fontSize: 7.5, color: SUAVE },
        { text: `Página ${pagina} de ${total}`, alignment: 'right', fontSize: 7.5, color: SUAVE, width: 'auto' },
      ],
      margin: [36, 16, 36, 0],
    }),
    content: [
      { text: o.titulo, style: 'titulo' },
      ...(o.subtitulo ? [{ text: o.subtitulo, style: 'subtitulo' } as Content] : []),
      ...(o.filtros ? [cajaFiltros(o.filtros, o.total)] : []),
      ...o.contenido,
      ...(o.leyendaNotas
        ? [{ text: `Las notas marcadas con (!) y en rojo están por debajo de ${NOTA_APROBACION}, la nota mínima de aprobación.`, fontSize: 7.5, color: SUAVE, margin: [0, 8, 0, 0] } as Content]
        : []),
    ],
    styles: {
      titulo: { fontSize: 16, bold: true, color: AZUL, margin: [0, 0, 0, 2] },
      subtitulo: { fontSize: 9.5, color: SUAVE, margin: [0, 0, 0, 10] },
      seccion: { fontSize: 11, bold: true, color: TEXTO, margin: [0, 10, 0, 6] },
      encabezadoTabla: { bold: true, color: 'white', fontSize: 8.5 },
    },
    defaultStyle: { font: 'Roboto', fontSize: 9, color: TEXTO, lineHeight: 1.15 },
  }
}

/** Genera y descarga el PDF. pdfmake (~1 MB) se carga aquí, solo la primera vez que alguien pide un reporte. */
export async function descargarPdf(definicion: TDocumentDefinitions, archivo: string) {
  const [{ default: pdfMake }, { default: fuentes }] = await Promise.all([
    import('pdfmake/build/pdfmake'),
    import('pdfmake/build/vfs_fonts'),
  ])
  pdfMake.addVirtualFileSystem(fuentes)
  const fecha = new Date().toISOString().slice(0, 10)
  await pdfMake.createPdf(definicion).download(`${archivo}-${fecha}.pdf`)
}

/** Trae TODAS las filas que cumplen los filtros (no solo la página visible), con un tope para no colgar el navegador. */
export async function todasLasFilas<T>(cargar: (page: number, limit: number) => Promise<Paginated<T>>, maximo = 5000): Promise<T[]> {
  const primera = await cargar(1, 100)
  if (primera.meta.total > maximo) {
    throw new Error(
      `Hay ${primera.meta.total.toLocaleString('es-BO')} registros: aplica más filtros (el reporte admite hasta ${maximo.toLocaleString('es-BO')}).`,
    )
  }
  const resto = await Promise.all(
    Array.from({ length: Math.max(0, primera.meta.totalPages - 1) }, (_, i) => cargar(i + 2, 100)),
  )
  return [...primera.data, ...resto.flatMap((r) => r.data)]
}

/** Reporte de un listado con los filtros que el usuario tiene puestos en ese momento. */
export async function reporteListado<T>(o: {
  titulo: string
  subtitulo?: string
  archivo: string
  filtros: Filtro[]
  columnas: Columna<T>[]
  cargar: (page: number, limit: number) => Promise<Paginated<T>>
  horizontal?: boolean
  maximo?: number
  /** Orden de las filas en el PDF (p. ej. por apellido); si no, el del servidor. */
  ordenar?: (a: T, b: T) => number
}) {
  const filas = await todasLasFilas(o.cargar, o.maximo)
  if (o.ordenar) filas.sort(o.ordenar)
  const conNotas = o.columnas.some((c) => c.nota)
  const cuerpo: TableCell[][] = filas.map((fila) =>
    o.columnas.map((c) => {
      const v = c.valor(fila)
      if (c.nota) return celdaNota(typeof v === 'number' ? v : v == null ? null : Number(v))
      return { text: v === null || v === undefined || v === '' ? '—' : String(v), alignment: c.alinear ?? 'left' }
    }),
  )
  const contenido: Content[] = filas.length
    ? [tabla(o.columnas.map((c) => ({ titulo: c.titulo, alinear: c.nota ? 'center' : c.alinear })), cuerpo, o.columnas.map((c) => c.ancho ?? 'auto'))]
    : [{ text: 'No hay registros con estos filtros.', italics: true, color: SUAVE, margin: [0, 10, 0, 0] }]
  const definicion = await documento({
    titulo: o.titulo,
    subtitulo: o.subtitulo,
    filtros: o.filtros,
    total: filas.length,
    contenido,
    horizontal: o.horizontal,
    leyendaNotas: conNotas,
  })
  await descargarPdf(definicion, o.archivo)
}
