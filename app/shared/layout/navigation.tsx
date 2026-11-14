import type { ReactElement } from 'react'
import { ICONO_MODULO, type Modulo } from '../config/modulos'
import type { Rol } from '../config/roles'

export interface NavItem {
  label: string
  to: string
  icon: ReactElement
  group?: string
}

/** Cada destino usa el ícono de su módulo (shared/config/modulos.tsx): el mismo en todo el sistema. */
const item = (label: string, to: string, modulo: Modulo, group?: string): NavItem => {
  const Icono = ICONO_MODULO[modulo]
  return { label, to, icon: <Icono />, group }
}

/** Menú según el rol del usuario (el servidor sigue siendo la autoridad de permisos). */
export function navigationFor(rol: Rol): NavItem[] {
  switch (rol) {
    case 'ADMIN':
      return [
        item('Inicio', '/', 'inicio'),
        item('Estudiantes', '/estudiantes', 'estudiantes', 'Personas'),
        item('Docentes', '/docentes', 'docentes', 'Personas'),
        item('Usuarios', '/usuarios', 'usuarios', 'Personas'),
        item('Cursos', '/cursos', 'cursos', 'Académico'),
        item('Materias', '/materias', 'materias', 'Académico'),
        item('Períodos', '/periodos-academicos', 'periodos', 'Académico'),
        item('Asignación docente', '/asignaciones-docentes', 'asignaciones', 'Académico'),
        item('Aulas', '/aulas', 'aulas', 'Académico'),
        item('Horarios', '/horarios', 'horarios', 'Académico'),
        item('Inscripciones', '/inscripciones', 'inscripciones', 'Gestión'),
        item('Calificaciones', '/calificaciones', 'calificaciones', 'Gestión'),
        item('Bitácora', '/bitacora', 'bitacora', 'Sistema'),
        item('Backup', '/backup', 'respaldo', 'Sistema'),
        item('Configuración', '/configuracion', 'configuracion', 'Sistema'),
      ]
    case 'DOCENTE':
      return [
        item('Inicio', '/', 'inicio'),
        item('Mi horario', '/mi/horario', 'horarios'),
        item('Mis asignaciones', '/asignaciones-docentes', 'asignaciones'),
        item('Mis calificaciones', '/mi/calificaciones', 'calificaciones'),
        item('Estudiantes', '/estudiantes', 'estudiantes'),
        item('Cursos', '/cursos', 'cursos'),
        item('Materias', '/materias', 'materias'),
      ]
    case 'ESTUDIANTE':
      return [
        // Estos 5 destinos son también la barra inferior en celular (docs/PLAN-FASE-2.md, 2.4).
        item('Inicio', '/', 'inicio'),
        item('Mis materias', '/mi/materias', 'materias'),
        item('Horario', '/mi/horario', 'horarios'),
        item('Historial', '/mi/historial', 'historial'),
        item('Mi cuenta', '/mi/cuenta', 'cuenta'),
      ]
  }
}
