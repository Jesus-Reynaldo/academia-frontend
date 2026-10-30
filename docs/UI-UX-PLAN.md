# Plan de UI/UX — Dashboard Académico (frontend-notas)

> Documento de planificación. **No contiene código de la aplicación**: define qué se construye, cómo se ve y cómo se organiza antes de escribir una sola pantalla.
> Fuentes de contexto: `backend-notas/doc/dashboard-requirements.md`, `requirements.md`, `backend-proposals.md`, `prisma/schema.prisma` y `CLAUDE.md` del backend. Las referencias de investigación están al final (sección 15).

---

## 1. Contexto y decisiones de partida

| Tema | Decisión | Motivo |
|---|---|---|
| Producto | Dashboard web del Sistema Académico: estudiantes, docentes, cursos, materias, períodos, inscripciones y calificaciones | Spec del backend |
| Usuarios | 3 roles con experiencias distintas: **ADMIN**, **DOCENTE**, **ESTUDIANTE** | El menú y las pantallas se construyen según `usuario.rol` (RF-AUTH-05) |
| Stack ya instalado | React 19, React Router (modo framework), TanStack Query, MUI 9 + Emotion, TypeScript | Estado actual del repo |
| Librería de UI | **MUI** (+ MUI X Charts) como base de componentes, con un tema propio (no el aspecto Material por defecto) | Ya instalada; accesible y con tabla, diálogos, formularios y date pickers maduros |
| Arquitectura de código | **Screaming Architecture** (carpetas por dominio académico, no por tipo técnico) | Solicitado; ver sección 12 |
| Idioma | Interfaz en español; términos del dominio igual que la API (`Estudiante`, `Inscripción`, `Calificación`) | El dominio y los mensajes del servidor ya están en español |
| Tono visual | Sobrio, confiable y legible: herramienta de trabajo diaria, no una web de marketing | Admin/docente pasan horas en la herramienta; la investigación apunta a paletas más calmadas en áreas de gestión |

### 1.1 Decisiones confirmadas

| # | Tema | Decisión |
|---|---|---|
| D1 | Modo de render | **SPA** (`ssr: false`). El JWT vive en el navegador y las rutas protegidas se resuelven en el cliente. Ya configurado en `react-router.config.ts`. |
| D2 | Marca institucional | **Ninguna por ahora.** Se usa la paleta propuesta (índigo `#2740B8`); cambiar la marca solo requiere editar los tokens del tema. |
| D3 | Plataforma | **Solo web responsive** (sin app móvil ni flujos específicos). Debe usarse bien desde 360 px, pero el diseño prioriza escritorio. |
| D4 | Formularios y gráficos | **React Hook Form + Zod** y **MUI X Charts** (instalados). |
| D5 | Modo oscuro | **Fuera de alcance.** Solo tema claro. Se conserva la estructura de tokens para poder añadirlo en el futuro. |
| D6 | Reparto del trabajo | El **docente** entrega: login, layout con menú lateral por rol, dependencias, plan UI/UX y arquitectura. Los **estudiantes** implementan el resto, **incluido el dashboard de Inicio** (ver sección 14). |

### 1.2 Limitaciones del backend que condicionan la UX

Hay que diseñar *con* ellas, no contra ellas:

1. **Sin refresh token**: la sesión vence a la hora → avisar antes de expirar y enviar al login con el mensaje "Tu sesión expiró".
2. **Las calificaciones no se eliminan** (`DELETE` = 409): nunca mostrar botón "Eliminar" en calificaciones; la corrección es editar.
3. **DELETE tiene 3 resultados** (204 eliminado / 200 desactivado / 409 bloqueado): el diálogo de confirmación y el mensaje posterior son distintos para cada uno.
4. **El docente no tiene "mis cursos"**: su pantalla de inicio se basa en las calificaciones que registró.
5. **Rangos de la distribución de notas fijos** (`0-50`, `51-70`, `71-85`, `86-100`) y umbral de riesgo por defecto 51: los colores de nota se alinean con estos rangos (sección 5.4).
6. **Los agregados vienen calculados del servidor**: no se promedia ni suma en el cliente.
7. **CORS solo localhost**: el frontend corre en local durante el desarrollo.

---

## 2. Usuarios y objetivos

| Rol | Quién es | Qué quiere lograr | Frecuencia | Dispositivo probable |
|---|---|---|---|---|
| **ADMIN** | Personal administrativo / dirección | Ver el estado general, mantener catálogos, inscribir estudiantes, detectar estudiantes en riesgo, crear cuentas | Diaria, sesiones largas | Escritorio |
| **DOCENTE** | Profesor | Registrar y corregir **sus** notas rápido, ver cómo se distribuyen | Diaria, tareas cortas y repetitivas | Escritorio y laptop; ocasionalmente móvil |
| **ESTUDIANTE** | Alumno | Consultar sus notas, promedio e historial; imprimirlo | Esporádica, consulta | **Móvil primero** |

Implicaciones de diseño:

- **ADMIN**: densidad media-alta, tablas potentes (filtros, orden, paginación), atajos.
- **DOCENTE**: el flujo "registrar nota" debe tomar pocos pasos; el formulario recuerda el último curso/materia/tipo usados.
- **ESTUDIANTE**: solo lectura, lenguaje simple, tarjetas grandes, buen responsive e impresión limpia del historial.

---

## 3. Principios de UX

1. **Claridad antes que ornamento.** Cada pantalla responde una pregunta ("¿cómo va el período?", "¿a quién le falta nota?").
2. **Un rol, un menú.** Nadie ve opciones que la API le va a rechazar con 403. (El servidor sigue siendo la autoridad; la UI solo evita el error.)
3. **Los cuatro estados siempre**: cargando (esqueleto), éxito, vacío (con explicación y acción) y error (con "Reintentar") — RNF-01. Cada bloque falla de forma independiente.
4. **Nunca solo color.** Todo estado de color va acompañado de texto e icono (WCAG 1.4.1; evita problemas para daltonismo).
5. **Mostrar nombres, no IDs.** La API ya embebe relaciones; la UI las muestra (RF-INS-01).
6. **Mensajes del servidor, no genéricos.** Los 400/409 de negocio se muestran tal cual; los 5xx/red usan mensaje genérico con "Reintentar".
7. **Confirmar lo destructivo, deshacer lo posible.** Diálogo de confirmación con el nombre del registro; tras la acción, mensaje de resultado.
8. **Consistencia.** Mismo patrón de listado, formulario, ficha y diálogo en los 7 recursos. Aprender uno es aprender todos.
9. **Rápido de percibir.** Skeletons con la forma del contenido, datos de referencia cacheados, `limit` siempre presente.
10. **Teclado primero en formularios y diálogos**; foco visible y orden lógico.

