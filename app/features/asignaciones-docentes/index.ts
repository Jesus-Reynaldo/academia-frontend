// API pública del feature "asignaciones-docentes". Exporta aquí solo lo que otros módulos pueden usar.
export { AsignacionesListPage } from './pages/AsignacionesListPage'
export { useAsignacionesDelCurso } from './api/useAsignaciones'
export type { AsignacionDocente, EstadoAsignacion } from './model/types'
