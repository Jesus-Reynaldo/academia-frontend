import SchoolRounded from '@mui/icons-material/SchoolRounded'
import { useInstitucion } from './useInstitucion'

interface LogoInstitucionProps {
  /** Lado del cuadro en píxeles. */
  tamano?: number
  /** Clases del cuadro cuando no hay logo (fondo y color del ícono por defecto). */
  className?: string
}

/**
 * Logotipo de la institución, o el birrete por defecto si no se cargó ninguno.
 * Decorativo (alt vacío): el nombre de la institución siempre aparece escrito al lado.
 */
export function LogoInstitucion({ tamano = 40, className = 'bg-white/15 text-white' }: LogoInstitucionProps) {
  const { logoUrl } = useInstitucion()
  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt=""
        width={tamano}
        height={tamano}
        className="shrink-0 rounded-lg bg-white object-contain p-0.5"
        style={{ width: tamano, height: tamano }}
      />
    )
  }
  return (
    <span aria-hidden className={`grid shrink-0 place-items-center rounded-lg ${className}`} style={{ width: tamano, height: tamano }}>
      <SchoolRounded style={{ fontSize: tamano * 0.6 }} />
    </span>
  )
}