---

## 4. Resumen de la investigación aplicada

Hallazgos relevantes (detalle y enlaces en la sección 15):

- **Admin/docente = paleta más contenida**; los entornos de gestión usan versiones tranquilas de la marca, y un esquema de *barra lateral oscura + contenido claro + acento azul* es el punto de partida más común y seguro para paneles de administración.
- **Semáforo (rojo/ámbar/verde) para notas**, pero **siempre con icono y/o texto**; la gente con daltonismo rojo-verde no distingue 0 de 100 solo por color.
- **Los colores de gráficos son una paleta aparte** de los colores de interfaz (y apta para daltonismo).
- **Paneles por rol**: el admin necesita visión general; el docente, su cola de trabajo; el estudiante, su progreso.
- **WCAG 2.2 AA**: texto normal ≥ 4.5:1, texto grande ≥ 3:1, componentes de UI y gráficos ≥ 3:1; tablas y formularios densos conviene superar el mínimo; errores de formulario con icono + texto + posición, no solo color.
- **MUI**: el tema se define con `createTheme` con variables CSS y esquemas de color; en este proyecto se usa solo el esquema claro.
- **Screaming Architecture**: las carpetas gritan el *dominio* (estudiantes, calificaciones…) y no el framework; lo realmente compartido va en `shared/`.

---

## 5. Sistema visual

### 5.1 Concepto

**"Cuaderno institucional"**: azul índigo sereno como color de marca (confianza, academia), superficies neutras ligeramente frías, mucho aire, y color funcional (verde/ámbar/rojo/azul) reservado **solo para significado** (estados y notas), nunca como decoración.

### 5.2 Paleta de marca y neutros (modo claro)

Todos los contrastes fueron calculados con la fórmula WCAG.

| Token | Hex | Uso | Contraste |
|---|---|---|---|
| `primary.main` | `#2740B8` | Botones primarios, enlaces, elemento activo del menú, foco | 8.4:1 sobre blanco |
| `primary.dark` | `#1E2F8A` | Hover/pressed, texto sobre fondo primario claro | 11.5:1 sobre blanco |
| `primary.light` / tinte | `#E8ECFD` | Fondo de ítem activo, chips seleccionados, filas seleccionadas | `#1E2F8A` sobre él: 9.8:1 |
| `secondary.main` (acento) | `#0F766E` (teal) | Acciones secundarias, indicadores positivos de progreso | 5.5:1 sobre blanco |
| `background.default` | `#F6F7FB` | Fondo de la app | — |
| `background.paper` | `#FFFFFF` | Tarjetas, tablas, diálogos | — |
| `sidebar.bg` | `#111A3B` | Barra lateral (índigo muy oscuro) | texto blanco 17:1 |
| `sidebar.text` | `#C7D0F8` | Ítems inactivos del menú | 11.2:1 sobre `#111A3B` |
| `text.primary` | `#0F172A` | Texto principal | 16.7:1 sobre el fondo |
| `text.secondary` | `#475569` | Texto de apoyo, etiquetas | 7.6:1 sobre blanco |
| `text.disabled` / placeholder | `#64748B` | Placeholders (no se usa para información esencial) | 4.8:1 |
| `divider` / bordes | `#E2E8F0` | Líneas de tabla y tarjetas | decorativo |
| `focus.ring` | `#2740B8` a 2 px + 2 px de separación | Anillo de foco visible | ≥ 3:1 |

> La tipografía de apoyo nunca baja de `#64748B` sobre blanco: `#6B7A90` (4.36:1) se descartó por no llegar a 4.5:1.

### 5.3 Colores semánticos (estado)

| Semántica | Hex texto/icono | Fondo tinte | Contraste texto/blanco | Uso |
|---|---|---|---|---|
| `success` | `#15803D` | `#DCFCE7` | 5.0:1 | Activo, aprobado, éxito |
| `warning` | `#B45309` | `#FEF3C7` | 5.0:1 | Atención, nota en zona límite, retirada |
| `error` | `#B91C1C` | `#FEE2E2` | 6.5:1 | Error, reprobado, en riesgo |
| `info` | `#0369A1` | `#E0F2FE` | 5.9:1 | Informativo, planificado, egresado |
| `neutral` | `#475569` | `#F1F5F9` | 7.6:1 | Inactivo, finalizado, sin dato |

### 5.4 Mapa de estados del dominio → etiqueta (`StatusChip`)

Un único componente `StatusChip` recibe el estado del backend y decide color, **icono** y **texto**. Así cumple el requisito RF-PER-03 y la regla "no solo color".

| Entidad | Estado API | Semántica | Icono sugerido | Texto |
|---|---|---|---|---|
| Estudiante | `ACTIVO` | success | check-círculo | Activo |
| | `INACTIVO` | neutral | pausa | Inactivo |
| | `EGRESADO` | info | birrete | Egresado |
| | `RETIRADO` | warning | salida | Retirado |
| Docente | `ACTIVO` / `INACTIVO` | success / neutral | check / pausa | Activo / Inactivo |
| Curso | `ACTIVO` / `INACTIVO` | success / neutral | check / pausa | Activo / Inactivo |
| Materia | `ACTIVA` / `INACTIVA` | success / neutral | check / pausa | Activa / Inactiva |
| Período | `PLANIFICADO` | info | calendario | Planificado |
| | `ACTIVO` | success | punto lleno | Activo |
| | `FINALIZADO` | neutral | check doble / candado | Finalizado |
| Inscripción | `ACTIVA` | success | check | Activa |
| | `RETIRADA` | warning | salida | Retirada |
| | `FINALIZADA` | neutral | bandera | Finalizada |
| Usuario | activo / `activo=false` | success / error | check / bloqueo | Activo / Desactivado |

