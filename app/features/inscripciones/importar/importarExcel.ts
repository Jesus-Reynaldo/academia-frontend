import { apiFetch } from '../../../shared/api/http'
import { ApiError, friendlyMessage } from '../../../shared/api/errors'
import type { Paginated } from '../../../shared/api/pagination'
import { inscripcionesApi } from '../api/inscripciones.api'

/**
 * Importación de inscripciones desde Excel (solo ADMIN).
 * Una fila = una inscripción. Un estudiante existente se identifica por su código o su documento (CI); uno nuevo
 * se deja sin código y se crea con los datos de la fila: el servidor le asigna el código (EST-0201…), así no se
 * repite aunque varias personas inscriban a la vez. El curso y la gestión se eligen de listas desplegables con los nombres del sistema.
 * No hay endpoint masivo: se usan los mismos POST /estudiantes y POST /inscripciones que la pantalla (la bitácora
 * registra cada alta y el servidor aplica sus reglas: cupo del curso, inscripción repetida…).
 */

interface CursoRef { id: number; nombre: string; capacidad: number | null; inscritosActivos: number; estado: string }
interface PeriodoRef { id: number; nombre: string; estado: string }
interface EstudianteRef { id: number; codigo: string; documento: string; nombres: string; apellidos: string }

export interface Contexto {
  cursos: CursoRef[]
  periodos: PeriodoRef[]
  estudiantes: EstudianteRef[]
}

/** Columnas de la hoja «Inscripciones» (el orden importa: es el de la planilla). */
export const COLUMNAS = [
  { clave: 'codigo', titulo: 'Código (solo si ya existe)', ancho: 22, nota: 'Vacío si el estudiante es nuevo: el sistema le asigna el código.' },
  { clave: 'documento', titulo: 'Documento (CI)', ancho: 16, nota: 'Obligatorio para estudiantes nuevos. Si el CI ya existe, se usa ese estudiante.' },
  { clave: 'nombres', titulo: 'Nombres', ancho: 22, nota: 'Solo para estudiantes nuevos (obligatorio).' },
  { clave: 'apellidos', titulo: 'Apellidos', ancho: 24, nota: 'Solo para estudiantes nuevos (obligatorio).' },
  { clave: 'email', titulo: 'Email', ancho: 28, nota: 'Opcional.' },
  { clave: 'telefono', titulo: 'Teléfono', ancho: 14, nota: 'Opcional.' },
  { clave: 'fechaNacimiento', titulo: 'Fecha de nacimiento', ancho: 18, nota: 'Opcional. Formato dd/mm/aaaa.' },
  { clave: 'curso', titulo: 'Curso *', ancho: 24, nota: 'Obligatorio. Elegir de la lista.' },
  { clave: 'gestion', titulo: 'Gestión *', ancho: 18, nota: 'Obligatorio. Elegir de la lista.' },
  { clave: 'fechaInscripcion', titulo: 'Fecha de inscripción', ancho: 18, nota: 'Opcional (si se deja vacía, hoy). dd/mm/aaaa.' },
] as const

type Clave = (typeof COLUMNAS)[number]['clave']
const FILAS_PLANILLA = 500

async function todas<T>(ruta: string, query: Record<string, string | number> = {}): Promise<T[]> {
  const filas: T[] = []
  for (let page = 1; ; page++) {
    const r = await apiFetch<Paginated<T>>(ruta, { query: { ...query, page, limit: 100 } })
    filas.push(...r.data)
    if (page >= r.meta.totalPages) return filas
  }
}

/** Cursos activos, gestiones no finalizadas y todos los estudiantes (para validar los códigos). */
export async function cargarContexto(): Promise<Contexto> {
  const [cursos, periodos, estudiantes] = await Promise.all([
    todas<CursoRef>('/cursos', { estado: 'ACTIVO', sortBy: 'nombre', order: 'asc' }),
    todas<PeriodoRef>('/periodos-academicos', { sortBy: 'fechaInicio', order: 'desc' }),
    todas<EstudianteRef>('/estudiantes', { sortBy: 'id', order: 'asc' }),
  ])
  return { cursos, periodos: periodos.filter((p) => p.estado !== 'FINALIZADO'), estudiantes }
}

const cargarExcel = async () => (await import('exceljs')).default

