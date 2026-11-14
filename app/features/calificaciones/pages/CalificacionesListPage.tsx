import Add from '@mui/icons-material/Add'
import ArrowBack from '@mui/icons-material/ArrowBack'
import EditOutlined from '@mui/icons-material/EditOutlined'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import { Link as RouterLink } from 'react-router'
import { useEffect, useMemo, useState } from 'react'
import type { Paginated } from '../../../shared/api/pagination'
import { useUrlParams } from '../../../shared/hooks/useUrlParams'
import { formatFecha } from '../../../shared/lib/format'
import { DataTable, type DataTableColumn } from '../../../shared/ui/DataTable'
import { EmptyState } from '../../../shared/ui/EmptyState'
import { GradeBadge } from '../../../shared/ui/GradeBadge'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { QueryState } from '../../../shared/ui/QueryState'
import { useUsuario } from '../../autenticacion'
import { usePeriodosReferencia } from '../../periodos-academicos'
import { useCalificacionesList } from '../api/useCalificaciones'
import { CalificacionFiltros } from '../components/CalificacionFiltros'
import { CalificacionFormDialog } from '../components/CalificacionFormDialog'
import { nombreCurso, nombreDocente, nombreEstudiante } from '../model/etiquetas'
import {
  CAMPOS_ORDENABLES,
  ETIQUETA_TIPO,
  TEXTO_SIN_ELIMINAR,
  TIPOS_EVALUACION,
  type CampoOrdenable,
  type Calificacion,
  type CalificacionListParams,
  type TipoEvaluacion,
} from '../model/types'
import { BuscadorUrl } from '../../../shared/ui/BuscadorUrl'

const LIMITES = [10, 20, 50]

// PASO 1: leer y validar los parámetros de la URL. Un valor inválido (enlace editado a mano) cae al valor por defecto.
function entero(valor: string | null): number | undefined {
  const numero = Number(valor)
  return valor !== null && Number.isInteger(numero) && numero >= 1 ? numero : undefined
}

function fechaUrl(valor: string | null): string | undefined {
  return valor !== null && /^\d{4}-\d{2}-\d{2}$/.test(valor) ? valor : undefined
}

function leerParametros(searchParams: URLSearchParams): CalificacionListParams {
  const limit = Number(searchParams.get('limit'))
  const sortBy = searchParams.get('sortBy')
  const order = searchParams.get('order')
  const tipo = searchParams.get('tipo')
  const ordenValido = CAMPOS_ORDENABLES.includes(sortBy as CampoOrdenable)

  return {
    page: entero(searchParams.get('page')) ?? 1,
    limit: LIMITES.includes(limit) ? limit : 20,
    // Sin orden en la URL: las calificaciones más recientes primero.
    sortBy: ordenValido ? (sortBy as CampoOrdenable) : 'fecha',
    order: order === 'asc' || order === 'desc' ? order : ordenValido ? 'asc' : 'desc',
    materiaId: entero(searchParams.get('materiaId')),
    docenteId: entero(searchParams.get('docenteId')),
    tipo: TIPOS_EVALUACION.includes(tipo as TipoEvaluacion) ? (tipo as TipoEvaluacion) : undefined,
    estudianteId: entero(searchParams.get('estudianteId')),
    cursoId: entero(searchParams.get('cursoId')),
    periodoAcademicoId: entero(searchParams.get('periodoAcademicoId')),
    fechaDesde: fechaUrl(searchParams.get('fechaDesde')),
    fechaHasta: fechaUrl(searchParams.get('fechaHasta')),
    q: searchParams.get('q')?.trim() || undefined,
  }
}

interface CalificacionesListPageProps {
  /** "gestion" = /calificaciones (ADMIN y DOCENTE); "mias" = /mi/calificaciones (DOCENTE y ESTUDIANTE). */
  modo: 'gestion' | 'mias'
}