### 5.5 Colores de las notas (escala 0–100)

Alineados con los rangos fijos del backend. Se muestra **el número siempre** y, en las zonas de alerta, un icono + etiqueta accesible (`aria-label`/tooltip: "Reprobado", "En riesgo"…). El corte de aprobación es la constante `NOTA_APROBACION` (51 por defecto; configurable en un solo archivo `shared/config`).

| Rango | Significado | Semántica | Visual |
|---|---|---|---|
| 0–50 | Reprobado (< `NOTA_APROBACION`) | error | Chip rojo tinte + icono alerta |
| 51–70 | Aprobado justo | warning | Chip ámbar tinte |
| 71–85 | Bueno | info | Chip azul tinte |
| 86–100 | Sobresaliente | success | Chip verde tinte |
| `null` | Sin notas | neutral | Guion "—" gris |

### 5.6 Paleta para gráficos (separada de la UI)

Paleta categórica apta para daltonismo (basada en Okabe-Ito), para series que no son estados:

`#0072B2` · `#E69F00` · `#009E73` · `#CC79A7` · `#56B4E9` · `#D55E00`

Reglas para gráficos:

- Barras de **distribución de notas** usan la escala de notas (5.5) porque *sí* tienen significado; las demás series usan la paleta categórica.
- Ocupación de curso: barra con relleno primario; ≥ 90 % pasa a ámbar y 100 % a rojo (con texto "Lleno").
- Siempre: título, etiquetas directas o leyenda, valores accesibles en tooltip y una **tabla/lista alternativa** para lectores de pantalla.
- Sin 3D, sin pasteles de más de 4 porciones, ejes que arrancan en 0 para barras.
- Librería: **MUI X Charts** (mismo ecosistema/tema).

### 5.7 Modo oscuro — fuera de alcance

Decisión D5: la primera versión es **solo tema claro**. No se construye conmutador de tema ni se prueban los colores oscuros. Para no cerrar la puerta, todos los colores se declaran como tokens en un único archivo de tema (`shared/theme`) y nunca como valores sueltos en los componentes.

### 5.8 Tipografía

- Familia: **Inter** (o *system-ui* como respaldo) — legible en tablas y números. Cifras **tabulares** (`font-variant-numeric: tabular-nums`) en notas, porcentajes y códigos para que las columnas se alineen.
- Escala (rem, base 16 px):

| Rol | Tamaño / peso | Uso |
|---|---|---|
| Display | 2rem / 700 | Cifra grande de tarjetas KPI |
| H1 | 1.75rem / 700 | Título de página |
| H2 | 1.375rem / 600 | Título de sección/tarjeta |
| H3 | 1.125rem / 600 | Subsecciones, títulos de diálogo |
| Body | 1rem / 400 | Texto general |
| Body small | 0.875rem / 400 | Celdas de tabla, ayudas |
| Caption | 0.75rem / 500 | Metadatos (mínimo permitido) |

- Interlineado 1.5 para texto corrido, 1.25 en títulos. Longitud de línea ≤ 75 caracteres.

### 5.9 Espaciado, forma y elevación

- Rejilla de **8 px** (medio paso de 4 px para ajustes finos). Contenedor de contenido con ancho máximo `1440 px`, márgenes 16 px (móvil) / 24 px (tablet) / 32 px (escritorio).
- Radios: `8 px` controles y chips, `12 px` tarjetas, `16 px` diálogos.
- Elevación mínima: tarjetas con borde `1 px #E2E8F0` y sombra casi nula; sombra solo en menús, diálogos y elementos flotantes. Las tablas **no** llevan sombra.
- Densidad de tabla: `comfortable` por defecto (fila 52 px), `compact` (fila 40 px) opcional para ADMIN.
- Iconografía: un solo set de trazo uniforme (Material Symbols Outlined / `@mui/icons-material`), 20–24 px, siempre con etiqueta textual o `aria-label`.
- Movimiento: transiciones de 150–200 ms; respetar `prefers-reduced-motion`.

---

## 6. Patrones y componentes

### 6.1 Estructura de la aplicación (App Shell)

```
┌──────────────────────────────────────────────────────────────┐
│ ☰  Sistema Académico        [Período: 2026-I ▾]  ☾  Ana G. ▾ │  ← Barra superior
├────────────┬─────────────────────────────────────────────────┤
│ ▣ Inicio   │  Breadcrumb: Estudiantes / Juan Pérez           │
│ ◉ Estud.   │  ───────────────────────────────────────────    │
│ ◉ Docentes │  Título de página                  [+ Nuevo]     │
│ ◉ Cursos   │                                                  │
│ ◉ Materias │  Contenido                                       │
│ ◉ Períodos │                                                  │
│ ◉ Inscrip. │                                                  │
│ ◉ Calific. │                                                  │
│ ──────     │                                                  │
│ ⚙ Cuenta   │                                                  │
└────────────┴─────────────────────────────────────────────────┘
```

- **Barra lateral** fija ≥ 1200 px (240 px, colapsable a 72 px solo íconos); **drawer temporal** en < 1200 px; **barra inferior** de 4–5 destinos para ESTUDIANTE en móvil.
- **Barra superior**: botón de menú, buscador global (fase 3), selector de período (ADMIN, aplica `periodoAcademicoId` a los widgets del dashboard), menú de usuario (nombre vía `/auth/me`, cambiar contraseña, cerrar sesión).
- Breadcrumbs en fichas y subpáginas. Título de página = `h1` único; botón de acción principal alineado a la derecha.
- Enlace "Saltar al contenido" como primer elemento enfocable.

### 6.2 Patrón de listado (`DataTable` + filtros)

Usado por Estudiantes, Docentes, Cursos, Materias, Períodos, Inscripciones y Calificaciones.

```
Título                                           [ + Nuevo ]
┌────────────────────────────────────────────────────────────┐
│ 🔍 Buscar…  [Estado ▾] [Nivel ▾]   chips: Estado: Activo ✕ │ [Limpiar]
├────────────────────────────────────────────────────────────┤
│ Código ▲ │ Nombre completo │ Documento │ Email │ Estado │ ⋮ │
│ E001     │ Ana Pérez       │ 12345     │ a@…   │ ✔ Activo│ ⋮ │
├────────────────────────────────────────────────────────────┤
│ 1–20 de 134        Filas: [20 ▾]     ‹ 1 2 3 … 7 ›          │
└────────────────────────────────────────────────────────────┘
```

