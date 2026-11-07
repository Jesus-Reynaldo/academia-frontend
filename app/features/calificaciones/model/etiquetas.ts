import type { CursoResumen, DocenteResumen, EstudianteResumen, InscripcionOpcion } from './types'

// Funciones pequeñas que arman los textos que se muestran en tablas, filtros y formularios.

export function nombreEstudiante(estudiante: Pick<EstudianteResumen, 'nombres' | 'apellidos'>): string {
  return `${estudiante.apellidos} ${estudiante.nombres}`.trim()
}

export function nombreDocente(docente: Pick<DocenteResumen, 'nombres' | 'apellidos'> | null): string {
  return docente ? `${docente.apellidos} ${docente.nombres}`.trim() : 'Sin docente'
}

export function nombreCurso(curso: Pick<CursoResumen, 'nombre' | 'paralelo'>): string {
  return curso.paralelo ? `${curso.nombre} «${curso.paralelo}»` : curso.nombre
}

/** "Estudiante · Curso · Período" (docs/UI-UX-PLAN.md, 8.10). */
export function etiquetaInscripcion(inscripcion: InscripcionOpcion): string {
  return `${nombreEstudiante(inscripcion.estudiante)} · ${nombreCurso(inscripcion.curso)} · ${inscripcion.periodoAcademico.nombre}`
}
