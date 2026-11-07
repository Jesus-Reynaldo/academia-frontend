import Autocomplete from '@mui/material/Autocomplete'
import TextField from '@mui/material/TextField'
import { useState } from 'react'
import { useDebounce } from '../../../shared/hooks/useDebounce'
import { useBuscarEstudiantes, useEstudianteReferencia } from '../api/useCalificaciones'
import { nombreEstudiante } from '../model/etiquetas'
import type { EstudianteResumen } from '../model/types'

interface EstudianteFiltroProps {
  /** id del estudiante filtrado (viene de la URL). */
  value: number | undefined
  onChange: (id: number | null) => void
}

/** Filtro por estudiante: la búsqueda se hace en el servidor (puede haber cientos de estudiantes). */
export function EstudianteFiltro({ value, onChange }: EstudianteFiltroProps) {
  const [abierto, setAbierto] = useState(false)
  const [texto, setTexto] = useState('')
  const textoDebounced = useDebounce(texto.trim(), 300)

  const busqueda = useBuscarEstudiantes(textoDebounced, abierto)
  const elegido = useEstudianteReferencia(value)

  const opciones: EstudianteResumen[] = busqueda.data ?? []
  // Si el elegido no está en la lista actual (p. ej. al abrir un enlace), se agrega para que se vea su nombre.
  const seleccionado = elegido.data ?? opciones.find((opcion) => opcion.id === value) ?? null
  const opcionesConElegido =
    seleccionado && !opciones.some((opcion) => opcion.id === seleccionado.id) ? [seleccionado, ...opciones] : opciones

  return (
    <Autocomplete
      options={opcionesConElegido}
      value={seleccionado}
      open={abierto}
      onOpen={() => setAbierto(true)}
      onClose={() => setAbierto(false)}
      loading={busqueda.isFetching}
      // El servidor ya filtra: se desactiva el filtro del navegador.
      filterOptions={(opcionesActuales) => opcionesActuales}
      getOptionLabel={(opcion) => `${nombreEstudiante(opcion)} (${opcion.codigo})`}
      isOptionEqualToValue={(opcion, valor) => opcion.id === valor.id}
      onInputChange={(_event, nuevoTexto, razon) => {
        if (razon === 'input') setTexto(nuevoTexto)
      }}
      onChange={(_event, opcion) => onChange(opcion?.id ?? null)}
      noOptionsText="No se encontraron estudiantes"
      loadingText="Buscando…"
      clearText="Quitar filtro"
      openText="Abrir lista"
      closeText="Cerrar lista"
      renderInput={(params) => (
        <TextField {...params} label="Estudiante" placeholder="Buscar por nombre o código" />
      )}
    />
  )
}
