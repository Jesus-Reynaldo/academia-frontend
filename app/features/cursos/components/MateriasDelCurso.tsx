import Alert from '@mui/material/Alert'
import MuiLink from '@mui/material/Link'
import { Link as RouterLink } from 'react-router'
import { DataTable, type DataTableColumn } from '../../../shared/ui/DataTable'
import { EmptyState } from '../../../shared/ui/EmptyState'
import { QueryState } from '../../../shared/ui/QueryState'
import { StatusChip } from '../../../shared/ui/StatusChip'
import { useMateriasDelCurso } from '../api/useCursos'
import { usePaginaEnRango } from '../../../shared/hooks/usePaginaEnRango'
import type { MateriaDelCurso, PaginaDetalleParams } from '../model/types'

const LIMITES = [10, 20, 50]

const COLUMNAS: DataTableColumn<MateriaDelCurso>[] = [
  {
    id: 'nombre',
    header: 'Materia',
    primary: true,
    render: (m) => (
      <MuiLink component={RouterLink} to={`/materias/${m.id}`} sx={{ fontWeight: 600 }}>
        {m.nombre}
      </MuiLink>
    ),
  },
  { id: 'codigo', header: 'Código', render: (m) => m.codigo },
  {
    id: 'horas',
    header: 'Horas semanales',
    align: 'right',
    render: (m) => (m.horasSemanales ? `${m.horasSemanales} h` : '—'),
  },
  { id: 'estado', header: 'Estado', render: (m) => <StatusChip estado={m.estado} /> },
]

interface MateriasDelCursoProps {
  cursoId: number
  params: PaginaDetalleParams
  onChange: (changes: Record<string, string | number | null>) => void
}

/** Pestaña "Materias". El modelo no relaciona curso y materia: se deducen de las calificaciones registradas. */
export function MateriasDelCurso({ cursoId, params, onChange }: MateriasDelCursoProps) {
  const query = useMateriasDelCurso(cursoId, params)
  const fueraDeRango = usePaginaEnRango(query.data?.meta, query.data?.data.length, onChange)

  return (
    <>
      <Alert severity="info" sx={{ mb: 2 }}>
        Se listan las materias que ya tienen calificaciones en este curso.
      </Alert>
      <QueryState query={query} skeletonHeight={240}>
        {(data) => (
          <DataTable
            caption="Materias con calificaciones en el curso"
            columns={COLUMNAS}
            rows={data.data}
            getRowId={(materia) => materia.id}
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
                  title="Este curso aún no tiene materias con calificaciones"
                  description="Cuando se registren notas en este curso, sus materias aparecerán aquí."
                />
              )
            }
          />
        )}
      </QueryState>
    </>
  )
}
