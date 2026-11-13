import Add from '@mui/icons-material/Add'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import MuiLink from '@mui/material/Link'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import { useMemo, useState } from 'react'
import { Link as RouterLink } from 'react-router'
import { usePaginaEnRango } from '../../../shared/hooks/usePaginaEnRango'
import { useUrlParams } from '../../../shared/hooks/useUrlParams'
import { formatFecha } from '../../../shared/lib/format'
import { DataTable, type DataTableColumn } from '../../../shared/ui/DataTable'
import { EmptyState } from '../../../shared/ui/EmptyState'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { QueryState } from '../../../shared/ui/QueryState'
import { StatusChip } from '../../../shared/ui/StatusChip'
import { useUsuario } from '../../autenticacion'
import { CursoSelect } from '../../cursos'
import { EstudianteSelect } from '../../estudiantes'
import { PeriodoSelect } from '../../periodos-academicos'
import { useInscripcionesList } from '../api/useInscripciones'
import { CambiarEstadoDialog } from '../components/CambiarEstadoDialog'
import { EliminarInscripcionDialog } from '../components/EliminarInscripcionDialog'
import { InscripcionFormDialog } from '../components/InscripcionFormDialog'
import { InscripcionRowMenu } from '../components/InscripcionRowMenu'
import { nombreCurso } from '../model/etiquetas'
import {
  CAMPOS_ORDENABLES,
  ESTADOS_INSCRIPCION,
  ETIQUETA_ESTADO_INSCRIPCION,
  type CampoOrdenable,
  type EstadoInscripcion,
  type Inscripcion,
  type InscripcionListParams,
} from '../model/types'

const LIMITES = [10, 20, 50]

function entero(valor: string | null): number | undefined {
  const numero = Number(valor)
  return valor !== null && Number.isInteger(numero) && numero >= 1 ? numero : undefined
}

/** Lee y valida los parámetros de la URL: un valor inválido (enlace editado a mano) cae al valor por defecto. */
function leerParametros(searchParams: URLSearchParams): InscripcionListParams {
  const limit = Number(searchParams.get('limit'))
  const sortBy = searchParams.get('sortBy')
  const estado = searchParams.get('estado')
  const ordenValido = CAMPOS_ORDENABLES.includes(sortBy as CampoOrdenable)
  const order = searchParams.get('order')

  return {
    page: entero(searchParams.get('page')) ?? 1,
    limit: LIMITES.includes(limit) ? limit : 20,
    // Sin orden en la URL: las inscripciones más recientes primero.
    sortBy: ordenValido ? (sortBy as CampoOrdenable) : 'fechaInscripcion',
    order: order === 'asc' || order === 'desc' ? order : ordenValido ? 'asc' : 'desc',
    estudianteId: entero(searchParams.get('estudianteId')),
    cursoId: entero(searchParams.get('cursoId')),
    periodoAcademicoId: entero(searchParams.get('periodoAcademicoId')),
    estado: ESTADOS_INSCRIPCION.includes(estado as EstadoInscripcion) ? (estado as EstadoInscripcion) : undefined,
  }
}

interface InscripcionesListPageProps {
  /** "gestion" = /inscripciones; "mias" = /mi/inscripciones (ESTUDIANTE, solo lectura). */
  modo: 'gestion' | 'mias'
}

