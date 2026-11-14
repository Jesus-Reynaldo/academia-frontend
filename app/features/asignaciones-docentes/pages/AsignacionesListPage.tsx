import Add from '@mui/icons-material/Add'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import MenuItem from '@mui/material/MenuItem'
import MuiLink from '@mui/material/Link'
import TextField from '@mui/material/TextField'
import { useEffect, useMemo, useState } from 'react'
import { Link as RouterLink } from 'react-router'
import type { Paginated } from '../../../shared/api/pagination'
import { useUrlParams } from '../../../shared/hooks/useUrlParams'
import { useDesde, type Desde } from '../../../shared/navegacion/desde'
import { BuscadorUrl } from '../../../shared/ui/BuscadorUrl'
import { DataTable, type DataTableColumn } from '../../../shared/ui/DataTable'
import { EmptyState } from '../../../shared/ui/EmptyState'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { QueryState } from '../../../shared/ui/QueryState'
import { StatusChip } from '../../../shared/ui/StatusChip'
import { useUsuario } from '../../autenticacion'
import { CursoSelect } from '../../cursos'
import { DocenteSelect } from '../../docentes'
import { MateriaSelect } from '../../materias'
import { PeriodoSelect } from '../../periodos-academicos'
import { useAsignacionesList } from '../api/useAsignaciones'
import { AsignacionFormDialog } from '../components/AsignacionFormDialog'
import { AsignacionRowMenu } from '../components/AsignacionRowMenu'
import {
  CAMPOS_ORDENABLES,
  ESTADOS_ASIGNACION,
  ETIQUETA_ESTADO_ASIGNACION,
  nombreDocente,
  type AsignacionDocente,
  type AsignacionListParams,
  type CampoOrdenable,
  type EstadoAsignacion,
} from '../model/types'
import { reporteAsignaciones } from '../reportes/asignacionesPdf'

const LIMITES = [10, 20, 50]

const id = (valor: string | null) => {
  const n = Number(valor)
  return Number.isInteger(n) && n > 0 ? n : undefined
}

function leerParametros(sp: URLSearchParams): AsignacionListParams {
  const page = Number(sp.get('page'))
  const limit = Number(sp.get('limit'))
  const sortBy = sp.get('sortBy')
  const order = sp.get('order')
  const estado = sp.get('estado')
  return {
    page: Number.isInteger(page) && page >= 1 ? page : 1,
    limit: LIMITES.includes(limit) ? limit : 20,
    sortBy: CAMPOS_ORDENABLES.includes(sortBy as CampoOrdenable) ? (sortBy as CampoOrdenable) : undefined,
    order: order === 'desc' ? 'desc' : 'asc',
    estado: ESTADOS_ASIGNACION.includes(estado as EstadoAsignacion) ? (estado as EstadoAsignacion) : undefined,
    q: sp.get('q')?.trim() || undefined,
    docenteId: id(sp.get('docenteId')),
    materiaId: id(sp.get('materiaId')),
    cursoId: id(sp.get('cursoId')),
    periodoAcademicoId: id(sp.get('periodoAcademicoId')),
  }
}

function columnas(esAdmin: boolean, desde: Desde): DataTableColumn<AsignacionDocente>[] {
  const enlace = (to: string, texto: string, negrita = false) => (
    <MuiLink component={RouterLink} to={to} state={{ desde }} sx={{ fontWeight: negrita ? 600 : undefined }}>
      {texto}
    </MuiLink>
  )
  return [
    ...(esAdmin
      ? [{
          id: 'docente',
          header: 'Docente',
          sortField: 'docente',
          primary: true,
          render: (a: AsignacionDocente) => enlace(`/docentes/${a.docente.id}`, nombreDocente(a.docente), true),
        }]
      : []),
    {
      id: 'materia',
      header: 'Materia',
      sortField: 'materia',
      primary: !esAdmin,
      render: (a) => enlace(`/materias/${a.materia.id}`, a.materia.nombre, !esAdmin),
    },
    { id: 'curso', header: 'Curso', sortField: 'curso', render: (a) => enlace(`/cursos/${a.curso.id}`, a.curso.nombre) },
    { id: 'periodo', header: 'Período', sortField: 'periodo', render: (a) => a.periodoAcademico.nombre },
    { id: 'estado', header: 'Estado', sortField: 'estado', render: (a) => <StatusChip estado={a.estado} /> },
  ]
}

/**
 * Asignación docente: qué materia dicta cada docente, en qué curso y en qué período.
 * ADMIN: gestiona (crear, editar, activar/desactivar). DOCENTE: «Mis asignaciones», solo lectura.
 */