Reglas:

- **Todo se manda al servidor**: `page`, `limit`, `sortBy`, `order` y filtros. Búsqueda con *debounce* de 300 ms (RF-EST-02).
- **El estado de la tabla vive en la URL** (`?page=2&estado=ACTIVO&q=ana&sortBy=apellidos&order=asc`): enlaces compartibles, botón "atrás" correcto, recarga sin perder contexto.
- Solo se ofrece ordenar por columnas que el backend permite; el resto no muestra control de orden.
- Mantener datos previos visibles mientras carga la nueva página (sin parpadeo) con indicador de progreso fino en la parte superior de la tabla.
- Chips de filtros activos removibles + botón "Limpiar filtros".
- Acciones por fila en menú `⋮` (Ver, Editar, Eliminar) con las opciones filtradas por rol; el nombre de la fila es un enlace a la ficha.
- Selección múltiple **no** en la primera versión (la API no tiene operaciones masivas).
- **Móvil (< 600 px)**: la tabla se convierte en lista de tarjetas (nombre, estado y 2 datos clave); alternativa: scroll horizontal con primera columna fija para tablas de muchas columnas.
- Estado vacío: ilustración liviana + "No hay estudiantes con estos filtros" + botón "Limpiar filtros" o "Crear el primero".

### 6.3 Patrón de formulario

- Etiqueta **visible arriba** de cada campo (nunca solo placeholder); obligatorios con asterisco **y** texto "(obligatorio)" para lectores; ayuda breve debajo cuando haga falta.
- Una columna en móvil, máximo dos en escritorio; agrupar con subtítulos (Datos personales / Contacto / Estado).
- **Validación**: al salir del campo (*blur*) y al enviar, nunca mientras se escribe por primera vez; esquema compartido con TypeScript. Reglas del contrato: campos obligatorios, email válido, fecha válida, `capacidad` y `horasSemanales` enteros ≥ 1, `nota` 0–100, `fechaFin` > `fechaInicio`, contraseña ≥ 8.
- **Errores**: mensaje bajo el campo con icono, color de error y `aria-describedby`; resumen de errores arriba si hay varios; al fallar el envío, el foco va al primer error.
- **Errores del servidor**: 409 (código/documento duplicado) se asignan al campo correspondiente; mensajes `message[]` de 400 se normalizan y se muestran en una alerta del formulario. Nunca enviar campos que la API rechaza (`id`, `createdAt`, relaciones).
- Botón principal "Guardar" (deshabilitado + spinner durante el envío para evitar doble envío), secundario "Cancelar"; aviso si hay cambios sin guardar al salir.
- Selectores con búsqueda (autocompletar) para estudiante, curso, período, materia e inscripción, con datos de referencia cacheados (RNF-04); opciones filtradas por reglas (solo `ACTIVO`, excluir períodos `FINALIZADO`).
- Fechas: se muestran `dd/mm/aaaa`, se envían ISO 8601 (RNF-07); date picker con entrada por teclado.
- Formularios en **página** para altas complejas (estudiante, docente) y en **diálogo** para altas simples (materia, período, calificación rápida).

### 6.4 Eliminar y confirmar (comportamiento 4.7)

Diálogo: *"¿Eliminar a Ana Pérez? Si tiene registros asociados, será desactivada en lugar de eliminada."* Botón peligro con el verbo explícito ("Eliminar"), foco inicial en "Cancelar".

| Respuesta API | Retroalimentación |
|---|---|
| `204` | Toast éxito: "Se eliminó «Ana Pérez»." + refresco de la lista |
| `200` | Toast informativo: "Se desactivó porque tiene registros asociados." + el chip pasa a Inactivo |
| `409` | Alerta (no toast, requiere leer): mensaje del servidor + sugerencia ("Cambia el estado de la inscripción a Retirada") |
| `403` | Mensaje "No tienes permiso para esta acción" |

### 6.5 Estados de datos (RNF-01)

| Estado | Patrón |
|---|---|
| Cargando | Skeletons con la forma real (filas de tabla, tarjetas KPI, gráfico); spinner solo en botones |
| Vacío | Icono + frase explicativa + acción siguiente |
| Error | `Alert` con causa en lenguaje claro + botón **Reintentar**; el resto de la página sigue usable |
| Éxito parcial | Banner de aviso (p. ej. "Sin período activo") |
| Sin conexión | Banner persistente "Sin conexión. Reintentando…" |

### 6.6 Notificaciones

- **Toast** (esquina inferior, 5 s, `role="status"`): éxito de guardar/editar y avisos no críticos. Con acción "Deshacer" solo donde exista (no hay en esta API).
- **Alert en línea**: errores que el usuario debe leer o resolver (409, 400 de negocio).
- **Diálogo**: decisiones destructivas o sesión expirada.
- Nunca usar `alert()` del navegador.

### 6.7 Otros componentes del catálogo

`StatusChip`, `GradeBadge` (nota + color + icono), `KpiCard`, `ProgressBarLabeled` (ocupación), `PageHeader` (título + breadcrumbs + acciones), `EmptyState`, `ErrorState`, `ConfirmDialog`, `FormField`, `EntitySelect` (autocompletar con caché), `DateField`, `FilterBar`, `DataTable`, `Tabs` de ficha, `DefinitionList` (datos de ficha), `Avatar con iniciales`, `RoleGate` (oculta contenido por rol), `Skeletons`.

---

## 7. Arquitectura de información y navegación

### 7.1 Menú por rol

| Sección | ADMIN | DOCENTE | ESTUDIANTE |
|---|:-:|:-:|:-:|
| **Inicio** (resumen) | ✔ | ✔ (su resumen) | ✔ (Mis datos) |
| Estudiantes | ✔ | ✔ (lectura) | — |
| Docentes | ✔ | — | — |
| Cursos | ✔ | ✔ (lectura) | ✔ (lectura) |
| Materias | ✔ | ✔ (lectura) | ✔ (lectura) |
| Períodos académicos | ✔ | ✔ (lectura) | ✔ (lectura) |
| Inscripciones | ✔ | ✔ (lectura) | ✔ (solo propias) |
| Calificaciones | ✔ | ✔ (suyas, crear/editar) | ✔ (solo propias) |
| Historial académico | ✔ (desde ficha) | ✔ (desde ficha de estudiante) | ✔ |
| Usuarios | ✔ | — | — |
| Cambiar contraseña / Cerrar sesión | ✔ | ✔ | ✔ |

