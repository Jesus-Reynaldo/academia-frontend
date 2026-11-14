import Box from '@mui/material/Box'
import { Bar, BarChart, CartesianGrid, Cell, LabelList, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatNota } from '../../../shared/lib/format'
import { colorNota } from '../../../shared/lib/colorNota'
import { colors } from '../../../shared/theme/tokens'

const APROBACION = 51

/**
 * Promedio por curso en barras horizontales: todos los nombres se leen completos, el color dice si va bien
 * y la línea punteada marca el 51. Decorativo para lectores de pantalla (la lista de abajo dice lo mismo).
 */
export function GraficoPromedioCursos({ datos }: { datos: { cursoId: number; curso: string; promedio: number }[] }) {
  const alto = Math.max(220, datos.length * 34 + 56)
  return (
    <Box aria-hidden sx={{ display: { xs: 'none', sm: 'block' }, width: '100%', height: alto, '& svg, & svg *': { outline: 'none' } }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={datos} layout="vertical" margin={{ top: 22, right: 48, left: 8, bottom: 8 }} accessibilityLayer={false}>
          <CartesianGrid stroke={colors.divider} strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" domain={[0, 100]} tick={{ fill: colors.text.secondary, fontSize: 12 }} />
          <YAxis type="category" dataKey="curso" width={150} interval={0} tick={{ fill: colors.text.primary, fontSize: 12 }} />
          <ReferenceLine
            x={APROBACION}
            stroke={colors.error.main}
            strokeDasharray="6 4"
            label={{ value: `51`, position: 'top', fill: colors.error.main, fontSize: 11, fontWeight: 600 }}
          />
          <Tooltip formatter={(v) => [formatNota(Number(v)), 'Promedio']} cursor={{ fill: colors.primary.tint }} />
          <Bar dataKey="promedio" radius={[0, 6, 6, 0]} barSize={18} isAnimationActive={false}>
            {datos.map((d) => (
              <Cell key={d.cursoId} fill={colorNota(d.promedio)} />
            ))}
            <LabelList
              dataKey="promedio"
              position="right"
              formatter={(v) => formatNota(Number(v))}
              style={{ fill: colors.text.primary, fontSize: 12, fontWeight: 600 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Box>
  )
}
