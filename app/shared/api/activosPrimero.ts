import type { Paginated } from './pagination'

type PedirPagina<T, E extends string> = (estado: E, page: number, limit: number) => Promise<Paginated<T>>

/**
 * Lista paginada con los registros agrupados por estado en el orden dado (los inactivos al final), respetando
 * dentro de cada grupo el orden que eligió el usuario. La API ordena por un solo campo, así que se pide cada
 * estado por separado (con su filtro `estado`) y se arma la página aquí: primero el total de cada grupo y luego
 * solo las páginas que caen en la ventana pedida.
 */
export async function activosPrimero<T, E extends string>(
  grupos: readonly E[],
  pedir: PedirPagina<T, E>,
  page: number,
  limit: number,
): Promise<Paginated<T>> {
  const totales = await Promise.all(grupos.map(async (estado) => (await pedir(estado, 1, 1)).meta.total))
  const total = totales.reduce((suma, n) => suma + n, 0)
  const inicio = (page - 1) * limit
  const fin = Math.min(inicio + limit, total)

  const partes: Promise<T[]>[] = []
  let base = 0
  grupos.forEach((estado, i) => {
    const grupoInicio = base
    const grupoFin = base + totales[i]
    base = grupoFin
    const desde = Math.max(inicio, grupoInicio)
    const hasta = Math.min(fin, grupoFin)
    if (desde >= hasta) return
    const desplazamiento = desde - grupoInicio
    const cantidad = hasta - desde
    const primera = Math.floor(desplazamiento / limit) + 1
    const ultima = Math.floor((desplazamiento + cantidad - 1) / limit) + 1
    const paginas = Array.from({ length: ultima - primera + 1 }, (_, k) => pedir(estado, primera + k, limit))
    partes.push(
      Promise.all(paginas).then((respuestas) => {
        const filas = respuestas.flatMap((r) => r.data)
        const relativo = desplazamiento - (primera - 1) * limit
        return filas.slice(relativo, relativo + cantidad)
      }),
    )
  })

  return {
    data: (await Promise.all(partes)).flat(),
    meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
  }
}