Menú **ADMIN** agrupado: *Panel* · *Personas* (Estudiantes, Docentes, Usuarios) · *Académico* (Cursos, Materias, Períodos) · *Gestión* (Inscripciones, Calificaciones).
Menú **DOCENTE**: Inicio · Mis calificaciones · Estudiantes · Cursos · Materias.
Menú **ESTUDIANTE** (barra inferior en móvil): Mis datos · Mis calificaciones · Historial · Mis inscripciones · Cuenta.

### 7.2 Mapa de rutas (URL)

```
/login
/                         → Inicio según rol
/estudiantes              /estudiantes/nuevo     /estudiantes/:id  (pestañas: datos | inscripciones | calificaciones | historial)
/estudiantes/:id/editar
/docentes                 /docentes/nuevo        /docentes/:id     /docentes/:id/editar
/cursos                   /cursos/:id            (pestañas: estudiantes | materias)
/materias                 /materias/:id
/periodos-academicos
/inscripciones
/calificaciones
/usuarios
/mi/resumen   /mi/calificaciones   /mi/historial   /mi/inscripciones     (estudiante y docente)
/cuenta/contrasena
/sin-acceso   (403)       *  → No encontrado (404)
```

Guardas: sin sesión → `/login` guardando la ruta de retorno; con sesión sin permiso → `/sin-acceso` (nunca pantalla en blanco).

---

## 8. Especificación por pantalla

### 8.1 Login (`/login`)

- Tarjeta centrada (máx. 400 px) sobre fondo de marca suave; logo + "Sistema Académico".
- Campos: email, contraseña (con botón mostrar/ocultar). Botón "Ingresar" con spinner.
- Errores: `401` → "Credenciales inválidas" (en una alerta en línea, sin indicar cuál campo falló); `429` → "Demasiados intentos, espera un momento" con el botón deshabilitado unos segundos; red → "No se pudo conectar con el servidor" + reintentar.
- Mensaje contextual si llegó por sesión vencida: "Tu sesión expiró. Vuelve a ingresar."
- Entorno de desarrollo: ayuda opcional que lista las 3 cuentas de prueba (solo `import.meta.env.DEV`).
- Accesibilidad: `autocomplete="username"/"current-password"`, `Enter` envía, foco al primer campo.

### 8.2 Inicio — ADMIN (RF-INI)

```
Resumen · Período vigente: 2026-I [Activo]                [Período ▾]
┌──────────┐┌──────────┐┌──────────┐┌──────────┐┌─────────────────┐
│Estud. 134││Docent. 12││Cursos 9  ││Materias 18││Inscrip. activas │
└──────────┘└──────────┘└──────────┘└──────────┘└─────────────────┘
┌ Ocupación por curso ─────────────┐┌ Promedio por curso ──────────┐
│ Primero A  ███████░░ 28/30  93 % ││  gráfico de barras           │
│ Primero B  █████░░░░ 18/30  60 % │└──────────────────────────────┘
└──────────────────────────────────┘┌ Distribución de notas [Materia▾]┐
┌ Estudiantes en riesgo (umbral ◀51▶)┐│ 0-50 ▇  51-70 ▇▇ 71-85 ▇▇▇ 86+ ▇▇│
│ Juan P. · E011 · 42,5 · 6 notas   │└──────────────────────────────┘
└───────────────────────────────────┘┌ Últimas calificaciones ──────┐
                                     │ lista de 10                  │
```

- 5 `KpiCard`; si `periodoActivo` es `null` → tarjeta "Sin período activo" con enlace a Períodos.
- Cada bloque con carga/vacío/error **independientes** (RF-INI-06). Selector de período afecta a ocupación, promedios, distribución y riesgo.
- Riesgo: control numérico/slider del `umbral` (por defecto 51), lista paginada, cada fila enlaza a la ficha.
- Ocupación: barra con texto "28/30 · 93 %"; sin capacidad (`porcentaje: null`) muestra solo "28 inscritos".

### 8.3 Inicio — DOCENTE (RF-MDO)

Tarjetas: calificaciones registradas, promedio otorgado. Tabla "Por materia" (calificaciones, promedio). Gráfico de distribución con selector de materia. Atajo destacado **"Registrar calificación"**. Últimas notas registradas por el docente.

### 8.4 Inicio — ESTUDIANTE / Mis datos (RF-MIS)

Tarjetas grandes: **Promedio general** (con `GradeBadge`), **Materias cursadas**, **Calificaciones**. Gráfico de línea/barras "Promedio por período". Accesos directos: Historial académico, Mis calificaciones. Solo lectura (sin botones de crear/editar/eliminar). Datos personales e inscripciones en tarjetas.

### 8.5 Estudiantes (RF-EST)

- **Listado**: columnas Código · Nombre completo · Documento · Email · Estado · Acciones. Buscador `q` (nombre, código, documento) + filtro Estado. Orden por columnas permitidas.
- **Ficha** `/estudiantes/:id`: cabecera (avatar iniciales, nombre, código, `StatusChip`, acciones Editar/Eliminar solo ADMIN) + pestañas **Datos · Inscripciones · Calificaciones · Historial académico**. Cada pestaña carga su propia consulta (perezosa) y mantiene su estado vacío/error.
- **Formulario** crear/editar: código, nombres, apellidos, documento, email, teléfono, fecha de nacimiento, estado. 409 por código/documento duplicado junto al campo.
- DOCENTE: solo listado y ficha (sin acciones de escritura).

### 8.6 Historial académico (RF-HIS)

```
Historial académico — Ana Pérez                [🖨 Imprimir]
Promedio general: 87,50  [Sobresaliente]
▼ 2026-I · Primero A · Promedio 87,5
   Matemática · promedio 87,5
      PARCIAL 85 [Bueno]   FINAL 90 [Sobresaliente]
   Lengua · promedio 48 [Reprobado ⚠]
▶ 2025-II · …
```

