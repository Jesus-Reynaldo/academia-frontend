import { usePaginaEnRango } from '../../../shared/hooks/usePaginaEnRango'
import { formatFecha } from '../../../shared/lib/format'
import { DataTable, type DataTableColumn } from '../../../shared/ui/DataTable'
import { EmptyState } from '../../../shared/ui/EmptyState'
import { GradeBadge } from '../../../shared/ui/GradeBadge'
import { QueryState } from '../../../shared/ui/QueryState'
import { useCalificacionesDelEstudiante } from '../api/useEstudiantes'
import { ETIQUETA_TIPO_EVALUACION, nombreCurso } from '../model/etiquetas'
import type { CalificacionDelEstudiante, PaginaFichaParams } from '../model/types'

const LIMITES = [10, 20, 50]

const COLUMNAS: DataTableColumn<CalificacionDelEstudiante>[] = [
  { id: 'materia', header: 'Materia', primary: true, render: (c) => c.materia.nombre },
  { id: 'curso', header: 'Curso', render: (c) => nombreCurso(c.inscripcion.curso) },
  { id: 'tipo', header: 'Tipo', render: (c) => ETIQUETA_TIPO_EVALUACION[c.tipo] ?? c.tipo },
  { id: 'fecha', header: 'Fecha', render: (c) => formatFecha(c.fecha) },
  { id: 'docente', header: 'Docente', render: (c) => (c.docente ? `${c.docente.apellidos}, ${c.docente.nombres}` : '—') },
  { id: 'nota', header: 'Nota', align: 'right', render: (c) => <GradeBadge nota={c.nota} /> },
]

interface CalificacionesDelEstudianteProps {
  estudianteId: number
  params: PaginaFichaParams
  onChange: (changes: Record<string, string | number | null>) => void
}

/** Pestaña "Calificaciones" de la ficha: las más recientes primero. */
export function CalificacionesDelEstudiante({ estudianteId, params, onChange }: CalificacionesDelEstudianteProps) {
  const query = useCalificacionesDelEstudiante(estudianteId, params)
  const fueraDeRango = usePaginaEnRango(query.data?.meta, query.data?.data.length, onChange)

  return (
    <QueryState query={query} skeletonHeight={240}>
      {(data) => (
        <DataTable
          caption="Calificaciones del estudiante"
          columns={COLUMNAS}
          rows={data.data}
          getRowId={(calificacion) => calificacion.id}
          pagination={{
            page: data.meta.page,
            limit: data.meta.limit,
            total: data.meta.total,
            limitOptions: LIMITES,
            onPageChange: (page) => onChange({ page: page === 1 ? null : page }),
            onLimitChange: (limit) => onChange({ limit }),
          }}
          fetching={query.isFetching}
          emptyState={
            fueraDeRango ? null : <EmptyState title="Sin calificaciones" description="Este estudiante aún no tiene notas registradas." />
          }
        />
      )}
    </QueryState>
  )
}
