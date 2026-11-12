import Box from '@mui/material/Box'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import { columnasDelCurso, desglosar } from '../model/desglose'
import type { HistorialCurso } from '../model/types'
import { NotaHistorial, NotasHistorial } from './NotaHistorial'

/** Libreta de un curso en tabla (computadora e impresión). Solo muestra las columnas que tienen datos. */
export function TablaCurso({ curso }: { curso: HistorialCurso }) {
  const columnas = columnasDelCurso(curso)

  return (
    // La región desplazable debe poder recorrerse con teclado (WCAG 2.1.1).
    <TableContainer
      className="historial-tabla"
      tabIndex={0}
      role="region"
      aria-label={`Calificaciones de ${curso.curso}. Si no ves todas las columnas, desplázate hacia los lados.`}
      sx={{ '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 2 } }}
    >
      <Table size="small" aria-label={`Libreta de ${curso.curso}`} sx={{ minWidth: 640 }}>
        <TableHead>
          <TableRow sx={{ bgcolor: 'action.hover' }}>
            <TableCell rowSpan={2}>Materia</TableCell>
            <TableCell align="center" colSpan={3}>
              Parciales por trimestre
            </TableCell>
            <TableCell align="center" rowSpan={2}>
              Prácticas
            </TableCell>
            {columnas.examenFinal && (
              <TableCell align="center" rowSpan={2}>
                Examen final
              </TableCell>
            )}
            {columnas.otras && (
              <TableCell align="center" rowSpan={2}>
                Otras evaluaciones
              </TableCell>
            )}
            <TableCell align="center" rowSpan={2}>
              Promedio
            </TableCell>
          </TableRow>
          <TableRow sx={{ bgcolor: 'action.hover' }}>
            <TableCell align="center">1.º</TableCell>
            <TableCell align="center">2.º</TableCell>
            <TableCell align="center">3.º</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {curso.materias.map((materia) => {
            const d = desglosar(materia)
            return (
              <TableRow key={materia.materiaId} sx={{ breakInside: 'avoid' }}>
                <TableCell component="th" scope="row" sx={{ fontWeight: 600, minWidth: 160 }}>
                  {materia.materia}
                </TableCell>
                {d.parciales.map((nota, i) => (
                  <TableCell key={i} align="center">
                    <NotaHistorial nota={nota} />
                  </TableCell>
                ))}
                <TableCell align="center">
                  <NotasHistorial notas={d.practicas} />
                </TableCell>
                {columnas.examenFinal && (
                  <TableCell align="center">
                    <NotasHistorial notas={d.finales} />
                  </TableCell>
                )}
                {columnas.otras && (
                  <TableCell align="center">
                    {d.otras.length === 0 ? (
                      '—'
                    ) : (
                      <Box sx={{ display: 'grid', gap: 0.25 }}>
                        {d.otras.map((o, i) => (
                          <span key={i}>
                            {o.etiqueta}: <NotaHistorial nota={o.nota} />
                          </span>
                        ))}
                      </Box>
                    )}
                  </TableCell>
                )}
                <TableCell align="center">
                  <NotaHistorial nota={materia.promedio} destacada />
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