- Jerarquía período → curso → materia → calificaciones (acordeones; el más reciente abierto).
- Promedios tal como vienen del servidor (no recalcular); nota bajo `NOTA_APROBACION` resaltada con icono + etiqueta.
- Vacío: "Aún no hay inscripciones ni calificaciones" + explicación.
- **Impresión** (`window.print()`): hoja `@media print` sin menú/barras/botones, fondo blanco, acordeones expandidos, encabezado con nombre, fecha de emisión y número de página; colores de nota con texto además del color (se imprime en blanco y negro).

### 8.7 Docentes (RF-DOC) · Cursos (RF-CUR) · Materias (RF-MAT)

- **Docentes**: listado + formulario igual a Estudiantes; ficha con resumen y pestaña de calificaciones paginadas.
- **Cursos**: filtros nivel/estado/nombre; la columna "Ocupación" usa `inscritosActivos` vs. `capacidad`; ficha con pestañas **Estudiantes inscritos** y **Materias**, y barra de ocupación en la cabecera. Aviso: *"Materias con calificaciones en este curso"* (limitación 2 del backend).
- **Materias**: filtros estado/nombre; ficha con sus calificaciones.

### 8.8 Períodos académicos (RF-PER)

Listado simple (sin ficha) con `StatusChip` (Planificado/Activo/Finalizado), fechas `dd/mm/aaaa` y duración. Formulario en diálogo con validación `fechaFin > fechaInicio`. Resaltar la fila del período activo.

### 8.9 Inscripciones (RF-INS)

- Listado con nombres de estudiante, curso y período; filtros por estudiante, curso, período y estado (selectores con autocompletar).
- **Nueva inscripción** (diálogo/página): estudiante (solo `ACTIVO`), curso (solo `ACTIVO`) y período (sin `FINALIZADO`). Al elegir curso se muestra su ocupación para anticipar el 409 de capacidad. Los errores de negocio (inactivo, período finalizado, duplicada, curso lleno) se muestran **tal cual** en una alerta.
- **Cambiar estado** (ACTIVA/RETIRADA/FINALIZADA) con menú de fila + confirmación.
- ESTUDIANTE: lista solo lectura de las propias.

### 8.10 Calificaciones (RF-CAL)

- Listado con filtros: materia, docente, tipo, estudiante, curso, período, rango de fechas. Cada fila: estudiante, curso, materia, tipo, `GradeBadge`, fecha, docente.
- **Registrar** (ADMIN/DOCENTE): inscripción (autocompletar mostrando "Estudiante · Curso · Período"), materia, tipo, nota 0–100 (campo numérico con paso 0.5 y vista previa del `GradeBadge`), docente (si DOCENTE, fijo "a su nombre"), fecha, observación. Acción **"Guardar y registrar otra"** que conserva curso/materia/tipo para carga rápida.
- **Editar** con `PATCH`. **No hay botón de eliminar**; en su lugar, texto de ayuda "Las calificaciones forman parte del historial y se corrigen editándolas".
- DOCENTE: solo ve las suyas; un 403 al editar una ajena se muestra como mensaje claro, no como error genérico.

### 8.11 Usuarios (solo ADMIN)

Listado (email, rol, vinculado a, activo). Alta: email, contraseña (≥ 8, con indicador de requisitos), rol y —según rol— selector de estudiante o docente (los demás no aparecen). Edición: email, contraseña, activo (rol y vínculo en solo lectura con explicación). El admin no puede desactivar/eliminar su propia cuenta: el control aparece deshabilitado con tooltip explicativo.

### 8.12 Cambiar contraseña, Sin acceso, No encontrado, Error

- **Cambiar contraseña**: contraseña actual, nueva (≥ 8) y confirmación; `204` → toast y permanece en sesión.
- **Sin acceso (403)**: mensaje amable, rol actual, botón "Volver al inicio".
- **No encontrado (404)** y **error inesperado** (error boundary): nunca pantalla en blanco; botón "Reintentar"/"Ir al inicio".

---

## 9. Manejo de errores y sesión (mapa HTTP → UI)

| Código | Dónde | Presentación |
|---|---|---|
| 400 | Formulario | Alerta con mensajes normalizados (`message` puede ser arreglo) y campos marcados |
| 401 (fuera de login) | Global | Limpia sesión, redirige a `/login` con aviso "Tu sesión expiró" |
| 401 (login) | Login | "Credenciales inválidas" |
| 403 | Acción / pantalla | Mensaje "No tienes permiso…" o pantalla Sin acceso |
| 404 | Ficha / ruta | Pantalla "No encontrado" con enlace al listado |
| 409 | Formulario / eliminar | Mensaje del servidor junto al campo o en alerta |
| 429 | Login | "Demasiados intentos, espera un momento" |
| 5xx / red | Bloque o página | Mensaje genérico + **Reintentar**; el resto de la app sigue funcionando |

**Sesión**: guardar el token solo en el `AuthProvider` (RF-AUTH-02). Avisar ~2 min antes de vencer (diálogo "Tu sesión está por expirar") con opción de volver a ingresar. Decisión de seguridad a documentar en el README: `localStorage` es sencillo pero expone el token ante XSS (RF-AUTH-07).

---

## 10. Responsive

| Breakpoint | Ancho | Layout |
|---|---|---|
| xs | 360–599 | 1 columna; drawer; tablas → tarjetas; formularios 1 columna; ESTUDIANTE con barra inferior |
| sm | 600–899 | 2 columnas de KPIs; tablas con scroll horizontal y primera columna fija |
| md | 900–1199 | Drawer colapsado a íconos; contenido a todo el ancho |
| lg | 1200–1535 | Barra lateral fija 240 px; rejilla de 12 columnas |
| xl | ≥ 1536 | Contenido limitado a 1440 px centrado |

Objetivos táctiles ≥ 44 × 44 px en móvil; sin scroll horizontal de página; probar a 360 px (RNF-02).

---

## 11. Accesibilidad (WCAG 2.2 AA) — lista de verificación