function descargarBlob(datos: ArrayBuffer, nombre: string) {
  const url = URL.createObjectURL(new Blob([datos], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }))
  const a = document.createElement('a')
  a.href = url
  a.download = nombre
  document.body.append(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

/** Planilla vacía con listas desplegables (cursos y gestiones reales), instrucciones y formato. */
export async function descargarPlantilla(ctx: Contexto, institucion: string) {
  const ExcelJS = await cargarExcel()
  const libro = new ExcelJS.Workbook()
  libro.creator = institucion
  libro.created = new Date()

  // Hoja 1: la planilla
  const hoja = libro.addWorksheet('Inscripciones', { views: [{ state: 'frozen', ySplit: 1 }] })
  hoja.columns = COLUMNAS.map((c) => ({ header: c.titulo, key: c.clave, width: c.ancho }))
  const encabezado = hoja.getRow(1)
  encabezado.height = 30
  encabezado.eachCell((celda, n) => {
    celda.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    celda.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: n >= 8 ? 'FF1E2F8A' : 'FF2740B8' } }
    celda.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
    celda.note = COLUMNAS[n - 1].nota
  })
  for (let fila = 2; fila <= FILAS_PLANILLA + 1; fila++) {
    hoja.getCell(`H${fila}`).dataValidation = {
      type: 'list', allowBlank: true, formulae: [`Listas!$A$2:$A$${ctx.cursos.length + 1}`],
      showErrorMessage: true, errorTitle: 'Curso no válido', error: 'Elige un curso de la lista.',
    }
    hoja.getCell(`I${fila}`).dataValidation = {
      type: 'list', allowBlank: true, formulae: [`Listas!$E$2:$E$${ctx.periodos.length + 1}`],
      showErrorMessage: true, errorTitle: 'Gestión no válida', error: 'Elige una gestión de la lista.',
    }
    for (const col of ['A', 'B', 'F']) hoja.getCell(`${col}${fila}`).numFmt = '@' // texto: no pierde ceros
    for (const col of ['G', 'J']) hoja.getCell(`${col}${fila}`).numFmt = 'dd/mm/yyyy'
  }

  // Hoja 2: instrucciones
  const ins = libro.addWorksheet('Instrucciones')
  ins.getColumn(1).width = 110
  const lineas = [
    ['Planilla de inscripciones', true],
    [`${institucion} · generada el ${new Date().toLocaleDateString('es-BO')}`, false],
    ['', false],
    ['1. Llena una fila por cada inscripción en la hoja «Inscripciones» (no cambies los títulos).', false],
    ['2. Estudiante que YA EXISTE: basta con su Código o su Documento (CI); el resto de sus datos puede quedar vacío.', false],
    ['3. Estudiante NUEVO: deja el Código VACÍO y completa Documento, Nombres y Apellidos (Email, Teléfono y Fecha de nacimiento son opcionales). El sistema le asigna el código al guardar.', false],
    ['4. Curso y Gestión se eligen de las listas desplegables (son los nombres que existen en el sistema).', false],
    ['5. Fechas en formato dd/mm/aaaa. Si la fecha de inscripción queda vacía, se usa la fecha del día.', false],
    ['6. Sube la planilla en Inscripciones → «Importar Excel». Antes de guardar verás una vista previa con los errores de cada fila.', false],
    ['', false],
    ['Ejemplo', true],
    ['Nuevo:  (vacío) | 9876543 LP | Ana María | Quispe Mamani | ana.quispe@correo.com | 70000000 | 15/03/2012 | 1ro Secundaria A | Gestión 2026 | 01/02/2026', false],
    ['Existente:  EST-0051 | (vacío) | (vacío) | (vacío) | | | | 2do Secundaria B | Gestión 2026 |', false],
  ] as const
  lineas.forEach(([texto, negrita], i) => {
    const c = ins.getCell(`A${i + 1}`)
    c.value = texto
    c.font = { bold: negrita, size: i === 0 ? 14 : 11, color: { argb: i === 0 ? 'FF2740B8' : 'FF0F172A' } }
    c.alignment = { wrapText: true }
  })

  // Hoja 3: listas (origen de los desplegables)
  const listas = libro.addWorksheet('Listas')
  listas.getRow(1).values = ['Curso', 'Capacidad', 'Inscritos activos', '', 'Gestión', 'Estado']
  listas.getRow(1).font = { bold: true }
  ctx.cursos.forEach((c, i) => {
    listas.getRow(i + 2).getCell(1).value = c.nombre
    listas.getRow(i + 2).getCell(2).value = c.capacidad ?? 'Sin límite'
    listas.getRow(i + 2).getCell(3).value = c.inscritosActivos
  })
  ctx.periodos.forEach((p, i) => {
    listas.getRow(i + 2).getCell(5).value = p.nombre
    listas.getRow(i + 2).getCell(6).value = p.estado
  })
  for (const [n, w] of [[1, 26], [2, 12], [3, 16], [5, 18], [6, 14]] as const) listas.getColumn(n).width = w

  descargarBlob(await libro.xlsx.writeBuffer(), 'planilla-inscripciones.xlsx')
}

/** Texto comparable: sin mayúsculas, tildes ni espacios de más. */
const normal = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim()

