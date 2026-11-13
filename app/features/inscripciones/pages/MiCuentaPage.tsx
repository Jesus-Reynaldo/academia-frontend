import LockReset from '@mui/icons-material/LockReset'
import Logout from '@mui/icons-material/Logout'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Skeleton from '@mui/material/Skeleton'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { Link as RouterLink } from 'react-router'
import { formatFecha } from '../../../shared/lib/format'
import { DefinitionList } from '../../../shared/ui/DefinitionList'
import { EmptyState } from '../../../shared/ui/EmptyState'
import { ErrorState } from '../../../shared/ui/ErrorState'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { SectionCard } from '../../../shared/ui/SectionCard'
import { StatusChip } from '../../../shared/ui/StatusChip'
import { useAuth, useUsuario } from '../../autenticacion'
import { useEstudiante } from '../../estudiantes'
import { useInscripcionesList } from '../api/useInscripciones'
import { nombreCurso } from '../model/etiquetas'

/** Mi cuenta (estudiante): datos personales, inscripciones como línea de tiempo y seguridad. */
export function MiCuentaPage() {
  const usuario = useUsuario()
  const { logout } = useAuth()
  const estudiante = useEstudiante(usuario.estudianteId)
  // La API devuelve solo las inscripciones del propio estudiante.
  const inscripciones = useInscripcionesList({ page: 1, limit: 50, sortBy: 'fechaInscripcion', order: 'desc' })
  const actual = inscripciones.data?.data.find((i) => i.estado === 'ACTIVA')

  return (
    <>
      <PageHeader title="Mi cuenta" modulo="cuenta" subtitle={estudiante.data ? `${estudiante.data.nombres} ${estudiante.data.apellidos}` : undefined} />
      <Stack spacing={2}>
        <SectionCard title="Mis datos">
          {estudiante.isPending ? (
            <Skeleton variant="rounded" height={140} />
          ) : estudiante.isError ? (
            <ErrorState error={estudiante.error} onRetry={() => void estudiante.refetch()} />
          ) : (
            <DefinitionList
              items={[
                { label: 'Código', value: estudiante.data.codigo },
                { label: 'Documento', value: estudiante.data.documento },
                { label: 'Email', value: estudiante.data.email ?? '—' },
                { label: 'Teléfono', value: estudiante.data.telefono ?? '—' },
                { label: 'Fecha de nacimiento', value: formatFecha(estudiante.data.fechaNacimiento) },
                { label: 'Estado', value: <StatusChip estado={estudiante.data.estado} /> },
                { label: 'Curso actual', value: actual ? `${nombreCurso(actual.curso)} · ${actual.periodoAcademico.nombre}` : 'Sin inscripción activa' },
                { label: 'Cuenta de acceso', value: usuario.email },
              ]}
            />
          )}
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Si algún dato es incorrecto, pide a secretaría que lo corrija.
          </Typography>
        </SectionCard>

        <Box id="inscripciones">
          <SectionCard title="Mis inscripciones">
            {inscripciones.isPending ? (
              <Skeleton variant="rounded" height={120} />
            ) : inscripciones.isError ? (
              <ErrorState error={inscripciones.error} onRetry={() => void inscripciones.refetch()} />
            ) : (inscripciones.data?.data.length ?? 0) === 0 ? (
              <EmptyState title="Todavía no tienes inscripciones" description="Cuando te inscriban en un curso, aparecerá aquí." />
            ) : (
              <Box component="ol" sx={{ listStyle: 'none', m: 0, p: 0 }}>
                {inscripciones.data?.data.map((i, n, lista) => (
                  <Box component="li" key={i.id} sx={{ display: 'flex', gap: 1.5 }}>
                    {/* Línea de tiempo: un punto por gestión, unidos por una línea. */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pt: 0.75 }} aria-hidden>
                      <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: i.estado === 'ACTIVA' ? 'primary.main' : 'grey.400' }} />
                      {n < lista.length - 1 && <Box sx={{ width: 2, flexGrow: 1, bgcolor: 'divider', my: 0.5 }} />}
                    </Box>
                    <Box sx={{ pb: 2, minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 600 }}>{i.periodoAcademico.nombre}</Typography>
                      <Typography variant="body2">{nombreCurso(i.curso)}</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                        <StatusChip estado={i.estado} />
                        <Typography variant="caption" color="text.secondary">
                          Inscripción: {formatFecha(i.fechaInscripcion)}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </SectionCard>
        </Box>

        <SectionCard title="Seguridad">
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <Button component={RouterLink} to="/cuenta/contrasena" variant="outlined" startIcon={<LockReset />} sx={{ minHeight: 44 }}>
              Cambiar contraseña
            </Button>
            <Button onClick={logout} color="inherit" startIcon={<Logout />} sx={{ minHeight: 44 }}>
              Cerrar sesión
            </Button>
          </Stack>
        </SectionCard>
      </Stack>
    </>
  )
}
