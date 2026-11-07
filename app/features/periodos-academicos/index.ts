// API pública del feature "periodos-academicos". Exporta aquí solo lo que otros módulos pueden usar.
export { PeriodosListPage } from './pages/PeriodosListPage'
export { PeriodoSelect, type PeriodoSelectProps } from './components/PeriodoSelect'
export { usePeriodosReferencia } from './api/usePeriodos'
export type { EstadoPeriodo, PeriodoAcademico } from './model/types'