function texto(v: unknown): string {
  if (v === null || v === undefined) return ''
  if (v instanceof Date) return v.toISOString()
  if (typeof v === 'object') {
    const o = v as { text?: string; result?: unknown; richText?: { text: string }[]; hyperlink?: string }
    if (o.richText) return o.richText.map((r) => r.text).join('').trim()
    if (o.text) return String(o.text).trim()
    if (o.result !== undefined) return texto(o.result)
  }
  return String(v).trim()
}

/** Fecha de una celda (Date de Excel o texto dd/mm/aaaa o aaaa-mm-dd) → aaaa-mm-dd; null si vacía; 'invalida'. */
function fecha(v: unknown): string | null | 'invalida' {
  if (v === null || v === undefined || v === '') return null
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? 'invalida' : v.toISOString().slice(0, 10)
  const t = texto(v)
  if (!t) return null
  let m = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/.exec(t)
  if (m) {
    const [d, mes, a] = [Number(m[1]), Number(m[2]), Number(m[3])]
    const f = new Date(Date.UTC(a, mes - 1, d))
    return f.getUTCDate() === d && f.getUTCMonth() === mes - 1 ? f.toISOString().slice(0, 10) : 'invalida'
  }
  m = /^(\d{4})-(\d{2})-(\d{2})/.exec(t)
  return m ? `${m[1]}-${m[2]}-${m[3]}` : 'invalida'
}

export interface FilaImportacion {
  fila: number
  /** Código del estudiante existente; vacío si es nuevo (lo asigna el servidor). */
  codigo: string
  /** Identifica al estudiante dentro del archivo (repetidas y nuevos en varias filas). */
  clave: string
  nombre: string
  /** El estudiante ya existe (se usa) o se creará con los datos de la fila. */
  accion: 'existente' | 'nuevo'
  estudianteId?: number
  estudianteNuevo?: { documento: string; nombres: string; apellidos: string; email?: string; telefono?: string; fechaNacimiento?: string }
  curso: string
  cursoId?: number
  gestion: string
  periodoId?: number
  fechaInscripcion?: string
  errores: string[]
}

