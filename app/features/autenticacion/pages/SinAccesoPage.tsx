import Button from '@mui/material/Button'
import LockOutlined from '@mui/icons-material/LockOutlined'
import { Link as RouterLink } from 'react-router'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { EmptyState } from '../../../shared/ui/EmptyState'
import { ETIQUETA_ROL } from '../../../shared/config/roles'
import { useUsuario } from '../context/auth-context'

export function SinAccesoPage() {
  const usuario = useUsuario()
  return (
    <>
      <PageHeader title="Sin acceso" />
      <LockOutlined color="disabled" sx={{ display: 'block', mx: 'auto', fontSize: 48 }} aria-hidden />
      <EmptyState
        title="No tienes permiso para ver esta pantalla"
        description={`Tu rol actual es ${ETIQUETA_ROL[usuario.rol]}.`}
        action={
          <Button component={RouterLink} to="/" variant="contained">
            Volver al inicio
          </Button>
        }
      />
    </>
  )
}
