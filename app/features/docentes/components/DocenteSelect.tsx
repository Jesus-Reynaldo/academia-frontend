import Autocomplete from '@mui/material/Autocomplete'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useMemo, useState, type ReactNode } from 'react'
import { useDebounce } from '../../../shared/hooks/useDebounce'
import { StatusChip } from '../../../shared/ui/StatusChip'
import { visuallyHidden } from '../../../shared/ui/visuallyHidden'
import { useDocente, useDocentesBuscar } from '../api/useDocentes'
import type { Docente } from '../model/types'

export interface DocenteSelectProps {
  /** Id del docente elegido, o `null` si no hay ninguno. */
  value: number | null
  onChange: (docenteId: number | null, docente: Docente | null) => void
  label?: string
  required?: boolean
  disabled?: boolean
  error?: boolean
  helperText?: ReactNode
  fullWidth?: boolean
}

const etiqueta = (docente: Docente) => `${docente.apellidos}, ${docente.nombres} (${docente.codigo})`

/** Selector de docente con búsqueda en el servidor. El elegido se resuelve por id, así se ve aunque no esté en la lista. */
export function DocenteSelect({
  value,
  onChange,
  label = 'Docente',
  required = false,
  disabled = false,
  error = false,
  helperText,
  fullWidth = true,
}: DocenteSelectProps) {
  const [texto, setTexto] = useState('')
  const buscado = useDebounce(texto.trim(), 300)
  const busqueda = useDocentesBuscar(buscado)
  const elegido = useDocente(value)

  const opciones = useMemo(() => {
    const lista = busqueda.data ?? []
    const actual = elegido.data
    return actual && !lista.some((docente) => docente.id === actual.id) ? [actual, ...lista] : lista
  }, [busqueda.data, elegido.data])

  const seleccionado = value === null ? null : (opciones.find((docente) => docente.id === value) ?? null)
  const fallo = busqueda.isError

  return (
    <Autocomplete
      options={opciones}
      value={seleccionado}
      onChange={(_, docente) => onChange(docente?.id ?? null, docente)}
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
      loadingText="Buscando docentes…"
      disabled={disabled}
      fullWidth={fullWidth}
      noOptionsText={
        fallo ? (
          <Button size="small" onClick={() => void busqueda.refetch()}>
            No se pudieron cargar. Reintentar
          </Button>
        ) : buscado ? (
          `No hay docentes que coincidan con «${buscado}»`
        ) : (
          'No hay docentes'
        )
      }
      renderOption={(props, docente) => {
        const { key, ...rest } = props
        return (
          <Box component="li" key={key} {...rest} sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {`${docente.apellidos}, ${docente.nombres}`}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {docente.codigo}
              </Typography>
            </Box>
            {docente.estado !== 'ACTIVO' && <StatusChip estado={docente.estado} />}
          </Box>
        )
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          required={required}
          error={error || fallo}
          placeholder="Escribe el nombre para buscar"
          helperText={fallo ? 'No se pudieron cargar los docentes.' : helperText}
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
