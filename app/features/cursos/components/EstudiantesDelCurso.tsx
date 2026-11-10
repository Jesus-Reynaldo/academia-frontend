import Alert from '@mui/material/Alert'
import { DataTable, type DataTableColumn } from '../../../shared/ui/DataTable'
import { EmptyState } from '../../../shared/ui/EmptyState'
import { QueryState } from '../../../shared/ui/QueryState'
import { StatusChip } from '../../../shared/ui/StatusChip'
import { useEstudiantesDelCurso } from '../api/useCursos'
import { usePaginaEnRango } from '../model/usePaginaEnRango'
import type { EstudianteDelCurso, PaginaDetalleParams } from '../model/types'

const LIMITES = [10, 20, 50]

/** `fila`: un estudiante puede repetir en el mismo curso en otra gestión, así que su id no identifica la fila. */
type Fila = EstudianteDelCurso & { fila: number }

const COLUMNAS: DataTableColumn<Fila>[] = [
  { id: 'nombre', header: 'Estudiante', primary: true, render: (e) => `${e.apellidos}, ${e.nombres}` },
  { id: 'codigo', header: 'Código', render: (e) => e.codigo },
  { id: 'email', header: 'Email', render: (e) => e.email ?? '—' },
  { id: 'estado', header: 'Estado', render: (e) => <StatusChip estado={e.estado} /> },
]

interface EstudiantesDelCursoProps {
  cursoId: number
  params: PaginaDetalleParams
  onChange: (changes: Record<string, string | number | null>) => void
}

/** Pestaña "Estudiantes inscritos" (ADMIN y DOCENTE; la API la niega a ESTUDIANTE). */
export function EstudiantesDelCurso({ cursoId, params, onChange }: EstudiantesDelCursoProps) {
  const query = useEstudiantesDelCurso(cursoId, params)
  const fueraDeRango = usePaginaEnRango(query.data?.meta, query.data?.data.length, onChange)

  return (
    <>
      <Alert severity="info" sx={{ mb: 2 }}>
        Se listan los estudiantes inscritos en este curso en todas las gestiones. La ocupación de arriba cuenta solo la
        gestión activa.
      </Alert>
      <QueryState query={query} skeletonHeight={240}>
        {(data) => (
          <DataTable
            caption="Estudiantes inscritos en el curso"
            columns={COLUMNAS}
            rows={data.data.map((estudiante, fila) => ({ ...estudiante, fila }))}
            getRowId={(estudiante) => estudiante.fila}
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
                <EmptyState
                  title="Este curso aún no tiene estudiantes"
                  description="Cuando se registren inscripciones, aparecerán aquí."
                />
              )
            }
          />
        )}
      </QueryState>
    </>
  )
}
