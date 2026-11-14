// API pública del feature "inscripciones". Exporta aquí solo lo que otros módulos pueden usar.
export { InscripcionesListPage } from './pages/InscripcionesListPage'
export { MiCuentaPage } from './pages/MiCuentaPage'
export { reporteInscripciones } from './reportes/inscripcionesPdf'
export { descargarConstancia } from './reportes/constanciaPdf'
export { useInscripcionesList } from './api/useInscripciones'
export type { EstadoInscripcion, Inscripcion } from './model/types'
