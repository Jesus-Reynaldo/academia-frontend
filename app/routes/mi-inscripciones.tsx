import { Navigate } from 'react-router'

// Las inscripciones del estudiante ahora están dentro de «Mi cuenta».
export default function MisInscripciones() {
  return <Navigate to="/mi/cuenta#inscripciones" replace />
}
