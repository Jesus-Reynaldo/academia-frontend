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
import { usePaginaEnRango } from '../../../shared/hooks/usePaginaEnRango'
import { useUrlParams } from '../../../shared/hooks/useUrlParams'
import { DataTable, type DataTableColumn } from '../../../shared/ui/DataTable'
import { EmptyState } from '../../../shared/ui/EmptyState'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { QueryState } from '../../../shared/ui/QueryState'
import { SearchField } from '../../../shared/ui/SearchField'
import { StatusChip } from '../../../shared/ui/StatusChip'
import { useUsuario } from '../../autenticacion'
import { useEstudiantesList } from '../api/useEstudiantes'
import { EliminarEstudianteDialog } from '../components/EliminarEstudianteDialog'
import { EstudianteFormDialog } from '../components/EstudianteFormDialog'
import { EstudianteRowMenu } from '../components/EstudianteRowMenu'
import {
  CAMPOS_ORDENABLES,
  ESTADOS_ESTUDIANTE,
  ETIQUETA_ESTADO_ESTUDIANTE,
  type CampoOrdenable,
  type EstadoEstudiante,
  type Estudiante,
  type EstudianteListParams,
} from '../model/types'

const LIMITES = [10, 20, 50]

/** Lee y valida los parámetros de la URL: un valor inválido (enlace editado a mano) cae al valor por defecto. */
function leerParametros(searchParams: URLSearchParams): EstudianteListParams {
  const page = Number(searchParams.get('page'))
  const limit = Number(searchParams.get('limit'))
  const sortBy = searchParams.get('sortBy')
  const order = searchParams.get('order')
  const estado = searchParams.get('estado')
  const q = searchParams.get('q')?.trim()

  return {
    page: Number.isInteger(page) && page >= 1 ? page : 1,
    limit: LIMITES.includes(limit) ? limit : 20,
    sortBy: CAMPOS_ORDENABLES.includes(sortBy as CampoOrdenable) ? (sortBy as CampoOrdenable) : 'apellidos',
    order: order === 'desc' ? 'desc' : 'asc',
    estado: ESTADOS_ESTUDIANTE.includes(estado as EstadoEstudiante) ? (estado as EstadoEstudiante) : undefined,
    q: q || undefined,
  }
}

const COLUMNAS: DataTableColumn<Estudiante>[] = [
  { id: 'codigo', header: 'Código', sortField: 'codigo', render: (e) => e.codigo },
  {
    id: 'nombre',
    header: 'Nombre completo',
    sortField: 'apellidos',
    primary: true,
    render: (e) => (
      <MuiLink component={RouterLink} to={`/estudiantes/${e.id}`} sx={{ fontWeight: 600 }}>
        {`${e.apellidos}, ${e.nombres}`}
      </MuiLink>
    ),
  },
  { id: 'documento', header: 'Documento', sortField: 'documento', render: (e) => e.documento },
  { id: 'email', header: 'Email', sortField: 'email', render: (e) => e.email ?? '—' },
  { id: 'estado', header: 'Estado', sortField: 'estado', render: (e) => <StatusChip estado={e.estado} /> },
]

export function EstudiantesListPage() {
  const usuario = useUsuario()
  const esAdmin = usuario.rol === 'ADMIN'

  const [searchParams, updateParams] = useUrlParams()
  const params = useMemo(() => leerParametros(searchParams), [searchParams])
  const query = useEstudiantesList(params)
  const fueraDeRango = usePaginaEnRango(query.data?.meta, query.data?.data.length, updateParams)

  // `formulario`: null = cerrado; { estudiante: null } = alta; { estudiante } = edición.
  const [formulario, setFormulario] = useState<{ estudiante: Estudiante | null } | null>(null)
  const [aEliminar, setAEliminar] = useState<Estudiante | null>(null)

  // SearchField guarda su propio texto: se reinicia cambiando su `key` (al limpiar filtros).
  const [busqueda, setBusqueda] = useState({ key: 0, inicial: params.q ?? '' })
  const reiniciarBusqueda = () => setBusqueda((actual) => ({ key: actual.key + 1, inicial: '' }))

  const hayFiltros = params.estado !== undefined || params.q !== undefined
  const limpiarFiltros = () => {
    updateParams({ estado: null, q: null })
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
      title="No hay estudiantes con estos filtros"
      description="Prueba con otro texto o estado, o quita los filtros."
      action={<Button onClick={limpiarFiltros}>Limpiar filtros</Button>}
    />
  ) : (
    <EmptyState
      title="Aún no hay estudiantes"
      description={esAdmin ? 'Registra el primero para poder inscribirlo a un curso.' : 'Cuando el administrador registre estudiantes, aparecerán aquí.'}
      action={
        esAdmin ? (
          <Button variant="contained" startIcon={<Add />} onClick={() => setFormulario({ estudiante: null })}>
            Crear el primero
          </Button>
        ) : undefined
      }
    />
  )

  return (
    <>
      <PageHeader
        title="Estudiantes"
        subtitle={
          // role="status": el lector de pantalla anuncia el nuevo total al filtrar.
          <span role="status">{total === undefined ? 'Cargando…' : `${total} ${total === 1 ? 'estudiante' : 'estudiantes'}`}</span>
        }
        actions={
          esAdmin && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setFormulario({ estudiante: null })}
              sx={{ minHeight: 44 }}
            >
              Nuevo estudiante
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
              label="Buscar"
              placeholder="Nombre, código o documento"
              delayMs={300}
              initialValue={busqueda.inicial}
              onSearch={(q) => updateParams({ q }, { replace: true })}
            />
            <TextField
              select
              label="Estado"
              value={params.estado ?? ''}
              onChange={(event) => updateParams({ estado: event.target.value })}
              sx={{ minWidth: { sm: 180 } }}
              slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
            >
              <MenuItem value="">Todos</MenuItem>
              {ESTADOS_ESTUDIANTE.map((valor) => (
                <MenuItem key={valor} value={valor}>
                  {ETIQUETA_ESTADO_ESTUDIANTE[valor]}
                </MenuItem>
              ))}
            </TextField>
            {params.q && (
              <Chip
                label={`Búsqueda: ${params.q}`}
                onDelete={() => {
                  updateParams({ q: null })
                  reiniciarBusqueda()
                }}
                sx={{ alignSelf: { xs: 'flex-start', sm: 'center' } }}
              />
            )}
            {params.estado && (
              <Chip
                label={`Estado: ${ETIQUETA_ESTADO_ESTUDIANTE[params.estado]}`}
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
            caption="Estudiantes"
            columns={COLUMNAS}
            rows={data.data}
            getRowId={(estudiante) => estudiante.id}
            rowActions={
              esAdmin
                ? (estudiante) => (
                    <EstudianteRowMenu
                      estudiante={estudiante}
                      onEdit={(e) => setFormulario({ estudiante: e })}
                      onDelete={setAEliminar}
                    />
                  )
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

      {formulario && <EstudianteFormDialog estudiante={formulario.estudiante} onClose={() => setFormulario(null)} />}

      {aEliminar && (
        <EliminarEstudianteDialog estudiante={aEliminar} onClose={() => setAEliminar(null)} onDone={despuesDeEliminar} />
      )}
    </>
  )
}
