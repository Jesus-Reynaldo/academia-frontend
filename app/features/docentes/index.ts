// API pública del feature "docentes". Exporta aquí solo lo que otros módulos pueden usar.
export { DocentesListPage } from './pages/DocentesListPage'
export { DocenteFichaPage } from './pages/DocenteFichaPage'
export { DocenteSelect, type DocenteSelectProps } from './components/DocenteSelect'
export { useDocente } from './api/useDocentes'
export type { Docente, EstadoDocente } from './model/types'
