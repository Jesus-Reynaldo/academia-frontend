import AppBar from '@mui/material/AppBar'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Divider from '@mui/material/Divider'
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
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
import SchoolRounded from '@mui/icons-material/SchoolRounded'
import { Fragment, useState, type ReactNode } from 'react'
import { NavLink, useNavigate } from 'react-router'
import { ETIQUETA_ROL, type Rol } from '../config/roles'
import { iniciales } from '../lib/format'
import { colors, SIDEBAR_WIDTH } from '../theme/tokens'
import type { NavItem } from './navigation'

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
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null)

  const closeMobile = () => setMobileOpen(false)

  const nav = (
    <Box sx={{ bgcolor: colors.sidebar.bg, color: colors.sidebar.text, height: '100%' }}>
      <Toolbar sx={{ gap: 1.5 }}>
        <SchoolRounded sx={{ color: '#fff' }} aria-hidden />
        <Typography variant="h3" component="p" sx={{ color: '#fff', fontSize: '1.0625rem' }}>
          Sistema Académico
        </Typography>
      </Toolbar>
      <Divider sx={{ borderColor: 'rgba(255,255,255,0.12)' }} />
      <List component="nav" aria-label="Navegación principal" sx={{ px: 1.5, py: 1 }}>
        {items.map((item, index) => (
          <Fragment key={item.to}>
            {item.group && item.group !== items[index - 1]?.group && (
              <ListSubheader
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

      <Box sx={{ flexGrow: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <AppBar
          position="sticky"
          color="inherit"
          elevation={0}
          sx={{ borderBottom: 1, borderColor: 'divider', '@media print': { display: 'none' } }}
        >
          <Toolbar>
            {!isDesktop && (
              <IconButton edge="start" aria-label="Abrir menú" onClick={() => setMobileOpen(true)} sx={{ mr: 1 }}>
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
            outline: 'none',
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  )
}
