import Clear from '@mui/icons-material/Clear'
import Search from '@mui/icons-material/Search'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import TextField from '@mui/material/TextField'
import { useEffect, useRef, useState } from 'react'

interface SearchFieldProps {
  label: string
  /** Texto con el que arranca el cuadro (p. ej. el que viene en la URL). */
  initialValue?: string
  /** Se llama con el texto ya recortado, tras una pausa al escribir, o al instante con Enter o al borrar. */
  onSearch: (texto: string) => void
  delayMs?: number
  placeholder?: string
}

/**
 * Cuadro de búsqueda con pausa: no lanza una consulta por cada tecla. El texto vive aquí (así escribir nunca
 * se corta); para reiniciarlo desde fuera (p. ej. "Limpiar filtros") cambia su `key`.
 */
export function SearchField({ label, initialValue = '', onSearch, delayMs = 350, placeholder }: SearchFieldProps) {
  const [texto, setTexto] = useState(initialValue)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => () => clearTimeout(timer.current), [])

  const emitir = (valor: string) => {
    clearTimeout(timer.current)
    onSearch(valor.trim())
  }

  const cambiar = (valor: string) => {
    setTexto(valor)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => onSearch(valor.trim()), delayMs)
  }

  return (
    <TextField
      type="search"
      label={label}
      value={texto}
      placeholder={placeholder}
      onChange={(event) => cambiar(event.target.value)}
      onKeyDown={(event) => {
        if (event.key === 'Enter') emitir(texto)
      }}
      autoComplete="off"
      slotProps={{
        inputLabel: { shrink: true },
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <Search fontSize="small" aria-hidden />
            </InputAdornment>
          ),
          endAdornment: texto ? (
            <InputAdornment position="end">
              <IconButton
                size="small"
                aria-label="Borrar búsqueda"
                onClick={() => {
                  setTexto('')
                  emitir('')
                }}
              >
                <Clear fontSize="small" />
              </IconButton>
            </InputAdornment>
          ) : undefined,
        },
      }}
    />
  )
}
