import PictureAsPdfOutlined from '@mui/icons-material/PictureAsPdfOutlined'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import { useState } from 'react'
import { friendlyMessage } from '../api/errors'
import { useNotify } from '../notifications/notifications-context'

interface BotonPdfProps {
  /** Arma y descarga el PDF (ver shared/reportes/motor.ts). */
  generar: () => Promise<void>
  etiqueta?: string
  variante?: 'outlined' | 'contained' | 'text'
}

/** Botón «PDF»: genera el reporte con los filtros actuales y avisa si algo falla. */
export function BotonPdf({ generar, etiqueta = 'Reporte PDF', variante = 'outlined' }: BotonPdfProps) {
  const notify = useNotify()
  const [generando, setGenerando] = useState(false)
  return (
    <Button
      variant={variante}
      startIcon={generando ? <CircularProgress size={18} color="inherit" /> : <PictureAsPdfOutlined />}
      disabled={generando}
      sx={{ minHeight: 44 }}
      onClick={async () => {
        setGenerando(true)
        try {
          await generar()
          notify('Reporte generado.')
        } catch (error) {
          notify(error instanceof Error && !('status' in error) ? error.message : friendlyMessage(error), 'error')
        } finally {
          setGenerando(false)
        }
      }}
    >
      {generando ? 'Generando…' : etiqueta}
    </Button>
  )
}
