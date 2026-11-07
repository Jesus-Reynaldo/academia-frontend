import Add from '@mui/icons-material/Add'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import { useEffect, useMemo, useState } from 'react'
import { ApiError, friendlyMessage } from '../../../shared/api/errors'
import type { Paginated } from '../../../shared/api/pagination'
import { useUrlParams } from '../../../shared/hooks/useUrlParams'
import { formatFecha } from '../../../shared/lib/format'
import { useNotify } from '../../../shared/notifications/notifications-context'
import { colors } from '../../../shared/theme/tokens'
import { ConfirmDialog } from '../../../shared/ui/ConfirmDialog'
import { DataTable, type DataTableColumn } from '../../../shared/ui/DataTable'
import { EmptyState } from '../../../shared/ui/EmptyState'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { QueryState } from '../../../shared/ui/QueryState'
import { StatusChip } from '../../../shared/ui/StatusChip'
import { useUsuario } from '../../autenticacion'
import { useEliminarPeriodo, usePeriodosList } from '../api/usePeriodos'
import { PeriodoFormDialog } from '../components/PeriodoFormDialog'
import { PeriodoRowMenu } from '../components/PeriodoRowMenu'
import { duracionEnDias } from '../model/schema'
import {
  CAMPOS_ORDENABLES,
  ESTADOS_PERIODO,
  ETIQUETA_ESTADO_PERIODO,
  type CampoOrdenable,
  type EstadoPeriodo,
  type PeriodoAcademico,
  type PeriodoListParams,
} from '../model/types'

const LIMITES = [10, 20, 50]

/** Lee y valida los parámetros de la URL: un valor inválido (enlace editado a mano) cae al valor por defecto. */
function leerParametros(searchParams: URLSearchParams): PeriodoListParams {
  const page = Number(searchParams.get('page'))
  const limit = Number(searchParams.get('limit'))
  const sortBy = searchParams.get('sortBy')
  const order = searchParams.get('order')
  const estado = searchParams.get('estado')
  const ordenValido = CAMPOS_ORDENABLES.includes(sortBy as CampoOrdenable)

  return {
    page: Number.isInteger(page) && page >= 1 ? page : 1,
    limit: LIMITES.includes(limit) ? limit : 20,
    // Sin orden en la URL: los períodos más recientes primero.
    sortBy: ordenValido ? (sortBy as CampoOrdenable) : 'fechaInicio',
    order: order === 'asc' || order === 'desc' ? order : ordenValido ? 'asc' : 'desc',
    estado: ESTADOS_PERIODO.includes(estado as EstadoPeriodo) ? (estado as EstadoPeriodo) : undefined,
  }
}

function textoDuracion(periodo: PeriodoAcademico): string {
  const dias = duracionEnDias(periodo.fechaInicio, periodo.fechaFin)
  if (dias === null) return '—'
  return `${dias} ${dias === 1 ? 'día' : 'días'}`
}

const COLUMNAS: DataTableColumn<PeriodoAcademico>[] = [
  {
    id: 'nombre',
    header: 'Nombre',
    sortField: 'nombre',
    primary: true,
    render: (p) => p.nombre,
  },
  {
    id: 'inicio',
    header: 'Inicio',
    sortField: 'fechaInicio',
    render: (p) => formatFecha(p.fechaInicio),
  },
  {
    id: 'fin',
    header: 'Fin',
    sortField: 'fechaFin',
    render: (p) => formatFecha(p.fechaFin),
  },
  { id: 'duracion', header: 'Duración', render: textoDuracion },
  {
    id: 'estado',
    header: 'Estado',
    sortField: 'estado',
    render: (p) => <StatusChip estado={p.estado} />,
  },
]

/** El período activo se resalta, además del chip, para ubicarlo de un vistazo. */
function estiloFila(periodo: PeriodoAcademico) {
  if (periodo.estado !== 'ACTIVO') return {}
  return {
    bgcolor: colors.primary.tint,
    borderColor: colors.primary.main,
    '& > th:first-of-type, & > td:first-of-type': {
      boxShadow: `inset 3px 0 0 ${colors.primary.main}`,
    },
  }
}