export function AsignacionesListPage() {
  const usuario = useUsuario()
  const esAdmin = usuario.rol === 'ADMIN'
  const [searchParams, updateParams] = useUrlParams()
  const params = useMemo(() => leerParametros(searchParams), [searchParams])
  const query = useAsignacionesList(params)
  const { desde } = useDesde(esAdmin ? 'Asignación docente' : 'Mis asignaciones')
  const [formulario, setFormulario] = useState<{ asignacion: AsignacionDocente | null } | null>(null)

  const hayFiltros = Boolean(params.q || params.estado || params.docenteId || params.materiaId || params.cursoId || params.periodoAcademicoId)
  const limpiar = () => updateParams({ q: null, estado: null, docenteId: null, materiaId: null, cursoId: null, periodoAcademicoId: null, page: null })
  const filtro = (campo: string) => (valor: number | null) => updateParams({ [campo]: valor, page: null })
  const total = query.data?.meta.total

  const vacio = hayFiltros ? (
    <EmptyState
      title="No hay asignaciones con estos filtros"
      description="Prueba con otros filtros o quítalos."
      action={<Button onClick={limpiar}>Limpiar filtros</Button>}
    />
  ) : (
    <EmptyState
      title={esAdmin ? 'Aún no hay asignaciones' : 'Aún no tienes materias asignadas'}
      description={
        esAdmin
          ? 'Asigna a cada docente las materias que dictará, en qué curso y en qué período.'
          : 'Cuando el administrador te asigne materias y cursos, aparecerán aquí y podrás registrar sus calificaciones.'
      }
      action={
        esAdmin ? (
          <Button variant="contained" startIcon={<Add />} onClick={() => setFormulario({ asignacion: null })}>
            Crear la primera
          </Button>
        ) : undefined
      }
    />
  )

  return (
    <>
      <PageHeader
        title={esAdmin ? 'Asignación docente' : 'Mis asignaciones'}
        modulo="asignaciones"
        reporte={() => reporteAsignaciones(params, !esAdmin)}
        subtitle={
          <span role="status">
            {total === undefined ? 'Cargando…' : `${total} ${total === 1 ? 'asignación' : 'asignaciones'}`}
          </span>
        }
        actions={
          esAdmin && (
            <Button variant="contained" startIcon={<Add />} onClick={() => setFormulario({ asignacion: null })} sx={{ minHeight: 44 }}>
              Nueva asignación
            </Button>
          )
        }
      />

      {!esAdmin && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Estas son las materias y cursos que el administrador te asignó. Solo verás estos cursos, sus estudiantes y
          estas materias, y solo podrás registrar calificaciones en ellas.
        </Alert>
      )}

      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <BuscadorUrl placeholder={esAdmin ? 'Docente, materia, curso o gestión' : 'Materia, curso o gestión'} minWidth={0} />
            {esAdmin && <DocenteSelect value={params.docenteId ?? null} onChange={filtro('docenteId')} label="Docente" />}
            <PeriodoSelect value={params.periodoAcademicoId ?? null} onChange={filtro('periodoAcademicoId')} label="Período" />
            <CursoSelect value={params.cursoId ?? null} onChange={filtro('cursoId')} label="Curso" />
            <MateriaSelect value={params.materiaId ?? null} onChange={filtro('materiaId')} label="Materia" />
            <TextField
              select
              label="Estado"
              value={params.estado ?? ''}
              onChange={(e) => updateParams({ estado: e.target.value || null, page: null })}
              slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
            >
              <MenuItem value="">Todos</MenuItem>
              {ESTADOS_ASIGNACION.map((valor) => (
                <MenuItem key={valor} value={valor}>
                  {ETIQUETA_ESTADO_ASIGNACION[valor]}
                </MenuItem>
              ))}
            </TextField>
          </div>
          {hayFiltros && (
            <Button onClick={limpiar} sx={{ mt: 1, minHeight: 44 }}>
              Limpiar filtros
            </Button>
          )}
        </CardContent>
      </Card>

      <QueryState query={query} skeletonHeight={280}>
        {(data) => (
          <Resultados
            data={data}
            params={params}
            columnas={columnas(esAdmin, desde)}
            esAdmin={esAdmin}
            fetching={query.isFetching}
            vacio={vacio}
            onChange={updateParams}
            onEdit={(asignacion) => setFormulario({ asignacion })}
          />
        )}
      </QueryState>

      {formulario && (
        <AsignacionFormDialog
          asignacion={formulario.asignacion}
          inicial={{ docenteId: params.docenteId, cursoId: params.cursoId, periodoAcademicoId: params.periodoAcademicoId }}
          onClose={() => setFormulario(null)}
        />
      )}
    </>
  )
}

interface ResultadosProps {
  data: Paginated<AsignacionDocente>
  params: AsignacionListParams
  columnas: DataTableColumn<AsignacionDocente>[]
  esAdmin: boolean
  fetching: boolean
  vacio: React.ReactNode
  onChange: (changes: Record<string, string | number | null>) => void
  onEdit: (a: AsignacionDocente) => void
}

function Resultados({ data, params, columnas, esAdmin, fetching, vacio, onChange, onEdit }: ResultadosProps) {
  const { meta } = data
  const paginaFueraDeRango = data.data.length === 0 && meta.total > 0 && meta.totalPages > 0
  useEffect(() => {
    if (paginaFueraDeRango) onChange({ page: meta.totalPages })
  }, [paginaFueraDeRango, meta.totalPages, onChange])

  return (
    <DataTable
      caption={esAdmin ? 'Asignaciones docentes' : 'Mis asignaciones'}
      columns={columnas}
      rows={data.data}
      getRowId={(a) => a.id}
      getRowSx={(a) => (a.estado === 'INACTIVA' ? { opacity: 0.7 } : {})}
      rowActions={esAdmin ? (a) => <AsignacionRowMenu asignacion={a} onEdit={onEdit} /> : undefined}
      sort={{ sortBy: params.sortBy ?? '', order: params.order }}
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
