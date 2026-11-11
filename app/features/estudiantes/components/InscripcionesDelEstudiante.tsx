import { usePaginaEnRango } from '../../../shared/hooks/usePaginaEnRango'
import { formatFecha } from '../../../shared/lib/format'
import { DataTable, type DataTableColumn } from '../../../shared/ui/DataTable'
import { EmptyState } from '../../../shared/ui/EmptyState'
import { QueryState } from '../../../shared/ui/QueryState'
import { StatusChip } from '../../../shared/ui/StatusChip'
import { useInscripcionesDelEstudiante } from '../api/useEstudiantes'
import { nombreCurso } from '../model/etiquetas'
import type { InscripcionDelEstudiante, PaginaFichaParams } from '../model/types'

const LIMITES = [10, 20, 50]

const COLUMNAS: DataTableColumn<InscripcionDelEstudiante>[] = [
  { id: 'periodo', header: 'Gestión', primary: true, render: (i) => i.periodoAcademico.nombre },
  { id: 'curso', header: 'Curso', render: (i) => nombreCurso(i.curso) },
  { id: 'fecha', header: 'Fecha de inscripción', render: (i) => formatFecha(i.fechaInscripcion) },
  { id: 'estado', header: 'Estado', render: (i) => <StatusChip estado={i.estado} /> },
]

interface InscripcionesDelEstudianteProps {
  estudianteId: number
  params: PaginaFichaParams
  onChange: (changes: Record<string, string | number | null>) => void
}

/** Pestaña "Inscripciones" de la ficha: las más recientes primero. */
export function InscripcionesDelEstudiante({ estudianteId, params, onChange }: InscripcionesDelEstudianteProps) {
  const query = useInscripcionesDelEstudiante(estudianteId, params)
  const fueraDeRango = usePaginaEnRango(query.data?.meta, query.data?.data.length, onChange)

  return (
    <QueryState query={query} skeletonHeight={200}>
      {(data) => (
        <DataTable
          caption="Inscripciones del estudiante"
          columns={COLUMNAS}
          rows={data.data}
          getRowId={(inscripcion) => inscripcion.id}
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
            fueraDeRango ? null : (
              <EmptyState title="Sin inscripciones" description="Este estudiante aún no se inscribió a ningún curso." />
            )
          }
        />
      )}
    </QueryState>
  )
}
