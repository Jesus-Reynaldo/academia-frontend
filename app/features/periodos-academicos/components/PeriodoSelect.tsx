import Autocomplete from '@mui/material/Autocomplete'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import { useMemo, type ReactNode } from 'react'
import { StatusChip } from '../../../shared/ui/StatusChip'
import { visuallyHidden } from '../../../shared/ui/visuallyHidden'
import { usePeriodosReferencia } from '../api/usePeriodos'
import type { EstadoPeriodo, PeriodoAcademico } from '../model/types'

export interface PeriodoSelectProps {
  /** Id del período elegido, o `null` si no hay ninguno. */
  value: number | null
  onChange: (periodoId: number | null, periodo: PeriodoAcademico | null) => void
  /**
   * Oculta los períodos FINALIZADO: úsalo en altas (p. ej. nueva inscripción), donde la API los rechaza.
   * Si `value` ya es uno finalizado (edición), sigue apareciendo para no perder la selección.
   */
  excluirFinalizados?: boolean
  label?: string
  required?: boolean
  disabled?: boolean
  error?: boolean
  helperText?: ReactNode
  fullWidth?: boolean
}

const ORDEN_ESTADO: Record<EstadoPeriodo, number> = {
  ACTIVO: 0,
  PLANIFICADO: 1,
  FINALIZADO: 2,
}

/** Activo primero, luego planificados y al final los finalizados; dentro de cada grupo, el más reciente antes. */
function ordenar(periodos: PeriodoAcademico[]): PeriodoAcademico[] {
  return [...periodos].sort(
    (a, b) =>
      ORDEN_ESTADO[a.estado] - ORDEN_ESTADO[b.estado] ||
      new Date(b.fechaInicio).getTime() - new Date(a.fechaInicio).getTime(),
  )
}

/**
 * Selector de período académico con búsqueda. Usa los datos de referencia en caché (`usePeriodosReferencia`),
 * así que varios selectores en pantalla no repiten la petición.
 */
export function PeriodoSelect({
  value,
  onChange,
  excluirFinalizados = false,
  label = 'Período académico',
  required = false,
  disabled = false,
  error = false,
  helperText,
  fullWidth = true,
}: PeriodoSelectProps) {
  const referencia = usePeriodosReferencia()

  const opciones = useMemo(() => {
    const todos = referencia.data ?? []
    const visibles = excluirFinalizados ? todos.filter((p) => p.estado !== 'FINALIZADO' || p.id === value) : todos
    return ordenar(visibles)
  }, [referencia.data, excluirFinalizados, value])

  const seleccionado = opciones.find((p) => p.id === value) ?? null
  const fallo = referencia.isError

  return (
    <Autocomplete
      options={opciones}
      value={seleccionado}
      onChange={(_, periodo) => onChange(periodo?.id ?? null, periodo)}
      getOptionLabel={(periodo) => periodo.nombre}
      isOptionEqualToValue={(opcion, valor) => opcion.id === valor.id}
      loading={referencia.isPending}
      loadingText="Cargando períodos…"
      disabled={disabled}
      fullWidth={fullWidth}
      noOptionsText={
        fallo ? (
          <Button size="small" onClick={() => void referencia.refetch()}>
            No se pudieron cargar. Reintentar
          </Button>
        ) : excluirFinalizados ? (
          'No hay períodos disponibles'
        ) : (
          'No hay períodos'
        )
      }
      renderOption={(props, periodo) => {
        const { key, ...rest } = props
        return (
          <Box component="li" key={key} {...rest} sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}>
            <span>{periodo.nombre}</span>
            <StatusChip estado={periodo.estado} />
          </Box>
        )
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          required={required}
          error={error || fallo}
          helperText={fallo ? 'No se pudieron cargar los períodos.' : helperText}
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
