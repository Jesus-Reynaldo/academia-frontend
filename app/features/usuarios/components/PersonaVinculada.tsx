import MuiLink from '@mui/material/Link'
import Skeleton from '@mui/material/Skeleton'
import { Link as RouterLink } from 'react-router'
import { useDocente } from '../../docentes'
import { useEstudiante } from '../../estudiantes'
import type { CuentaUsuario } from '../model/types'
import { useDesde } from '../../../shared/navegacion/desde'

interface PersonaProps {
  id: number
}

function Enlace({ to, nombres, apellidos }: { to: string; nombres: string; apellidos: string }) {
  const { desde } = useDesde('Usuarios')
  return (
    <MuiLink component={RouterLink} to={to} state={{ desde }}>
      {`${apellidos}, ${nombres}`}
    </MuiLink>
  )
}

function EstudianteVinculado({ id }: PersonaProps) {
  const query = useEstudiante(id)
  if (query.isPending) return <Skeleton variant="text" width={140} />
  if (query.isError) return <>No disponible</>
  return <Enlace to={`/estudiantes/${id}`} nombres={query.data.nombres} apellidos={query.data.apellidos} />
}

function DocenteVinculado({ id }: PersonaProps) {
  const query = useDocente(id)
  if (query.isPending) return <Skeleton variant="text" width={140} />
  if (query.isError) return <>No disponible</>
  return <Enlace to={`/docentes/${id}`} nombres={query.data.nombres} apellidos={query.data.apellidos} />
}

/** La API solo entrega el id de la persona vinculada: su nombre se consulta aparte y queda en caché. */
export function PersonaVinculada({ usuario }: { usuario: CuentaUsuario }) {
  if (usuario.estudianteId !== null) return <EstudianteVinculado id={usuario.estudianteId} />
  if (usuario.docenteId !== null) return <DocenteVinculado id={usuario.docenteId} />
  return <>—</>
}
