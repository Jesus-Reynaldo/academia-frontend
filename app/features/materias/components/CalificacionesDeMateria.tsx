import { useState } from 'react'
import { formatFecha } from '../../../shared/lib/format'
import { DataTable, type DataTableColumn } from '../../../shared/ui/DataTable'
import { EmptyState } from '../../../shared/ui/EmptyState'
import { GradeBadge } from '../../../shared/ui/GradeBadge'
import { QueryState } from '../../../shared/ui/QueryState'
import { useCalificacionesDeMateria } from '../api/useMaterias'
import { ETIQUETA_TIPO_EVALUACION, type CalificacionDeMateria } from '../model/types'

const LIMITES = [10, 20, 50]

const nombreCompleto = (persona: { nombres: string; apellidos: string }) => `${persona.nombres} ${persona.apellidos}`

const COLUMNAS: DataTableColumn<CalificacionDeMateria>[] = [
  {
    id: 'estudiante',
    header: 'Estudiante',
    primary: true,
    render: (c) => nombreCompleto(c.inscripcion.estudiante),
  },
  {
    id: 'curso',
    header: 'Curso',
    render: (c) => [c.inscripcion.curso.nombre, c.inscripcion.curso.paralelo].filter(Boolean).join(' · '),
  },
  { id: 'tipo', header: 'Tipo', render: (c) => ETIQUETA_TIPO_EVALUACION[c.tipo] ?? c.tipo },
  { id: 'nota', header: 'Nota', render: (c) => <GradeBadge nota={c.nota} /> },
  { id: 'fecha', header: 'Fecha', render: (c) => formatFecha(c.fecha) },
  { id: 'docente', header: 'Docente', render: (c) => (c.docente ? nombreCompleto(c.docente) : '—') },
]

/**
 * Calificaciones registradas en una materia (solo ADMIN y DOCENTE). Paginadas en el servidor.
 * El endpoint solo ordena por antigüedad, así que la tabla no ofrece ordenar por columnas:
 * muestra primero las más recientes.
 */
export function CalificacionesDeMateria({ materiaId }: { materiaId: number }) {
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const query = useCalificacionesDeMateria(materiaId, { page, limit, order: 'desc' }, true)

  return (
    <QueryState query={query} skeletonHeight={220}>
      {(data) => (
        <DataTable
          caption="Calificaciones de la materia"
          columns={COLUMNAS}
          rows={data.data}
          getRowId={(calificacion) => calificacion.id}
          pagination={{
            page: data.meta.page,
            limit: data.meta.limit,
            total: data.meta.total,
            limitOptions: LIMITES,
            onPageChange: setPage,
            onLimitChange: (nuevo) => {
              setLimit(nuevo)
              setPage(1)
            },
          }}
          fetching={query.isFetching}
          emptyState={
            <EmptyState
              title="Aún no hay calificaciones en esta materia"
              description="Cuando se registren, aparecerán aquí."
            />
          }
        />
      )}
    </QueryState>
  )
}
