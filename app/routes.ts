import { type RouteConfig, index, layout, route } from '@react-router/dev/routes'

export default [
  route('login', 'routes/login.tsx'),

  // Todo lo que está dentro exige sesión y se muestra dentro del App Shell.
  layout('routes/app-layout.tsx', [
    index('routes/inicio.tsx'),
    route('cuenta/contrasena', 'routes/cambiar-password.tsx'),
    route('sin-acceso', 'routes/sin-acceso.tsx'),

    // Módulos pendientes: cada estudiante reemplaza el placeholder de su ruta por la pantalla real.
    route('estudiantes', 'routes/estudiantes.tsx'),
    route('estudiantes/:id', 'routes/estudiante-ficha.tsx'),
    route('docentes', 'routes/docentes.tsx'),
    route('docentes/:id', 'routes/docente-ficha.tsx'),
    route('cursos', 'routes/cursos.tsx'),
    route('cursos/:id', 'routes/curso-detalle.tsx'),
    route('materias', 'routes/materias.tsx'),
    route('materias/:id', 'routes/materia-detalle.tsx'),
    route('periodos-academicos', 'routes/periodos-academicos.tsx'),
    route('inscripciones', 'routes/inscripciones.tsx'),
    route('calificaciones', 'routes/calificaciones.tsx'),
    route('asignaciones-docentes', 'routes/asignaciones-docentes.tsx'),
    route('usuarios', 'routes/usuarios.tsx'),
    route('bitacora', 'routes/bitacora.tsx'),
    route('backup', 'routes/respaldo.tsx'),
    route('configuracion', 'routes/configuracion.tsx'),
    route('mi/calificaciones', 'routes/mi-calificaciones.tsx'),
    route('mi/historial', 'routes/mi-historial.tsx'),
    route('mi/inscripciones', 'routes/mi-inscripciones.tsx'),
    route('mi/materias', 'routes/mi-materias.tsx'),
    route('mi/materias/:materiaId', 'routes/mi-materia.tsx'),
    route('mi/cuenta', 'routes/mi-cuenta.tsx'),

    route('*', 'routes/no-encontrado.tsx'),
  ]),
] satisfies RouteConfig
