import Autocomplete from '@mui/material/Autocomplete'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import type { Ref, ReactNode } from 'react'
import { etiquetaInscripcion } from '../model/etiquetas'
import type { InscripcionOpcion } from '../model/types'
import { visuallyHidden } from '../../../shared/ui/visuallyHidden'

interface InscripcionAutocompleteProps {
  opciones: InscripcionOpcion[]
  /** id de la inscripción elegida (null = ninguna). */
  value: number | null
  onChange: (id: number | null) => void
  onBlur?: () => void
  inputRef?: Ref<HTMLInputElement>
  cargando?: boolean
  error?: string
  /** Texto de ayuda cuando no hay error. */
  ayuda?: ReactNode
}

/**
 * Autocompletar de inscripciones: muestra "Estudiante · Curso · Período" (docs/UI-UX-PLAN.md, 8.10).
 * El filtrado por texto lo hace MUI en el navegador sobre la lista ya cargada.
 */
export function InscripcionAutocomplete({
  opciones,
  value,
  onChange,
  onBlur,
  inputRef,
  cargando = false,
  error,
  ayuda,
}: InscripcionAutocompleteProps) {
  const seleccionada = opciones.find((opcion) => opcion.id === value) ?? null

  return (
    <Autocomplete
      options={opciones}
      value={seleccionada}
      loading={cargando}
      getOptionLabel={etiquetaInscripcion}
      isOptionEqualToValue={(opcion, valor) => opcion.id === valor.id}
      onChange={(_event, opcion) => onChange(opcion?.id ?? null)}
      onBlur={onBlur}
      noOptionsText="No hay inscripciones activas que coincidan"
      loadingText="Cargando inscripciones…"
      clearText="Quitar selección"
      openText="Abrir lista"
      closeText="Cerrar lista"
      renderInput={(params) => (
        <TextField
          {...params}
          inputRef={inputRef}
          required
          label={
            <>
              Inscripción
              <Box component="span" sx={visuallyHidden}>
                {' '}
                (obligatorio)
              </Box>
            </>
          }
          placeholder="Escribe el nombre del estudiante"
          error={Boolean(error)}
          helperText={error ?? ayuda}
        />
      )}
    />
  )
}
