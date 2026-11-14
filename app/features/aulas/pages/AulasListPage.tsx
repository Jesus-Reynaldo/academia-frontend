import Add from '@mui/icons-material/Add'
import EditOutlined from '@mui/icons-material/EditOutlined'
import ScheduleOutlined from '@mui/icons-material/ScheduleOutlined'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import { useMemo, useState } from 'react'
import { useUrlParams } from '../../../shared/hooks/useUrlParams'
import { reporteListado } from '../../../shared/reportes/motor'
import { AccionesFila, type AccionFila } from '../../../shared/ui/AccionesFila'
import { BuscadorUrl } from '../../../shared/ui/BuscadorUrl'
import { DataTable, type DataTableColumn } from '../../../shared/ui/DataTable'
import { EmptyState } from '../../../shared/ui/EmptyState'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { QueryState } from '../../../shared/ui/QueryState'
import { StatusChip } from '../../../shared/ui/StatusChip'
import { useCambioEstado } from '../../../shared/ui/useCambioEstado'
import { aulasApi, useAulasList } from '../api/aulas'
import { AulaFormDialog } from '../components/AulaFormDialog'
import { CAMPOS_ORDENABLES, ESTADOS_AULA, ETIQUETA_ESTADO_AULA, type Aula, type AulaListParams, type CampoOrdenable, type EstadoAula } from '../model/types'

const LIMITES = [10, 20, 50]

function leer(sp: URLSearchParams): AulaListParams {
  const page = Number(sp.get('page'))
  const limit = Number(sp.get('limit'))
  const sortBy = sp.get('sortBy')
  const estado = sp.get('estado')
  return {
    page: Number.isInteger(page) && page >= 1 ? page : 1,
    limit: LIMITES.includes(limit) ? limit : 20,
    sortBy: CAMPOS_ORDENABLES.includes(sortBy as CampoOrdenable) ? (sortBy as CampoOrdenable) : 'codigo',
    order: sp.get('order') === 'desc' ? 'desc' : 'asc',
    q: sp.get('q')?.trim() || undefined,
    estado: ESTADOS_AULA.includes(estado as EstadoAula) ? (estado as EstadoAula) : undefined,
  }
}

function Acciones({ aula, onEdit }: { aula: Aula; onEdit: (a: Aula) => void }) {
  const estado = useCambioEstado({
    ruta: '/aulas',
    id: aula.id,
    sujeto: aula.nombre,
    activo: aula.estado === 'ACTIVA',
    alDesactivar: { estado: 'INACTIVA' },
    alActivar: { estado: 'ACTIVA' },
    efecto: 'Ya no se podrá elegir para nuevos horarios; los horarios que ya la usan se conservan.',
  })
  const acciones: AccionFila[] = [
    { etiqueta: 'Ver horario del aula', icono: <ScheduleOutlined />, to: `/horarios?aulaId=${aula.id}&vista=semana` },
    { etiqueta: 'Editar', icono: <EditOutlined />, onClick: () => onEdit(aula) },
  ]
  if (estado.accion) acciones.push(estado.accion)
  return (
    <>
      <AccionesFila sujeto={aula.nombre} acciones={acciones} />
      {estado.dialogo}
    </>
  )
}

const COLUMNAS: DataTableColumn<Aula>[] = [
  { id: 'codigo', header: 'Código', sortField: 'codigo', render: (a) => a.codigo },
  { id: 'nombre', header: 'Nombre', sortField: 'nombre', primary: true, render: (a) => <span className="font-semibold">{a.nombre}</span> },
  { id: 'capacidad', header: 'Capacidad', sortField: 'capacidad', align: 'right', render: (a) => (a.capacidad ? `${a.capacidad}` : '—') },
  { id: 'ubicacion', header: 'Ubicación', sortField: 'ubicacion', render: (a) => a.ubicacion ?? '—' },
  { id: 'estado', header: 'Estado', sortField: 'estado', render: (a) => <StatusChip estado={a.estado} /> },
]

