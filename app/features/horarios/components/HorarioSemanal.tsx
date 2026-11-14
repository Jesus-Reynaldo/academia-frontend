import MeetingRoomOutlined from '@mui/icons-material/MeetingRoomOutlined'
import { DIAS, NOMBRE_DIA, nombreDocente, type DiaSemana, type Horario, type VistaHorario } from '../model/types'

/** Colores suaves para distinguir materias (siempre el mismo color para la misma materia). */
const COLORES = ['#2740B8', '#0F766E', '#B45309', '#7C3AED', '#BE123C', '#0369A1', '#4D7C0F', '#A21CAF', '#C2410C', '#334155']
const colorMateria = (id: number) => COLORES[id % COLORES.length]

const HOY: DiaSemana | undefined = DIAS[new Date().getDay() - 1]

function Bloque({ h, vista, onClick }: { h: Horario; vista: VistaHorario; onClick?: (h: Horario) => void }) {
  const a = h.asignacion
  const secundario =
    vista === 'docente' ? a.curso.nombre : vista === 'aula' ? `${a.curso.nombre} · ${nombreDocente(a.docente)}` : nombreDocente(a.docente)
  const contenido = (
    <>
      <span className="block text-xs font-bold tabular-nums text-texto-suave">
        {h.horaInicio} – {h.horaFin}
      </span>
      <span className="block font-semibold leading-snug">{a.materia.nombre}</span>
      <span className="block text-sm leading-snug text-texto-suave">{secundario}</span>
      {vista !== 'aula' && (
        <span className="mt-0.5 flex items-center gap-1 text-xs text-texto-suave">
          <MeetingRoomOutlined sx={{ fontSize: 14 }} aria-hidden /> {h.aula.nombre}
        </span>
      )}
      {h.estado === 'INACTIVO' && <span className="mt-1 inline-block rounded bg-fondo px-1.5 text-xs">Inactivo</span>}
    </>
  )
  const clase = `block w-full rounded-lg border border-borde bg-white p-2 text-left shadow-sm ${h.estado === 'INACTIVO' ? 'opacity-60' : ''}`
  const estilo = { borderLeft: `4px solid ${colorMateria(a.materiaId)}` }
  return onClick ? (
    <button type="button" className={`${clase} cursor-pointer hover:bg-primary-tint focus-visible:outline-2`} style={estilo} onClick={() => onClick(h)} aria-label={`Editar: ${a.materia.nombre}, ${NOMBRE_DIA[h.diaSemana]} de ${h.horaInicio} a ${h.horaFin}`}>
      {contenido}
    </button>
  ) : (
    <div className={clase} style={estilo}>{contenido}</div>
  )
}

/**
 * Semana de clases: una columna por día (lunes a viernes, y sábado si hay clases ese día), con los bloques en
 * orden de hora. En celular los días se apilan y solo aparecen los que tienen clases.
 */
export function HorarioSemanal({ horarios, vista, onEditar }: { horarios: Horario[]; vista: VistaHorario; onEditar?: (h: Horario) => void }) {
  const dias = DIAS.filter((d) => d !== 'SABADO' || horarios.some((h) => h.diaSemana === 'SABADO'))
  const porDia = (d: DiaSemana) => horarios.filter((h) => h.diaSemana === d).sort((x, y) => x.horaInicio.localeCompare(y.horaInicio))
  return (
    <div className={`grid gap-3 ${dias.length === 6 ? 'lg:grid-cols-6' : 'lg:grid-cols-5'} md:grid-cols-3`} role="list" aria-label="Horario semanal">
      {dias.map((d) => {
        const bloques = porDia(d)
        return (
          <section key={d} role="listitem" aria-label={NOMBRE_DIA[d]} className={`${bloques.length === 0 ? 'hidden md:block' : ''} rounded-xl border border-borde bg-fondo p-2`}>
            <h3 className={`mb-2 rounded-md px-2 py-1 text-center text-sm font-bold ${d === HOY ? 'bg-primary text-white' : 'text-texto'}`}>
              {NOMBRE_DIA[d]}
              {d === HOY && <span className="sr-only"> (hoy)</span>}
            </h3>
            <div className="flex flex-col gap-2">
              {bloques.length === 0 ? (
                <p className="py-4 text-center text-xs text-texto-suave">Sin clases</p>
              ) : (
                bloques.map((h) => <Bloque key={h.id} h={h} vista={vista} onClick={onEditar} />)
              )}
            </div>
          </section>
        )
      })}
    </div>
  )
}
