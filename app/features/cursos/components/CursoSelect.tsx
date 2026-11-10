import Autocomplete from '@mui/material/Autocomplete'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useMemo, useState, type ReactNode } from 'react'
import { useDebounce } from '../../../shared/hooks/useDebounce'
import { StatusChip } from '../../../shared/ui/StatusChip'
import { visuallyHidden } from '../../../shared/ui/visuallyHidden'
import { useCurso, useCursosBuscar } from '../api/useCursos'
import type { Curso } from '../model/types'

export interface CursoSelectProps {
  /** Id del curso elegido, o `null` si no hay ninguno. */
  value: number | null
  onChange: (cursoId: number | null, curso: Curso | null) => void
  /** Ofrece solo cursos ACTIVO: úsalo en altas (p. ej. una nueva inscripción). */
  soloActivos?: boolean
  label?: string
  required?: boolean
  disabled?: boolean
  error?: boolean
  helperText?: ReactNode
  fullWidth?: boolean
}

/** Selector de curso con búsqueda en el servidor. El elegido se resuelve por id, así se ve aunque no esté en la lista. */
export function CursoSelect({
  value,
  onChange,
  soloActivos = false,
  label = 'Curso',
  required = false,
  disabled = false,
  error = false,
  helperText,
  fullWidth = true,
}: CursoSelectProps) {
  const [texto, setTexto] = useState('')
  const buscado = useDebounce(texto.trim(), 300)
  const busqueda = useCursosBuscar(buscado, soloActivos ? 'ACTIVO' : undefined)
  const elegido = useCurso(value)

  const opciones = useMemo(() => {
    const lista = busqueda.data ?? []
    const actual = elegido.data
    return actual && !lista.some((curso) => curso.id === actual.id) ? [actual, ...lista] : lista
  }, [busqueda.data, elegido.data])

  const seleccionado = value === null ? null : (opciones.find((curso) => curso.id === value) ?? null)
  const fallo = busqueda.isError

  return (
    <Autocomplete
      options={opciones}
      value={seleccionado}
      onChange={(_, curso) => onChange(curso?.id ?? null, curso)}
      onInputChange={(_, nuevo, motivo) => {
        // Solo cuenta lo que el usuario escribe: al elegir una opción el cuadro muestra su nombre.
        if (motivo === 'input') setTexto(nuevo)
        else setTexto('')
      }}
      // El servidor ya filtró: no se vuelve a filtrar en el navegador.
      filterOptions={(todas) => todas}
      getOptionLabel={(curso) => curso.nombre}
      isOptionEqualToValue={(opcion, valor) => opcion.id === valor.id}
      loading={busqueda.isFetching}
      loadingText="Buscando cursos…"
      disabled={disabled}
      fullWidth={fullWidth}
      noOptionsText={
        fallo ? (
          <Button size="small" onClick={() => void busqueda.refetch()}>
            No se pudieron cargar. Reintentar
          </Button>
        ) : buscado ? (
          `No hay cursos que coincidan con «${buscado}»`
        ) : (
          'No hay cursos'
        )
      }
      renderOption={(props, curso) => {
        const { key, ...rest } = props
        return (
          <Box component="li" key={key} {...rest} sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {curso.nombre}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {curso.nivel}
              </Typography>
            </Box>
            {curso.estado !== 'ACTIVO' && <StatusChip estado={curso.estado} />}
          </Box>
        )
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          required={required}
          error={error || fallo}
          placeholder="Escribe el nombre para buscar"
          helperText={fallo ? 'No se pudieron cargar los cursos.' : helperText}
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
