import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Link from '@mui/material/Link'
import MenuItem from '@mui/material/MenuItem'
import Pagination from '@mui/material/Pagination'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useMemo } from 'react'
import { Link as RouterLink } from 'react-router'
import { ICONO_MODULO } from '../../../shared/config/modulos'
import { ETIQUETA_ROL } from '../../../shared/config/roles'
import { useUrlParams } from '../../../shared/hooks/useUrlParams'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { QueryState } from '../../../shared/ui/QueryState'
import { BuscadorUrl } from '../../../shared/ui/BuscadorUrl'
import { reporteBitacora } from '../reportes/bitacoraPdf'
import { useDesde } from '../../../shared/navegacion/desde'
import { useBitacora } from '../api/bitacora.api'
import {
  ACCIONES,
  ETIQUETA_ACCION,
  RECURSO,
  RECURSOS,
  type AccionBitacora,
  type BitacoraParams,
  type RecursoBitacora,
  type RegistroBitacora,
} from '../model/types'

const POR_PAGINA = 30

/** «Curso X → INACTIVO» se muestra «Curso X → Inactivo». */
const legible = (texto: string) => texto.replace(/→ ([A-ZÁÉÍÓÚÑ]+)$/, (_, estado: string) => `→ ${estado.charAt(0)}${estado.slice(1).toLowerCase()}`)

/** Color del círculo según la acción: crear verde, modificar azul, desactivar ámbar, eliminar rojo. */
const COLOR_ACCION: Record<AccionBitacora, string> = {
  CREAR: 'bg-ok-tint text-ok',
  MODIFICAR: 'bg-info-tint text-info',
  DESACTIVAR: 'bg-alerta-tint text-alerta',
  ELIMINAR: 'bg-peligro-tint text-peligro',
}

function leerParametros(sp: URLSearchParams): BitacoraParams {
  const page = Number(sp.get('page'))
  const recurso = sp.get('recurso')
  const accion = sp.get('accion')
  return {
    page: Number.isInteger(page) && page >= 1 ? page : 1,
    limit: POR_PAGINA,
    recurso: RECURSOS.includes(recurso as RecursoBitacora) ? (recurso as RecursoBitacora) : undefined,
    accion: ACCIONES.includes(accion as AccionBitacora) ? (accion as AccionBitacora) : undefined,
    q: sp.get('q')?.trim() || undefined,
  }
}

