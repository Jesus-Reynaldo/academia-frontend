import Add from '@mui/icons-material/Add'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import MuiLink from '@mui/material/Link'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import { useMemo, useState } from 'react'
import { Link as RouterLink } from 'react-router'
import { useUrlParams } from '../../../shared/hooks/useUrlParams'
import { DataTable, type DataTableColumn } from '../../../shared/ui/DataTable'
import { EmptyState } from '../../../shared/ui/EmptyState'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { QueryState } from '../../../shared/ui/QueryState'
import { SearchField } from '../../../shared/ui/SearchField'
import { StatusChip } from '../../../shared/ui/StatusChip'
import { useUsuario } from '../../autenticacion'
import { useCursosList } from '../api/useCursos'
import { CursoFormDialog } from '../components/CursoFormDialog'
import { CursoRowMenu } from '../components/CursoRowMenu'
import { EliminarCursoDialog } from '../components/EliminarCursoDialog'
import { OcupacionCurso } from '../components/OcupacionCurso'
import { usePaginaEnRango } from '../../../shared/hooks/usePaginaEnRango'
import {
  CAMPOS_ORDENABLES,
  ESTADOS_CURSO,
  ETIQUETA_ESTADO_CURSO,
  NIVELES_CURSO,
  type CampoOrdenable,
  type Curso,
  type CursoListParams,
  type EstadoCurso,
} from '../model/types'

const LIMITES = [10, 20, 50]

/** Lee y valida los parámetros de la URL: un valor inválido (enlace editado a mano) cae al valor por defecto. */
function leerParametros(searchParams: URLSearchParams): CursoListParams {
  const page = Number(searchParams.get('page'))
  const limit = Number(searchParams.get('limit'))
  const sortBy = searchParams.get('sortBy')
  const order = searchParams.get('order')
  const nivel = searchParams.get('nivel')
  const estado = searchParams.get('estado')
  const nombre = searchParams.get('nombre')?.trim()

  return {
    page: Number.isInteger(page) && page >= 1 ? page : 1,
    limit: LIMITES.includes(limit) ? limit : 20,
    sortBy: CAMPOS_ORDENABLES.includes(sortBy as CampoOrdenable) ? (sortBy as CampoOrdenable) : 'nombre',
    order: order === 'desc' ? 'desc' : 'asc',
    nivel: (NIVELES_CURSO as readonly string[]).includes(nivel ?? '') ? (nivel as string) : undefined,
    estado: ESTADOS_CURSO.includes(estado as EstadoCurso) ? (estado as EstadoCurso) : undefined,
    nombre: nombre || undefined,
  }
}

const COLUMNAS: DataTableColumn<Curso>[] = [
  {
    id: 'nombre',
    header: 'Curso',
    sortField: 'nombre',
    primary: true,
    render: (c) => (
      <MuiLink component={RouterLink} to={`/cursos/${c.id}`} sx={{ fontWeight: 600 }}>
        {c.nombre}
      </MuiLink>
    ),
  },
  { id: 'nivel', header: 'Nivel', sortField: 'nivel', render: (c) => c.nivel },
  { id: 'paralelo', header: 'Paralelo', sortField: 'paralelo', render: (c) => c.paralelo ?? '—' },
  {
    id: 'ocupacion',
    header: 'Ocupación',
    render: (c) => <OcupacionCurso inscritos={c.inscritosActivos} capacidad={c.capacidad} />,
  },
  { id: 'estado', header: 'Estado', sortField: 'estado', render: (c) => <StatusChip estado={c.estado} /> },
]

