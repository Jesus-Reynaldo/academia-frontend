// Única fuente de configuración: ningún componente escribe URLs a mano (RNF-06).
export const API_URL: string = (
  import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1'
).replace(/\/+$/, '')

// Nota mínima de aprobación. Debe coincidir con NOTA_APROBACION del backend (51 por defecto).
export const NOTA_APROBACION = 51