const fechaDia = new Intl.DateTimeFormat('es-BO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
const hora = new Intl.DateTimeFormat('es-BO', { hour: '2-digit', minute: '2-digit' })

/** «Hoy», «Ayer» o la fecha completa, en la hora local del navegador. */
function nombreDia(fecha: Date) {
  const hoy = new Date()
  const ayer = new Date(); ayer.setDate(hoy.getDate() - 1)
  if (fecha.toDateString() === hoy.toDateString()) return 'Hoy'
  if (fecha.toDateString() === ayer.toDateString()) return 'Ayer'
  const texto = fechaDia.format(fecha)
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

function agruparPorDia(registros: RegistroBitacora[]) {
  const grupos: { dia: string; registros: RegistroBitacora[] }[] = []
  for (const r of registros) {
    const dia = nombreDia(new Date(r.fecha))
    const ultimo = grupos.at(-1)
    if (ultimo?.dia === dia) ultimo.registros.push(r)
    else grupos.push({ dia, registros: [r] })
  }
  return grupos
}

/** Bitácora (solo ADMIN): quién creó, modificó, desactivó o eliminó qué y cuándo. */
export function BitacoraPage() {
  const [searchParams, updateParams] = useUrlParams()
  const params = useMemo(() => leerParametros(searchParams), [searchParams])
  const query = useBitacora(params)
  const hayFiltros = params.recurso !== undefined || params.accion !== undefined || params.q !== undefined
  const total = query.data?.meta.total

  return (
    <>
      <PageHeader
        modulo="bitacora"
        reporte={() => reporteBitacora(params)}
        title="Bitácora"
        subtitle={<span role="status">{total === undefined ? 'Cargando…' : `${total} ${total === 1 ? 'cambio registrado' : 'cambios registrados'}`}</span>}
      />

      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <BuscadorUrl placeholder="Quién, qué o descripción" minWidth={240} />
            <TextField
              select
              label="Módulo"
              value={params.recurso ?? ''}
              onChange={(e) => updateParams({ recurso: e.target.value })}
              sx={{ minWidth: { sm: 200 } }}
              slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
            >
              <MenuItem value="">Todos</MenuItem>
              {RECURSOS.map((r) => (
                <MenuItem key={r} value={r}>{RECURSO[r].plural}</MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Acción"
              value={params.accion ?? ''}
              onChange={(e) => updateParams({ accion: e.target.value })}
              sx={{ minWidth: { sm: 180 } }}
              slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
            >
              <MenuItem value="">Todas</MenuItem>
              {ACCIONES.map((a) => (
                <MenuItem key={a} value={a}>{ETIQUETA_ACCION[a]}</MenuItem>
              ))}
            </TextField>
            {hayFiltros && (
              <Button onClick={() => updateParams({ recurso: null, accion: null, q: null })} sx={{ minHeight: 44, alignSelf: { xs: 'flex-start', sm: 'center' } }}>
                Limpiar filtros
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <QueryState
        query={query}
        skeletonHeight={320}
        isEmpty={(data) => data.data.length === 0}
        emptyTitle={hayFiltros ? 'No hay cambios con estos filtros' : 'Todavía no hay cambios registrados'}
        emptyDescription={hayFiltros ? 'Prueba con otro módulo o acción.' : 'Aquí aparecerá cada vez que alguien cree, modifique o desactive algo.'}
      >
        {(data) => (
          <>
            <Card>
              <CardContent>
                {agruparPorDia(data.data).map((grupo) => (
                  <section key={grupo.dia} aria-label={grupo.dia} className="mb-6 last:mb-0">
                    <Typography variant="h2" component="h2" sx={{ fontSize: '0.95rem', color: 'text.secondary', mb: 1.5 }}>
                      {grupo.dia}
                    </Typography>
                    <ol className="m-0 list-none border-l-2 border-borde p-0 pl-4">
                      {grupo.registros.map((r) => (
                        <Entrada key={r.id} registro={r} />
                      ))}
                    </ol>
                  </section>
                ))}
              </CardContent>
            </Card>
            {data.meta.totalPages > 1 && (
              <div className="mt-4 flex justify-center">
                <Pagination
                  count={data.meta.totalPages}
                  page={data.meta.page}
                  onChange={(_, page) => updateParams({ page: page === 1 ? null : page })}
                  getItemAriaLabel={(tipo, page) => (tipo === 'page' ? `Página ${page}` : tipo === 'next' ? 'Página siguiente' : 'Página anterior')}
                  sx={{ '& .MuiPaginationItem-root': { minWidth: 44, height: 44 } }}
                />
              </div>
            )}
          </>
        )}
      </QueryState>
    </>
  )
}

function Entrada({ registro: r }: { registro: RegistroBitacora }) {
  const { desde } = useDesde('Bitácora')
  const recurso = RECURSO[r.recurso]
  const Icono = ICONO_MODULO[recurso.modulo]
  const enlace = recurso.ruta && r.recursoId && r.accion !== 'ELIMINAR' ? `${recurso.ruta}/${r.recursoId}` : null
  const quien = r.usuario ? r.usuario.email : 'Usuario eliminado'
  const fecha = new Date(r.fecha)
  return (
    <li className="relative mb-3 flex items-start gap-3 last:mb-0">
      <span aria-hidden className={`-ml-[2.15rem] grid h-9 w-9 shrink-0 place-items-center rounded-full ring-4 ring-white ${COLOR_ACCION[r.accion]}`}>
        <Icono fontSize="small" />
      </span>
      <div className="min-w-0 flex-1">
        <Typography variant="body2" sx={{ overflowWrap: 'anywhere' }}>
          <strong>{quien}</strong>
          {r.usuario && <span className="text-texto-suave"> ({ETIQUETA_ROL[r.usuario.rol]})</span>}{' '}
          {ETIQUETA_ACCION[r.accion].toLowerCase()} {recurso.articulo} {recurso.etiqueta}{' '}
          {enlace ? (
            <Link component={RouterLink} to={enlace} state={{ desde }} underline="always">
              «{legible(r.descripcion)}»
            </Link>
          ) : (
            <span className="font-semibold">«{legible(r.descripcion)}»</span>
          )}
        </Typography>
        <Typography variant="caption" color="text.secondary" component="time" dateTime={r.fecha}>
          {hora.format(fecha)}
        </Typography>
      </div>
    </li>
  )
}