- [ ] Contraste: texto ≥ 4.5:1, texto grande ≥ 3:1, componentes/gráficos ≥ 3:1 (todos los tokens de la sección 5 ya cumplen).
- [ ] Ningún significado depende solo del color (estados, notas, errores, gráficos).
- [ ] Foco siempre visible (anillo de 2 px); orden de tabulación lógico; sin trampas de teclado; atajo "Saltar al contenido".
- [ ] Todos los campos con `label`; errores asociados con `aria-describedby`; foco al primer error; `autocomplete` correcto.
- [ ] Tablas con `<caption>`/título, `<th scope>`, ordenamiento anunciado (`aria-sort`).
- [ ] Diálogos con foco atrapado, cierre con `Esc`, foco devuelto al disparador, `aria-labelledby`.
- [ ] Mensajes dinámicos (toasts, carga, resultados de filtro) en regiones `aria-live` (`role="status"`/`alert`).
- [ ] Gráficos con alternativa textual/tabular.
- [ ] Zoom 200 % y reflujo a 320 px sin pérdida de contenido; texto redimensionable.
- [ ] Objetivos táctiles ≥ 24 px (mínimo WCAG 2.2) y ≥ 44 px en móvil (recomendado).
- [ ] `prefers-reduced-motion` respetado.
- [ ] Idioma de la página declarado (`lang="es"`), fechas y números con formato local.
- [ ] Verificación con axe/Lighthouse y recorrido manual con teclado y lector de pantalla antes de cada entrega.

---

## 12. Screaming Architecture

**Idea:** al abrir `app/`, lo primero que se lee debe ser *qué hace el sistema* (estudiantes, calificaciones, inscripciones…) y no *con qué está hecho* (components, hooks, utils). Las carpetas de primer nivel reflejan los **módulos del backend** (`estudiante`, `docente`, `curso`, `materia`, `periodo-academico`, `inscripcion`, `calificacion`, `auth`, `usuario`, `dashboard`).

### 12.1 Estructura propuesta

```
app/
├── root.tsx                      # Layout HTML + providers (Query, Theme, Auth)
├── routes.ts                     # Mapa de rutas (configuración de React Router)
├── routes/                       # Archivos de ruta DELGADOS: solo conectan URL → pantalla de feature
│
├── features/                     # ← el dominio "grita" aquí
│   ├── autenticacion/
│   │   ├── api/                  # login, me, cambiar-password
│   │   ├── components/           # LoginForm, RoleGate, SessionExpiryDialog
│   │   ├── context/              # AuthProvider (único lugar que toca el token)
│   │   ├── pages/                # LoginPage, CambiarPasswordPage, SinAccesoPage
│   │   ├── model/                # tipos Usuario, Rol, permisos por rol
│   │   └── index.ts              # API pública del feature
│   ├── panel-inicio/             # Dashboard: admin, docente, estudiante (consume /dashboard/*)
│   ├── estudiantes/
│   │   ├── api/                  # funciones HTTP + query keys + hooks de TanStack Query
│   │   ├── components/           # EstudiantesTable, EstudianteForm, EstudianteFicha…
│   │   ├── pages/                # EstudiantesListPage, EstudianteDetailPage, EstudianteFormPage
│   │   ├── model/                # tipos, esquemas de validación, constantes de estado
│   │   └── index.ts
│   ├── docentes/
│   ├── cursos/
│   ├── materias/
│   ├── periodos-academicos/
│   ├── inscripciones/
│   ├── calificaciones/
│   ├── historial-academico/      # Vista agrupada período → curso → materia + impresión
│   └── usuarios/
│
├── shared/                       # SOLO lo realmente transversal (no conoce el dominio)
│   ├── api/                      # cliente HTTP único, normalización de errores, interceptor 401
│   ├── ui/                       # DataTable, StatusChip, KpiCard, ConfirmDialog, EmptyState…
│   ├── layout/                   # AppShell, Sidebar, Topbar, PageHeader, BottomNav
│   ├── theme/                    # tokens y createTheme (solo tema claro)
│   ├── hooks/                    # useDebounce, useUrlState, useConfirm
│   ├── lib/                      # formateo de fechas/notas, utilidades puras
│   └── config/                   # env (VITE_API_URL), NOTA_APROBACION, roles
│
└── app.css / index.css           # Reset mínimo y estilos de impresión globales
```

### 12.2 Reglas de dependencia (se verifican con ESLint)

1. `routes/` → importa de `features/*` (solo su `index.ts`) y de `shared/`.
2. `features/X` → puede importar `shared/` y **la API pública** (`index.ts`) de otro feature **solo cuando es imprescindible** (p. ej. `inscripciones` usa un `EstudianteSelect` exportado por `estudiantes`). Nunca rutas internas de otro feature.
3. `shared/` **nunca** importa de `features/`.
4. Sin dependencias circulares entre features; si dos features se necesitan mutuamente, lo común sube a `shared/` o se crea un feature de composición (p. ej. `historial-academico`).
5. Los componentes de presentación no llaman a la API: usan hooks del feature (RNF-05). Ningún componente llama a `fetch` directamente (capa `api/` única).
6. Los **tipos del dominio** viven en el `model/` del feature dueño y reflejan el contrato de la API.

### 12.3 Convenciones

- Carpetas en `kebab-case` y en español para el dominio (`periodos-academicos`), igual que el backend; archivos de componentes en `PascalCase.tsx`; hooks `useXxx.ts`.
- Cada feature expone un `index.ts` con su API pública; lo no exportado es privado.
- Query keys jerárquicas por feature (`['estudiantes','list',filtros]`) para invalidar con precisión tras mutaciones.
- Datos de referencia (cursos, períodos, materias activas) con `staleTime` largo y compartidos mediante el hook exportado por su feature.
- Pruebas junto al código (`*.test.tsx`) dentro del feature.

---

## 13. Notas de implementación del tema (sin código)

- Un solo archivo de **tokens** (colores, tipografía, espaciado, radios) en `shared/theme`, de donde sale el tema de MUI con **variables CSS** (solo esquema claro).
- Sobrescribir en el tema (no en cada pantalla): botones (sin mayúsculas forzadas), campos (borde 1 px, radio 8), tablas (cabecera sticky, cebra suave opcional), chips, diálogos, tooltips y foco visible.
- Declarar en el tema los colores extra (`neutral`, `sidebar`, escala de notas) como extensión de paleta tipada.
- Reutilizar los componentes de MUI envueltos en `shared/ui` para que el aspecto y la accesibilidad se arreglen en un solo lugar.

