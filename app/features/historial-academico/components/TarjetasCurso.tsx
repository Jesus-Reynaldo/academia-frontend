import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import type { ReactNode } from 'react'
import { desglosar, estaDebajo } from '../model/desglose'
import type { HistorialCurso } from '../model/types'
import { NotaHistorial } from './NotaHistorial'

function Dato({ etiqueta, children }: { etiqueta: string; children: ReactNode }) {
  return (
    <Box component="li" sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, py: 0.25 }}>
      <Typography component="span" variant="body2" color="text.secondary">
        {etiqueta}
      </Typography>
      <Typography component="span" variant="body2">
        {children}
      </Typography>
    </Box>
  )
}

/** Libreta de un curso en tarjetas, una por materia (celular). Evita la tabla con desplazamiento lateral. */
export function TarjetasCurso({ curso }: { curso: HistorialCurso }) {
  return (
    <Stack component="ul" spacing={1} sx={{ listStyle: 'none', m: 0, p: 0 }}>
      {curso.materias.map((materia) => {
        const d = desglosar(materia)
        const debajo = estaDebajo(materia.promedio)
        return (
          <Box
            component="li"
            key={materia.materiaId}
            sx={{
              border: 1,
              borderColor: debajo ? 'error.light' : 'divider',
              borderLeftWidth: 4,
              borderRadius: 2,
              p: 1.5,
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 1, mb: 0.5 }}>
              <Typography component="h4" variant="subtitle1" sx={{ fontWeight: 700, overflowWrap: 'anywhere' }}>
                {materia.materia}
              </Typography>
              <Typography component="span" variant="subtitle1">
                <NotaHistorial nota={materia.promedio} destacada />
              </Typography>
            </Box>
            <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0 }}>
              {d.parciales.map((nota, i) =>
                nota === null ? null : (
                  <Dato key={i} etiqueta={`Parcial ${i + 1}.º trimestre`}>
                    <NotaHistorial nota={nota} />
                  </Dato>
                ),
              )}
              {d.practicas.map((nota, i) => (
                <Dato key={`p${i}`} etiqueta="Práctica">
                  <NotaHistorial nota={nota} />
                </Dato>
              ))}
              {d.finales.map((nota, i) => (
                <Dato key={`f${i}`} etiqueta="Examen final">
                  <NotaHistorial nota={nota} />
                </Dato>
              ))}
              {d.otras.map((o, i) => (
                <Dato key={`o${i}`} etiqueta={o.etiqueta}>
                  <NotaHistorial nota={o.nota} />
                </Dato>
              ))}
            </Box>
          </Box>
        )
      })}
    </Stack>
  )
}
