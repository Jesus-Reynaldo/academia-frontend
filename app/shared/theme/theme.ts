import { createTheme } from '@mui/material/styles'
import { colors } from './tokens'

export const theme = createTheme({
  cssVariables: true,
  palette: {
    mode: 'light',
    primary: { main: colors.primary.main, dark: colors.primary.dark, light: colors.primary.tint },
    secondary: { main: colors.secondary.main },
    success: { main: colors.success.main },
    warning: { main: colors.warning.main },
    error: { main: colors.error.main },
    info: { main: colors.info.main },
    background: colors.background,
    text: colors.text,
    divider: colors.divider,
  },
  shape: { borderRadius: 8 },
  typography: {
    fontFamily: '"Inter", system-ui, "Segoe UI", Roboto, sans-serif',
    h1: { fontSize: '1.75rem', fontWeight: 700, lineHeight: 1.25 },
    h2: { fontSize: '1.375rem', fontWeight: 600, lineHeight: 1.25 },
    h3: { fontSize: '1.125rem', fontWeight: 600, lineHeight: 1.25 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { fontVariantNumeric: 'tabular-nums' },
      },
    },
    MuiButton: { defaultProps: { disableElevation: true } },
    MuiCard: {
      defaultProps: { variant: 'outlined' },
      styleOverrides: { root: { borderRadius: 12 } },
    },
    MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
    MuiTextField: { defaultProps: { size: 'small' } },
    MuiChip: { styleOverrides: { root: { fontWeight: 600 } } },
    MuiDialog: { styleOverrides: { paper: { borderRadius: 16 } } },
    MuiLink: { defaultProps: { underline: 'hover' } },
  },
})