interface ErrorEliminar {
  mensaje: string
  /** true si reintentar no sirve (conflicto o falta de permiso): se oculta el botón Eliminar. */
  bloqueado: boolean
}

/** Traduce el error de DELETE a un mensaje que el usuario pueda leer y a una acción siguiente. */
function describirErrorEliminar(error: unknown): ErrorEliminar {
  if (error instanceof ApiError) {
    if (error.status === 409) {
      return {
        mensaje: `${error.messages.join(' ')} Cambia su estado a Finalizado en lugar de eliminarlo.`,
        bloqueado: true,
      }
    }
    if (error.status === 403 || error.status === 404) return { mensaje: friendlyMessage(error), bloqueado: true }
    if (error.status >= 500) {
      return {
        mensaje:
          'El servidor no pudo eliminar el período. Es probable que tenga inscripciones asociadas: cambia su estado a Finalizado en lugar de eliminarlo.',
        bloqueado: false,
      }
    }
  }
  return { mensaje: friendlyMessage(error), bloqueado: false }
}

export function PeriodosListPage() {
  const usuario = useUsuario()
  const esAdmin = usuario.rol === 'ADMIN'
  const notify = useNotify()

  const [searchParams, updateParams] = useUrlParams()
  const params = useMemo(() => leerParametros(searchParams), [searchParams])
  const query = usePeriodosList(params)

  // `formulario`: null = cerrado; { periodo: null } = alta; { periodo } = edición.
  const [formulario, setFormulario] = useState<{
    periodo: PeriodoAcademico | null
  } | null>(null)
  const [aEliminar, setAEliminar] = useState<PeriodoAcademico | null>(null)
  const [errorEliminar, setErrorEliminar] = useState<ErrorEliminar | null>(null)
  const eliminar = useEliminarPeriodo()

  const hayFiltros = params.estado !== undefined
  const limpiarFiltros = () => updateParams({ estado: null })
  const total = query.data?.meta.total

  const cerrarEliminar = () => {
    setAEliminar(null)
    setErrorEliminar(null)
  }

  const confirmarEliminar = () => {
    if (!aEliminar) return
    const periodo = aEliminar
    const filasEnPagina = query.data?.data.length ?? 0
    setErrorEliminar(null)
    eliminar.mutate(periodo.id, {
      onSuccess: (resultado) => {
        if (resultado.tipo === 'desactivado') {
          notify(`Se desactivó «${periodo.nombre}» porque tiene registros asociados.`, 'info')
        } else {
          notify(`Se eliminó «${periodo.nombre}».`)
        }
        cerrarEliminar()
        // Si era la única fila de la última página, retrocede una página en lugar de mostrar una vacía.
        if (filasEnPagina === 1 && params.page > 1) updateParams({ page: params.page - 1 })
      },
      onError: (error) => setErrorEliminar(describirErrorEliminar(error)),
    })
  }

  const vacio = hayFiltros ? (
    <EmptyState
      title="No hay períodos con estos filtros"
      description="Prueba con otro estado o quita los filtros."
      action={<Button onClick={limpiarFiltros}>Limpiar filtros</Button>}
    />
  ) : (
    <EmptyState
      title="Aún no hay períodos académicos"
      description={
        esAdmin
          ? 'Crea el primero para poder inscribir estudiantes.'
          : 'Cuando el administrador cree períodos, aparecerán aquí.'
      }
      action={
        esAdmin ? (
          <Button variant="contained" startIcon={<Add />} onClick={() => setFormulario({ periodo: null })}>
            Crear el primero
          </Button>
        ) : undefined
      }
    />
  )

  return (
    <>
      <PageHeader
        title="Períodos académicos"
        subtitle={
          // role="status": el lector de pantalla anuncia el nuevo total al filtrar.
          <span role="status">
            {total === undefined ? 'Cargando…' : `${total} ${total === 1 ? 'período' : 'períodos'}`}
          </span>
        }
        actions={
          esAdmin && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setFormulario({ periodo: null })}
              sx={{ minHeight: 44 }}
            >
              Nuevo período
            </Button>
          )
        }
      />

      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ alignItems: { sm: 'center' } }}>
            <TextField
              select
              label="Estado"
              value={params.estado ?? ''}
              onChange={(event) => updateParams({ estado: event.target.value })}
              sx={{ minWidth: { sm: 200 } }}
              slotProps={{
                select: { displayEmpty: true },
                inputLabel: { shrink: true },
              }}
            >
              <MenuItem value="">Todos</MenuItem>
              {ESTADOS_PERIODO.map((valor) => (
                <MenuItem key={valor} value={valor}>
                  {ETIQUETA_ESTADO_PERIODO[valor]}
                </MenuItem>
              ))}
            </TextField>
            {params.estado && (
              <Chip
                label={`Estado: ${ETIQUETA_ESTADO_PERIODO[params.estado]}`}
                onDelete={() => updateParams({ estado: null })}
                sx={{ alignSelf: { xs: 'flex-start', sm: 'center' } }}
              />
            )}
            {hayFiltros && (
              <Button
                onClick={limpiarFiltros}
                sx={{
                  alignSelf: { xs: 'flex-start', sm: 'center' },
                  minHeight: 44,
                }}
              >
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
            onEdit={(periodo) => setFormulario({ periodo })}
            onDelete={(periodo) => {
              setErrorEliminar(null)
              setAEliminar(periodo)
            }}
          />
        )}
      </QueryState>

      {formulario && <PeriodoFormDialog periodo={formulario.periodo} onClose={() => setFormulario(null)} />}

      <ConfirmDialog
        open={aEliminar !== null}
        title={aEliminar ? `¿Eliminar «${aEliminar.nombre}»?` : ''}
        description="Esta acción no se puede deshacer. Si el período tiene inscripciones, no podrá eliminarse."
        confirmLabel="Eliminar"
        loading={eliminar.isPending}
        hideConfirm={errorEliminar?.bloqueado ?? false}
        onConfirm={confirmarEliminar}
        onClose={cerrarEliminar}
      >
        {errorEliminar && (
          <Alert severity="error" role="alert" sx={{ mt: 2 }}>
            {errorEliminar.mensaje}
          </Alert>
        )}
      </ConfirmDialog>
    </>
  )
}

