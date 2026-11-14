import { useState } from 'react'
import { useUrlParams } from '../hooks/useUrlParams'
import { SearchField } from './SearchField'

interface BuscadorUrlProps {
  /** Qué se puede escribir: «Estudiante, curso o gestión». */
  placeholder: string
  minWidth?: number
}

/**
 * Buscador por contenido que guarda el texto en la URL (`?q=`): el servidor busca palabra por palabra en las
 * columnas visibles. Si otra parte de la página borra `q` (p. ej. «Limpiar filtros»), el cuadro se vacía solo.
 */
export function BuscadorUrl({ placeholder, minWidth = 280 }: BuscadorUrlProps) {
  const [searchParams, updateParams] = useUrlParams()
  const q = searchParams.get('q') ?? ''
  // Si q cambió desde fuera (no por lo que se escribió aquí), se reinicia el cuadro con el valor nuevo.
  const [ultimo, setUltimo] = useState(q)
  const [clave, setClave] = useState(0)
  if (q !== ultimo) {
    setUltimo(q)
    setClave((c) => c + 1)
  }
  return (
    <div style={{ minWidth }}>
      <SearchField
        key={clave}
        label="Buscar"
        placeholder={placeholder}
        delayMs={300}
        initialValue={q}
        onSearch={(texto) => {
          setUltimo(texto)
          updateParams({ q: texto || null }, { replace: true })
        }}
      />
    </div>
  )
}
