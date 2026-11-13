import Add from '@mui/icons-material/Add'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import { useMemo, useState } from 'react'
import { ETIQUETA_ROL, TODOS_LOS_ROLES, type Rol } from '../../../shared/config/roles'
import { usePaginaEnRango } from '../../../shared/hooks/usePaginaEnRango'
import { useUrlParams } from '../../../shared/hooks/useUrlParams'
import { DataTable, type DataTableColumn } from '../../../shared/ui/DataTable'
import { EmptyState } from '../../../shared/ui/EmptyState'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { QueryState } from '../../../shared/ui/QueryState'
import { SearchField } from '../../../shared/ui/SearchField'
import { StatusChip } from '../../../shared/ui/StatusChip'
import { useUsuario } from '../../autenticacion'
import { useUsuariosList } from '../api/useUsuarios'
import { CrearUsuarioDialog } from '../components/CrearUsuarioDialog'
import { EditarUsuarioDialog } from '../components/EditarUsuarioDialog'
import { EliminarUsuarioDialog } from '../components/EliminarUsuarioDialog'
import { PersonaVinculada } from '../components/PersonaVinculada'
import { UsuarioRowMenu } from '../components/UsuarioRowMenu'
import { CAMPOS_ORDENABLES, type CampoOrdenable, type CuentaUsuario, type UsuarioListParams } from '../model/types'

const LIMITES = [10, 20, 50]

/** Lee y valida los parámetros de la URL: un valor inválido (enlace editado a mano) cae al valor por defecto. */
function leerParametros(searchParams: URLSearchParams): UsuarioListParams {
  const page = Number(searchParams.get('page'))
  const limit = Number(searchParams.get('limit'))
  const sortBy = searchParams.get('sortBy')
  const order = searchParams.get('order')
  const rol = searchParams.get('rol')
  const q = searchParams.get('q')?.trim()

  return {
    page: Number.isInteger(page) && page >= 1 ? page : 1,
    limit: LIMITES.includes(limit) ? limit : 20,
    sortBy: CAMPOS_ORDENABLES.includes(sortBy as CampoOrdenable) ? (sortBy as CampoOrdenable) : 'email',
    order: order === 'desc' ? 'desc' : 'asc',
    rol: TODOS_LOS_ROLES.includes(rol as Rol) ? (rol as Rol) : undefined,
    q: q || undefined,
  }
}

export function UsuariosListPage() {
  const sesion = useUsuario()
  const [searchParams, updateParams] = useUrlParams()
  const params = useMemo(() => leerParametros(searchParams), [searchParams])
  const query = useUsuariosList(params)
  const fueraDeRango = usePaginaEnRango(query.data?.meta, query.data?.data.length, updateParams)

  const [creando, setCreando] = useState(false)
  const [aEditar, setAEditar] = useState<CuentaUsuario | null>(null)
  const [aEliminar, setAEliminar] = useState<CuentaUsuario | null>(null)

  const total = query.data?.meta.total

  // SearchField guarda su propio texto: se reinicia cambiando su `key` (al limpiar filtros).
  const [busqueda, setBusqueda] = useState({ key: 0, inicial: params.q ?? '' })
  const hayFiltros = params.rol !== undefined || params.q !== undefined
  const limpiarFiltros = () => {
    updateParams({ rol: null, q: null })
    setBusqueda((actual) => ({ key: actual.key + 1, inicial: '' }))
  }

  // Si se borró la única fila de la última página, retrocede una página en lugar de mostrar una vacía.
  const filasEnPagina = query.data?.data.length ?? 0
  const despuesDeEliminar = () => {
    setAEliminar(null)
    if (filasEnPagina === 1 && params.page > 1) updateParams({ page: params.page - 1 })
  }

  const columnas: DataTableColumn<CuentaUsuario>[] = [
    {
      id: 'email',
      header: 'Email',
      sortField: 'email',
      primary: true,
      render: (u) => (
        <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', overflowWrap: 'anywhere' }}>
          {u.email}
          {u.id === sesion.id && <Chip size="small" label="Tu cuenta" />}
        </Box>
      ),
    },
    { id: 'rol', header: 'Rol', sortField: 'rol', render: (u) => ETIQUETA_ROL[u.rol] },
    { id: 'vinculo', header: 'Vinculado a', render: (u) => <PersonaVinculada usuario={u} /> },
    { id: 'activo', header: 'Estado', render: (u) => <StatusChip estado={u.activo ? 'ACTIVO' : 'INACTIVO'} /> },
  ]

  const vacio = hayFiltros ? (
    <EmptyState
      title="No hay usuarios que coincidan"
      description="Prueba con otro texto u otro rol, o quita los filtros."
      action={<Button onClick={limpiarFiltros}>Limpiar filtros</Button>}
    />
  ) : (
    <EmptyState title="Aún no hay usuarios" description="Crea una cuenta para que alguien pueda iniciar sesión." />
  )

  return (
    <>
      <PageHeader
        title="Usuarios"
        subtitle={
          // role="status": el lector de pantalla anuncia el nuevo total al filtrar.
          <span role="status">{total === undefined ? 'Cargando…' : `${total} ${total === 1 ? 'usuario' : 'usuarios'}`}</span>
        }
        actions={
          <Button variant="contained" startIcon={<Add />} onClick={() => setCreando(true)} sx={{ minHeight: 44 }}>
            Nuevo usuario
          </Button>
        }
      />

      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ alignItems: { sm: 'center' } }}>
            <SearchField
              key={busqueda.key}
              label="Buscar"
              placeholder="Email de la cuenta"
              delayMs={300}
              initialValue={busqueda.inicial}
              onSearch={(texto) => updateParams({ q: texto }, { replace: true })}
            />
            <TextField
              select
              label="Rol"
              value={params.rol ?? ''}
              onChange={(event) => updateParams({ rol: event.target.value })}
              sx={{ minWidth: { sm: 200 } }}
              slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
            >
              <MenuItem value="">Todos</MenuItem>
              {TODOS_LOS_ROLES.map((valor) => (
                <MenuItem key={valor} value={valor}>
                  {ETIQUETA_ROL[valor]}
                </MenuItem>
              ))}
            </TextField>
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
            caption="Usuarios"
            columns={columnas}
            rows={data.data}
            getRowId={(cuenta) => cuenta.id}
            rowActions={(cuenta) => (
              <UsuarioRowMenu cuenta={cuenta} esPropia={cuenta.id === sesion.id} onEdit={setAEditar} onDelete={setAEliminar} />
            )}
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

      {creando && <CrearUsuarioDialog onClose={() => setCreando(false)} />}
      {aEditar && <EditarUsuarioDialog cuenta={aEditar} esPropia={aEditar.id === sesion.id} onClose={() => setAEditar(null)} />}
      {aEliminar && <EliminarUsuarioDialog cuenta={aEliminar} onClose={() => setAEliminar(null)} onDone={despuesDeEliminar} />}
    </>
  )
}