---

## 14. Reparto del trabajo y plan por fases

### 14.1 Quién hace qué

| Entrega | Responsable | Estado |
|---|---|---|
| Plan UI/UX, arquitectura y dependencias | **Docente** | Este documento + proyecto configurado |
| Fundaciones: tema, cliente HTTP, `AuthProvider`, rutas protegidas, App Shell con menú lateral por rol | **Docente** | Hecho |
| **Login** (8.1), **Cambiar contraseña** y **Sin acceso** (8.12) | **Docente** | Hecho |
| **Inicio / Dashboard** por rol (8.2, 8.3, 8.4) | **Estudiantes** | Pendiente (fase 1); `/` muestra un placeholder |
| Componentes base de `shared/ui` (StatusChip, GradeBadge, KpiCard, EmptyState, ErrorState, QueryState, PageHeader, SectionCard, PlaceholderPage) | **Docente** (base) | Hecho; DataTable, ConfirmDialog y FormField los añaden los estudiantes según los necesiten |
| Inicio (8.2 a 8.4), Estudiantes (8.5), Historial académico (8.6), Docentes, Cursos, Materias (8.7), Períodos (8.8), Inscripciones (8.9), Calificaciones (8.10), Usuarios (8.11) | **Estudiantes** | Fases 1 a 3 |
| Pruebas, responsive, accesibilidad, capturas por rol y README final | **Estudiantes** (con revisión del docente) | Fase 4 |

> Los estudiantes trabajan **sobre la estructura entregada**: cada módulo en su carpeta `app/features/<modulo>/`, siguiendo las reglas de la sección 12 y reutilizando `shared/`.

### 14.2 Fases

| Fase | Contenido | Resultado verificable |
|---|---|---|
| **0 — Fundaciones (docente)** | Tokens y tema MUI, cliente HTTP con manejo de 401 y errores, `AuthProvider`, rutas protegidas, App Shell con menú por rol, `shared/ui` base, Login, Cambiar contraseña | Login con las 3 cuentas; el menú cambia por rol; un 401 devuelve al login; sin pantallas en blanco |
| **1 — Lectura (estudiantes)** | Inicio/dashboard por rol, listados y fichas de Estudiantes, Cursos, Materias, Períodos; Historial académico con impresión | Vistas de lectura con los 4 estados, paginación/filtros/orden del servidor y URL como estado |
| **2 — Escritura (estudiantes)** | CRUD de Estudiantes, Docentes, Cursos, Materias, Períodos; Inscripciones; Calificaciones (crear/editar); comportamiento de DELETE (4.7) | Formularios con validación en el cliente + errores 400/409 del servidor |
| **3 — Administración y pulido (estudiantes)** | Usuarios, aviso de expiración de sesión, densidad de tabla | Checklist de accesibilidad completo |
| **4 — Calidad** | Pruebas de componentes y flujos clave, revisión responsive (360 px), auditoría axe/Lighthouse, capturas por rol, README final con decisiones | Criterios de aceptación de la spec cumplidos |

---

## 15. Decisiones

Resueltas (ver 1.1): SPA, sin marca institucional, solo web responsive, React Hook Form + Zod, MUI X Charts, sin modo oscuro, reparto docente/estudiantes.

Pendiente (opcional): **Storybook** como catálogo de `shared/ui`. No está instalado; solo se añadiría si hay tiempo.

---

## 16. Fuentes consultadas

Investigación web (los sitios secundarios se usaron como orientación; las cifras de contraste se verificaron con la fórmula WCAG):

- Paletas y color en paneles educativos: [AdminLTE — Best Admin Dashboard Color Schemes](https://adminlte.io/blog/best-admin-dashboard-color-schemes/) · [EdTech Color Palette](https://www.inspoai.io/blogs/edtech-color-palette) · [LMS Dashboard UI: Design Best Practices](https://grandavehousing.calpoly.edu/news/lms-dashboard-ui-design-best) · [EdTech Books — Dashboard](https://edtechbooks.org/design/dashboard)
- Codificación por color de notas y daltonismo: [Khan Academy — Color Coding in Teacher Dashboard (hilo de la comunidad)](https://support.khanacademy.org/hc/de/community/posts/360042619711/comments/360005207812) · [Quadratic — Student performance dashboard](https://www.quadratichq.com/use-cases/build-a-student-performance-dashboard-grades-tracking)
- Accesibilidad / WCAG 2.2: [Yale — WCAG 2 A and AA Checklist (Designers)](https://usability.yale.edu/web-accessibility/articles/wcag2-checklist/designers) · [Allyant — Color and contrast for accessibility](https://allyant.com/blog/color-and-contrast-for-accessibility/) · [Stark — Use of Color (1.4.1)](https://www.getstark.co/wcag-explained/perceivable/distinguishable/use-of-color/) · [Stark — Non-text contrast (1.4.11)](https://getstark.co/wcag-explained/perceivable/distinguishable/non-text-contrast) · [Chi — Color & sensory](https://lib.lumen.com/chi/6.29.0/foundations/accessibility/color-sensory) · [W3C — WCAG 2.2](https://www.w3.org/TR/WCAG22/)
- Tema MUI, variables CSS y modo oscuro: [MUI — CSS theme variables](https://mui.com/material-ui/customization/css-theme-variables/configuration/) · [MUI — Dark mode](https://mui.com/material-ui/customization/dark-mode)
- Screaming Architecture / organización por features en React: [Folder structures (GitHub)](https://github.com/ahmad2point0/folder-structures) · [Best Practices for Folder Structure in React](https://namastedev.com/blog/best-practices-for-folder-structure-in-react-3/) · [Screaming architecture (guía)](https://sharedcontext.ai/skills/external/joabgonzalez/screaming-architecture)
- Paleta categórica apta para daltonismo: Okabe & Ito (2008), *Color Universal Design*.

Documentos del proyecto: `backend-notas/doc/dashboard-requirements.md`, `requirements.md`, `backend-proposals.md`, `prisma/schema.prisma`, `CLAUDE.md`.
