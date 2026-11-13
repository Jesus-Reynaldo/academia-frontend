import TrendingDown from '@mui/icons-material/TrendingDown'
import TrendingFlat from '@mui/icons-material/TrendingFlat'
import TrendingUp from '@mui/icons-material/TrendingUp'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import {
  CartesianGrid,
  LabelList,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { colorNota } from '../../../shared/lib/colorNota'
import { formatNota } from '../../../shared/lib/format'
import { colors } from '../../../shared/theme/tokens'
import { GradeBadge } from '../../../shared/ui/GradeBadge'

const APROBACION = 51

interface PromedioGestion {
  periodoId: number
  periodo: string
  promedio: number | null
}

/** Nombre de la zona, en su esquina superior izquierda. */
function zona(texto: string, color: string) {
  return { value: texto, position: 'insideTopLeft' as const, fill: color, fontSize: 11, fontWeight: 600 }
}

/** Recta de mínimos cuadrados sobre los promedios (x = orden de la gestión). Solo dibuja; no cambia promedios. */
function rectaTendencia(valores: number[]) {
  const n = valores.length
  const mediaX = (n - 1) / 2
  const mediaY = valores.reduce((s, v) => s + v, 0) / n
  let num = 0
  let den = 0
  valores.forEach((v, x) => {
    num += (x - mediaX) * (v - mediaY)
    den += (x - mediaX) ** 2
  })
  const pendiente = den === 0 ? 0 : num / den
  return { pendiente, valor: (x: number) => mediaY + pendiente * (x - mediaX) }
}

/** Frase simple: cómo cambió respecto a la gestión anterior y en qué zona está ahora. */
function mensaje(anterior: PromedioGestion, actual: PromedioGestion & { promedio: number }) {
  const diferencia = actual.promedio - (anterior.promedio ?? actual.promedio)
  const puntos = formatNota(Math.abs(diferencia))
  const cambio =
    Math.abs(diferencia) < 0.5
      ? `Te mantuviste igual que en la ${anterior.periodo}.`
      : diferencia > 0
        ? `Subiste ${puntos} puntos respecto a la ${anterior.periodo}.`
        : `Bajaste ${puntos} puntos respecto a la ${anterior.periodo}.`
  const zona =
    actual.promedio < APROBACION
      ? `Estás por debajo de ${APROBACION}: te faltan ${formatNota(APROBACION - actual.promedio)} puntos para aprobar.`
      : actual.promedio <= 70
        ? `Sigues aprobando, pero estás a ${formatNota(actual.promedio - APROBACION)} puntos del mínimo.`
        : '¡Vas bien, sigue así!'
  return { diferencia, texto: `${cambio} ${zona}` }
}

/** Evolución del promedio por gestión: zonas de color, número en cada punto y línea de tendencia. */
export function EvolucionGestiones({ porPeriodo }: { porPeriodo: PromedioGestion[] }) {
  const conNota = porPeriodo.filter((p): p is PromedioGestion & { promedio: number } => p.promedio !== null)

  if (conNota.length < 2) {
    return (
      <>
        <Typography variant="body2" color="text.secondary">
          Cuando tengas notas en más de una gestión, aquí verás si vas subiendo o bajando.
        </Typography>
        <ListaPromedios porPeriodo={porPeriodo} />
      </>
    )
  }

  const tendencia = rectaTendencia(conNota.map((p) => p.promedio))
  const datos = conNota.map((p, i) => ({ ...p, tendencia: Math.round(tendencia.valor(i) * 100) / 100 }))
  const { diferencia, texto } = mensaje(conNota.at(-2)!, conNota.at(-1)!)
  const sube = diferencia >= 0.5
  const baja = diferencia <= -0.5
  // Gris oscuro: no se confunde con la línea roja del mínimo ni con los colores de los puntos.
  const colorTendencia = colors.neutral.main

  // Escala cercana a las notas para que la subida o bajada se note (siempre incluye la línea de 51).
  const valores = [...conNota.map((p) => p.promedio), APROBACION]
  const minimo = Math.max(0, Math.floor((Math.min(...valores) - 8) / 5) * 5)
  const maximo = Math.min(100, Math.ceil((Math.max(...valores) + 8) / 5) * 5)

  return (
    <>
      <Alert
        severity={baja ? 'warning' : sube ? 'success' : 'info'}
        icon={baja ? <TrendingDown /> : sube ? <TrendingUp /> : <TrendingFlat />}
        sx={{ mb: 2 }}
      >
        {texto}
      </Alert>

      {/* Decorativo para lectores de pantalla: la frase de arriba y la lista de abajo dicen lo mismo. */}
      <Box
        aria-hidden
        sx={{
          display: { xs: 'none', sm: 'block' },
          width: '100%',
          height: 280,
          // Sin el marco negro que el navegador dibuja al hacer clic en el gráfico.
          '& svg, & svg *, & .recharts-wrapper': { outline: 'none' },
        }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={datos} margin={{ top: 28, right: 32, left: 0, bottom: 8 }} accessibilityLayer={false}>
            <ReferenceArea y1={minimo} y2={APROBACION} fill={colors.error.tint} fillOpacity={0.9} ifOverflow="hidden" label={zona('Reprobado', colors.error.main)} />
            <ReferenceArea y1={APROBACION} y2={70} fill={colors.warning.tint} fillOpacity={0.9} ifOverflow="hidden" label={zona('Aprobado justo', colors.warning.main)} />
            <ReferenceArea y1={70} y2={85} fill={colors.info.tint} fillOpacity={0.9} ifOverflow="hidden" label={zona('Bueno', colors.info.main)} />
            <ReferenceArea y1={85} y2={maximo} fill={colors.success.tint} fillOpacity={0.9} ifOverflow="hidden" label={zona('Excelente', colors.success.main)} />
            <CartesianGrid stroke={colors.divider} strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="periodo" tick={{ fill: colors.text.secondary, fontSize: 13 }} padding={{ left: 40, right: 40 }} />
            <YAxis domain={[minimo, maximo]} tick={{ fill: colors.text.secondary, fontSize: 12 }} width={40} />
            <ReferenceLine
              y={APROBACION}
              stroke={colors.error.main}
              strokeWidth={1.5}
              strokeDasharray="6 4"
              label={{ value: `Mínimo para aprobar: ${APROBACION}`, fill: colors.error.main, fontSize: 12, fontWeight: 600, position: 'insideBottomRight' }}
            />
            <Tooltip formatter={(v, nombre) => [formatNota(Number(v)), nombre === 'tendencia' ? 'Tendencia' : 'Promedio']} />
            <Line
              dataKey="tendencia"
              stroke={colorTendencia}
              strokeWidth={3}
              strokeDasharray="10 6"
              dot={false}
              activeDot={false}
              isAnimationActive={false}
            />
            <Line
              dataKey="promedio"
              stroke={colors.primary.main}
              strokeWidth={3}
              isAnimationActive={false}
              dot={({ cx, cy, payload, index }) => (
                <circle key={index} cx={cx} cy={cy} r={7} fill={colorNota(payload.promedio)} stroke="#fff" strokeWidth={2} />
              )}
              activeDot={{ r: 8 }}
            >
              <LabelList
                dataKey="promedio"
                position="top"
                offset={12}
                formatter={(v) => formatNota(Number(v))}
                style={{ fill: colors.text.primary, fontSize: 14, fontWeight: 700 }}
              />
            </Line>
          </LineChart>
        </ResponsiveContainer>
      </Box>

      <Box sx={{ display: { xs: 'none', sm: 'flex' }, gap: 3, flexWrap: 'wrap', mt: 1 }}>
        <Leyenda color={colors.primary.main} texto="Tu promedio" />
        <Leyenda color={colorTendencia} texto={`Tendencia de todas tus gestiones: ${tendencia.pendiente >= 0.5 ? 'subiendo' : tendencia.pendiente <= -0.5 ? 'bajando' : 'estable'}`} punteada />
      </Box>
      <ListaPromedios porPeriodo={porPeriodo} />
    </>
  )
}

function Leyenda({ color, texto, punteada = false }: { color: string; texto: string; punteada?: boolean }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Box sx={{ width: 28, borderTop: `3px ${punteada ? 'dashed' : 'solid'} ${color}` }} />
      <Typography variant="body2">{texto}</Typography>
    </Box>
  )
}

function ListaPromedios({ porPeriodo }: { porPeriodo: PromedioGestion[] }) {
  return (
    <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0, display: 'flex', flexWrap: 'wrap', gap: 2, mt: 1.5 }}>
      {porPeriodo.map((p) => (
        <Box component="li" key={p.periodoId} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2">{p.periodo}:</Typography>
          <GradeBadge nota={p.promedio} />
        </Box>
      ))}
    </Box>
  )
}
