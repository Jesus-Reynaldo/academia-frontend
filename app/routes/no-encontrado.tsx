import Button from '@mui/material/Button'
import { Link as RouterLink } from 'react-router'
import { EmptyState } from '../shared/ui/EmptyState'
import { PageHeader } from '../shared/ui/PageHeader'

export default function NoEncontrado() {
  return (
    <>
      <PageHeader title="Página no encontrada" />
      <EmptyState
        title="No encontramos lo que buscas"
        description="La dirección no existe o fue movida."
        action={
          <Button component={RouterLink} to="/" variant="contained">
            Ir al inicio
          </Button>
        }
      />
    </>
  )
}