interface ResultadosProps {
  data: Paginated<PeriodoAcademico>
  params: PeriodoListParams
  esAdmin: boolean
  fetching: boolean
  vacio: React.ReactNode
  onChange: (changes: Record<string, string | number | null>) => void
  onEdit: (periodo: PeriodoAcademico) => void
  onDelete: (periodo: PeriodoAcademico) => void
}

function Resultados({ data, params, esAdmin, fetching, vacio, onChange, onEdit, onDelete }: ResultadosProps) {
  const { meta } = data

  // Un enlace con una página que ya no existe (p. ej. tras borrar) devolvería filas vacías con total > 0:
  // se lleva al usuario a la última página real en vez de mostrar "no hay datos".
  const paginaFueraDeRango = data.data.length === 0 && meta.total > 0 && meta.totalPages > 0
  useEffect(() => {
    if (paginaFueraDeRango) onChange({ page: meta.totalPages })
  }, [paginaFueraDeRango, meta.totalPages, onChange])

  return (
    <DataTable
      caption="Períodos académicos"
      columns={COLUMNAS}
      rows={data.data}
      getRowId={(periodo) => periodo.id}
      getRowSx={estiloFila}
      rowActions={
        esAdmin ? (periodo) => <PeriodoRowMenu periodo={periodo} onEdit={onEdit} onDelete={onDelete} /> : undefined
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
