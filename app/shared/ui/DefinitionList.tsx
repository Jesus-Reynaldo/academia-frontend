import Typography from '@mui/material/Typography'
import type { ReactNode } from 'react'

export interface DefinitionItem {
  label: string
  value: ReactNode
}

/** Pares etiqueta/valor para fichas de detalle. Una columna en móvil, dos desde 640 px. */
export function DefinitionList({ items }: { items: DefinitionItem[] }) {
  return (
    <dl className="m-0 grid gap-x-6 gap-y-4 sm:grid-cols-2">
      {items.map((item) => (
        <div key={item.label} className="min-w-0 rounded-lg bg-fondo px-3 py-2">
          <Typography component="dt" variant="body2" color="text.secondary">
            {item.label}
          </Typography>
          <Typography component="dd" variant="body1" sx={{ m: 0, mt: 0.25, fontWeight: 500, wordBreak: 'break-word' }}>
            {item.value ?? '—'}
          </Typography>
        </div>
      ))}
    </dl>
  )
}
