import CheckCircleOutlined from '@mui/icons-material/CheckCircleOutlined'
import RadioButtonUnchecked from '@mui/icons-material/RadioButtonUnchecked'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useState, type ReactNode } from 'react'
import type { UseFormRegisterReturn } from 'react-hook-form'
import { PASSWORD_MINIMO } from '../model/schema'

interface CampoPasswordProps {
  label: ReactNode
  required?: boolean
  /** Texto actual, para el indicador de requisitos. */
  valor: string
  error?: string
  ayuda?: string
  registro: UseFormRegisterReturn
}

/** Contraseña con botón para mostrarla y un indicador del requisito de longitud (con icono y texto). */
export function CampoPassword({ label, required = false, valor, error, ayuda, registro }: CampoPasswordProps) {
  const [visible, setVisible] = useState(false)
  const cumple = valor.length >= PASSWORD_MINIMO

  return (
    <Box>
      <TextField
        label={label}
        required={required}
        fullWidth
        type={visible ? 'text' : 'password'}
        autoComplete="new-password"
        error={Boolean(error)}
        helperText={error ?? ayuda}
        slotProps={{
          input: {
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  onClick={() => setVisible((actual) => !actual)}
                  edge="end"
                >
                  {visible ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
        {...registro}
      />
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.75, color: cumple ? 'success.main' : 'text.secondary' }}>
        {cumple ? <CheckCircleOutlined sx={{ fontSize: 16 }} aria-hidden /> : <RadioButtonUnchecked sx={{ fontSize: 16 }} aria-hidden />}
        <Typography variant="caption" sx={{ color: 'inherit' }}>
          {`Al menos ${PASSWORD_MINIMO} caracteres`}
        </Typography>
      </Box>
    </Box>
  )
}
