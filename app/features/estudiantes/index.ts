// API pública del feature "estudiantes". Exporta aquí solo lo que otros módulos pueden usar.
export { EstudiantesListPage } from './pages/EstudiantesListPage'
export { EstudianteFichaPage } from './pages/EstudianteFichaPage'
export { EstudianteSelect, type EstudianteSelectProps } from './components/EstudianteSelect'
export { useEstudiante } from './api/useEstudiantes'
export type { EstadoEstudiante, Estudiante } from './model/types'
