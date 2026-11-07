import Autocomplete from '@mui/material/Autocomplete'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useMemo, useState, type ReactNode } from 'react'
import { useDebounce } from '../../../shared/hooks/useDebounce'
import { StatusChip } from '../../../shared/ui/StatusChip'
import { visuallyHidden } from '../../../shared/ui/visuallyHidden'
import { useMateria, useMateriasBuscar } from '../api/useMaterias'
import type { Materia } from '../model/types'

export interface MateriaSelectProps {
  /** Id de la materia elegida, o `null` si no hay ninguna. */
  value: number | null
  onChange: (materiaId: number | null, materia: Materia | null) => void
  /**
   * Ofrece solo materias ACTIVA: úsalo en altas (p. ej. registrar una calificación). Si `value` ya es una
   * inactiva (edición), sigue apareciendo para no perder la selección.
   */
  soloActivas?: boolean
  label?: string
  required?: boolean
  disabled?: boolean
  error?: boolean
  helperText?: ReactNode
  fullWidth?: boolean
}

const etiqueta = (materia: Materia) => `${materia.nombre} (${materia.codigo})`

/**
 * Selector de materia con búsqueda por nombre en el servidor (sirve aunque haya más materias que una página).
 * Las búsquedas se cachean por texto; la materia ya elegida se resuelve por id, así que se ve su nombre aunque
 * no esté en la lista visible.
 */
export function MateriaSelect({
  value,
  onChange,
  soloActivas = false,
  label = 'Materia',
  required = false,
  disabled = false,
  error = false,
  helperText,
  fullWidth = true,
}: MateriaSelectProps) {
  const [texto, setTexto] = useState('')
  const buscado = useDebounce(texto.trim(), 300)
  const busqueda = useMateriasBuscar(buscado, soloActivas ? 'ACTIVA' : undefined)
  const elegida = useMateria(value)

  const opciones = useMemo(() => {
    const lista = busqueda.data ?? []
    const actual = elegida.data
    return actual && !lista.some((materia) => materia.id === actual.id) ? [actual, ...lista] : lista
  }, [busqueda.data, elegida.data])

  const seleccionada = value === null ? null : (opciones.find((materia) => materia.id === value) ?? null)
  const fallo = busqueda.isError

  return (
    <Autocomplete
      options={opciones}
      value={seleccionada}
      onChange={(_, materia) => onChange(materia?.id ?? null, materia)}
      onInputChange={(_, nuevo, motivo) => {
        // Solo cuenta lo que el usuario escribe: al elegir una opción el cuadro muestra su nombre, y eso no es una búsqueda.
        if (motivo === 'input') setTexto(nuevo)
        else setTexto('')
      }}
      // El servidor ya filtró por nombre: no se vuelve a filtrar en el navegador.
      filterOptions={(todas) => todas}
      getOptionLabel={etiqueta}
      isOptionEqualToValue={(opcion, valor) => opcion.id === valor.id}
      loading={busqueda.isFetching}
      loadingText="Buscando materias…"
      disabled={disabled}
      fullWidth={fullWidth}
      noOptionsText={
        fallo ? (
          <Button size="small" onClick={() => void busqueda.refetch()}>
            No se pudieron cargar. Reintentar
          </Button>
        ) : buscado ? (
          `No hay materias que coincidan con «${buscado}»`
        ) : soloActivas ? (
          'No hay materias activas'
        ) : (
          'No hay materias'
        )
      }
      renderOption={(props, materia) => {
        const { key, ...rest } = props
        return (
          <Box component="li" key={key} {...rest} sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {materia.nombre}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {materia.codigo}
              </Typography>
            </Box>
            {materia.estado !== 'ACTIVA' && <StatusChip estado={materia.estado} />}
          </Box>
        )
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          required={required}
          error={error || fallo}
          placeholder="Escribe el nombre para buscar"
          helperText={fallo ? 'No se pudieron cargar las materias.' : helperText}
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