export function CalificacionesListPage({ modo }: CalificacionesListPageProps) {
  const usuario = useUsuario()
  const esAdmin = usuario.rol === 'ADMIN'
  // El ESTUDIANTE solo lee; ADMIN y DOCENTE registran y editan.
  const puedeEscribir = usuario.rol !== 'ESTUDIANTE'

  const [searchParams, updateParams] = useUrlParams()
  const params = useMemo(() => leerParametros(searchParams), [searchParams])
  const query = useCalificacionesList(params)
  const periodos = usePeriodosReferencia()

  // `formulario`: null = cerrado; { calificacion: null } = alta; { calificacion } = edición.
  // ?nueva=1 (botón «Registrar calificación» del Inicio): el formulario de alta empieza abierto.
  const pideNueva = searchParams.get('nueva') === '1'
  const [formulario, setFormulario] = useState<{ calificacion: Calificacion | null } | null>(() =>
    pideNueva && puedeEscribir ? { calificacion: null } : null,
  )
  // Se quita el parámetro para que recargar o volver no reabra el formulario.
  useEffect(() => {
    if (pideNueva) updateParams({ nueva: null })
  }, [pideNueva, updateParams])

  // PASO 2: filtros activos (cuántos y cómo limpiarlos).
  const filtrosActivos = [
    params.materiaId,
    params.docenteId,
    params.tipo,
    params.estudianteId,
    params.cursoId,
    params.periodoAcademicoId,
    params.fechaDesde,
    params.fechaHasta,
    params.q,
  ].filter((valor) => valor !== undefined).length
  const limpiarFiltros = () =>
    updateParams({
      q: null,
      materiaId: null,
      docenteId: null,
      tipo: null,
      estudianteId: null,
      cursoId: null,
      periodoAcademicoId: null,
      fechaDesde: null,
      fechaHasta: null,
    })

  const total = query.data?.meta.total
  const esEstudiante = usuario.rol === 'ESTUDIANTE'
  const titulo = modo === 'gestion' ? 'Calificaciones' : esEstudiante ? 'Todas mis notas' : 'Mis calificaciones'

  // PASO 3: columnas de la tabla. El período no viene en la calificación: se busca por id en la lista de períodos.
  const nombrePeriodo = (id: number) => periodos.data?.find((periodo) => periodo.id === id)?.nombre

  const todasLasColumnas: DataTableColumn<Calificacion>[] = [
    {
      id: 'estudiante',
      header: 'Estudiante',
      primary: true,
      render: (c) => nombreEstudiante(c.inscripcion.estudiante),
    },
    {
      id: 'curso',
      header: 'Curso',
      render: (c) => {
        const periodo = nombrePeriodo(c.inscripcion.periodoAcademicoId)
        return periodo ? `${nombreCurso(c.inscripcion.curso)} · ${periodo}` : nombreCurso(c.inscripcion.curso)
      },
    },
    { id: 'materia', header: 'Materia', render: (c) => c.materia.nombre },
    { id: 'tipo', header: 'Tipo', sortField: 'tipo', render: (c) => ETIQUETA_TIPO[c.tipo] },
    { id: 'nota', header: 'Nota', sortField: 'nota', render: (c) => <GradeBadge nota={c.nota} /> },
    { id: 'fecha', header: 'Fecha', sortField: 'fecha', render: (c) => formatFecha(c.fecha) },
    { id: 'docente', header: 'Docente', render: (c) => nombreDocente(c.docente) },
  ]
  // El estudiante no necesita una columna con su propio nombre: la materia pasa a ser el título de cada fila.
  const columnas = esEstudiante
    ? todasLasColumnas.filter((c) => c.id !== 'estudiante').map((c) => (c.id === 'materia' ? { ...c, primary: true } : c))
    : todasLasColumnas

  // PASO 4: estado vacío distinto con y sin filtros.
  const vacio =
    filtrosActivos > 0 ? (
      <EmptyState
        title="No hay calificaciones con estos filtros"
        description="Prueba con otros valores o quita los filtros."
        action={<Button onClick={limpiarFiltros}>Limpiar filtros</Button>}
      />
    ) : (
      <EmptyState
        title={puedeEscribir ? 'Aún no hay calificaciones' : 'Aún no tienes calificaciones'}
        description={
          puedeEscribir
            ? 'Registra la primera para empezar el historial.'
            : 'Cuando tus docentes registren notas, aparecerán aquí.'
        }
        action={
          puedeEscribir ? (
            <Button variant="contained" startIcon={<Add />} onClick={() => setFormulario({ calificacion: null })}>
              Registrar la primera
            </Button>
          ) : undefined
        }
      />
    )

  return (
    <>
      {esEstudiante && (
        <Button component={RouterLink} to="/mi/materias" startIcon={<ArrowBack />} sx={{ mb: 1, minHeight: 44 }}>
          Mis materias
        </Button>
      )}
      <PageHeader
        title={titulo}
        modulo="calificaciones"
        subtitle={
          // role="status": el lector de pantalla anuncia el nuevo total al filtrar.
          <span role="status">
            {total === undefined ? 'Cargando…' : `${total} ${total === 1 ? 'calificación' : 'calificaciones'}`}
          </span>
        }
        actions={
          puedeEscribir && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setFormulario({ calificacion: null })}
              sx={{ minHeight: 44 }}
            >
              Registrar calificación
            </Button>
          )
        }
      />

      <div className="mb-3">
        <BuscadorUrl placeholder={esEstudiante ? 'Materia, docente, nota u observación' : 'Estudiante, materia, docente, nota u observación'} />
      </div>

      <CalificacionFiltros
        params={params}
        onChange={updateParams}
        mostrarEstudiante={puedeEscribir}
        mostrarDocente={esAdmin}
        simplificado={esEstudiante}
        cantidadActivos={filtrosActivos}
        onLimpiar={limpiarFiltros}
      />

      <QueryState query={query} skeletonHeight={280}>
        {(data) => (
          <Resultados
            data={data}
            params={params}
            columnas={columnas}
            puedeEscribir={puedeEscribir}
            fetching={query.isFetching}
            vacio={vacio}
            onChange={updateParams}
            onEdit={(calificacion) => setFormulario({ calificacion })}
          />
        )}
      </QueryState>

      {/* RF-CAL-03: no hay botón "Eliminar"; este texto explica cómo corregir una nota. */}
      {puedeEscribir && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          {TEXTO_SIN_ELIMINAR}
        </Typography>
      )}

      {formulario && <CalificacionFormDialog calificacion={formulario.calificacion} onClose={() => setFormulario(null)} />}
    </>
  )
}

