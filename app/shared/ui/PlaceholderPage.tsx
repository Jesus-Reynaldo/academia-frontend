import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import ConstructionOutlined from '@mui/icons-material/ConstructionOutlined'
import { PageHeader } from './PageHeader'

interface PlaceholderPageProps {
  title: string
  /** Carpeta del feature donde se implementa esta pantalla. */
  feature: string
}

/** Pantalla provisional de los módulos que implementan los estudiantes. Se reemplaza por la pantalla real. */
export function PlaceholderPage({ title, feature }: PlaceholderPageProps) {
  return (
    <>
      <PageHeader title={title} />
      <Card>
        <CardContent sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
          <ConstructionOutlined sx={{ fontSize: 48, mb: 1 }} aria-hidden />
          <Typography variant="h3" component="p" color="text.primary" gutterBottom>
            Módulo pendiente de implementar
          </Typography>
          <Typography variant="body2">
            Esta pantalla se desarrolla en <code>app/features/{feature}/</code> siguiendo el plan de UI/UX.
          </Typography>
        </CardContent>
      </Card>
    </>
  )
}
