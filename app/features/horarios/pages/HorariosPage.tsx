import Add from '@mui/icons-material/Add'
import CalendarViewWeekOutlined from '@mui/icons-material/CalendarViewWeekOutlined'
import EditOutlined from '@mui/icons-material/EditOutlined'
import ViewListOutlined from '@mui/icons-material/ViewListOutlined'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
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
import { CursoSelect } from '../../cursos'
import { DocenteSelect } from '../../docentes'
import { PeriodoSelect, usePeriodosReferencia } from '../../periodos-academicos'
import { useAulasActivas } from '../../aulas'
import { horariosApi, horariosKeys, useHorarios } from '../api/horarios'
import { HorarioFormDialog } from '../components/HorarioFormDialog'
import { HorarioSemanal } from '../components/HorarioSemanal'
import { descargarHorario } from '../reportes/horarioPdf'
import { DIAS, ESTADOS_HORARIO, ETIQUETA_ESTADO_HORARIO, NOMBRE_DIA, nombreDocente, type DiaSemana, type EstadoHorario, type Horario, type HorarioFiltros, type VistaHorario } from '../model/types'

const LIMITES = [20, 50, 100]
const id = (v: string | null) => {
  const n = Number(v)
  return Number.isInteger(n) && n > 0 ? n : undefined
}

function Acciones({ h, onEdit }: { h: Horario; onEdit: (h: Horario) => void }) {
  const sujeto = `${h.asignacion.materia.nombre} (${NOMBRE_DIA[h.diaSemana]} ${h.horaInicio}–${h.horaFin})`
  const estado = useCambioEstado({
    ruta: '/horarios',
    id: h.id,
    sujeto,
    activo: h.estado === 'ACTIVO',
    alDesactivar: { estado: 'INACTIVO' },
    alActivar: { estado: 'ACTIVO' },
    efecto: 'Dejará de aparecer en el horario del curso, del docente y de los estudiantes.',
  })
  const acciones: AccionFila[] = [{ etiqueta: 'Editar', icono: <EditOutlined />, onClick: () => onEdit(h) }]
  if (estado.accion) acciones.push(estado.accion)
  return (
    <>
      <AccionesFila sujeto={sujeto} acciones={acciones} />
      {estado.dialogo}
    </>
  )
}

const COLUMNAS: DataTableColumn<Horario>[] = [
  { id: 'dia', header: 'Día', render: (h) => NOMBRE_DIA[h.diaSemana] },
  { id: 'hora', header: 'Hora', render: (h) => <span className="tabular-nums">{h.horaInicio} – {h.horaFin}</span> },
  { id: 'materia', header: 'Materia', primary: true, render: (h) => <span className="font-semibold">{h.asignacion.materia.nombre}</span> },
  { id: 'curso', header: 'Curso', render: (h) => h.asignacion.curso.nombre },
  { id: 'docente', header: 'Docente', render: (h) => nombreDocente(h.asignacion.docente) },
  { id: 'aula', header: 'Aula', render: (h) => h.aula.nombre },
  { id: 'periodo', header: 'Período', render: (h) => h.asignacion.periodoAcademico.nombre },
  { id: 'estado', header: 'Estado', render: (h) => <StatusChip estado={h.estado} /> },
]

