// Todos los colores salen de aquí (docs/UI-UX-PLAN.md, sección 5). Contrastes WCAG AA verificados.
export const colors = {
  primary: { main: '#2740B8', dark: '#1E2F8A', tint: '#E8ECFD' },
  secondary: { main: '#0F766E' },
  background: { default: '#F6F7FB', paper: '#FFFFFF' },
  sidebar: { bg: '#111A3B', text: '#C7D0F8' },
  text: { primary: '#0F172A', secondary: '#475569', disabled: '#64748B' },
  divider: '#E2E8F0',
  success: { main: '#15803D', tint: '#DCFCE7' },
  warning: { main: '#B45309', tint: '#FEF3C7' },
  error: { main: '#B91C1C', tint: '#FEE2E2' },
  info: { main: '#0369A1', tint: '#E0F2FE' },
  neutral: { main: '#475569', tint: '#F1F5F9' },
} as const

/** Paleta categórica apta para daltonismo (Okabe-Ito) para series de gráficos que no son estados. */
export const chartColors = ['#0072B2', '#E69F00', '#009E73', '#CC79A7', '#56B4E9', '#D55E00'] as const

export const SIDEBAR_WIDTH = 248
