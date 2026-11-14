# Plan de la Fase 2 — Frontend profesional

> Documento vivo. Reúne **todo lo que se trabaje en el frontend después del plan principal** (`docs/UI-UX-PLAN.md`), que ya está cumplido. Cada mejora se diagnostica, se especifica, se registra en Jira, se implementa y se verifica aquí.
>
> **Estado:** en revisión (PR #16 frontend + PR #3 backend) · **Inicio:** 12/11/2026 · **Épica en Jira:** DS-8 · **Áreas:** estudiante, docente y administrador

---

## Contenido

1. [Forma de trabajo](#1-forma-de-trabajo)
2. [Interfaz del estudiante](#2-interfaz-del-estudiante)
3. [Interfaz del docente](#3-interfaz-del-docente)
4. [Interfaz del administrador](#4-interfaz-del-administrador)
5. [Registro de cambios](#5-registro-de-cambios)
6. [Diseño, rendimiento y conexión entre roles](#6-diseño-rendimiento-y-conexión-entre-roles)

---

## 1. Forma de trabajo

### 1.1 Relación con el plan principal

`UI-UX-PLAN.md` sigue siendo la base: sistema visual, componentes, arquitectura y reglas. Este documento **no lo reemplaza**: lo amplía por rol, con diagnóstico y criterios medibles. Si algo de aquí contradice el plan principal, manda este documento para la fase 2, y la decisión se anota en el registro de cambios.

### 1.2 Flujo por cambio

| Paso | Regla |
|---|---|
| Jira | Una **Tarea por módulo** (no por fase), dentro de la épica DS-8. |
| Rama | `feature/DS-xx-modulo` desde `master` actualizado. |
| Commits y PR | Empiezan con la clave de Jira (`DS-18 …`). Un PR por tarea. |
| Revisión | El grupo tiene acceso para revisar y unir; se recomienda que otro integrante revise antes del merge. |
| Documento | Cada PR actualiza la sección del rol y el [registro de cambios](#5-registro-de-cambios). |

### 1.3 Definición de terminado

Un cambio está terminado cuando cumple **todo**:

- [ ] `tsc --noEmit` y `eslint` sin errores.
- [ ] Probado con los perfiles de prueba del rol (sección 2.8) en **360 px** y **1280 px**, sin desborde horizontal.
- [ ] **axe-core** (WCAG 2.2 AA) sin violaciones en las vistas tocadas.
- [ ] Objetivos táctiles de **al menos 44 px** en celular.
- [ ] Los cuatro estados: cargando, error con Reintentar, vacío y con datos.
- [ ] Sin cambios en el backend y sin recalcular promedios en el cliente: se usan los del servidor y solo se comparan con `NOTA_APROBACION` (51).
- [ ] No se rompe la experiencia de los otros roles.

### 1.4 Entorno de pruebas

- Base de prueba aparte, creada con la semilla (`semilla-academia/02_semilla_academia.sql`), con un backend y un frontend paralelos. Al terminar se borra; la base real no se toca.
- Script de auditoría reutilizable (recorridos, axe-core, teclado, impresión A4, objetivos táctiles): carpeta `Documentacion-Academia/Analisis-UX-Estudiante/evidencia`.

---

## 2. Interfaz del estudiante

### 2.1 Diagnóstico

Auditoría del 12/11/2026: **56 vistas** (7 perfiles × 4 pantallas × celular y computadora), con axe-core 4.10, teclado e impresión en A4. La base técnica es sólida (0 errores, 0 desbordes, 1–3 s de carga), pero la experiencia es de «consulta de registros» y no de «seguimiento del propio avance».

| ID | Gravedad | Pantalla | Hallazgo | Tarea |
|---|---|---|---|---|
| H1 | **Crítica** | Historial | La libreta impresa en A4 corta Examen final, Nota final y Promedio final; la 1.ª hoja sale casi vacía. | DS-18 |
| H2 | Alta | Inicio | No dice curso actual, estado de la gestión ni materias en riesgo. | DS-19 |
| H3 | Alta | Inicio | Egresado y retirado ven lo mismo que un activo, sin aviso. | DS-19 |
| H4 | Alta | Mis calificaciones | Es la vista del administrador: su propio nombre en 182 filas, 6 filtros, 7,4 pantallas en celular. | DS-20 |
| H5 | Media | Historial | Abre en la gestión más antigua; 39 % de celdas «—»; tabla ancha en celular. | DS-18 |
| H6 | Media | Historial | Región desplazable sin acceso por teclado (axe: `scrollable-region-focusable`). | DS-18 |
| H7 | Media | Historial | Reprobado indicado solo con color. | DS-18 |
| H8 | Media | Navegación | No hay barra inferior en celular (plan 6.1). | DS-21 |
| H9 | Media | General | Objetivos táctiles menores de 44 px. | DS-21 |
| H10 | Baja | Inicio | Últimas notas sin fecha ni tipo; tarjeta «Accesos» duplica el menú; gráfico sin línea de 51. | DS-19 |
| H11 | Baja | Mis inscripciones | Filtros y paginación para 1 a 3 filas. | DS-22 |
| H12 | Baja | Inicio | El foco del teclado entra a un SVG sin nombre. | DS-19 |
| H13 | Baja | General | «Mis datos» no muestra datos personales; paralelo repetido («5to Secundaria A «A»»). | DS-20, DS-22 |

### 2.2 Para quién diseñamos

Uso esporádico y **desde el celular**, con datos móviles limitados; la familia es una segunda audiencia de la libreta. Las preguntas que trae:

1. ¿Cómo voy en esta gestión?
2. ¿Qué materias tengo en riesgo?
3. ¿Qué saqué en el último examen y qué comentó el docente?
4. ¿En qué curso y paralelo estoy?
5. Necesito mi libreta para mostrarla o imprimirla.
6. ¿Mejoré respecto al año pasado?

### 2.3 Principios

1. **Lo actual primero:** la gestión en curso es el punto de partida; lo histórico, a un toque.
2. **Por materia, no por nota suelta.**
3. **Siempre con significado:** cada número con su estado (✔ aprobado, ⚠ en riesgo) usando icono y texto, no solo color.
4. **Celular primero y a un toque:** barra inferior, tarjetas, objetivos de 44 px.
5. **El servidor calcula, la pantalla interpreta.**

### 2.4 Navegación y rutas

| Destino | Ruta | Contenido | Tarea |
|---|---|---|---|
| Inicio | `/` | ¿Cómo voy? | DS-19 |
| Mis materias | `/mi/materias`, `/mi/materias/:materiaId` | Tarjetas por materia y detalle | DS-20 |
| Historial | `/mi/historial` | Libreta e impresión oficial | DS-18 |
| Mi cuenta | `/mi/cuenta` | Datos, inscripciones, contraseña | DS-22 |

En celular, los 4 destinos van en una **barra inferior fija** (DS-21). `/mi/calificaciones` y `/mi/inscripciones` redirigen a su nueva ubicación.

### 2.5 Especificación por pantalla

#### Inicio — «¿cómo voy?» (DS-19)

```
5to Secundaria A · Gestión 2026 (en curso)
⚠ Vas aprobando 11 de 13 materias
   En riesgo: Física 49 · Matemática 46          [Ver]
[Promedio 2026 ⚠ 59,1] [Aprobadas ✔ 11] [En riesgo ⚠ 2]
Últimas notas: materia · tipo · fecha · nota
Mi evolución por gestión (con línea de 51)
```

| Situación | Mensaje principal |
|---|---|
| Activo, al día | «Vas aprobando todas tus materias» |
| Activo, en riesgo | Alerta con las materias en riesgo primero |
| Egresado | «Egresaste en la Gestión X» y acceso a la libreta |
| Retirado | «Tu inscripción figura como retirada» y acceso al historial |
| Sin inscripción | «Todavía no estás inscrito en un curso» |

#### Mis materias (DS-20)

- Una tarjeta por materia de la gestión actual: promedio con estado, notas por trimestre y docente. Primero las de riesgo.
- Detalle: cada evaluación (tipo, fecha, nota) y la **observación del docente**.
- «Todas mis notas»: sin columna de nombre, con 3 filtros (materia, tipo, gestión actual por defecto).

#### Historial (DS-18)

- Abre en la **gestión más reciente**.
- Solo columnas con datos; se quitan las que la API no entrega (Ponderado, Nota pre-final, Nota final).
- Reprobadas con **icono y texto**; resumen por gestión (promedio, aprobadas, en riesgo).
- Celular: una tarjeta por materia. Tabla desplazable accesible con teclado.
- Impresión A4 vertical con todas las columnas y encabezado con nombre, fecha de emisión y número de página.

#### Mi cuenta (DS-22)

Datos personales, curso actual, inscripciones como línea de tiempo y cambio de contraseña.

### 2.6 Origen de los datos (sin cambiar el backend)

| Bloque | Endpoint |
|---|---|
| Curso y gestión actual | `GET /inscripciones` (propias) con período `ACTIVO` |
| Promedios por gestión y materia | `GET /estudiantes/:id/historial-academico` |
| Materias en riesgo | Historial: promedio por materia de la gestión actual comparado con 51 |
| Últimas notas, fecha, tipo, docente, observación | `GET /estudiantes/:id/calificaciones` |
| Evolución | `GET /dashboard/estudiantes/:id/resumen` |
| Datos personales | `GET /estudiantes/:id` |

> **Mejora sugerida al backend (depende del docente):** que el historial incluya la fecha y el docente de cada nota.

### 2.7 Criterios de aceptación

| ID | Criterio | Tarea |
|---|---|---|
| CA-01 | El Inicio muestra curso, paralelo y gestión actual sin desplazar en celular. | DS-19 |
| CA-02 | Las materias con promedio de la gestión actual menor a 51 se listan con icono, texto y enlace. | DS-19 |
| CA-03 | Egresado, retirado y sin inscripción ven un mensaje propio de su situación. | DS-19 |
| CA-04 | Las últimas notas muestran materia, tipo, fecha y nota, sin repetir el nombre del estudiante. | DS-19 |
| CA-05 | Mis materias lista solo la gestión actual, con las de riesgo primero. | DS-20 |
| CA-06 | El detalle de una materia muestra la observación del docente cuando existe. | DS-20 |
| CA-07 | El Historial abre en la gestión más reciente y no muestra columnas sin datos. | DS-18 |
| CA-08 | La libreta impresa en A4 incluye todas las columnas finales y se entiende en blanco y negro. | DS-18 |
| CA-09 | En celular hay barra inferior con 4 destinos y objetivos de al menos 44 px. | DS-21 |
| CA-10 | axe-core no reporta violaciones WCAG 2.2 AA en las pantallas del estudiante. | Todas |

### 2.8 Plan de pruebas

**Perfiles** (semilla): regular (Juan Pérez, EST-0051), en riesgo (EST-0185), destacado (EST-0080), egresado (EST-0101), retirado (EST-0003), nuevo de 1ro (EST-0176) y uno sin inscripciones (creado solo en la base de prueba).

| Caso | Perfil | Pasos | Resultado esperado |
|---|---|---|---|
| QA-01 | Regular | Ver el Inicio en celular | Curso, gestión y estado sin desplazar |
| QA-02 | En riesgo | Ver el Inicio | Alerta con sus materias en riesgo |
| QA-03 | Destacado | Ver el Inicio | Mensaje positivo, sin alerta |
| QA-04 | Egresado | Ver el Inicio | «Egresaste…» y acceso a la libreta |
| QA-05 | Retirado | Ver el Inicio | Mensaje de inscripción retirada |
| QA-06 | Sin inscripción | Recorrer las 4 pantallas | Mensajes vacíos claros, sin errores |
| QA-07 | Regular | Mis materias → Física | Notas por trimestre y observación |
| QA-08 | Regular | Historial → Imprimir en A4 | Todas las columnas finales visibles |
| QA-09 | Todos | Recorrer con Tab | Foco visible y ordenado, sin elementos sin nombre |
| QA-10 | Todos | axe-core en 360 y 1280 px | 0 violaciones |
| QA-11 | Regular | Abrir `/mi/calificaciones` y `/mi/inscripciones` | Redirigen a la nueva ubicación |
| QA-12 | Estudiante | Abrir una materia ajena por URL | Mensaje claro, sin datos de otros |

### 2.9 Tareas en Jira

| Tarea | Módulo | Estado | PR |
|---|---|---|---|
| DS-18 | Historial académico: libreta clara e impresión completa | En revisión | #15 |
| DS-19 | Panel de inicio: tablero «¿cómo voy?» | En revisión | #16 |
| DS-20 | Calificaciones: Mis materias y detalle por materia | En revisión | #16 |
| DS-21 | Navegación del estudiante: barra inferior y menú | En revisión | #16 |
| DS-22 | Inscripciones y cuenta: Mi cuenta | En revisión | #16 |

> El PR #16 incluye también el commit de DS-18 (#15): aceptar #16 cubre ambos.

**Orden recomendado:** DS-18 (corrige el hallazgo crítico) → DS-19 → DS-20 → DS-21 → DS-22.

> Estas pantallas nacieron en otras tareas (DS-9 Panel, DS-10 Historial, DS-16 Calificaciones). Los cambios se coordinan con sus autores.

---

## 3. Interfaz del docente

Auditoría con 4 perfiles (Ana García con muchas notas, Luis Mamani, un docente nuevo sin notas y uno inactivo) × 7 pantallas × PC y celular.

| Hallazgo | Gravedad | Corrección |
|---|---|---|
| El formulario de notas cargaba solo las 100 inscripciones más recientes del colegio: **44 de 144 estudiantes no podían recibir nota**. | Crítica | Primero se elige el curso y se listan todas sus inscripciones activas, ordenadas por apellido. |
| El Inicio deducía los cursos de las últimas 100 notas: Ana veía 3 de sus 6 cursos. | Alta | Cursos activos + conteo de notas por curso. |
| Tipos en mayúsculas («PARCIAL»), espacio vacío bajo los cursos, enlaces sin subrayar (axe). | Media | Etiquetas legibles, diseño corregido, enlaces subrayados. |
| «Registrar calificación» del Inicio llevaba a una lista. | Baja | Abre el formulario directamente (`?nueva=1`). |

Además: tarjetas con sus totales (notas, cursos, materias, promedio que otorga). El docente inactivo ve el mensaje del servidor al intentar registrar.

## 4. Interfaz del administrador

| Mejora | Detalle |
|---|---|
| Acciones visibles | Las tablas muestran íconos (ver, editar, desactivar, cambiar estado) en la columna **Acciones**, en lugar del menú ⋮. |
| Nada se elimina | «Eliminar» pasa a **Desactivar / Activar** (PATCH de estado); los inactivos van al final de cada tabla. Períodos e inscripciones no se borran: se finalizan o retiran. |
| Usuarios | Buscador por email. |
| Inicio | Promedio por curso en barras horizontales con color por nota y línea 51; distribución con valores. |
| **Bitácora** | Quién creó, modificó o desactivó qué y cuándo, agrupada por día, con filtros (requiere el backend). |
| **Backup** | Descargar toda la información (`.json.gz`, ~300 KB) y restaurarla escribiendo CONFIRMAR; antes se descarga un backup del estado actual. |
| **Configuración** | Nombre, sigla y logotipo de la institución (login, menú y pestaña) y **Despertador** del servidor para Render/Aiven. |

### 4.1 Cambios en el backend (PR #3 de academia-backend)

Bitácora, Backup, Configuración y Despertador necesitan módulos nuevos en el backend. Se agregaron con permiso de Luther, sin cambiar la lógica existente:

| Módulo | Endpoints | Base de datos |
|---|---|---|
| Bitácora | `GET /bitacora` (ADMIN); interceptor global que registra POST/PATCH/PUT/DELETE | Tabla `bitacora` |
| Respaldo | `GET /respaldo`, `GET /respaldo/resumen`, `POST /respaldo/restaurar` (ADMIN, en una transacción) | — |
| Configuración | `GET /configuracion`, `GET /configuracion/logo` (públicos); `PATCH`, `PUT/DELETE logo` (ADMIN) | Tabla `configuracion` |
| Despertador | `GET /salud` (público); `GET/PATCH /configuracion/despertador`, `POST .../probar` (ADMIN) | Columna `despertadorActivo` |

Migraciones aditivas (`npx prisma migrate deploy`). Al publicar en Render hay que permitir el dominio del frontend en el CORS de `main.ts` y confirmar `RENDER_EXTERNAL_URL`.

---

## 5. Registro de cambios

| Fecha | Tarea | PR | Cambio |
|---|---|---|---|
| 12/11/2026 | — | — | Creación del documento con el diagnóstico y la propuesta de la interfaz del estudiante. Tareas DS-18 a DS-22 creadas en Jira. |
| 12/11/2026 | DS-18 | #15 | Historial: impresión A4 completa, gestión más reciente por defecto, solo columnas con datos, notas bajo 51 con icono y texto, resumen por gestión, tarjetas en celular y tabla accesible con teclado. Verificado: axe 0 violaciones en 14 vistas, 0 celdas «—», ninguna tabla impresa cortada. |
| 12/11/2026 | DS-19 a DS-22 | #16 | Estudiante completo: Inicio «¿cómo voy?» con situación y materias para reforzar, Mis materias y detalle con observaciones, Mi cuenta, barra inferior en celular. Verificado con 7 perfiles × 6 pantallas × 2 tamaños: axe 0, 0 errores. |
| 13/11/2026 | Docente | #16 | Registro de notas por curso (todos los estudiantes activos), Inicio con todos sus cursos, tipos legibles. Verificado: 4 docentes × 7 pantallas × 2 tamaños, registrar y editar notas. |
| 13/11/2026 | Administrador | #16 | Buscador de usuarios, Inicio accesible. Prueba integrada de los 3 roles (admin crea → docente califica → estudiante ve → admin retira y desactiva): 43/43 en PC y celular. Corregido: el estudiante retirado veía «(en curso)». |
| 13/11/2026 | Diseño | #16 | Tailwind v4 (sin preflight, en capas), acciones con íconos, un ícono por módulo, gráficos más claros (tendencia en la evolución del estudiante), Motion y precarga de pantallas. |
| 13/11/2026 | Administrador | #16 | Desactivar en lugar de eliminar; inactivos al final de las tablas. Verificado: 0 peticiones DELETE. |
| 13–14/11/2026 | Sistema | #16, back #3 | Bitácora, Backup y Configuración (nombre, sigla, logo) con backend nuevo. Verificado: 54 pruebas unitarias del backend, restauración con archivos dañados sin cambios, permisos por rol. |
| 14/11/2026 | Sistema | #16, back #3 | Despertador (GET /salud + visita cada 10 min) y aviso «Despertando el servidor…» en el login. Auditoría final: 52 pantallas de los 3 roles, axe 0, 0 errores. |

---

## 6. Diseño, rendimiento y conexión entre roles

- **Diseño:** Tailwind v4 convive con MUI (sin preflight y en `@layer`); los colores salen de `shared/theme/tokens.ts`. Un solo ícono por módulo en `shared/config/modulos.tsx`.
- **Fluidez:** Motion (respeta «reducir movimiento»), precarga de pantallas al apuntar el menú (`prefetch="intent"`) y barra fina de carga.
- **Peso medido** (compilación de producción, comprimido): CSS 13 KB; todo el sistema 535 KB; el Inicio suma 116 KB por los gráficos. Mejora pendiente: cargar los gráficos solo cuando se necesitan.
- **Conexión entre roles:** lo que crea el administrador lo usa el docente, lo que registra el docente lo ve el estudiante, y desactivar o retirar tiene efecto inmediato en los otros roles.
