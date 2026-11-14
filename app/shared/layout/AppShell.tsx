import AppBar from '@mui/material/AppBar'
import BottomNavigation from '@mui/material/BottomNavigation'
import BottomNavigationAction from '@mui/material/BottomNavigationAction'
import Paper from '@mui/material/Paper'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Divider from '@mui/material/Divider'
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import LinearProgress from '@mui/material/LinearProgress'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import ListSubheader from '@mui/material/ListSubheader'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import MenuIcon from '@mui/icons-material/Menu'
import Logout from '@mui/icons-material/Logout'
import LockReset from '@mui/icons-material/LockReset'
import { useIsFetching } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { Fragment, useEffect, useState, type ReactNode } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router'
import { ETIQUETA_ROL, type Rol } from '../config/roles'
import { iniciales } from '../lib/format'
import { colors, SIDEBAR_WIDTH } from '../theme/tokens'
import type { NavItem } from './navigation'
import { LogoInstitucion } from '../institucion/LogoInstitucion'
import { useInstitucion } from '../institucion/useInstitucion'

interface AppShellProps {
  items: NavItem[]
  user: { nombre: string; email: string; rol: Rol }
  onLogout: () => void
  children: ReactNode
}

export function AppShell({ items, user, onLogout, children }: AppShellProps) {
  const theme = useTheme()
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'))
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  // Estudiante en celular o tablet: sus 4 destinos van en una barra inferior fija, sin menú lateral.
  const barraInferior = user.rol === 'ESTUDIANTE' && !isDesktop
  const destinoActual =
    [...items].sort((a, b) => b.to.length - a.to.length).find((item) => (item.to === '/' ? location.pathname === '/' : location.pathname.startsWith(item.to)))?.to ?? false
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null)

  const closeMobile = () => setMobileOpen(false)
  const institucion = useInstitucion()
  // La pestaña del navegador lleva el nombre de la institución.
  useEffect(() => {
    document.title = institucion.nombre
  }, [institucion.nombre])

  const nav = (
    <Box sx={{ bgcolor: colors.sidebar.bg, color: colors.sidebar.text, height: '100%' }}>
      <Toolbar sx={{ gap: 1.5 }}>
        <LogoInstitucion tamano={36} />
        <Typography
          variant="h3"
          component="p"
          title={institucion.nombre}
          sx={{ color: '#fff', fontSize: '1rem', lineHeight: 1.25, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
        >
          {institucion.sigla ?? institucion.nombre}
        </Typography>
      </Toolbar>
      <Divider sx={{ borderColor: 'rgba(255,255,255,0.12)' }} />
      <List component="nav" aria-label="Navegación principal" sx={{ px: 1.5, py: 1 }}>
        {items.map((item, index) => (
          <Fragment key={item.to}>
            {item.group && item.group !== items[index - 1]?.group && (
              <ListSubheader
                // Dentro de <nav> no hay <ul>: un <li> suelto viola la estructura de listas (axe listitem).
                component="div"
                disableSticky
                sx={{
                  bgcolor: 'transparent',
                  color: colors.sidebar.text,
                  opacity: 0.75,
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  lineHeight: '32px',
                  mt: 1,
                  px: 1.5,
                }}
              >
                {item.group}
              </ListSubheader>
            )}
            <ListItemButton
              component={NavLink}
              to={item.to}
              end={item.to === '/'}
              // Descarga el código de la pantalla al apuntar o enfocar el enlace: abre al instante.
              prefetch="intent"
              onClick={closeMobile}
              sx={{
                borderRadius: 2,
                color: colors.sidebar.text,
                mb: 0.25,
                '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' },
                '&.active': { bgcolor: colors.primary.tint, color: colors.primary.dark },
                '&.active .MuiListItemIcon-root': { color: colors.primary.dark },
                '&:focus-visible': { outline: '2px solid #fff', outlineOffset: 2 },
              }}
            >
              <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} slotProps={{ primary: { sx: { fontWeight: 600, fontSize: '0.9375rem' } } }} />
            </ListItemButton>
          </Fragment>
        ))}
      </List>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Box
        component="a"
        href="#contenido"
        sx={{
          position: 'absolute',
          left: 8,
          top: -48,
          zIndex: 2000,
          bgcolor: 'background.paper',
          color: 'primary.main',
          px: 2,
          py: 1,
          borderRadius: 1,
          '&:focus': { top: 8 },
        }}
      >
        Saltar al contenido
      </Box>

      {!barraInferior && (
      <Drawer
        variant={isDesktop ? 'permanent' : 'temporary'}
        open={isDesktop || mobileOpen}
        onClose={closeMobile}
        ModalProps={{ keepMounted: true }}
        sx={{
          width: isDesktop ? SIDEBAR_WIDTH : 0,
          flexShrink: 0,
          '& .MuiDrawer-paper': { width: SIDEBAR_WIDTH, border: 0, boxSizing: 'border-box' },
          '@media print': { display: 'none' },
        }}
      >
        {nav}
      </Drawer>
      )}

      <Box sx={{ flexGrow: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <AppBar
          position="sticky"
          color="inherit"
          elevation={0}
          sx={{ borderBottom: 1, borderColor: 'divider', '@media print': { display: 'none' } }}
        >
          <Toolbar>
            {!isDesktop && !barraInferior && (
              <IconButton edge="start" aria-label="Abrir menú" onClick={() => setMobileOpen(true)} sx={{ mr: 1, width: 44, height: 44 }}>
                <MenuIcon />
              </IconButton>
            )}
            <Box sx={{ flexGrow: 1 }} />
            <Box sx={{ display: { xs: 'none', sm: 'block' }, textAlign: 'right', mr: 1.5 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                {user.nombre}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {ETIQUETA_ROL[user.rol]}
              </Typography>
            </Box>
            <IconButton
              aria-label="Menú de usuario"
              aria-haspopup="menu"
              aria-expanded={Boolean(menuAnchor)}
              onClick={(event) => setMenuAnchor(event.currentTarget)}
            >
              <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main', fontSize: '0.9rem' }}>
                {iniciales(user.nombre)}
              </Avatar>
            </IconButton>
            <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}>
              <Box sx={{ px: 2, py: 1, display: { sm: 'none' } }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {user.nombre}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {user.email}
                </Typography>
              </Box>
              <MenuItem
                onClick={() => {
                  setMenuAnchor(null)
                  void navigate('/cuenta/contrasena')
                }}
              >
                <ListItemIcon>
                  <LockReset fontSize="small" />
                </ListItemIcon>
                Cambiar contraseña
              </MenuItem>
              <MenuItem
                onClick={() => {
                  setMenuAnchor(null)
                  onLogout()
                }}
              >
                <ListItemIcon>
                  <Logout fontSize="small" />
                </ListItemIcon>
                Cerrar sesión
              </MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>

        <Box
          component="main"
          id="contenido"
          tabIndex={-1}
          sx={{
            flexGrow: 1,
            width: '100%',
            maxWidth: 1440,
            mx: 'auto',
            px: { xs: 2, sm: 3, lg: 4 },
            py: { xs: 2, sm: 3 },
            // Espacio para que la barra inferior no tape el final del contenido.
            pb: barraInferior ? 11 : undefined,
            outline: 'none',
          }}
        >
          <BarraCarga />
          {/* La clave cambia con la ruta: cada pantalla entra con un fundido (MotionConfig lo apaga si se pidió reducir movimiento). */}
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            {children}
          </motion.div>
        </Box>

        {barraInferior && (
          <Paper
            component="nav"
            aria-label="Navegación principal"
            elevation={8}
            sx={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: (t) => t.zIndex.appBar, '@media print': { display: 'none' } }}
          >
            <BottomNavigation showLabels value={destinoActual} sx={{ height: 64 }}>
              {items.map((item) => (
                <BottomNavigationAction
                  key={item.to}
                  component={NavLink}
                  to={item.to}
                  end={item.to === '/'}
                  prefetch="intent"
                  value={item.to}
                  label={item.label}
                  icon={item.icon}
                  sx={{
                    minWidth: 0,
                    px: 0.5,
                    // Mismo tamaño de texto seleccionado o no, para que no se parta en dos líneas.
                    '& .MuiBottomNavigationAction-label, & .MuiBottomNavigationAction-label.Mui-selected': { fontSize: '0.75rem', whiteSpace: 'nowrap' },
                  }}
                />
              ))}
            </BottomNavigation>
          </Paper>
        )}
      </Box>
    </Box>
  )
}

/**
 * Línea fina arriba mientras se traen datos. Aparece solo si la carga pasa de 300 ms (sin parpadeos en cargas
 * rápidas) y se oculta a lectores de pantalla cuando no hay carga.
 */
function BarraCarga() {
  const cargando = useIsFetching() > 0
  return (
    <Box
      aria-hidden={!cargando}
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: (t) => t.zIndex.appBar + 1,
        opacity: cargando ? 1 : 0,
        transition: 'opacity 200ms ease',
        transitionDelay: cargando ? '300ms' : '0ms',
        pointerEvents: 'none',
        '@media print': { display: 'none' },
      }}
    >
      <LinearProgress aria-label="Cargando datos" sx={{ height: 3 }} />
    </Box>
  )
}
