import FilterListIcon from '@mui/icons-material/FilterList'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Collapse from '@mui/material/Collapse'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import { useTheme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useState } from 'react'
import { usePeriodosReferencia } from '../../periodos-academicos'
import { useCursosReferencia, useDocentesReferencia, useMateriasReferencia } from '../api/useCalificaciones'
import { nombreCurso, nombreDocente } from '../model/etiquetas'
import { ETIQUETA_TIPO, TIPOS_EVALUACION, type CalificacionListParams, type TipoEvaluacion } from '../model/types'
import { toInputDate } from '../model/schema'
import { EstudianteFiltro } from './EstudianteFiltro'

interface CalificacionFiltrosProps {
  params: CalificacionListParams
  /** Aplica cambios a la URL (los valores vacíos se quitan). */
  onChange: (changes: Record<string, string | number | null>) => void
  /** ADMIN y DOCENTE pueden filtrar por estudiante; el ESTUDIANTE solo ve las suyas. */
  mostrarEstudiante: boolean
  /** Solo ADMIN: un DOCENTE ya solo ve las suyas y la API no le deja listar docentes. */
  mostrarDocente: boolean
  cantidadActivos: number
  onLimpiar: () => void
}

// Props comunes de los selectores: la etiqueta siempre arriba y la opción "Todos" visible.
const propsSelect = { select: true, slotProps: { select: { displayEmpty: true }, inputLabel: { shrink: true } } } as const

export function CalificacionFiltros({
  params,
  onChange,
  mostrarEstudiante,
  mostrarDocente,
  cantidadActivos,
  onLimpiar,
}: CalificacionFiltrosProps) {
  const theme = useTheme()
  const esMovil = useMediaQuery(theme.breakpoints.down('sm'))
  // En pantallas pequeñas los filtros se pliegan para no ocupar toda la pantalla.
  const [abierto, setAbierto] = useState(false)

  const materias = useMateriasReferencia()
  const cursos = useCursosReferencia()
  const periodos = usePeriodosReferencia()
  const docentes = useDocentesReferencia(mostrarDocente)

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
        {esMovil && (
          <Button
            startIcon={<FilterListIcon />}
            onClick={() => setAbierto((valor) => !valor)}
            aria-expanded={abierto}
            aria-controls="filtros-calificaciones"
            sx={{ minHeight: 44 }}
          >
            {cantidadActivos > 0 ? `Filtros (${cantidadActivos})` : 'Filtros'}
          </Button>
        )}

        <Collapse in={!esMovil || abierto} id="filtros-calificaciones">
          <Box
            sx={{
              display: 'grid',
              gap: 2,
              pt: esMovil ? 1.5 : 0,
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
            }}
          >
            <TextField
              {...propsSelect}
              label="Materia"
              value={params.materiaId ?? ''}
              onChange={(event) => onChange({ materiaId: event.target.value })}
            >
              <MenuItem value="">Todas</MenuItem>
              {materias.data?.map((materia) => (
                <MenuItem key={materia.id} value={materia.id}>
                  {materia.nombre}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              {...propsSelect}
              label="Tipo"
              value={params.tipo ?? ''}
              onChange={(event) => onChange({ tipo: event.target.value })}
            >
              <MenuItem value="">Todos</MenuItem>
              {TIPOS_EVALUACION.map((tipo: TipoEvaluacion) => (
                <MenuItem key={tipo} value={tipo}>
                  {ETIQUETA_TIPO[tipo]}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              {...propsSelect}
              label="Curso"
              value={params.cursoId ?? ''}
              onChange={(event) => onChange({ cursoId: event.target.value })}
            >
              <MenuItem value="">Todos</MenuItem>
              {cursos.data?.map((curso) => (
                <MenuItem key={curso.id} value={curso.id}>
                  {nombreCurso(curso)}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              {...propsSelect}
              label="Período"
              value={params.periodoAcademicoId ?? ''}
              onChange={(event) => onChange({ periodoAcademicoId: event.target.value })}
            >
              <MenuItem value="">Todos</MenuItem>
              {periodos.data?.map((periodo) => (
                <MenuItem key={periodo.id} value={periodo.id}>
                  {periodo.nombre}
                </MenuItem>
              ))}
            </TextField>

            {mostrarEstudiante && (
              <EstudianteFiltro
                value={params.estudianteId}
                onChange={(id) => onChange({ estudianteId: id })}
              />
            )}

            {mostrarDocente && (
              <TextField
                {...propsSelect}
                label="Docente"
                value={params.docenteId ?? ''}
                onChange={(event) => onChange({ docenteId: event.target.value })}
              >
                <MenuItem value="">Todos</MenuItem>
                {docentes.data?.map((docente) => (
                  <MenuItem key={docente.id} value={docente.id}>
                    {nombreDocente(docente)}
                  </MenuItem>
                ))}
              </TextField>
            )}

            <TextField
              type="date"
              label="Desde"
              value={params.fechaDesde ? toInputDate(params.fechaDesde) : ''}
              onChange={(event) => onChange({ fechaDesde: event.target.value })}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              type="date"
              label="Hasta"
              value={params.fechaHasta ? toInputDate(params.fechaHasta) : ''}
              onChange={(event) => onChange({ fechaHasta: event.target.value })}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Box>
        </Collapse>

        {cantidadActivos > 0 && (
          <Button onClick={onLimpiar} sx={{ mt: 1.5, minHeight: 44 }}>
            Limpiar filtros
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
