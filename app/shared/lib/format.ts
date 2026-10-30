const fechaFormatter = new Intl.DateTimeFormat('es', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: 'UTC',
})

/** Las fechas llegan en ISO 8601 UTC; se muestran como dd/mm/aaaa (RNF-07). */
export function formatFecha(iso: string | null | undefined): string {
  if (!iso) return '—'
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? '—' : fechaFormatter.format(date)
}

const notaFormatter = new Intl.NumberFormat('es', { maximumFractionDigits: 2 })

export function formatNota(nota: number | null | undefined): string {
  return nota === null || nota === undefined ? '—' : notaFormatter.format(nota)
}

export function formatPorcentaje(value: number | null | undefined): string {
  return value === null || value === undefined ? '—' : `${notaFormatter.format(value)} %`
}

export function iniciales(nombre: string | null | undefined): string {
  if (!nombre) return '?'
  return nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]!.toUpperCase())
    .join('')
}
