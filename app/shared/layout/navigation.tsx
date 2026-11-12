import type { ReactElement } from 'react'
import DashboardOutlined from '@mui/icons-material/DashboardOutlined'
import SchoolOutlined from '@mui/icons-material/SchoolOutlined'
import BadgeOutlined from '@mui/icons-material/BadgeOutlined'
import ClassOutlined from '@mui/icons-material/ClassOutlined'
import MenuBookOutlined from '@mui/icons-material/MenuBookOutlined'
import EventNoteOutlined from '@mui/icons-material/EventNoteOutlined'
import AssignmentIndOutlined from '@mui/icons-material/AssignmentIndOutlined'
import GradeOutlined from '@mui/icons-material/GradeOutlined'
import ManageAccountsOutlined from '@mui/icons-material/ManageAccountsOutlined'
import HistoryEduOutlined from '@mui/icons-material/HistoryEduOutlined'
import AccountCircleOutlined from '@mui/icons-material/AccountCircleOutlined'
import HomeOutlined from '@mui/icons-material/HomeOutlined'
import type { Rol } from '../config/roles'

export interface NavItem {
  label: string
  to: string
  icon: ReactElement
  group?: string
}

const inicio = (label: string): NavItem => ({ label, to: '/', icon: <DashboardOutlined /> })

/** Menú según el rol del usuario (el servidor sigue siendo la autoridad de permisos). */
export function navigationFor(rol: Rol): NavItem[] {
  switch (rol) {
    case 'ADMIN':
      return [
        inicio('Panel'),
        { label: 'Estudiantes', to: '/estudiantes', icon: <SchoolOutlined />, group: 'Personas' },
        { label: 'Docentes', to: '/docentes', icon: <BadgeOutlined />, group: 'Personas' },
        { label: 'Usuarios', to: '/usuarios', icon: <ManageAccountsOutlined />, group: 'Personas' },
        { label: 'Cursos', to: '/cursos', icon: <ClassOutlined />, group: 'Académico' },
        { label: 'Materias', to: '/materias', icon: <MenuBookOutlined />, group: 'Académico' },
        { label: 'Períodos', to: '/periodos-academicos', icon: <EventNoteOutlined />, group: 'Académico' },
        { label: 'Inscripciones', to: '/inscripciones', icon: <AssignmentIndOutlined />, group: 'Gestión' },
        { label: 'Calificaciones', to: '/calificaciones', icon: <GradeOutlined />, group: 'Gestión' },
      ]
    case 'DOCENTE':
      return [
        inicio('Inicio'),
        { label: 'Mis calificaciones', to: '/mi/calificaciones', icon: <GradeOutlined /> },
        { label: 'Estudiantes', to: '/estudiantes', icon: <SchoolOutlined /> },
        { label: 'Cursos', to: '/cursos', icon: <ClassOutlined /> },
        { label: 'Materias', to: '/materias', icon: <MenuBookOutlined /> },
      ]
    case 'ESTUDIANTE':
      return [
        // Estos 4 destinos son también la barra inferior en celular (docs/PLAN-FASE-2.md, 2.4).
        { label: 'Inicio', to: '/', icon: <HomeOutlined /> },
        { label: 'Mis materias', to: '/mi/materias', icon: <MenuBookOutlined /> },
        { label: 'Historial', to: '/mi/historial', icon: <HistoryEduOutlined /> },
        { label: 'Mi cuenta', to: '/mi/cuenta', icon: <AccountCircleOutlined /> },
      ]
  }
}
