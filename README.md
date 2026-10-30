# frontend-notas — Dashboard Académico

Frontend (React + TypeScript) del **Sistema Académico**. Consume la API REST de `backend-notas` (estudiantes, docentes, cursos, materias, períodos, inscripciones y calificaciones) con login JWT y tres roles: **ADMIN**, **DOCENTE** y **ESTUDIANTE**.

| Tecnología | Uso |
|---|---|
| React 19 + TypeScript | Interfaz |
| React Router 8 (modo framework, **SPA**) | Rutas |
| TanStack Query | Estado del servidor (caché, carga, errores) |
| MUI 9 + MUI X Charts + Emotion | Componentes y gráficos |
| React Hook Form + Zod | Formularios y validación |
| Vite 8 | Build y servidor de desarrollo |

## Documentación del proyecto

- **[Plan de UI/UX](docs/UI-UX-PLAN.md)**: sistema visual, colores, patrones, pantallas por rol, accesibilidad, arquitectura (Screaming Architecture) y reparto del trabajo. **Léelo antes de programar.**
- Especificación funcional y contrato de la API: `backend-notas/doc/dashboard-requirements.md`.

---

## 1. Requisitos previos

| Herramienta | Versión | Comprobar con |
|---|---|---|
| Node.js | 22 o superior | `node -v` |
| npm | viene con Node | `npm -v` |
| Git | cualquiera reciente | `git --version` |
| Backend `backend-notas` funcionando | ver sección 2 | abrir <http://localhost:3000/api/docs> |

## 2. Levantar el backend primero

El frontend no funciona sin la API. En la carpeta `backend-notas`, sigue su `README.md` (instalar MySQL, crear el `.env`, migrar y cargar datos). En resumen:

```bash
cd backend-notas
npm install
npm run prisma:migrate
npm run prisma:seed       # crea los usuarios de prueba; muestra una contraseña UNA sola vez si no definiste SEED_ADMIN_PASSWORD
npm run start:dev         # http://localhost:3000/api/v1
```

Comprueba que Swagger abre en <http://localhost:3000/api/docs>.

> **Anota la contraseña que imprime el seed** (o define `SEED_ADMIN_PASSWORD` en el `.env` del backend antes de ejecutarlo). Es la misma para las tres cuentas.

## 3. Instalar y ejecutar el frontend

```bash
# 1. Clonar e instalar dependencias
git clone <url-del-repositorio> frontend-notas
cd frontend-notas
npm install

# 2. Crear el archivo de entorno
cp .env.example .env          # en PowerShell: Copy-Item .env.example .env

# 3. Iniciar en modo desarrollo
npm run dev
```