/** Aulas (solo ADMIN): los ambientes que se eligen al armar los horarios. */
export function AulasListPage() {
  const [sp, updateParams] = useUrlParams()
  const params = useMemo(() => leer(sp), [sp])
  const query = useAulasList(params)
  const [formulario, setFormulario] = useState<{ aula: Aula | null } | null>(null)
  const total = query.data?.meta.total
  const hayFiltros = Boolean(params.q || params.estado)

  const reporte = () =>
    reporteListado({
      titulo: 'Aulas',
      archivo: 'aulas',
      filtros: [
        { etiqueta: 'Estado', valor: params.estado && ETIQUETA_ESTADO_AULA[params.estado] },
        { etiqueta: 'Búsqueda', valor: params.q && `«${params.q}»` },
      ],
      cargar: (page, limit) => aulasApi.list({ ...params, page, limit }),
      columnas: [
        { titulo: 'Código', valor: (a) => a.codigo, ancho: 60 },
        { titulo: 'Nombre', valor: (a) => a.nombre, ancho: '*' },
        { titulo: 'Capacidad', valor: (a) => a.capacidad ?? '—', ancho: 55, alinear: 'right' },
        { titulo: 'Ubicación', valor: (a) => a.ubicacion ?? '—', ancho: '*' },
        { titulo: 'Estado', valor: (a) => ETIQUETA_ESTADO_AULA[a.estado], ancho: 55 },
      ],
    })

  return (
    <>
      <PageHeader
        title="Aulas"
        modulo="aulas"
        reporte={reporte}
        subtitle={<span role="status">{total === undefined ? 'Cargando…' : `${total} ${total === 1 ? 'aula' : 'aulas'}`}</span>}
        actions={
          <Button variant="contained" startIcon={<Add />} onClick={() => setFormulario({ aula: null })} sx={{ minHeight: 44 }}>
            Nueva aula
          </Button>
        }
      />
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <BuscadorUrl placeholder="Código, nombre o ubicación" minWidth={0} />
            <TextField
              select
              label="Estado"
              value={params.estado ?? ''}
              onChange={(e) => updateParams({ estado: e.target.value || null, page: null })}
              slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
            >
              <MenuItem value="">Todos</MenuItem>
              {ESTADOS_AULA.map((e) => <MenuItem key={e} value={e}>{ETIQUETA_ESTADO_AULA[e]}</MenuItem>)}
            </TextField>
          </div>
        </CardContent>
      </Card>
      <QueryState query={query} skeletonHeight={240}>
        {(data) => (
          <DataTable
            caption="Aulas"
            columns={COLUMNAS}
            rows={data.data}
            getRowId={(a) => a.id}
            getRowSx={(a) => (a.estado === 'INACTIVA' ? { opacity: 0.7 } : {})}
            rowActions={(a) => <Acciones aula={a} onEdit={(x) => setFormulario({ aula: x })} />}
            sort={{ sortBy: params.sortBy, order: params.order }}
            onSortChange={(sortBy, order) => updateParams({ sortBy, order })}
            pagination={{
              page: data.meta.page,
              limit: data.meta.limit,
              total: data.meta.total,
              limitOptions: LIMITES,
              onPageChange: (page) => updateParams({ page: page === 1 ? null : page }),
              onLimitChange: (limit) => updateParams({ limit }),
            }}
            fetching={query.isFetching}
            emptyState={
              hayFiltros ? (
                <EmptyState title="No hay aulas con estos filtros" action={<Button onClick={() => updateParams({ q: null, estado: null })}>Limpiar filtros</Button>} />
              ) : (
                <EmptyState
                  title="Aún no hay aulas"
                  description="Registra las aulas y laboratorios para poder armar los horarios."
                  action={<Button variant="contained" startIcon={<Add />} onClick={() => setFormulario({ aula: null })}>Registrar la primera</Button>}
                />
              )
            }
          />
        )}
      </QueryState>
      {formulario && <AulaFormDialog aula={formulario.aula} onClose={() => setFormulario(null)} />}
    </>
  )
}