interface ResultadosProps {
  data: Paginated<Calificacion>
  params: CalificacionListParams
  columnas: DataTableColumn<Calificacion>[]
  puedeEscribir: boolean
  fetching: boolean
  vacio: React.ReactNode
  onChange: (changes: Record<string, string | number | null>) => void
  onEdit: (calificacion: Calificacion) => void
}

function Resultados({ data, params, columnas, puedeEscribir, fetching, vacio, onChange, onEdit }: ResultadosProps) {
  const { meta } = data

  // Un enlace con una página que ya no existe devolvería filas vacías con total > 0:
  // se lleva al usuario a la última página real en vez de mostrar "no hay datos".
  const paginaFueraDeRango = data.data.length === 0 && meta.total > 0 && meta.totalPages > 0
  useEffect(() => {
    if (paginaFueraDeRango) onChange({ page: meta.totalPages })
  }, [paginaFueraDeRango, meta.totalPages, onChange])

  return (
    <>
      {puedeEscribir && data.data.length > 0 && (
        <Alert severity="info" icon={false} sx={{ mb: 2, display: { xs: 'none', sm: 'flex' } }}>
          Usa el lápiz de cada fila para corregir una calificación.
        </Alert>
      )}
      <DataTable
        caption="Calificaciones"
        columns={columnas}
        rows={data.data}
        getRowId={(calificacion) => calificacion.id}
        rowActions={
          puedeEscribir
            ? (calificacion) => (
                <IconButton
                  onClick={() => onEdit(calificacion)}
                  aria-label={`Editar la calificación de ${nombreEstudiante(calificacion.inscripcion.estudiante)} en ${calificacion.materia.nombre}`}
                  sx={{ width: 44, height: 44 }}
                >
                  <EditOutlined />
                </IconButton>
              )
            : undefined
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
    </>
  )
}