export function InscripcionesListPage({ modo }: InscripcionesListPageProps) {
  const usuario = useUsuario()
  const esAdmin = usuario.rol === 'ADMIN' && modo === 'gestion'
  // El estudiante solo ve las suyas: no aplica filtrar por persona, y la API le niega el listado de estudiantes.
  const veOtrosEstudiantes = usuario.rol !== 'ESTUDIANTE'
  const puedeAbrirFicha = usuario.rol === 'ADMIN' || usuario.rol === 'DOCENTE'

  const [searchParams, updateParams] = useUrlParams()
  const params = useMemo(() => leerParametros(searchParams), [searchParams])
  const query = useInscripcionesList(params)
  const fueraDeRango = usePaginaEnRango(query.data?.meta, query.data?.data.length, updateParams)

  const [creando, setCreando] = useState(false)
  const [cambio, setCambio] = useState<{ inscripcion: Inscripcion; estado: EstadoInscripcion } | null>(null)
  const [aEliminar, setAEliminar] = useState<Inscripcion | null>(null)

  const hayFiltros =
    params.estudianteId !== undefined ||
    params.cursoId !== undefined ||
    params.periodoAcademicoId !== undefined ||
    params.estado !== undefined
  const limpiarFiltros = () => updateParams({ estudianteId: null, cursoId: null, periodoAcademicoId: null, estado: null })
  const total = query.data?.meta.total
  const titulo = modo === 'gestion' ? 'Inscripciones' : 'Mis inscripciones'

  // Si se borró la única fila de la última página, retrocede una página en lugar de mostrar una vacía.
  const filasEnPagina = query.data?.data.length ?? 0
  const despuesDeEliminar = () => {
    setAEliminar(null)
    if (filasEnPagina === 1 && params.page > 1) updateParams({ page: params.page - 1 })
  }

  const columnas: DataTableColumn<Inscripcion>[] = [
    ...(veOtrosEstudiantes
      ? [
          {
            id: 'estudiante',
            header: 'Estudiante',
            primary: true,
            render: (i: Inscripcion) => {
              const nombre = `${i.estudiante.apellidos}, ${i.estudiante.nombres}`
              return puedeAbrirFicha ? (
                <MuiLink component={RouterLink} to={`/estudiantes/${i.estudiante.id}`} sx={{ fontWeight: 600 }}>
                  {nombre}
                </MuiLink>
              ) : (
                nombre
              )
            },
          },
        ]
      : []),
    {
      id: 'curso',
      header: 'Curso',
      primary: !veOtrosEstudiantes,
      render: (i) => (
        <MuiLink component={RouterLink} to={`/cursos/${i.curso.id}`}>
          {nombreCurso(i.curso)}
        </MuiLink>
      ),
    },
    { id: 'periodo', header: 'Gestión', render: (i) => i.periodoAcademico.nombre },
    { id: 'fecha', header: 'Fecha de inscripción', sortField: 'fechaInscripcion', render: (i) => formatFecha(i.fechaInscripcion) },
    { id: 'estado', header: 'Estado', sortField: 'estado', render: (i) => <StatusChip estado={i.estado} /> },
  ]

  const vacio = hayFiltros ? (
    <EmptyState
      title="No hay inscripciones con estos filtros"
      description="Prueba con otros filtros o quítalos."
      action={<Button onClick={limpiarFiltros}>Limpiar filtros</Button>}
    />
  ) : (
    <EmptyState
      title={modo === 'gestion' ? 'Aún no hay inscripciones' : 'Todavía no tienes inscripciones'}
      description={esAdmin ? 'Registra la primera para que el estudiante pueda recibir calificaciones.' : 'Cuando se registren inscripciones, aparecerán aquí.'}
      action={
        esAdmin ? (
          <Button variant="contained" startIcon={<Add />} onClick={() => setCreando(true)}>
            Crear la primera
          </Button>
        ) : undefined
      }
    />
  )

  return (
    <>
      <PageHeader
        title={titulo}
        modulo="inscripciones"
        subtitle={
          // role="status": el lector de pantalla anuncia el nuevo total al filtrar.
          <span role="status">{total === undefined ? 'Cargando…' : `${total} ${total === 1 ? 'inscripción' : 'inscripciones'}`}</span>
        }
        actions={
          esAdmin && (
            <Button variant="contained" startIcon={<Add />} onClick={() => setCreando(true)} sx={{ minHeight: 44 }}>
              Nueva inscripción
            </Button>
          )
        }
      />

      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
          <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(4, 1fr)' } }}>
            {veOtrosEstudiantes && (
              <EstudianteSelect value={params.estudianteId ?? null} onChange={(id) => updateParams({ estudianteId: id })} />
            )}
            {veOtrosEstudiantes && <CursoSelect value={params.cursoId ?? null} onChange={(id) => updateParams({ cursoId: id })} />}
            <PeriodoSelect
              label="Gestión"
              value={params.periodoAcademicoId ?? null}
              onChange={(id) => updateParams({ periodoAcademicoId: id })}
            />
            <TextField
              select
              label="Estado"
              value={params.estado ?? ''}
              onChange={(event) => updateParams({ estado: event.target.value })}
              slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
            >
              <MenuItem value="">Todos</MenuItem>
              {ESTADOS_INSCRIPCION.map((valor) => (
                <MenuItem key={valor} value={valor}>
                  {ETIQUETA_ESTADO_INSCRIPCION[valor]}
                </MenuItem>
              ))}
            </TextField>
          </Box>
          {hayFiltros && (
            <Button onClick={limpiarFiltros} sx={{ mt: 1, minHeight: 44 }}>
              Limpiar filtros
            </Button>
          )}
        </CardContent>
      </Card>

      <QueryState query={query} skeletonHeight={280}>
        {(data) => (
          <DataTable
            caption={titulo}
            columns={columnas}
            rows={data.data}
            getRowId={(inscripcion) => inscripcion.id}
            rowActions={
              esAdmin
                ? (inscripcion) => (
                    <InscripcionRowMenu
                      inscripcion={inscripcion}
                      onCambiarEstado={(i, estado) => setCambio({ inscripcion: i, estado })}
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

      {creando && <InscripcionFormDialog onClose={() => setCreando(false)} />}
      {cambio && <CambiarEstadoDialog inscripcion={cambio.inscripcion} estado={cambio.estado} onClose={() => setCambio(null)} />}
      {aEliminar && <EliminarInscripcionDialog inscripcion={aEliminar} onClose={() => setAEliminar(null)} onDone={despuesDeEliminar} />}
    </>
  )
}
