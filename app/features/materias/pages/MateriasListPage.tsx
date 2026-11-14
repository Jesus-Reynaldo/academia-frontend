import Add from '@mui/icons-material/Add'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import MenuItem from '@mui/material/MenuItem'
import MuiLink from '@mui/material/Link'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import { useEffect, useMemo, useState } from 'react'
import { Link as RouterLink } from 'react-router'
import type { Paginated } from '../../../shared/api/pagination'
import { useUrlParams } from '../../../shared/hooks/useUrlParams'
import { DataTable, type DataTableColumn } from '../../../shared/ui/DataTable'
import { EmptyState } from '../../../shared/ui/EmptyState'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { QueryState } from '../../../shared/ui/QueryState'
import { SearchField } from '../../../shared/ui/SearchField'
import { StatusChip } from '../../../shared/ui/StatusChip'
import { useUsuario } from '../../autenticacion'
import { useMateriasList } from '../api/useMaterias'
import { EliminarMateriaDialog } from '../components/EliminarMateriaDialog'
import { MateriaFormDialog } from '../components/MateriaFormDialog'
import { MateriaRowMenu } from '../components/MateriaRowMenu'
import {
  CAMPOS_ORDENABLES,
  ESTADOS_MATERIA,
  ETIQUETA_ESTADO_MATERIA,
  type CampoOrdenable,
  type EstadoMateria,
  type Materia,
  type MateriaListParams,
} from '../model/types'
import { reporteMaterias } from '../reportes/materiasPdf'

const LIMITES = [10, 20, 50]

/** Lee y valida los parámetros de la URL: un valor inválido (enlace editado a mano) cae al valor por defecto. */
function leerParametros(searchParams: URLSearchParams): MateriaListParams {
  const page = Number(searchParams.get('page'))
  const limit = Number(searchParams.get('limit'))
  const sortBy = searchParams.get('sortBy')
  const order = searchParams.get('order')
  const estado = searchParams.get('estado')
  const nombre = searchParams.get('nombre')?.trim()

  return {
    page: Number.isInteger(page) && page >= 1 ? page : 1,
    limit: LIMITES.includes(limit) ? limit : 20,
    sortBy: CAMPOS_ORDENABLES.includes(sortBy as CampoOrdenable) ? (sortBy as CampoOrdenable) : 'nombre',
    order: order === 'asc' || order === 'desc' ? order : 'asc',
    estado: ESTADOS_MATERIA.includes(estado as EstadoMateria) ? (estado as EstadoMateria) : undefined,
    nombre: nombre || undefined,
  }
}

const COLUMNAS: DataTableColumn<Materia>[] = [
  { id: 'codigo', header: 'Código', sortField: 'codigo', render: (m) => m.codigo },
  {
    id: 'nombre',
    header: 'Nombre',
    sortField: 'nombre',
    primary: true,
    render: (m) => (
      <MuiLink component={RouterLink} to={`/materias/${m.id}`} sx={{ fontWeight: 600 }}>
        {m.nombre}
      </MuiLink>
    ),
  },
  {
    id: 'horas',
    header: 'Horas semanales',
    align: 'right',
    render: (m) => (m.horasSemanales ? `${m.horasSemanales} h` : '—'),
  },
  { id: 'estado', header: 'Estado', sortField: 'estado', render: (m) => <StatusChip estado={m.estado} /> },
]

