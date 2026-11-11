import Autocomplete from '@mui/material/Autocomplete'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useMemo, useState, type ReactNode } from 'react'
import { useDebounce } from '../../../shared/hooks/useDebounce'
import { StatusChip } from '../../../shared/ui/StatusChip'
import { visuallyHidden } from '../../../shared/ui/visuallyHidden'
import { useEstudiante, useEstudiantesBuscar } from '../api/useEstudiantes'
import type { Estudiante } from '../model/types'

export interface EstudianteSelectProps {
  /** Id del estudiante elegido, o `null` si no hay ninguno. */
  value: number | null
  onChange: (estudianteId: number | null, estudiante: Estudiante | null) => void
  /** Ofrece solo estudiantes ACTIVO: úsalo en altas (p. ej. una nueva inscripción). */
  soloActivos?: boolean
  label?: string
  required?: boolean
  disabled?: boolean
  error?: boolean
  helperText?: ReactNode
  fullWidth?: boolean
}

const etiqueta = (estudiante: Estudiante) => `${estudiante.apellidos}, ${estudiante.nombres} (${estudiante.codigo})`

/**
 * Selector de estudiante con búsqueda en el servidor por nombre, código o documento. El elegido se resuelve
 * por id, así que se ve su nombre aunque no esté en la lista visible.
 */
export function EstudianteSelect({
  value,
  onChange,
  soloActivos = false,
  label = 'Estudiante',
  required = false,
  disabled = false,
  error = false,
  helperText,
  fullWidth = true,
}: EstudianteSelectProps) {
  const [texto, setTexto] = useState('')
  const buscado = useDebounce(texto.trim(), 300)
  const busqueda = useEstudiantesBuscar(buscado, soloActivos ? 'ACTIVO' : undefined)
  const elegido = useEstudiante(value)

  const opciones = useMemo(() => {
    const lista = busqueda.data ?? []
    const actual = elegido.data
    return actual && !lista.some((estudiante) => estudiante.id === actual.id) ? [actual, ...lista] : lista
  }, [busqueda.data, elegido.data])

  const seleccionado = value === null ? null : (opciones.find((estudiante) => estudiante.id === value) ?? null)
  const fallo = busqueda.isError

  return (
    <Autocomplete
      options={opciones}
      value={seleccionado}
      onChange={(_, estudiante) => onChange(estudiante?.id ?? null, estudiante)}
      onInputChange={(_, nuevo, motivo) => {
        // Solo cuenta lo que el usuario escribe: al elegir una opción el cuadro muestra su nombre.
        if (motivo === 'input') setTexto(nuevo)
        else setTexto('')
      }}
      // El servidor ya filtró: no se vuelve a filtrar en el navegador.
      filterOptions={(todas) => todas}
      getOptionLabel={etiqueta}
      isOptionEqualToValue={(opcion, valor) => opcion.id === valor.id}
      loading={busqueda.isFetching}
      loadingText="Buscando estudiantes…"
      disabled={disabled}
      fullWidth={fullWidth}
      noOptionsText={
        fallo ? (
          <Button size="small" onClick={() => void busqueda.refetch()}>
            No se pudieron cargar. Reintentar
          </Button>
        ) : buscado ? (
          `No hay estudiantes que coincidan con «${buscado}»`
        ) : (
          'No hay estudiantes'
        )
      }
      renderOption={(props, estudiante) => {
        const { key, ...rest } = props
        return (
          <Box component="li" key={key} {...rest} sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {`${estudiante.apellidos}, ${estudiante.nombres}`}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {estudiante.codigo}
              </Typography>
            </Box>
            {estudiante.estado !== 'ACTIVO' && <StatusChip estado={estudiante.estado} />}
          </Box>
        )
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          required={required}
          error={error || fallo}
          placeholder="Nombre, código o documento"
          helperText={fallo ? 'No se pudieron cargar los estudiantes.' : helperText}
          label={
            required ? (
              <>
                {label}
                <Box component="span" sx={visuallyHidden}>
                  {' '}
                  (obligatorio)
                </Box>
              </>
            ) : (
              label
            )
          }
        />
      )}
    />
  )
}