export function CursosListPage() {
  const usuario = useUsuario()
  const esAdmin = usuario.rol === 'ADMIN'

  const [searchParams, updateParams] = useUrlParams()
  const params = useMemo(() => leerParametros(searchParams), [searchParams])
  const query = useCursosList(params)
  const fueraDeRango = usePaginaEnRango(query.data?.meta, query.data?.data.length, updateParams)

  // `formulario`: null = cerrado; { curso: null } = alta; { curso } = edición.
  const [formulario, setFormulario] = useState<{ curso: Curso | null } | null>(null)
  const [aEliminar, setAEliminar] = useState<Curso | null>(null)

  // SearchField guarda su propio texto: se reinicia cambiando su `key` (al limpiar filtros).
  const [busqueda, setBusqueda] = useState({ key: 0, inicial: params.nombre ?? '' })
  const reiniciarBusqueda = () => setBusqueda((actual) => ({ key: actual.key + 1, inicial: '' }))

  const hayFiltros = params.nivel !== undefined || params.estado !== undefined || params.nombre !== undefined
  const limpiarFiltros = () => {
    updateParams({ nivel: null, estado: null, nombre: null })
    reiniciarBusqueda()
  }
  const total = query.data?.meta.total

  // Si se borró la única fila de la última página, retrocede una página en lugar de mostrar una vacía.
  const filasEnPagina = query.data?.data.length ?? 0
  const despuesDeEliminar = () => {
    setAEliminar(null)
    if (filasEnPagina === 1 && params.page > 1) updateParams({ page: params.page - 1 })
  }

  const vacio = hayFiltros ? (
    <EmptyState
      title="No hay cursos con estos filtros"
      description="Prueba con otro nombre, nivel o estado, o quita los filtros."
      action={<Button onClick={limpiarFiltros}>Limpiar filtros</Button>}
    />
  ) : (
    <EmptyState
      title="Aún no hay cursos"
      description={esAdmin ? 'Crea el primero para poder inscribir estudiantes.' : 'Cuando el administrador cree cursos, aparecerán aquí.'}
      action={
        esAdmin ? (
          <Button variant="contained" startIcon={<Add />} onClick={() => setFormulario({ curso: null })}>
            Crear el primero
          </Button>
        ) : undefined
      }
    />
  )

  return (
    <>
      <PageHeader
        title="Cursos"
        modulo="cursos"
        subtitle={
          // role="status": el lector de pantalla anuncia el nuevo total al filtrar.
          <span role="status">{total === undefined ? 'Cargando…' : `${total} ${total === 1 ? 'curso' : 'cursos'}`}</span>
        }
        actions={
          esAdmin && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setFormulario({ curso: null })}
              sx={{ minHeight: 44 }}
            >
              Nuevo curso
            </Button>
          )
        }
      />

      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1.5}
            sx={{ alignItems: { sm: 'center' }, flexWrap: 'wrap' }}
            useFlexGap
          >
            <SearchField
              key={busqueda.key}
              label="Buscar por nombre"
              initialValue={busqueda.inicial}
              onSearch={(nombre) => updateParams({ nombre }, { replace: true })}
            />
            <TextField
              select
              label="Nivel"
              value={params.nivel ?? ''}
              onChange={(event) => updateParams({ nivel: event.target.value })}
              sx={{ minWidth: { sm: 180 } }}
              slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
            >
              <MenuItem value="">Todos</MenuItem>
              {NIVELES_CURSO.map((valor) => (
                <MenuItem key={valor} value={valor}>
                  {valor}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Estado"
              value={params.estado ?? ''}
              onChange={(event) => updateParams({ estado: event.target.value })}
              sx={{ minWidth: { sm: 180 } }}
              slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
            >
              <MenuItem value="">Todos</MenuItem>
              {ESTADOS_CURSO.map((valor) => (
                <MenuItem key={valor} value={valor}>
                  {ETIQUETA_ESTADO_CURSO[valor]}
                </MenuItem>
              ))}
            </TextField>
            {params.nombre && (
              <Chip
                label={`Nombre: ${params.nombre}`}
                onDelete={() => {
                  updateParams({ nombre: null })
                  reiniciarBusqueda()
                }}
                sx={{ alignSelf: { xs: 'flex-start', sm: 'center' } }}
              />
            )}
            {params.nivel && (
              <Chip
                label={`Nivel: ${params.nivel}`}
                onDelete={() => updateParams({ nivel: null })}
                sx={{ alignSelf: { xs: 'flex-start', sm: 'center' } }}
              />
            )}
            {params.estado && (
              <Chip
                label={`Estado: ${ETIQUETA_ESTADO_CURSO[params.estado]}`}
                onDelete={() => updateParams({ estado: null })}
                sx={{ alignSelf: { xs: 'flex-start', sm: 'center' } }}
              />
            )}
            {hayFiltros && (
              <Button onClick={limpiarFiltros} sx={{ alignSelf: { xs: 'flex-start', sm: 'center' }, minHeight: 44 }}>
                Limpiar filtros
              </Button>
            )}
          </Stack>
        </CardContent>
      </Card>

      <QueryState query={query} skeletonHeight={280}>
        {(data) => (
          <DataTable
            caption="Cursos"
            columns={COLUMNAS}
            rows={data.data}
            getRowId={(curso) => curso.id}
            rowActions={
              esAdmin
                ? (curso) => <CursoRowMenu curso={curso} onEdit={(c) => setFormulario({ curso: c })} onDelete={setAEliminar} />
                : undefined
            }
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
            emptyState={fueraDeRango ? null : vacio}
          />
        )}
      </QueryState>

      {formulario && <CursoFormDialog curso={formulario.curso} onClose={() => setFormulario(null)} />}

      {aEliminar && <EliminarCursoDialog curso={aEliminar} onClose={() => setAEliminar(null)} onDone={despuesDeEliminar} />}
    </>
  )
}