Abre la dirección que muestra la terminal (normalmente <http://localhost:5173>).

> **Importante (CORS):** el backend solo acepta peticiones desde `localhost`, `127.0.0.1` o `[::1]`. Abre el frontend con `http://localhost:5173`, no con la IP de tu red ni con otro nombre de equipo.

### Variables de entorno

| Variable | Valor por defecto | Descripción |
|---|---|---|
| `VITE_API_URL` | `http://localhost:3000/api/v1` | URL base de la API. **Ninguna URL se escribe a mano en los componentes**: todo sale de esta variable. |

El archivo `.env` está en `.gitignore` (no se sube). `.env.example` sí se versiona como plantilla. Si cambias el `.env`, reinicia `npm run dev`.

### Cuentas de prueba

Creadas por el seed del backend; las tres comparten contraseña.

| Rol | Email |
|---|---|
| ADMIN | `admin@colegio.edu` (o el valor de `SEED_ADMIN_EMAIL`) |
| DOCENTE | `ana.garcia@colegio.edu` |
| ESTUDIANTE | `juan.perez@colegio.edu` |

## 4. Scripts

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo con recarga en caliente |
| `npm run typecheck` | Genera los tipos de rutas y revisa TypeScript |
| `npm run lint` | Revisa el código con ESLint |
| `npm run build` | Compila para producción en `build/client` (SPA) |
| `npm run preview` | Sirve el build local en <http://localhost:4173> para probarlo |

Antes de subir cambios ejecuta `npm run typecheck`, `npm run lint` y `npm run build`.

## 5. Estructura del proyecto (Screaming Architecture)

Las carpetas muestran **qué hace el sistema** (estudiantes, calificaciones…) y no con qué está hecho. Detalle y reglas de dependencia en la [sección 12 del plan](docs/UI-UX-PLAN.md).

```
app/
├── root.tsx            # HTML base y providers (TanStack Query, tema, sesión)
├── routes.ts           # Mapa de rutas
├── routes/             # Archivos de ruta delgados: conectan una URL con una pantalla
├── features/           # Un módulo por dominio (espeja los módulos del backend)
│   ├── autenticacion/  ├── panel-inicio/   ├── estudiantes/    ├── docentes/
│   ├── cursos/         ├── materias/       ├── periodos-academicos/
│   ├── inscripciones/  ├── calificaciones/ ├── historial-academico/  └── usuarios/
│       └── (en cada uno) api/ · components/ · pages/ · model/ · index.ts
└── shared/             # Solo lo transversal: api/, ui/, layout/, theme/, hooks/, lib/, config/
```

Reglas rápidas:

1. Cada módulo vive en su carpeta `app/features/<modulo>/` y expone lo público en su `index.ts`.
2. `shared/` **nunca** importa de `features/`.
3. Un feature no importa archivos internos de otro; solo su `index.ts`.
4. Los componentes **no llaman a `fetch`**: usan los hooks de su feature (capa `api/` única en `shared/api`).
5. Los tipos de datos reflejan el contrato de la API (sección 4 de la spec del backend).

> Ya existen todas las carpetas. `autenticacion` y `shared/` están implementados (login, sesión, layout con menú lateral por rol, tema y componentes base); el resto de `features/` tiene el esqueleto (`api/`, `components/`, `pages/`, `model/`, `index.ts`) listo para que lo completen los estudiantes. Cada ruta pendiente de `app/routes/` muestra un placeholder con un `TODO` que indica qué reemplazar.

## 6. Reparto del trabajo

| Entrega | Responsable |
|---|---|
| Plan UI/UX, arquitectura, dependencias, tema, cliente HTTP, sesión, rutas protegidas, layout con menú lateral, **Login** y Cambiar contraseña | Docente |
| **Inicio / Dashboard** (un panel por rol), Estudiantes, Historial académico, Docentes, Cursos, Materias, Períodos, Inscripciones, Calificaciones y Usuarios | Estudiantes |

Cómo trabajar un módulo (estudiantes):

1. Lee la sección 8 del [plan de UI/UX](docs/UI-UX-PLAN.md) correspondiente a tu pantalla y los requisitos `RF-*` de la spec.
2. Crea una rama: `git checkout -b feature/<modulo>` (por ejemplo `feature/cursos`).
3. Implementa dentro de `app/features/<modulo>/` reutilizando `shared/ui`; no copies componentes entre módulos.
4. Registra tu ruta en `app/routes.ts`.
5. Verifica los cuatro estados (cargando, éxito, vacío, error), los permisos por rol y el diseño a 360 px.
6. Haz commits pequeños y claros, y abre una *pull request* hacia `master`.

## 7. Decisiones de diseño

- **SPA (`ssr: false`)**: el token JWT vive en el navegador y las rutas protegidas se resuelven en el cliente; el SSR no podría renderizar páginas autenticadas.
- **Token en `localStorage`**: es lo más sencillo, pero queda expuesto si hay un ataque XSS. Se acepta para este proyecto académico y se guarda en **un único punto** (el proveedor de sesión); ningún otro componente lo lee. En producción se preferiría una cookie `HttpOnly`.
- **Sesión sin refresh token**: el token dura 1 hora (configurable en el backend); al vencer, la API responde `401` y la app lleva al login con el aviso "Tu sesión expiró".
- **Solo tema claro y solo web responsive** (desde 360 px de ancho). Sin modo oscuro ni app móvil.
- **Umbral de aprobación**: constante `NOTA_APROBACION` (51 por defecto, igual que el backend), definida en un solo archivo de configuración. Las notas por debajo se resaltan con color **e** icono.
- **Estado de las tablas en la URL** (`?page=2&estado=ACTIVO&q=ana`): enlaces compartibles y botón "atrás" correcto. Paginación, filtros y orden los resuelve el servidor.
- **Librerías**: MUI (componentes y tema), MUI X Charts (gráficos), React Hook Form + Zod (formularios), TanStack Query (datos del servidor).

## 8. Problemas frecuentes

| Síntoma | Causa y solución |
|---|---|
| Error de CORS en la consola del navegador | Abriste el frontend con una dirección que no es `localhost`/`127.0.0.1`. Usa `http://localhost:5173`. |
| `Network Error` / no carga ningún dato | El backend no está corriendo, o `VITE_API_URL` apunta a otro puerto. Revisa <http://localhost:3000/api/docs> y tu `.env`. |
| Cambié `.env` y no tiene efecto | Reinicia `npm run dev`. |
| Login responde "Credenciales inválidas" | Contraseña incorrecta: es la que imprimió el seed (o `SEED_ADMIN_PASSWORD`). Si la perdiste, vuelve a ejecutar `npm run prisma:seed` (borra y recrea los datos). |
| `429` al iniciar sesión | Límite de 10 intentos por minuto por IP. Espera un momento. |
| `npm run build` falla con "Failed to load PostCSS config" | Hay un `postcss.config.*` fuera del proyecto (en una carpeta superior). El repositorio incluye un `postcss.config.js` vacío para evitarlo; no lo borres. |
| Errores de tipos de rutas (`+types/...`) | Ejecuta `npm run typecheck` para regenerarlos. |
| Puerto 5173 ocupado | Vite elegirá otro puerto: ábrelo igualmente con `localhost`. |