/** Horarios académicos (ADMIN): semana de un curso, docente o aula, y lista completa con filtros. */
export function HorariosPage() {
  const [sp, updateParams] = useUrlParams()
  const periodos = usePeriodosReferencia()
  const aulas = useAulasActivas()
  const periodoActivo = periodos.data?.find((p) => p.estado === 'ACTIVO')?.id
  // Sin período elegido se muestra el período activo.
  useEffect(() => {
    if (!sp.get('periodoAcademicoId') && periodoActivo) updateParams({ periodoAcademicoId: periodoActivo }, { replace: true })
  }, [sp, periodoActivo, updateParams])

  const filtros: HorarioFiltros = useMemo(() => {
    const estado = sp.get('estado')
    const dia = sp.get('diaSemana')
    return {
      periodoAcademicoId: id(sp.get('periodoAcademicoId')),
      cursoId: id(sp.get('cursoId')),
      docenteId: id(sp.get('docenteId')),
      aulaId: id(sp.get('aulaId')),
      estado: ESTADOS_HORARIO.includes(estado as EstadoHorario) ? (estado as EstadoHorario) : undefined,
      diaSemana: DIAS.includes(dia as DiaSemana) ? (dia as DiaSemana) : undefined,
      q: sp.get('q')?.trim() || undefined,
    }
  }, [sp])
  const vista: 'semana' | 'lista' = sp.get('vista') === 'lista' ? 'lista' : 'semana'
  const quien: VistaHorario | null = filtros.cursoId ? 'curso' : filtros.docenteId ? 'docente' : filtros.aulaId ? 'aula' : null
  const page = id(sp.get('page')) ?? 1
  const limit = LIMITES.includes(Number(sp.get('limit'))) ? Number(sp.get('limit')) : 20

  const semana = useHorarios({ ...filtros, estado: filtros.estado ?? 'ACTIVO' }, vista === 'semana' && quien !== null)
  const lista = useQuery({
    queryKey: [...horariosKeys.all, 'pagina', filtros, page, limit],
    queryFn: ({ signal }) => horariosApi.list({ ...filtros, page, limit }, signal),
    placeholderData: keepPreviousData,
    enabled: vista === 'lista',
  })
  const [formulario, setFormulario] = useState<{ horario: Horario | null } | null>(null)
  const filtro = (campo: string) => (valor: number | null) => updateParams({ [campo]: valor, page: null })
  const muestra = semana.data?.[0] ?? lista.data?.data[0]
  const nombrePeriodo = periodos.data?.find((p) => p.id === filtros.periodoAcademicoId)?.nombre

  const titulo =
    quien === 'curso' && muestra ? `Horario de ${muestra.asignacion.curso.nombre}`
    : quien === 'docente' && muestra ? `Horario de ${nombreDocente(muestra.asignacion.docente)}`
    : quien === 'aula' && muestra ? `Horario del aula ${muestra.aula.nombre}`
    : 'Horarios'

  const reporte = async () => {
    const pdfFiltros = [
      { etiqueta: 'Período', valor: nombrePeriodo },
      { etiqueta: 'Curso', valor: filtros.cursoId ? muestra?.asignacion.curso.nombre : undefined },
      { etiqueta: 'Docente', valor: filtros.docenteId && muestra ? nombreDocente(muestra.asignacion.docente) : undefined },
      { etiqueta: 'Aula', valor: filtros.aulaId ? muestra?.aula.nombre : undefined },
    ]
    if (vista === 'semana' && quien) {
      return descargarHorario({ horarios: semana.data ?? [], vista: quien, titulo, subtitulo: nombrePeriodo, archivo: 'horario', filtros: pdfFiltros })
    }
    return reporteListado({
      titulo: 'Horarios',
      archivo: 'horarios',
      horizontal: true,
      filtros: [...pdfFiltros, { etiqueta: 'Estado', valor: filtros.estado && ETIQUETA_ESTADO_HORARIO[filtros.estado] }, { etiqueta: 'Búsqueda', valor: filtros.q && `«${filtros.q}»` }],
      cargar: (p, l) => horariosApi.list({ ...filtros, page: p, limit: l }),
      columnas: [
        { titulo: 'Día', valor: (h) => NOMBRE_DIA[h.diaSemana], ancho: 55 },
        { titulo: 'Hora', valor: (h) => `${h.horaInicio}–${h.horaFin}`, ancho: 62 },
        { titulo: 'Materia', valor: (h) => h.asignacion.materia.nombre, ancho: '*' },
        { titulo: 'Curso', valor: (h) => h.asignacion.curso.nombre, ancho: '*' },
        { titulo: 'Docente', valor: (h) => nombreDocente(h.asignacion.docente), ancho: '*' },
        { titulo: 'Aula', valor: (h) => h.aula.nombre, ancho: 80 },
        { titulo: 'Estado', valor: (h) => ETIQUETA_ESTADO_HORARIO[h.estado], ancho: 50 },
      ],
    })
  }

  return (
    <>
      <PageHeader
        title={titulo}
        modulo="horarios"
        reporte={reporte}
        subtitle={nombrePeriodo ?? 'Elige el período'}
        actions={
          <Button variant="contained" startIcon={<Add />} onClick={() => setFormulario({ horario: null })} sx={{ minHeight: 44 }}>
            Agregar al horario
          </Button>
        }
      />
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <ToggleButtonGroup exclusive size="small" value={vista} onChange={(_e, v: string | null) => v && updateParams({ vista: v === 'semana' ? null : v, page: null })} aria-label="Cómo ver los horarios">
              <ToggleButton value="semana" sx={{ minHeight: 40, px: 2 }}><CalendarViewWeekOutlined fontSize="small" sx={{ mr: 1 }} />Semana</ToggleButton>
              <ToggleButton value="lista" sx={{ minHeight: 40, px: 2 }}><ViewListOutlined fontSize="small" sx={{ mr: 1 }} />Lista</ToggleButton>
            </ToggleButtonGroup>
            {vista === 'semana' && <span className="text-sm text-texto-suave">Elige un curso, un docente o un aula para ver su semana.</span>}
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <PeriodoSelect value={filtros.periodoAcademicoId ?? null} onChange={filtro('periodoAcademicoId')} label="Período" />
            <CursoSelect value={filtros.cursoId ?? null} onChange={(v) => updateParams({ cursoId: v, docenteId: vista === 'semana' && v ? null : (filtros.docenteId ?? null), aulaId: vista === 'semana' && v ? null : (filtros.aulaId ?? null), page: null })} label="Curso y paralelo" />
            <DocenteSelect value={filtros.docenteId ?? null} onChange={(v) => updateParams({ docenteId: v, cursoId: vista === 'semana' && v ? null : (filtros.cursoId ?? null), aulaId: vista === 'semana' && v ? null : (filtros.aulaId ?? null), page: null })} label="Docente" />
            <TextField
              select
              label="Aula"
              value={filtros.aulaId ?? ''}
              onChange={(e) => {
                const v = e.target.value ? Number(e.target.value) : null
                updateParams({ aulaId: v, cursoId: vista === 'semana' && v ? null : (filtros.cursoId ?? null), docenteId: vista === 'semana' && v ? null : (filtros.docenteId ?? null), page: null })
              }}
              slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
            >
              <MenuItem value="">Todas</MenuItem>
              {(aulas.data ?? []).map((a) => <MenuItem key={a.id} value={a.id}>{a.nombre}</MenuItem>)}
            </TextField>
            {vista === 'lista' && (
              <>
                <BuscadorUrl placeholder="Materia, curso, docente o aula" minWidth={0} />
                <TextField
                  select
                  label="Estado"
                  value={filtros.estado ?? ''}
                  onChange={(e) => updateParams({ estado: e.target.value || null, page: null })}
                  slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
                >
                  <MenuItem value="">Todos</MenuItem>
                  {ESTADOS_HORARIO.map((e) => <MenuItem key={e} value={e}>{ETIQUETA_ESTADO_HORARIO[e]}</MenuItem>)}
                </TextField>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {aulas.data?.length === 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Primero registra las aulas en el módulo «Aulas»: cada clase del horario se dicta en un aula.
        </Alert>
      )}

      {vista === 'semana' ? (
        quien === null ? (
          <EmptyState title="Elige qué semana ver" description="Selecciona arriba un curso y paralelo, un docente o un aula. También puedes ver todo en «Lista»." />
        ) : (
          <QueryState query={semana} skeletonHeight={320}>
            {(datos) =>
              datos.length === 0 ? (
                <EmptyState
                  title="Sin clases registradas"
                  description="Todavía no hay bloques en este horario para el período elegido."
                  action={<Button variant="contained" startIcon={<Add />} onClick={() => setFormulario({ horario: null })}>Agregar al horario</Button>}
                />
              ) : (
                <HorarioSemanal horarios={datos} vista={quien} onEditar={(h) => setFormulario({ horario: h })} />
              )
            }
          </QueryState>
        )
      ) : (
        <QueryState query={lista} skeletonHeight={280}>
          {(data) => (
            <DataTable
              caption="Horarios"
              columns={COLUMNAS}
              rows={data.data}
              getRowId={(h) => h.id}
              getRowSx={(h) => (h.estado === 'INACTIVO' ? { opacity: 0.7 } : {})}
              rowActions={(h) => <Acciones h={h} onEdit={(x) => setFormulario({ horario: x })} />}
              pagination={{
                page: data.meta.page,
                limit: data.meta.limit,
                total: data.meta.total,
                limitOptions: LIMITES,
                onPageChange: (p) => updateParams({ page: p === 1 ? null : p }),
                onLimitChange: (l) => updateParams({ limit: l }),
              }}
              fetching={lista.isFetching}
              emptyState={<EmptyState title="No hay horarios con estos filtros" description="Cambia los filtros o agrega clases al horario." />}
            />
          )}
        </QueryState>
      )}

      {formulario && (
        <HorarioFormDialog
          horario={formulario.horario}
          inicial={{ periodoAcademicoId: filtros.periodoAcademicoId, cursoId: filtros.cursoId, aulaId: filtros.aulaId }}
          onClose={() => setFormulario(null)}
        />
      )}
    </>
  )
}