/** Lee la hoja «Inscripciones» y valida cada fila contra el sistema (sin guardar nada). */
export async function leerPlanilla(archivo: File, ctx: Contexto): Promise<FilaImportacion[]> {
  const ExcelJS = await cargarExcel()
  const libro = new ExcelJS.Workbook()
  try {
    await libro.xlsx.load(await archivo.arrayBuffer())
  } catch {
    throw new Error('El archivo no es una planilla de Excel válida (.xlsx).')
  }
  const hoja = libro.getWorksheet('Inscripciones') ?? libro.worksheets[0]
  if (!hoja) throw new Error('La planilla no tiene hojas.')
  const titulos = COLUMNAS.map((c, i) => normal(texto(hoja.getRow(1).getCell(i + 1).value)) === normal(c.titulo))
  if (titulos.filter(Boolean).length < 8) {
    throw new Error('La planilla no tiene las columnas esperadas. Descarga la planilla del sistema y llénala sin cambiar los títulos.')
  }

  const porCodigo = new Map(ctx.estudiantes.map((e) => [normal(e.codigo), e]))
  const porDocumento = new Map(ctx.estudiantes.map((e) => [normal(e.documento), e]))
  const cursoPorNombre = new Map(ctx.cursos.map((c) => [normal(c.nombre), c]))
  const periodoPorNombre = new Map(ctx.periodos.map((p) => [normal(p.nombre), p]))
  const vistos = new Map<string, number>()
  const filas: FilaImportacion[] = []

  hoja.eachRow({ includeEmpty: false }, (row, n) => {
    if (n === 1) return
    const v = Object.fromEntries(COLUMNAS.map((c, i) => [c.clave, row.getCell(i + 1).value])) as Record<Clave, unknown>
    const t = (k: Clave) => texto(v[k])
    if (COLUMNAS.every((c) => !t(c.clave))) return // fila vacía
    const errores: string[] = []
    const codigo = t('codigo')
    const documento = t('documento')
    // Existente: por código o, si no hay código, por documento. Sin código y con un CI nuevo: estudiante nuevo.
    const porSuCodigo = codigo ? porCodigo.get(normal(codigo)) : undefined
    const porSuDocumento = documento ? porDocumento.get(normal(documento)) : undefined
    const existente = codigo ? porSuCodigo : porSuDocumento
    const fila: FilaImportacion = {
      fila: n, codigo: existente?.codigo ?? codigo, clave: '', nombre: '', accion: existente || codigo ? 'existente' : 'nuevo',
      curso: t('curso'), gestion: t('gestion'), errores,
    }
    if (codigo && !porSuCodigo) {
      fila.nombre = '(no encontrado)'
      errores.push(`El código ${codigo} no existe. Si es un estudiante nuevo, deja el código vacío: el sistema le asigna uno.`)
    } else if (existente) {
      fila.estudianteId = existente.id
      fila.clave = `id:${existente.id}`
      fila.nombre = `${existente.apellidos}, ${existente.nombres}`
      if (codigo && porSuDocumento && porSuDocumento.id !== existente.id) {
        errores.push(`El documento ${documento} es de ${porSuDocumento.codigo}, no de ${existente.codigo}.`)
      }
    } else {
      const [nombres, apellidos, email, telefono] = [t('nombres'), t('apellidos'), t('email'), t('telefono')]
      fila.clave = documento ? `doc:${normal(documento)}` : `fila:${n}`
      fila.nombre = [apellidos, nombres].filter(Boolean).join(', ') || '(estudiante nuevo)'
      if (!documento) errores.push('Estudiante nuevo: falta el documento (o el código, si ya existe).')
      if (!nombres) errores.push('Estudiante nuevo: faltan los nombres.')
      if (!apellidos) errores.push('Estudiante nuevo: faltan los apellidos.')
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errores.push('El email no es válido.')
      const nac = fecha(v.fechaNacimiento)
      if (nac === 'invalida') errores.push('La fecha de nacimiento no es válida (dd/mm/aaaa).')
      fila.estudianteNuevo = {
        documento, nombres, apellidos,
        email: email || undefined, telefono: telefono || undefined, fechaNacimiento: nac && nac !== 'invalida' ? nac : undefined,
      }
    }
    const curso = fila.curso ? cursoPorNombre.get(normal(fila.curso)) : undefined
    if (!fila.curso) errores.push('Falta el curso.')
    else if (!curso) errores.push(`El curso «${fila.curso}» no existe o no está activo.`)
    else fila.cursoId = curso.id
    const periodo = fila.gestion ? periodoPorNombre.get(normal(fila.gestion)) : undefined
    if (!fila.gestion) errores.push('Falta la gestión.')
    else if (!periodo) errores.push(`La gestión «${fila.gestion}» no existe o ya está finalizada.`)
    else fila.periodoId = periodo.id
    const fIns = fecha(v.fechaInscripcion)
    if (fIns === 'invalida') errores.push('La fecha de inscripción no es válida (dd/mm/aaaa).')
    else if (fIns) fila.fechaInscripcion = fIns
    if (fila.clave && fila.gestion) {
      const clave = `${fila.clave}|${normal(fila.gestion)}`
      const repetida = vistos.get(clave)
      if (repetida) errores.push(`Repetida: el mismo estudiante ya está en la fila ${repetida} para esta gestión.`)
      else vistos.set(clave, n)
    }
    filas.push(fila)
  })
  if (filas.length === 0) throw new Error('La planilla está vacía: no hay filas para importar.')
  return filas
}

export interface ResultadoFila {
  fila: number
  nombre: string
  ok: boolean
  mensaje: string
  /** Código del estudiante (el asignado por el servidor si se creó). */
  codigo?: string
}

/** Crea los estudiantes nuevos y las inscripciones de las filas sin errores, una por una. */
export async function importarFilas(filas: FilaImportacion[], alAvanzar: (hechas: number) => void): Promise<ResultadoFila[]> {
  // Un estudiante nuevo que aparece en varias filas (otras gestiones) se crea una sola vez.
  const creados = new Map<string, { id: number; codigo: string }>()
  const resultados: ResultadoFila[] = []
  for (const [i, f] of filas.entries()) {
    let codigo = f.codigo || creados.get(f.clave)?.codigo
    try {
      let estudianteId = f.estudianteId ?? creados.get(f.clave)?.id
      let creado = false
      if (!estudianteId && f.estudianteNuevo) {
        const e = await apiFetch<{ id: number; codigo: string }>('/estudiantes', { method: 'POST', body: f.estudianteNuevo })
        estudianteId = e.id
        codigo = e.codigo
        creados.set(f.clave, { id: e.id, codigo: e.codigo })
        creado = true
      }
      await inscripcionesApi.create({
        estudianteId: estudianteId as number,
        cursoId: f.cursoId as number,
        periodoAcademicoId: f.periodoId as number,
        fechaInscripcion: f.fechaInscripcion,
      })
      resultados.push({ fila: f.fila, nombre: f.nombre, codigo, ok: true, mensaje: creado ? `Estudiante creado con el código ${codigo} e inscrito.` : 'Inscrito.' })
    } catch (error) {
      const mensaje = error instanceof ApiError ? error.messages.join(' ') : friendlyMessage(error)
      resultados.push({ fila: f.fila, nombre: f.nombre, codigo, ok: false, mensaje })
    }
    alAvanzar(i + 1)
  }
  return resultados
}
