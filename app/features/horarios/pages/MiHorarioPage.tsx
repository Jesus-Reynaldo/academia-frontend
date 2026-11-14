import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import { useState } from 'react'
import { EmptyState } from '../../../shared/ui/EmptyState'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { QueryState } from '../../../shared/ui/QueryState'
import { useUsuario } from '../../autenticacion'
import { useHorarios } from '../api/horarios'
import { HorarioSemanal } from '../components/HorarioSemanal'
import { descargarHorario } from '../reportes/horarioPdf'
import type { Horario } from '../model/types'

/** Períodos que aparecen en los horarios, el activo primero. */
function periodosDe(horarios: Horario[]) {
  const mapa = new Map(horarios.map((h) => [h.asignacion.periodoAcademico.id, h.asignacion.periodoAcademico]))
  return [...mapa.values()].sort((a, b) => Number(b.estado === 'ACTIVO') - Number(a.estado === 'ACTIVO') || b.id - a.id)
}

/**
 * «Mi horario»: el DOCENTE ve sus clases (curso y aula); el ESTUDIANTE, las de los cursos en que está inscrito
 * (materia, docente y aula). El servidor solo entrega lo que corresponde a cada uno.
 */
export function MiHorarioPage() {
  const usuario = useUsuario()
  const esDocente = usuario.rol === 'DOCENTE'
  const query = useHorarios({})
  const [elegido, setElegido] = useState<number | null>(null)

  return (
    <QueryState query={query} skeletonHeight={360}>
      {(todos) => {
        const periodos = periodosDe(todos)
        const periodo = periodos.find((p) => p.id === elegido) ?? periodos[0]
        const horarios = periodo ? todos.filter((h) => h.asignacion.periodoAcademico.id === periodo.id) : []
        const cursos = [...new Set(horarios.map((h) => h.asignacion.curso.nombre))]
        const subtitulo = periodo
          ? `${periodo.nombre} · ${esDocente ? `${horarios.length} ${horarios.length === 1 ? 'clase' : 'clases'} por semana` : cursos.join(', ')}`
          : undefined
        return (
          <>
            <PageHeader
              title="Mi horario"
              modulo="horarios"
              subtitle={subtitulo}
              reporte={
                periodo
                  ? () =>
                      descargarHorario({
                        horarios,
                        vista: esDocente ? 'docente' : 'estudiante',
                        titulo: 'Mi horario',
                        subtitulo: `${usuario.nombre ?? ''}${usuario.nombre ? ' · ' : ''}${subtitulo}`,
                        archivo: 'mi-horario',
                      })
                  : undefined
              }
            />
            {periodos.length > 1 && (
              <TextField select label="Período" value={periodo?.id ?? ''} onChange={(e) => setElegido(Number(e.target.value))} sx={{ mb: 2, minWidth: 220 }}>
                {periodos.map((p) => <MenuItem key={p.id} value={p.id}>{p.nombre}</MenuItem>)}
              </TextField>
            )}
            {horarios.length === 0 ? (
              <EmptyState
                title="Aún no tienes horario"
                description={
                  esDocente
                    ? 'Cuando el administrador registre los horarios de tus materias, aparecerán aquí.'
                    : 'Cuando el administrador registre el horario de tu curso, aparecerá aquí.'
                }
              />
            ) : (
              <HorarioSemanal horarios={horarios} vista={esDocente ? 'docente' : 'estudiante'} />
            )}
          </>
        )
      }}
    </QueryState>
  )
}