export function MateriasListPage() {
  const usuario = useUsuario()
  const esAdmin = usuario.rol === 'ADMIN'

  const [searchParams, updateParams] = useUrlParams()
  const params = useMemo(() => leerParametros(searchParams), [searchParams])
  const query = useMateriasList(params)

  // `formulario`: null = cerrado; { materia: null } = alta; { materia } = edición.
  const [formulario, setFormulario] = useState<{ materia: Materia | null } | null>(null)
  const [aEliminar, setAEliminar] = useState<Materia | null>(null)
  // El cuadro de búsqueda guarda su propio texto. Para vaciarlo desde fuera (limpiar filtros) se cambia su clave
  // y se le da el valor inicial explícito: la URL puede tardar un instante en actualizarse y no sirve de referencia.
  const [busqueda, setBusqueda] = useState({ key: 0, inicial: params.nombre ?? '' })
  const reiniciarBusqueda = () => setBusqueda((actual) => ({ key: actual.key + 1, inicial: '' }))

  const hayFiltros = params.estado !== undefined || params.nombre !== undefined
  const limpiarFiltros = () => {
    updateParams({ estado: null, nombre: null })
    reiniciarBusqueda()
  }
  const total = query.data?.meta.total

  const vacio = hayFiltros ? (
    <EmptyState
      title="No hay materias con estos filtros"
      description="Prueba con otro nombre o estado, o quita los filtros."
      action={<Button onClick={limpiarFiltros}>Limpiar filtros</Button>}
    />
  ) : (
    <EmptyState
      title="Aún no hay materias"
      description={
        esAdmin
          ? 'Crea la primera para poder registrar calificaciones.'
          : 'Cuando el administrador cree materias, aparecerán aquí.'
      }
      action={
        esAdmin ? (
          <Button variant="contained" startIcon={<Add />} onClick={() => setFormulario({ materia: null })}>
            Crear la primera
          </Button>
        ) : undefined
      }
    />
  )

  return (
    <>
      <PageHeader
        title="Materias"
        modulo="materias"
        reporte={() => reporteMaterias(params)}
        subtitle={
          // role="status": el lector de pantalla anuncia el nuevo total al filtrar.
          <span role="status">
            {total === undefined ? 'Cargando…' : `${total} ${total === 1 ? 'materia' : 'materias'}`}
          </span>
        }
        actions={
          esAdmin && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setFormulario({ materia: null })}
              sx={{ minHeight: 44 }}
            >
              Nueva materia
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
          >
            <SearchField
              key={busqueda.key}
              label="Buscar"
              placeholder="Nombre, código o descripción"
              initialValue={busqueda.inicial}
              onSearch={(nombre) => updateParams({ nombre }, { replace: true })}
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
              {ESTADOS_MATERIA.map((valor) => (
                <MenuItem key={valor} value={valor}>
                  {ETIQUETA_ESTADO_MATERIA[valor]}
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
            {params.estado && (
              <Chip
                label={`Estado: ${ETIQUETA_ESTADO_MATERIA[params.estado]}`}
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
          <Resultados
            data={data}
            params={params}
            esAdmin={esAdmin}
            fetching={query.isFetching}
            vacio={vacio}
            onChange={updateParams}
            onEdit={(materia) => setFormulario({ materia })}
            onDelete={setAEliminar}
          />
        )}
      </QueryState>

      {formulario && <MateriaFormDialog materia={formulario.materia} onClose={() => setFormulario(null)} />}

      {aEliminar && (
        <EliminarMateriaDialog
          materia={aEliminar}
          onClose={() => setAEliminar(null)}
          onDone={() => {
            // Si era la única fila de la última página, retrocede una página en lugar de mostrar una vacía.
            if ((query.data?.data.length ?? 0) === 1 && params.page > 1) updateParams({ page: params.page - 1 })
            setAEliminar(null)
          }}
        />
      )}
    </>
  )
}

interface ResultadosProps {
  data: Paginated<Materia>
  params: MateriaListParams
  esAdmin: boolean
  fetching: boolean
  vacio: React.ReactNode
  onChange: (changes: Record<string, string | number | null>) => void
  onEdit: (materia: Materia) => void
  onDelete: (materia: Materia) => void
}

function Resultados({ data, params, esAdmin, fetching, vacio, onChange, onEdit, onDelete }: ResultadosProps) {
  const { meta } = data

  // Un enlace con una página que ya no existe devolvería filas vacías con total > 0:
  // se lleva al usuario a la última página real en vez de mostrar "no hay datos".
  const paginaFueraDeRango = data.data.length === 0 && meta.total > 0 && meta.totalPages > 0
  useEffect(() => {
    if (paginaFueraDeRango) onChange({ page: meta.totalPages })
  }, [paginaFueraDeRango, meta.totalPages, onChange])

  return (
    <DataTable
      caption="Materias"
      columns={COLUMNAS}
      rows={data.data}
      getRowId={(materia) => materia.id}
      rowActions={
        esAdmin ? (materia) => <MateriaRowMenu materia={materia} onEdit={onEdit} onDelete={onDelete} /> : undefined
      }
      sort={{ sortBy: params.sortBy, order: params.order }}
      onSortChange={(sortBy, order) => onChange({ sortBy, order })}
      pagination={{
        page: meta.page,
        limit: meta.limit,
        total: meta.total,
        limitOptions: LIMITES,
        onPageChange: (page) => onChange({ page: page === 1 ? null : page }),
        onLimitChange: (limit) => onChange({ limit }),
      }}
      fetching={fetching}
      emptyState={paginaFueraDeRango ? null : vacio}
    />
  )
}
