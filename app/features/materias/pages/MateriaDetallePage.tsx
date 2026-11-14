import EditOutlined from '@mui/icons-material/EditOutlined'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import { useState } from 'react'
import { Link as RouterLink, useNavigate } from 'react-router'
import { ApiError } from '../../../shared/api/errors'
import { formatFecha } from '../../../shared/lib/format'
import { DefinitionList } from '../../../shared/ui/DefinitionList'
import { EmptyState } from '../../../shared/ui/EmptyState'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { QueryState } from '../../../shared/ui/QueryState'
import { SectionCard } from '../../../shared/ui/SectionCard'
import { StatusChip } from '../../../shared/ui/StatusChip'
import { useUsuario } from '../../autenticacion'
import { useMateria } from '../api/useMaterias'
import { CalificacionesDeMateria } from '../components/CalificacionesDeMateria'
import { EliminarMateriaDialog } from '../components/EliminarMateriaDialog'
import { MateriaFormDialog } from '../components/MateriaFormDialog'
import { BotonCambioEstado } from '../../../shared/ui/BotonCambioEstado'
import { VolverA } from '../../../shared/ui/VolverA'

// Vuelve a Materias, o a la pantalla de origen si se llegó desde otra (p. ej. el detalle de un curso).
const VOLVER = <VolverA to="/materias" etiqueta="Materias" />

function NoEncontrada() {
  return (
    <>
      {VOLVER}
      <EmptyState
        title="Materia no encontrada"
        description="Puede que se haya eliminado o que el enlace no sea correcto."
        action={
          <Button component={RouterLink} to="/materias" variant="contained">
            Ir al listado de materias
          </Button>
        }
      />
    </>
  )
}

/** Ficha de una materia: sus datos y, para ADMIN y DOCENTE, sus calificaciones paginadas. */
export function MateriaDetallePage({ materiaId }: { materiaId: number | null }) {
  const usuario = useUsuario()
  const esAdmin = usuario.rol === 'ADMIN'
  const puedeVerCalificaciones = usuario.rol === 'ADMIN' || usuario.rol === 'DOCENTE'
  const navigate = useNavigate()
  const query = useMateria(materiaId)

  const [editando, setEditando] = useState(false)
  const [eliminando, setEliminando] = useState(false)

  if (materiaId === null) return <NoEncontrada />
  if (query.isError && query.error instanceof ApiError && query.error.status === 404) return <NoEncontrada />

  return (
    <>
      {VOLVER}
      <QueryState query={query} skeletonHeight={200}>
        {(materia) => (
          <>
            <PageHeader
              title={materia.nombre}
              modulo="materias"
              subtitle={
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
                  <span>Código {materia.codigo}</span>
                  <StatusChip estado={materia.estado} />
                </Stack>
              }
              actions={
                esAdmin && (
                  <>
                    <Button
                      variant="outlined"
                      startIcon={<EditOutlined />}
                      onClick={() => setEditando(true)}
                      sx={{ minHeight: 44 }}
                    >
                      Editar
                    </Button>
                    <BotonCambioEstado
                      ruta="/materias"
                      id={materia.id}
                      sujeto={materia.nombre}
                      activo={materia.estado === 'ACTIVA'}
                      alDesactivar={{ estado: 'INACTIVA' }}
                      alActivar={{ estado: 'ACTIVA' }}
                      efecto="No se podrá elegir para nuevas calificaciones."
                    />
                  </>
                )
              }
            />

            {materia.estado === 'INACTIVA' && (
              <Alert severity="info" sx={{ mb: 2 }}>
                Esta materia está inactiva: conserva su historial, pero no se ofrece para nuevas calificaciones.
              </Alert>
            )}

            <Stack spacing={2}>
              <SectionCard modulo="materias" title="Datos de la materia">
                <DefinitionList
                  items={[
                    { label: 'Código', value: materia.codigo },
                    { label: 'Nombre', value: materia.nombre },
                    { label: 'Horas semanales', value: materia.horasSemanales ? `${materia.horasSemanales} h` : '—' },
                    { label: 'Estado', value: <StatusChip estado={materia.estado} /> },
                    { label: 'Descripción', value: materia.descripcion || '—' },
                    { label: 'Registrada el', value: formatFecha(materia.createdAt) },
                  ]}
                />
              </SectionCard>

              {puedeVerCalificaciones && (
                <SectionCard modulo="calificaciones" title="Calificaciones">
                  <CalificacionesDeMateria materiaId={materia.id} />
                </SectionCard>
              )}
            </Stack>

            {editando && <MateriaFormDialog materia={materia} onClose={() => setEditando(false)} />}
            {eliminando && (
              <EliminarMateriaDialog
                materia={materia}
                onClose={() => setEliminando(false)}
                onDone={(resultado) => {
                  setEliminando(false)
                  // Eliminada: la ficha ya no existe, se vuelve al listado. Desactivada: se queda y se ve "Inactiva".
                  if (resultado.tipo === 'eliminada') void navigate('/materias', { replace: true })
                }}
              />
            )}
          </>
        )}
      </QueryState>
    </>
  )
}
