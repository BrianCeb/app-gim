# GimnasioApp — Documentación del proyecto

Proyecto final de la carrera de programación.
Autor: Brian Cebrero
Fecha de la documentación: noviembre de 2026

---

## 1. Introducción

GimnasioApp es una aplicación web para administrar un gimnasio pequeño (el gimnasio de la tía del autor).
Permite llevar el registro de los alumnos, controlar el vencimiento de las cuotas mensuales, registrar
los ingresos de cada alumno al gimnasio con su DNI y ver estadísticas de asistencia y de pagos.

La aplicación está pensada para que la use el personal del gimnasio desde una computadora en la
recepción o desde un celular, sin conocimientos técnicos, entrando a **un solo enlace web**.

## 2. Problema que resuelve

Antes de la aplicación, el control de alumnos y cuotas se hacía de forma manual, lo que dificultaba:

- Saber rápidamente qué alumnos tienen la cuota vencida o por vencer.
- Controlar quién ingresa al gimnasio cada día.
- Mantener los datos de contacto ordenados y sin duplicados.
- Tener una visión general de la asistencia.

### Problema técnico de la primera versión

Una primera versión del proyecto publicaba el frontend (en Vercel) y el backend en enlaces distintos.
A veces había que entrar primero a la URL del backend para que el frontend mostrara los datos.
Las causas probables eran:

- El hosting gratuito del backend "se dormía" tras un tiempo sin uso y tardaba en arrancar.
- Problemas de CORS (dos orígenes distintos).
- La URL de la API configurada en el frontend podía estar mal.

**Solución adoptada en la versión actual:** frontend y API se publican juntos en el mismo servidor
Express, bajo una única URL. El frontend usa rutas relativas (`/api/...`), por lo que no hace falta CORS
ni configurar la dirección del backend.

## 3. Objetivos

### Objetivo general
Entregar una aplicación web estable, accesible desde un único enlace, que permita administrar alumnos,
cuotas e ingresos de un gimnasio, con los datos guardados de forma persistente en la nube.

### Objetivos específicos
- Alta, listado, búsqueda, edición y eliminación de alumnos (CRUD).
- Cálculo automático del vencimiento de la cuota y del estado de pago.
- Registro rápido de ingresos por DNI, mostrando en el momento si el alumno está al día.
- Foto del alumno para identificarlo en la recepción.
- Estadísticas de ingresos y estado de las cuotas.
- Actualización automática de las pantallas abiertas cuando cambian los datos.
- Interfaz adaptable a computadora y celular, en español de Argentina.

## 4. Funcionalidades

La aplicación tiene una pantalla pública de **Inicio** y seis secciones que requieren iniciar sesión
(Ajustes agrupa dos pestañas, Planes y Personal, para que la barra del celular no pase de 6 ítems):

| Sección | Qué permite hacer |
|---|---|
| **Inicio** (`/ingresar`) | Propuesta de valor de la aplicación y formulario de ingreso (email y contraseña). Es la única pantalla que se ve sin sesión. |
| **Panel** | Registrar un ingreso por DNI; ver ingresos del día y cantidad de alumnos al día, por vencer y vencidos; lista de "cuotas a revisar" con botón "Pagó". |
| **Ingresos** | Registrar ingresos y ver el listado de ingresos de cualquier día (hora, alumno, estado de su cuota). |
| **Alumnos** | Listado completo con el plan de cada alumno; búsqueda por nombre, apellido o DNI (sin importar tildes ni puntos); filtro por estado; alta (con plan y medio del primer pago obligatorios), edición, eliminación con confirmación, registro de pago y foto. |
| **Pagos** | Alumnos ordenados por vencimiento (los más urgentes primero), con su plan y precio vigente; filtro por estado; botón para registrar el pago con su medio (se puede cambiar de plan al pagar) y botón **Historial** con todos los pagos del alumno (HU 12). |
| **Estadísticas** | Gráfico de barras de ingresos por día (últimos 30 días), promedio diario, total de alumnos y gráfico de torta con el estado de las cuotas. |
| **Ajustes → Planes** (`/planes`) | Planes de cuota: alta (nombre, duración, precio y días de aviso), edición, activar o desactivar. Muestra cuántos alumnos tiene cada plan. Solo administración. |
| **Ajustes → Personal** (`/personal`) | Cuentas para ingresar a la app: alta (nombre, email, rol y contraseña), edición, activar o desactivar con confirmación y cambio de contraseña. Solo administración. |

### Roles del personal

Cada cuenta tiene uno de dos roles. El menú muestra solo las secciones permitidas.

| Puede… | Recepción | Administración |
|---|---|---|
| Panel, Ingresos y Pagos | ✔ | ✔ |
| Ver, crear y editar alumnos; registrar pagos y fotos | ✔ | ✔ |
| Elegir el plan de un alumno y ver los precios | ✔ | ✔ |
| Ver el historial de pagos de un alumno | ✔ | ✔ |
| Anular el último pago de un alumno | — | ✔ |
| Ajustes → Planes (crear, editar, activar o desactivar planes) | — | ✔ |
| Eliminar alumnos | — | ✔ |
| Estadísticas | — | ✔ |
| Ajustes → Personal (gestionar las cuentas) | — | ✔ |

> Los permisos son un supuesto del equipo, pendiente de confirmar con la dueña del gimnasio.

Además:
- Cerrar sesión desde el menú (al pie del menú lateral o arriba a la derecha en el celular).
- Si la sesión vence o desactivan la cuenta, la aplicación vuelve sola al Inicio con un aviso.
- Mensajes emergentes ("toasts") de éxito y error.
- Aviso de falta de conexión con botón "Reintentar".
- Estados de carga y estados vacíos ("Todavía no hay alumnos", "Sin ingresos", etc.).
- Página "no encontrada" para direcciones inexistentes.
- Validación de formularios en el navegador y en el servidor.

## 5. Reglas de negocio

- El vencimiento depende del **plan de cuota** del alumno (ver "Planes de cuota (HU 11)").
- Estados de la cuota:
  - **Vencido:** la fecha de vencimiento ya pasó.
  - **Por vencer:** faltan tantos días o menos como los "días de aviso" del plan (3 en el Mensual).
  - **Al día:** faltan más días que los de aviso.
- **Registrar pago** toma la fecha de hoy (hora de Argentina) y el plan del alumno por defecto, aunque
  se pueden elegir otros, pide el medio de pago y recalcula el vencimiento. Cada pago queda en el
  historial (ver "Historial de pagos (HU 12)").
- El **DNI** es único por alumno. Se aceptan puntos o espacios ("12.345.678") y se guarda solo con
  números ("12345678"). Debe tener entre 6 y 9 dígitos.
- Son obligatorios: nombre, apellido, DNI, email válido, fecha de pago y plan.
- Un ingreso solo se registra si existe un alumno con ese DNI. El ingreso se registra aunque la cuota
  esté vencida, pero la pantalla lo avisa claramente en rojo.
- Las fechas se muestran en formato argentino (dd/mm/aaaa).

### Planes de cuota (HU 11)
Confirmadas por Brian (15/11/2026):
- Cada plan tiene **nombre** (único, sin distinguir mayúsculas), **duración** (en meses o en días),
  **precio** vigente (pesos enteros) y **días de aviso** para "por vencer" (por defecto 3 en planes de
  meses y 1 en planes de días; en un plan de días tiene que ser menor que la duración).
- **Meses = mes calendario:** 5/11 + 1 mes = 5/12. Si el día no existe en el mes de destino, queda el
  último día: 31/1 + 1 mes = 28/2 (29/2 en año bisiesto). **Días = días fijos:** semanal = 7 días.
- **Pago tarde** (el día del vencimiento o después): el período nuevo cuenta desde el día del pago.
- **Pago adelantado** (antes del vencimiento): el período se suma al vencimiento actual, así no pierde
  días. Efecto conocido: alguien que arrancó un 31 "baja" de día con los pagos adelantados
  (31/1 → 28/2 → 28/3), como en cualquier mes calendario.
- El plan es **obligatorio al dar de alta**. **Cambiar el plan** al editar no toca el vencimiento
  actual: se aplica desde el próximo pago. También se puede elegir otro plan al registrar el pago, y
  ese pago ya usa el plan nuevo. Si al editar se corrige la fecha de pago, el vencimiento se recalcula
  desde esa fecha con el plan del alumno.
- Los planes los crea y edita **solo administración**; recepción los elige y ve los precios.
- Los planes **no se borran: se desactivan**. Un plan desactivado no se puede elegir para altas ni
  para cobrar; los alumnos que lo tenían lo conservan (y su vencimiento) hasta su próximo pago, en el
  que hay que elegirles otro.
- Cambiar el precio o la duración de un plan se aplica desde el próximo pago de cada alumno.
- El precio vigente vive en el plan. Lo que se cobró en cada pago se guarda aparte, en el historial
  (HU 12).
- Los alumnos cargados antes de la HU 11 quedaron en el plan **Mensual** (1 mes, aviso 3 días, precio
  $0 hasta que administración cargue el real), sin tocar su vencimiento.
- Fuera de alcance por ahora: pase diario, control de días por semana y descuentos.

### Historial de pagos (HU 12)
Confirmadas por Brian (16/11/2026):
- **Cada pago queda registrado** en la colección `pagos`: alumno, fecha, plan, monto cobrado, medio de
  pago, quién lo registró y el vencimiento que dejó. El alumno sigue guardando su último pago y su
  vencimiento, para que las pantallas los lean rápido.
- **Medios de pago:** lista fija: efectivo, transferencia, débito y crédito. Es obligatorio al cobrar
  y en el alta. No viene elegido de antemano, para que quede cómo pagó de verdad.
- **Monto = precio del plan** en ese momento, y no se edita (sin descuentos ni pagos parciales). Se
  guarda una copia: si después cambia el precio, lo cobrado no cambia.
- **El alta es el primer pago:** también pide el medio y queda en el historial.
- **Anular:** solo administración, y solo el **último pago vigente** de un alumno. El alumno vuelve
  a la fecha de pago, al vencimiento y al plan que tenía antes de ese pago. El pago **no se borra**:
  queda marcado como anulado (con fecha y quién lo anuló) y se ve tachado. Se pueden anular varios,
  siempre del último hacia atrás.
- **El pago del alta no se anula** (no hay un estado anterior al que volver): si el alta estuvo mal,
  se corrige desde "Editar alumno" o se elimina el alumno. *Regla propuesta por el equipo de
  desarrollo, pendiente de confirmar.*
- **Si se elimina un alumno, sus pagos se conservan**, con una copia de su nombre y DNI: cuentan para
  la recaudación (HU 13).
- Los alumnos cargados antes de la HU 12 **arrancan con el historial vacío**: de esos pagos no se sabe
  el monto ni el medio, y no se inventan registros.
- El historial lo ven los dos roles, desde el botón "Historial" de Pagos.

### Cuentas del personal (HU 10)
Decididas por el equipo (Sprint 1):
- Las cuentas **no se borran: se desactivan**, y se pueden volver a activar. Una cuenta desactivada no
  puede ingresar, y si tenía la sesión abierta se le corta en el pedido siguiente.
- Las contraseñas las pone y las cambia administración (no hay recuperación por email). Mínimo 8
  caracteres. Al crear una cuenta, administración le pasa la contraseña a la persona.
- El email es único (no distingue mayúsculas) y es el dato para iniciar sesión.
- **Nadie puede cambiar su propio rol ni desactivar su propia cuenta**: en la cuenta propia solo se
  cambian nombre, email y contraseña. Evita quedarse afuera sin querer.
- **Siempre tiene que quedar al menos un administrador activo.** Con la regla anterior esto ya no
  puede pasar desde la app (quien edita es un administrador activo), pero el servidor lo controla igual
  como segunda protección.

## 6. Arquitectura

```
                 Navegador (computadora o celular)
                              │
                     https://<una sola URL>
                              │
          ┌───────────────────┴────────────────────┐
          │         Servidor Node.js + Express      │
          │                                         │
          │  /api/auth      ─┐  (pública)           │
          │  /api/alumnos   ─┤                      │
          │  /api/ingresos  ─┼─ API REST (JSON)     │
          │  /healthz       ─┘  (pública)           │
          │  /socket.io      → avisos en tiempo real│
          │                    (solo con sesión)    │
          │  /* (resto)      → frontend React       │
          │                    compilado (dist/)    │
          └───────────────────┬────────────────────┘
                              │ Mongoose
                     MongoDB Atlas (nube)
```

Es una arquitectura cliente-servidor con una **SPA** (Single Page Application):

1. El navegador pide la página; Express devuelve el `index.html` y los archivos del frontend compilado.
2. React se ejecuta en el navegador y pide los datos a la API con `fetch` usando rutas relativas.
3. Express valida, consulta o modifica la base de datos con Mongoose y responde en JSON.
4. Cuando un dato cambia, el servidor emite un aviso por **Socket.io** (`alumnos:cambio` o
   `ingresos:cambio`). Las pantallas abiertas en otros dispositivos reciben el aviso y vuelven a pedir
   los datos por la API. Socket.io solo avisa; los datos siempre viajan por la API REST.

### Flujo de inicio de sesión

```
 Navegador                                   Servidor                       MongoDB
    │  POST /api/auth/login {email, password}   │                               │
    │ ─────────────────────────────────────────▶│  busca el usuario por email   │
    │                                           │ ─────────────────────────────▶│
    │                                           │  compara la contraseña con    │
    │                                           │  el hash (bcrypt)             │
    │  200 + Set-Cookie: sesion=<JWT>           │                               │
    │     (httpOnly, SameSite=Strict, 12 h)     │                               │
    │ ◀─────────────────────────────────────────│                               │
    │                                           │                               │
    │  GET /api/alumnos  (la cookie va sola)    │                               │
    │ ─────────────────────────────────────────▶│ requireAuth: verifica el JWT  │
    │                                           │ y que el usuario siga activo  │
    │                                           │ ─────────────────────────────▶│
    │  200 datos  ·  401 sin sesión  ·  403 sin permiso                         │
    │ ◀─────────────────────────────────────────│                               │
```

1. El servidor nunca guarda ni compara contraseñas en texto: solo su **hash** de bcrypt.
2. El token de sesión (**JWT**) viaja en una **cookie httpOnly**: el JavaScript de la página no puede
   leerla. Por eso, al abrir la aplicación, el frontend pregunta `GET /api/auth/yo` para saber si ya hay
   sesión.
3. En cada pedido, `requireAuth` verifica la firma del token y busca al usuario en la base: si lo
   desactivaron o le cambiaron el rol, el cambio rige en el pedido siguiente.
4. `requireRol(...)` controla el rol: **401** = no se sabe quién es; **403** = se sabe, pero no tiene
   permiso.
5. Socket.io acepta la conexión solo con la misma cookie válida.

Cualquier ruta que no sea de la API (por ejemplo `/alumnos`) devuelve el `index.html`, así se puede
refrescar la página en cualquier sección. Las rutas `/api` inexistentes responden un error 404 en JSON,
nunca HTML.

## 7. Tecnologías utilizadas

### Backend
| Tecnología | Uso |
|---|---|
| Node.js (≥ 22.12) | Entorno de ejecución de JavaScript en el servidor. |
| Express 5 | Servidor web, rutas de la API y archivos del frontend. |
| MongoDB Atlas | Base de datos NoSQL en la nube. |
| Mongoose 8 | Modelos, validaciones y consultas a MongoDB. |
| Socket.io 4 | Avisos en tiempo real a las pantallas abiertas. |
| dotenv | Lectura de variables de entorno desde `.env`. |
| bcryptjs | Hash de las contraseñas del personal (versión en JavaScript puro: no requiere compilar nada). |
| jsonwebtoken | Firma y verificación del token de sesión (JWT). |
| cookie-parser | Lectura de la cookie de sesión en Express y en Socket.io. |
| mongoose-paginate-v2 | Instalada en el modelo de alumnos para una futura paginación (todavía no se usa). |
| ES Modules | Sintaxis `import/export` (`"type": "module"`). |

### Frontend
| Tecnología | Uso |
|---|---|
| React 19 | Construcción de la interfaz con componentes. |
| Vite 8 | Servidor de desarrollo y compilación (build) del frontend. |
| React Router 7 | Navegación entre secciones sin recargar la página. |
| Tailwind CSS 4 | Estilos con clases utilitarias; diseño adaptable (responsive). |
| Recharts | Gráficos de la sección Estadísticas (se carga solo al abrir esa sección). |
| lucide-react | Íconos. |
| socket.io-client | Recepción de avisos en tiempo real. |

### Herramientas
- Git y GitHub para control de versiones.
- Postman para probar la API.
- Render (previsto) para el hosting.

## 8. Estructura del proyecto

```
gimnasio-app/
├── package.json            # scripts globales: build y start (los usa el hosting)
├── README.md               # guía rápida de uso, API y deploy
├── DOCUMENTACION.md        # este documento
├── CLAUDE.md               # contexto y reglas de trabajo para Claude Code
├── .gitignore              # excluye node_modules, dist y .env
├── backend/
│   ├── package.json
│   ├── server.js           # arranque de Express, Socket.io, rutas, frontend y errores
│   ├── .env                # variables secretas (NO se sube a Git)
│   ├── .env.example        # plantilla sin secretos
│   ├── scripts/
│   │   ├── crearAdmin.js           # seed del primer administrador (npm run seed:admin)
│   │   ├── vincularIngresos.js     # migración: vincula ingresos viejos con su alumno (npm run migrar:ingresos)
│   │   └── migrarPlanes.js         # migración: plan Mensual para los alumnos sin plan (npm run migrar:planes)
│   └── src/
│       ├── config/
│       │   ├── db.js               # conexión a MongoDB
│       │   └── auth.js             # JWT y opciones de la cookie de sesión
│       ├── middlewares/
│       │   └── auth.js             # requireAuth y requireRol
│       ├── dao/models/
│       │   ├── Alumno.js
│       │   ├── Ingreso.js
│       │   ├── Foto.js
│       │   ├── Plan.js
│       │   ├── Pago.js             # historial de pagos (HU 12)
│       │   └── Usuario.js
│       ├── utils/
│       │   └── vencimiento.js      # cálculo del vencimiento según el plan (lógica pura)
│       └── routes/
│           ├── auth.router.js      # login, logout, yo
│           ├── alumnos.router.js
│           ├── ingresos.router.js
│           ├── planes.router.js    # planes de cuota (ver: sesión; crear/editar: administración)
│           ├── pagos.router.js     # anular un pago (solo administración)
│           └── usuarios.router.js  # cuentas del personal (solo administración)
└── frontend/
    ├── package.json
    ├── vite.config.js      # plugins y proxy de desarrollo hacia el backend
    ├── index.html
    └── src/
        ├── main.jsx                # rutas de la aplicación
        ├── index.css
        ├── pages/                  # Inicio, Panel, Ingresos, Alumnos, Pagos, Estadísticas, Planes, Personal
        ├── components/             # Layout, RutaProtegida, AlumnoForm, UsuarioForm, PlanForm, AjustesTabs, IngresoRapido, RegistrarPago, SelectorMedio, HistorialPagos, Modal, ui
        ├── context/                # AuthContext (sesión), DatosContext (datos + Socket.io), AvisosContext (toasts)
        ├── hooks/                  # custom hooks: useAuth, useHistorialPagos, useFiltroEstado
        └── lib/                    # api.js, permisos.js, fechas.js, alumnos.js, planes.js, pagos.js, imagen.js
```

## 9. Modelo de datos (MongoDB)

### Colección `alumnos` (modelo `Alumno`)
| Campo | Tipo | Detalle |
|---|---|---|
| `_id` | ObjectId | Generado por MongoDB. |
| `nombre` | String | Obligatorio. |
| `apellido` | String | Obligatorio. |
| `dni` | String | Obligatorio y **único** (índice único). |
| `email` | String | Obligatorio, se guarda en minúsculas. |
| `fechaPago` | Date | Obligatoria, guardada a medianoche UTC. |
| `fechaVencimiento` | Date | Calculada según el plan (ver reglas de la HU 11). |
| `plan` | ObjectId | Referencia al plan de cuota (con índice). Obligatorio al dar de alta (lo controla la ruta; en el esquema no es `required` para no romper datos sin migrar). |
| `fotoUrl` | String | Ruta a la foto (`/api/alumnos/:id/foto?v=...`) o vacío. |

### Colección `ingresos` (modelo `Ingreso`)
| Campo | Tipo | Detalle |
|---|---|---|
| `alumno` | ObjectId | Referencia al alumno que ingresó (con índice). Puede faltar solo en ingresos de alumnos que ya no existían al migrar. |
| `dni` | String | DNI que tenía el alumno el día que ingresó (dato histórico). |
| `fecha` | Date | Fecha y hora exacta del ingreso. |

### Colección `fotos` (modelo `Foto`)
| Campo | Tipo | Detalle |
|---|---|---|
| `alumno` | ObjectId | Referencia al alumno (único: una foto por alumno). |
| `data` | Buffer | Imagen en binario. |
| `contentType` | String | `image/jpeg`, `image/png` o `image/webp`. |

**Decisión de diseño:** las fotos se guardan en una colección aparte para que el listado de alumnos
sea liviano (no viaja la imagen con cada alumno). El navegador pide la foto solo cuando la muestra, y
como la URL cambia con cada foto nueva (`?v=...`), se puede guardar en caché por mucho tiempo.

**Relación alumno–ingreso:** se vincula por el `_id` del alumno (`ingreso.alumno`), que no cambia
nunca. Antes se vinculaba por DNI, y si se corregía el DNI de un alumno sus ingresos anteriores
quedaban "huérfanos" y aparecían como "Alumno eliminado". El ingreso se sigue registrando escribiendo
el DNI en recepción; el servidor busca al alumno y guarda su `_id` y también el DNI de ese momento.
Si se elimina un alumno, sus ingresos se conservan y se muestran como "Alumno eliminado (DNI ...)",
con el DNI guardado.

Los ingresos anteriores a este cambio se vinculan una vez con `npm run migrar:ingresos` (ver
sección 13).

### Colección `plans` (modelo `Plan`)
Planes de cuota (Mongoose nombra la colección `plans`).

| Campo | Tipo | Detalle |
|---|---|---|
| `nombre` | String | Obligatorio, **único** (índice único; la ruta además lo controla sin distinguir mayúsculas). |
| `duracion.cantidad` | Number | Entero, 1 o más. |
| `duracion.unidad` | String | `meses` (mes calendario) o `dias` (días fijos). |
| `precio` | Number | Precio vigente en pesos enteros, 0 o más. |
| `diasAviso` | Number | Días antes del vencimiento en que el alumno aparece "por vencer". Por defecto 3. |
| `activo` | Boolean | `true` por defecto. Los planes no se borran: se desactivan. |
| `createdAt`, `updatedAt` | Date | Las agrega Mongoose. |

**Relación alumno–plan:** cada alumno guarda el `_id` de su plan. La API devuelve los alumnos con el
plan completo (`populate`: nombre, duración, precio, aviso y estado), porque las pantallas lo
necesitan para mostrar el precio y calcular el estado de pago.

**Cálculo del vencimiento:** está en `backend/src/utils/vencimiento.js` (`sumarDuracion` y
`calcularVencimiento`), sin base de datos ni Express, para poder probarlo solo. El frontend tiene el
mismo cálculo en `lib/fechas.js`, solo para mostrar el vencimiento antes de guardar; el que vale es el
del servidor.

### Colección `pagos` (modelo `Pago`, HU 12)
Un documento por cada pago registrado: es el historial y la base de la recaudación (HU 13).

| Campo | Tipo | Detalle |
|---|---|---|
| `alumno` | ObjectId | Referencia al alumno (con índice, para traer rápido su historial). |
| `alumnoNombre`, `alumnoDni` | String | Copia de cómo era el alumno ese día: el pago se sigue entendiendo aunque se elimine el alumno. |
| `fecha` | Date | Fecha del pago, a medianoche UTC. |
| `plan`, `planNombre` | ObjectId, String | Plan con el que pagó y una copia de su nombre. |
| `monto` | Number | Lo cobrado: el precio del plan ese día, en pesos enteros. |
| `medio` | String | `efectivo`, `transferencia`, `debito` o `credito`. |
| `usuario`, `usuarioNombre` | ObjectId, String | Cuenta del personal que lo registró. |
| `fechaPagoAnterior`, `vencimientoAnterior`, `planAnterior` | Date, Date, ObjectId | Cómo estaba el alumno antes de este pago. Sirven para anularlo. En el pago del alta quedan en `null`. |
| `vencimientoNuevo` | Date | Vencimiento que dejó el pago. |
| `anulado` | Objeto | `fecha`, `usuario` y `usuarioNombre` de la anulación. Vacío si el pago está vigente. |
| `vigente` | (virtual) | `true` si no fue anulado. No se guarda: Mongoose lo calcula y lo incluye en el JSON. |
| `createdAt`, `updatedAt` | Date | Las agrega Mongoose. El historial se ordena por `createdAt`. |

**Decisión de diseño: copias además de referencias.** En una base relacional se guardaría solo el
`_id` del alumno y del plan. Acá el pago es un **registro histórico**: tiene que mostrar lo que pasó
ese día aunque después se elimine el alumno, se renombre el plan o cambie el precio. Por eso guarda el
`_id` (para vincular) y también una copia de los datos que se muestran.

**Transacciones:** registrar un pago cambia dos documentos (el alumno y el pago nuevo), y anularlo
también (el pago y el alumno). Se guardan dentro de una **transacción de MongoDB**
(`mongoose.connection.transaction`): se guardan los dos o ninguno. Así nunca queda un alumno renovado
sin su pago en el historial, ni un pago anulado con el alumno sin restaurar. MongoDB Atlas lo permite
porque siempre funciona como *replica set*.

**¿Por qué solo se anula el último?** Cada pago guarda cómo estaba el alumno justo antes. Si se anulan
en orden (del último hacia atrás), volver al estado anterior siempre es correcto. Anular uno del medio
obligaría a recalcular todos los que vinieron después.

### Colección `usuarios` (modelo `Usuario`)
Cuentas del personal del gimnasio (no de los alumnos).

| Campo | Tipo | Detalle |
|---|---|---|
| `nombre` | String | Obligatorio. |
| `email` | String | Obligatorio, **único**, se guarda en minúsculas. Es el dato para iniciar sesión. |
| `passwordHash` | String | Hash bcrypt de la contraseña (nunca la contraseña). `select: false`: no viaja en las consultas ni en las respuestas de la API. |
| `rol` | String | `administracion` o `recepcion`. |
| `activo` | Boolean | `true` por defecto. Las cuentas no se borran: se desactivan, y una cuenta inactiva no puede ingresar. |
| `createdAt`, `updatedAt` | Date | Fechas de alta y última modificación (las agrega Mongoose). |

El primer administrador se crea con `npm run seed:admin`, a partir de las variables `ADMIN_NOMBRE`,
`ADMIN_EMAIL` y `ADMIN_PASSWORD` (mínimo 8 caracteres). Si el email ya existe, el script no lo modifica.

## 10. API REST

Todas las respuestas son JSON. Los errores tienen siempre el formato `{ "error": "mensaje" }`.

Columna **Acceso**: *pública* = sin sesión; *sesión* = cualquier rol con sesión iniciada;
*admin* = solo administración. Sin sesión, las rutas protegidas responden **401**; con un rol sin
permiso, **403**.

| Método | Ruta | Acceso | Descripción | Respuestas principales |
|---|---|---|---|---|
| POST | `/api/auth/login` | pública | Iniciar sesión (`email`, `password`); deja la cookie `sesion` | 200, 400, 401 (datos incorrectos), 403 (cuenta desactivada) |
| POST | `/api/auth/logout` | pública | Cerrar sesión (borra la cookie) | 200 |
| GET | `/api/auth/yo` | sesión | Usuario de la sesión actual | 200, 401 |
| GET | `/api/alumnos` | sesión | Lista de alumnos ordenada por apellido y nombre, con su plan | 200 |
| POST | `/api/alumnos` | sesión | Crear alumno (`plan` obligatorio y activo; `medio` obligatorio). Registra el primer pago en el historial | 201, 400 (datos inválidos, plan inexistente/inactivo o sin medio), 409 (DNI repetido) |
| GET | `/api/alumnos/dni/:dni` | sesión | Buscar alumno por DNI | 200, 404 |
| PUT | `/api/alumnos/:id` | sesión | Editar alumno (`plan` opcional; recalcula el vencimiento solo si cambia la fecha de pago) | 200, 400, 404, 409 |
| DELETE | `/api/alumnos/:id` | **admin** | Eliminar alumno y su foto (sus pagos se conservan) | 200, 400 (ID inválido), 403, 404 |
| POST | `/api/alumnos/:id/pago` | sesión | Registrar pago (`medio` obligatorio; `fechaPago` opcional, por defecto hoy; `plan` opcional, por defecto el suyo, tiene que estar activo). Devuelve el alumno y, en `pago`, el registro del historial | 200, 400, 404 |
| GET | `/api/alumnos/:id/pagos` | sesión | Historial de pagos del alumno, del más reciente al más viejo (incluye los anulados) | 200, 400, 404 |
| POST | `/api/pagos/:id/anular` | **admin** | Anular el último pago vigente del alumno (el alumno vuelve al estado anterior) | 200, 400 (ID inválido), 403, 404, 409 (no es el último, ya anulado o es el del alta) |
| GET | `/api/alumnos/:id/foto` | sesión | Obtener la foto | 200 (imagen), 404 |
| PUT | `/api/alumnos/:id/foto` | sesión | Subir foto (`imagen` como data URL base64) | 200, 400, 404, 413 |
| DELETE | `/api/alumnos/:id/foto` | sesión | Quitar la foto | 200, 404 |
| GET | `/api/ingresos` | sesión | Lista de ingresos, más recientes primero | 200 |
| POST | `/api/ingresos` | sesión | Registrar ingreso por `dni`; devuelve también el alumno | 201, 400, 404 |
| GET | `/api/planes` | sesión | Planes (activos primero, por nombre), incluidos los desactivados | 200 |
| POST | `/api/planes` | **admin** | Crear plan (`nombre`, `duracion: { cantidad, unidad }`, `precio`, `diasAviso` opcional) | 201, 400, 403, 409 (nombre repetido) |
| PUT | `/api/planes/:id` | **admin** | Editar plan (mismos campos + `activo`, booleano obligatorio). No hay DELETE: se desactiva | 200, 400, 403, 404, 409 |
| GET | `/api/usuarios` | **admin** | Cuentas del personal (activas primero, por nombre), sin el hash | 200, 403 |
| POST | `/api/usuarios` | **admin** | Crear cuenta (`nombre`, `email`, `rol`, `password`) | 201, 400, 403, 409 (email repetido) |
| PUT | `/api/usuarios/:id` | **admin** | Editar `nombre`, `email`, `rol` y `activo` (booleano, obligatorio) | 200, 400 (datos inválidos o cambio sobre la propia cuenta), 403, 404, 409 (email repetido o último admin) |
| PUT | `/api/usuarios/:id/password` | **admin** | Poner una contraseña nueva (`password`) | 200, 400, 403, 404 |
| GET | `/healthz` (o `/health`) | pública | Estado del servidor y de la base de datos | 200, 503 |

> **Estadísticas** no tiene una ruta propia: se calcula en el navegador con `/api/alumnos` e
> `/api/ingresos`, que recepción necesita para trabajar. Por eso la restricción de Estadísticas a
> administración es de la interfaz (no aparece en el menú y la ruta muestra "No tenés acceso").

Ejemplo de creación de alumno:

```http
POST /api/alumnos
Content-Type: application/json

{
  "nombre": "Juan",
  "apellido": "Pérez",
  "dni": "12.345.678",
  "email": "juan@ejemplo.com",
  "fechaPago": "2026-11-01",
  "plan": "<_id del plan Mensual>",
  "medio": "efectivo"
}
```

Respuesta `201 Created`: el alumno guardado con `_id`, `dni: "12345678"`,
`fechaVencimiento` = 01/12/2026 y el plan completo. Además queda su primer pago en `pagos`.

### Manejo de errores en el servidor
- Validación propia de los datos antes de guardar (mensajes claros en español).
- DNI duplicado: se consulta antes de guardar y, además, se captura el error `11000` del índice único
  de MongoDB, por si dos pedidos llegan al mismo tiempo.
- ID con formato inválido (`CastError`) → 400.
- JSON mal formado → 400. Cuerpo demasiado grande (más de 1 MB) → 413.
- Cualquier otro error → 500 con un mensaje genérico (el detalle queda solo en los logs del servidor).

## 11. Frontend: decisiones de diseño

- **Capa de API única (`lib/api.js`):** todas las llamadas pasan por una función que usa rutas
  relativas, traduce los errores del servidor a mensajes legibles y detecta la falta de conexión.
- **Estado global con Context (`DatosContext`):** alumnos e ingresos se cargan una vez y se comparten
  entre todas las secciones. Se recargan tras crear, editar, eliminar o pagar, y también cuando llega
  un aviso por Socket.io o se recupera la conexión. Así nunca hace falta recargar la página.
- **Avisos (`AvisosContext`):** mensajes temporales de éxito, alerta o error.
- **Fechas (`lib/fechas.js`):** las fechas de pago se guardan a medianoche UTC y se muestran en UTC,
  para que no "salten" un día por la zona horaria. Los ingresos (momento exacto) se muestran en hora
  de Argentina (`America/Argentina/Buenos_Aires`). Formato `es-AR`.
- **Fotos (`lib/imagen.js`):** antes de subirla, la foto se achica en el navegador a 400 px como máximo
  y se convierte a JPEG (≈30–60 KB). El servidor además valida el tipo y el tamaño (máx. 600 KB).
- **Validación doble:** el formulario aplica las mismas reglas que el backend para avisar antes de
  enviar; el backend vuelve a validar porque nunca hay que confiar solo en el cliente.
- **Diseño responsive:** menú lateral en computadora y barra inferior en celular.
- **Carga diferida:** la sección Estadísticas (que incluye la librería de gráficos) se descarga solo
  cuando se abre, para que el resto cargue más rápido.
- **Accesibilidad:** etiquetas para lectores de pantalla, roles `alert`/`status` en los mensajes y
  navegación con teclado.
- **Sesión (`AuthContext` + custom hook `useAuth`):** guarda quién inició sesión y ofrece `ingresar` y
  `salir`. Cualquier componente la obtiene con `const { usuario, salir } = useAuth()`. El hook avisa con
  un error claro si se usa fuera del Provider.
- **Rutas protegidas (`RutaProtegida`):** mientras se verifica la sesión muestra "Verificando sesión…";
  sin sesión lleva al Inicio recordando a qué pantalla quería ir (salvo que haya tocado "Salir"); sin
  permiso muestra "No tenés acceso a esta sección".
- **Permisos en un solo lugar (`lib/permisos.js`):** la función `puede(usuario, permiso)` la usan el
  menú, las rutas y los botones. Es solo para la interfaz: la seguridad real está en el backend.
- **Sesión vencida:** si cualquier pedido responde 401 (o el servidor rechaza el socket), `api.js`
  avisa a `AuthContext`, que cierra la sesión en pantalla y muestra un aviso. Un solo camino para todos
  los casos.
- **`DatosContext` dentro de la parte protegida:** sin sesión no se piden datos ni se abre el socket;
  al cerrar sesión se desmonta y la conexión se corta.
- **Planes en `DatosContext`:** a diferencia del personal, los planes los usan varias pantallas
  (formulario de alumno, registrar pago, Ajustes), así que se cargan junto con alumnos e ingresos. El
  servidor avisa `planes:cambio` por Socket.io y se recargan planes y alumnos (los alumnos traen el
  precio y los días de aviso de su plan).
- **Selector de plan:** muestra "Nombre · $ precio". En el alta, si hay un solo plan activo ya viene
  elegido. Debajo de la fecha de pago se ve el vencimiento que va a quedar, calculado con las mismas
  reglas que el servidor; al editar, si se cambia el plan, avisa "El plan nuevo se aplica desde el
  próximo pago".
- **Registrar pago:** muestra plan, precio y nuevo vencimiento antes de confirmar; el botón dice el
  monto ("Registrar $ 25.000") cuando el precio es mayor que 0. Si el plan del alumno se desactivó,
  pide elegir otro.
- **Custom hooks propios (`hooks/`):** además de `useAuth`, hay dos que juntan lógica que se repetía
  o que ensuciaba los componentes:
  - `useHistorialPagos(alumnoId)` trae el historial y devuelve `{ pagos, cargando, error, recargar,
    anulable }`. Descarta la respuesta si cambió el alumno antes de que llegue (así no se ve un instante
    el historial de otro). `anulable` aplica las mismas reglas que el servidor: el último vigente, y no
    el del alta.
  - `useFiltroEstado(alumnos, { enUrl })` calcula el estado de cada alumno, las cantidades por estado y
    el filtro elegido. Antes ese código estaba copiado en Pagos y en Alumnos. En Pagos el filtro vive en
    la dirección (`?estado=vencido`, para llegar desde el Panel); en Alumnos, solo en memoria.
- **Medio de pago con botones (`SelectorMedio`):** 4 botones grandes en vez de una lista desplegable:
  se ven todas las opciones y se eligen con un toque (más rápido en el mostrador y en el celular).
  Funcionan como un grupo de radio (`role="radiogroup"`, `aria-checked`) para lectores de pantalla.
- **Registrar pago (HU 12):** debajo del medio aparece **"A cobrar $ X"** en grande. El aviso final dice
  el monto y el medio ("Pago de $ 25.000 en efectivo registrado…").
- **Historial (`HistorialPagos`):** fecha y monto arriba y en negrita (lo primero que se busca); abajo
  plan, medio, hasta cuándo cubre y quién lo registró. Los anulados se ven tachados, con quién y cuándo
  los anuló. La confirmación de anular aparece dentro del mismo modal (no una ventana sobre otra) y dice
  a qué fecha vuelve el vencimiento.
- **Ajustes con pestañas:** Planes y Personal son dos rutas (`/planes`, `/personal`) con pestañas
  arriba (`AjustesTabs`). El ítem "Ajustes" del menú queda marcado en las dos.
- **Pantalla Personal:** la lista de cuentas no va en `DatosContext` porque solo la usa esta pantalla:
  se pide al entrar, y recepción nunca la descarga. El formulario de edición no toca la contraseña ni
  el estado activo; cada uno tiene su botón (la contraseña se escribe dos veces, y desactivar pide
  confirmación). En la cuenta propia el rol aparece bloqueado y no está el botón de desactivar.
- **`actualizarUsuario` en `AuthContext`:** si administración edita su propia cuenta, el menú muestra
  el nombre nuevo sin recargar. Solo cambia los datos en pantalla; la cookie de sesión sigue igual.

### Pantalla Pagos con planes (prototipo de Arquitectura y diseño de interfaces)
Con la HU 11 cada fila de Pagos muestra, además del vencimiento, el **plan y su precio vigente**
("Mensual · $ 25.000"): es lo que recepción tiene que cobrar al renovar. El diálogo "Registrar pago"
muestra el plan (se puede cambiar), el precio, y el **nuevo vencimiento antes de confirmar**
(visibilidad del estado del sistema y prevención de errores).

### Pantalla Pagos con historial (HU 12)
Cada fila de Pagos suma el botón **Historial**. Al cobrar se elige el medio y se ve el monto a cobrar.
Para la materia: *visibilidad del estado del sistema* (monto y nuevo vencimiento antes de confirmar),
*control y libertad* (anular un error), *prevención de errores* (solo se ofrece anular el pago que se
puede anular, con confirmación) y *reconocer antes que recordar* (todos los medios visibles a la vez).

### Pantalla de Inicio (prototipo de Arquitectura y diseño de interfaces)

| Criterio | Cómo se resolvió |
|---|---|
| Propuesta de valor clara | Título "Cuotas e ingresos del gimnasio, bajo control." y una frase que dice para quién es y qué resuelve; tres beneficios concretos con íconos. |
| Botón "Ingresar" evidente | Botón de ancho completo, el elemento más contrastado del formulario; también se envía con Enter. |
| Texto e imagen equilibrados | En computadora, pantalla dividida en dos mitades: a la izquierda la propuesta de valor con una ilustración de la app (datos de ejemplo); a la derecha, el formulario. En celular, la propuesta va arriba (sin la ilustración, para no alejar el formulario) y el formulario abajo. |
| Errores comprensibles | Validación antes de enviar, con el mensaje debajo de cada campo ("Escribí tu email.", "Revisá el email: falta la @ o el dominio"). Los errores del servidor aparecen en un recuadro rojo con ícono: "Email o contraseña incorrectos.", "Tu cuenta está desactivada. Hablá con administración." o "No se pudo conectar con el servidor". |
| Prevención y recuperación | Botón para mostrar u ocultar la contraseña; al fallar, se borra solo la contraseña (el email queda escrito); texto de ayuda: "¿No tenés cuenta u olvidaste la contraseña? Pedísela a administración." |
| Consistencia | Mismos colores, tipografía, marca y componentes (`Boton`, `Campo`) que el resto de la aplicación. |
| Accesibilidad | Etiquetas en todos los campos, `autocomplete` para que el navegador ofrezca guardar la contraseña, `aria-invalid` en campos con error y `role="alert"` en el error del servidor. |

La ilustración es un SVG propio con datos ficticios; se puede reemplazar por una foto real del
gimnasio sin cambiar el resto de la pantalla.

## 12. Seguridad

- La URI de MongoDB (con usuario y contraseña) se guarda en la variable de entorno `MONGO_URI`, en el
  archivo `backend/.env`, que está excluido de Git por `.gitignore`. Se versiona solo `.env.example`
  sin datos reales.
- En el hosting, `MONGO_URI` se configura como variable secreta.
- El frontend no contiene ninguna credencial: solo habla con su propio servidor.
- La URI nunca se imprime en consola.
- Como en una etapa del desarrollo la credencial se compartió fuera del proyecto, se recomienda
  cambiar la contraseña del usuario de la base en Atlas antes de la entrega.
- Recomendaciones para Atlas: usuario con permisos mínimos (lectura/escritura solo en la base del
  gimnasio) y Network Access limitado a las IP del hosting cuando sea posible.
- Límite de tamaño de las peticiones (1 MB) y validación de imágenes.

### Inicio de sesión y permisos
- **Contraseñas:** se guarda solo el hash de bcrypt (costo 10), nunca la contraseña. Mínimo 8 caracteres.
- **Token de sesión (JWT):** firmado con `JWT_SECRET` (variable secreta de al menos 32 caracteres; sin
  ella el servidor no arranca), algoritmo fijo HS256 y vencimiento de 12 horas. Guarda solo el id y el
  rol del usuario: va firmado, no cifrado, así que no lleva datos sensibles.
- **Cookie `sesion`:** `httpOnly` (el JavaScript de la página no puede leerla, lo que protege ante XSS),
  `SameSite=Strict` (el navegador no la manda desde otros sitios, lo que protege ante CSRF) y `Secure`
  en producción (solo viaja por HTTPS; se activa con `NODE_ENV=production`).
- **Login sin pistas:** el mismo mensaje si el email no existe o si la contraseña está mal, y la
  respuesta tarda lo mismo en los dos casos (si el email no existe se compara igual contra un hash de
  relleno). "Cuenta desactivada" solo se informa a quien escribió la contraseña correcta.
- **Inyección NoSQL:** email y contraseña se convierten a texto antes de consultar, así un objeto como
  `{ "$ne": null }` no funciona como operador.
- **Permisos en el servidor:** `requireAuth` y `requireRol` protegen la API aunque alguien fuerce la
  interfaz. El rol se lee de la base en cada pedido, no del token.
- **Cuentas del personal:** el permiso de administración se pone una sola vez, al montar
  `/api/usuarios` en `server.js` (`requireAuth` + `requireRol('administracion')`), así una ruta nueva
  del router no puede quedar desprotegida por olvido. La contraseña se cambia por una ruta aparte, y
  `activo` se exige como booleano (el texto `"false"` no cuenta como verdadero).
- **Fotos:** se sirven con `Cache-Control: private`, para que ningún caché compartido las guarde.
- **Limitación conocida:** cerrar sesión borra la cookie, pero el token sigue siendo válido hasta que
  vence (12 h). Lo atenúan la cookie `httpOnly` y que desactivar la cuenta corta el acceso en el
  pedido siguiente. Por lo mismo, **cambiar la contraseña no cierra las sesiones ya abiertas** de esa
  cuenta: para echar a alguien en el momento hay que desactivarla. No hay límite de intentos de login
  (no está en el backlog).

## 13. Instalación y ejecución local

Requisito: Node.js 22.12 o superior.

1. Copiar `backend/.env.example` a `backend/.env` y completar `MONGO_URI`, `JWT_SECRET` y los datos
   del primer administrador (`ADMIN_NOMBRE`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`). Para generar
   `JWT_SECRET`:
   ```bash
   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
   ```
2. Instalar dependencias:
   ```bash
   npm install --prefix backend
   npm install --prefix frontend
   ```
   Crear el primer administrador (una sola vez; si ya existe no hace nada):
   ```bash
   npm run seed:admin --prefix backend
   ```
   Si la base tiene ingresos de antes de que se vincularan por `_id`, completarlos (una sola vez;
   sin `--aplicar` solo muestra qué cambiaría, y repetirlo no modifica nada):
   ```bash
   npm run migrar:ingresos --prefix backend -- --aplicar
   ```
   Crear el plan "Mensual" y asignarlo a los alumnos sin plan (una sola vez; no toca vencimientos):
   ```bash
   npm run migrar:planes --prefix backend -- --aplicar
   ```
3. Modo desarrollo (dos terminales):
   ```bash
   npm run dev:backend    # API en http://localhost:3000 (se reinicia al guardar)
   npm run dev:frontend   # App en http://localhost:5173 (se recarga al guardar)
   ```
   Vite reenvía `/api` y `/socket.io` al backend (proxy), por eso el frontend nunca usa URLs absolutas.
4. Modo producción local:
   ```bash
   npm run build   # instala dependencias y compila el frontend en frontend/dist
   npm start       # todo en http://localhost:3000
   ```

## 14. Despliegue (producción)

Plataforma prevista: **Render**, con un único *Web Service*:

| Configuración | Valor |
|---|---|
| Build Command | `npm run build` |
| Start Command | `npm start` |
| Health Check Path | `/healthz` |
| Variables | `MONGO_URI` (secreta), `JWT_SECRET` (secreta, distinta de la de desarrollo), `NODE_ENV=production`, `NODE_VERSION=22` |
| Plan | Pago (Starter) para que el servicio no se apague por inactividad |

El primer administrador de producción se crea una vez con `npm run seed:admin --prefix backend`
(desde la consola *Shell* de Render, con `ADMIN_NOMBRE`, `ADMIN_EMAIL` y `ADMIN_PASSWORD` cargadas como
variables temporales, que después se pueden borrar).

Si la base de producción es distinta de la de desarrollo y tiene ingresos viejos, correr una vez
`npm run migrar:ingresos --prefix backend -- --aplicar` desde el mismo *Shell*. En la base actual ya
se corrió (15/11/2026). Lo mismo con `npm run migrar:planes --prefix backend -- --aplicar` (en la
base actual ya se corrió el 15/11/2026: creó "Mensual" y se lo asignó a 3 alumnos).

El servidor primero verifica `JWT_SECRET`, se conecta a MongoDB y recién después empieza a aceptar
pedidos; si algo falla, se detiene con un error claro (así el hosting lo detecta y no queda "a medias").
La ruta `/healthz` devuelve 503 si la base no responde.

**Actualizaciones:** se hace `git push` a la rama principal y Render compila y publica la nueva versión.
Si el build falla, sigue funcionando la versión anterior.

> Estado: al momento de esta documentación el despliegue final y la URL de producción están
> pendientes de confirmar. Completar aquí la URL definitiva y el costo mensual del plan.

## 15. Pruebas realizadas

- Conexión local del backend con MongoDB Atlas (`✅ Conectado a MongoDB`).
- Prueba manual con Postman de `POST /api/alumnos` → `201 Created` con el documento y su `_id`.
- Build del frontend generado en `frontend/dist`.

### Inicio de sesión y roles (HU 9)
Probado en local contra la base real y en Chrome:

| Prueba | Resultado |
|---|---|
| Pedidos a `/api/alumnos` e `/api/ingresos` sin sesión o con una cookie inventada | 401 |
| Login con email inexistente / contraseña incorrecta | 401 con el mismo mensaje y tiempo de respuesta similar |
| Login con `{ "$ne": null }` como email | 401 (no funciona como operador) |
| Login correcto | 200 y cookie `HttpOnly; SameSite=Strict; Max-Age=43200` |
| Cuenta desactivada / token de un rol que ya no coincide con la base | 401 / 403 (manda la base) |
| Recepción intenta eliminar un alumno | 403 (y no se borra nada) |
| Socket.io sin sesión | Conexión rechazada ("No autorizado") |
| Seed del administrador ejecutado dos veces | Lo crea la primera vez; la segunda no modifica nada |
| Entrar a `/alumnos` sin sesión | Redirige a `/ingresar` y, al ingresar, vuelve a `/alumnos` |
| Formulario vacío / contraseña incorrecta | Mensajes debajo de cada campo / recuadro rojo con el error del servidor |
| "Salir" | Borra la cookie, muestra "Cerraste sesión." y vuelve al Inicio sin recordar la pantalla anterior |
| Sesión vencida con la pantalla abierta | Vuelve sola al Inicio con un aviso |
| Inicio en celular (390 px) y en computadora | Se adapta sin desbordes |

### Gestión de cuentas del personal (HU 10)
Probado en local contra la base real con un script de 28 pedidos (la cuenta de prueba se borró al
terminar) y en el navegador por el equipo:

| Prueba | Resultado |
|---|---|
| `/api/usuarios` sin sesión / con una cuenta de recepción | 401 / 403 |
| La lista no incluye `passwordHash` | ✔ |
| Alta con contraseña de 7 caracteres, email inválido, rol inexistente, nombre vacío o `{ "$ne": null }` como contraseña | 400 con el mensaje correspondiente |
| Alta correcta (`Recepcion@Prueba.test`) | 201, email guardado en minúsculas, `activo: true` |
| Alta o edición con un email que ya existe | 409 |
| Administración se baja su propio rol / se desactiva | 400 "No podés cambiar tu propio rol ni desactivar tu cuenta." |
| `activo: "false"` (texto), ID inválido, cuenta inexistente | 400 / 400 / 404 |
| Desactivar una cuenta con la sesión abierta | Su siguiente pedido responde 401 y no puede volver a entrar (403) |
| Cambiar la contraseña | La vieja da 401, la nueva entra |
| En pantalla: crear una cuenta de recepción y entrar con ella | Menú sin Estadísticas ni Personal; sin botón "Eliminar" en Alumnos |
| En pantalla: editar la cuenta propia | Rol bloqueado, sin botón de desactivar; el nombre nuevo aparece en el menú al instante |
| Barra inferior del celular con los 6 ítems de administración | Se ve bien |

### Ingresos vinculados por `_id` (tarea técnica)
Probado en local contra la base real:

| Prueba | Resultado |
|---|---|
| Ingreso viejo sin `alumno` frente al nuevo esquema | Sigue siendo válido |
| Registrar un ingreso por DNI | 201; guarda el `_id` del alumno y su DNI (el ingreso de prueba se borró después) |
| `npm run migrar:ingresos` sin `--aplicar` | Informa 2 ingresos para vincular y no guarda nada |
| Con `--aplicar` | Vincula los 2 ingresos |
| Repetirlo | "No hay ingresos sin vincular. No se modificó nada." |
| Verificación | Los 2 ingresos apuntan a un alumno cuyo DNI coincide con el guardado |
| Build del frontend | Sin errores; no quedan usos del cruce por DNI |

### Planes de cuota (HU 11)
Probado en local contra la base real (script de 40 pedidos; los planes, el alumno, el ingreso y la
cuenta de prueba se borraron al terminar), 12 casos del cálculo de fechas en el backend y otros 12 en
el frontend, y en Chrome:

| Prueba | Resultado |
|---|---|
| `/api/planes` sin sesión / recepción crea o edita un plan | 401 / 403 |
| Recepción lista los planes | 200 |
| Plan sin nombre, unidad inválida, duración 0 o decimal, precio negativo o vacío, aviso ≥ duración en un plan de días | 400 con el mensaje correspondiente |
| Nombre repetido ("mensual" contra "Mensual") | 409 |
| Plan sin `diasAviso` | Semanal queda con 1, Trimestral con 3 |
| `activo` como texto / ID inválido / inexistente / DELETE | 400 / 400 / 404 / 404 (no existe la ruta) |
| Alta de alumno sin plan, con plan inexistente o inactivo | 400 |
| Alta con Mensual y pago 31/1/2026 | Vence 28/2/2026; la respuesta trae el plan completo |
| Editar: cambiar a Semanal | El vencimiento no cambia |
| Editar: corregir la fecha de pago a 1/2 (Semanal) | Vence 8/2 |
| Pago tarde (vencía 8/2, paga 10/2, Semanal) | Vence 17/2 |
| Pago adelantado (vence 17/2, paga 15/2) pasándose a Mensual | Vence 17/3 |
| Pagar o pasarse a un plan desactivado | 400 "El plan … ya no está activo. Elegí otro." |
| Editar otros datos de un alumno con plan desactivado | 200, conserva su plan y su vencimiento |
| Trimestral, pago tarde 30/11/2026 | Vence 28/2/2027 |
| Registrar un ingreso | El alumno de la respuesta trae su plan |
| `npm run migrar:planes` sin `--aplicar` / con `--aplicar` / repetido | Informa / crea Mensual y lo asigna a 3 alumnos / no modifica nada; las fechas de los alumnos quedaron idénticas |
| En pantalla: crear un plan vacío | Mensajes debajo de nombre y precio |
| En pantalla: elegir "Días" | El aviso sugerido pasa de 3 a 1 |
| En pantalla: alta de alumno con Semanal y pago 15/11 | "Cada pago cubre 7 días." · "La cuota vence el 22/11/2026." |
| En pantalla: registrar pago a un alumno vencido / al día (sin confirmar) | Nuevo vencimiento desde hoy (15/12) / sumado al actual (23/11 → 23/12) |
| En pantalla: Pagos, Alumnos y Ajustes | Plan y precio en cada fila; columna Plan; pestañas Planes/Personal con "Ajustes" marcado en ambas; sin errores en la consola |

### Historial de pagos (HU 12)
Probado en local contra la base real con scripts y en Chrome, con un alumno de prueba (el alumno y
sus pagos se borraron al terminar):

| Prueba | Resultado |
|---|---|
| Alta / pago sin `medio` | 400 "Elegí el medio de pago (efectivo, transferencia, débito o crédito)." |
| Alta con efectivo (pago 1/11, Mensual) | 201, vence 1/12; queda 1 pago con anteriores en `null` |
| Pago adelantado con transferencia (16/11) | 200, vence 1/1/2027; la respuesta trae `pago` con monto y medio |
| `GET /api/alumnos/:id/pagos` | 2 pagos del más reciente al más viejo, con vencimiento anterior y nuevo correctos |
| Historial con ID inválido | 400 |
| Anular un pago que no es el último | 409 "Solo se puede anular el último pago del alumno." |
| Anular el último | 200; el alumno vuelve a la fecha de pago y al vencimiento anteriores |
| Anularlo otra vez | 409 "Este pago ya estaba anulado." |
| Anular el siguiente (ahora es el último) | 200; el alumno vuelve al estado del alta |
| Anular el pago del alta | 409 |
| Anular con ID inválido / inexistente / sin sesión | 400 / 404 / 401 |
| Anular con rol recepción | 403 (probado sobre el middleware `requireRol`) |
| Historial al final | 2 anulados y el alta vigente: los pagos anulados no se borran |
| Eliminar el alumno | 200; sus pagos siguen en la colección |
| `lib/pagos.js` contra `Pago.js` | Las dos listas de medios coinciden |
| En pantalla: alta sin elegir medio | "Elegí el medio de pago." debajo de los botones, en rojo |
| En pantalla: alta con Efectivo | Se ve "Primer pago: $ X. Queda en el historial de pagos." y el alumno aparece en Pagos |
| En pantalla: cobrar sin medio / con Transferencia | Error debajo de los botones / aviso "Pago de $ 0 en transferencia registrado. … al día hasta el 16/01/2027." |
| En pantalla: Historial | 2 pagos, el más nuevo con "Anular este pago"; el del alta sin el botón |
| En pantalla: anular | Confirmación dentro del modal con el vencimiento al que vuelve; el pago queda tachado con "Anulado el … por …"; la fila de Pagos vuelve a 16/12/2026 |
| En pantalla: `/pagos?estado=vencido` | Llega ya filtrado (Vencidos 1); filtros y conteos de Alumnos siguen funcionando |
| En pantalla, 375 px de ancho | Historial queda solo con ícono para que "Registrar pago" entre en una línea; sin errores en la consola |

Pendiente de probar: volver al **plan anterior** al anular (hace falta un segundo plan activo) y
anular con una cuenta real de recepción.

Pruebas de aceptación a completar en producción (lista de verificación):

- [ ] La aplicación carga por HTTPS desde un único enlace, en ventana privada y en celular.
- [ ] Crear un alumno y verlo en el listado; persiste al recargar.
- [ ] Búsqueda por DNI y por nombre.
- [ ] Edición de datos y recálculo del vencimiento.
- [ ] Eliminación con confirmación.
- [ ] Registrar pago y ver el cambio de estado.
- [ ] Registrar ingreso por DNI (existente y no existente).
- [ ] Corregir el DNI de un alumno con ingresos: en Ingresos sigue apareciendo con su nombre.
- [ ] Subir y quitar foto.
- [ ] Refrescar la página en cualquier sección.
- [ ] Los errores se muestran de forma comprensible (por ejemplo, DNI repetido).
- [ ] Funciona sin visitar antes ninguna URL de backend.
- [ ] No hay secretos en Git ni en el bundle del frontend.
- [ ] Sin sesión, cualquier sección lleva al Inicio; con sesión, se puede refrescar sin perderla.
- [ ] La cookie de sesión sale con `Secure` (HTTPS) en producción.
- [ ] Recepción no ve Estadísticas, Personal ni el botón "Eliminar"; administración sí.
- [ ] Crear una cuenta de recepción, entrar con ella, desactivarla y comprobar que se le cierra la sesión.
- [ ] Cargar el precio real del plan Mensual y crear los demás planes que use el gimnasio.
- [ ] Con recepción: elegir el plan al dar de alta y al cobrar; no ve Ajustes.
- [ ] Con dos pantallas abiertas: cambiar el precio de un plan y verlo actualizado en la otra.
- [ ] Cobrar con cada medio de pago y verlo en el historial con el monto correcto.
- [ ] Con administración: anular el último pago y ver que el vencimiento vuelve al anterior.
- [ ] Con recepción: ver el historial, sin el botón "Anular".

## 16. Evolución del proyecto y problemas resueltos

### Versión inicial (repositorio aparte `backend1-gim` en GitHub)
Ya no forma parte de este repositorio: se conserva solo como antecedente en su propio repositorio.
- Backend Express con vistas **Handlebars** y un `client.js` con Socket.io.
- Datos de prueba en un archivo `alumnos.json`.
- Un frontend React separado (componentes `AlumnoList`, `AlumnosForm`, `AvisoPago`,
  `RegistroIngreso`, `SlidebarAdmin`), publicado aparte en Vercel.
- Ruta `POST /editar/:id` pensada para formularios Handlebars con redirección.

### Versión actual (carpeta `gimnasio-app/`)
Problemas encontrados (o riesgos previstos) durante el desarrollo y cómo se resolvieron:

| Problema o riesgo | Solución |
|---|---|
| Faltaba el script `dev` en `package.json`. | Se agregó (`node --watch server.js`). |
| Import incorrecto del modelo `Alumno.js`. | Se reorganizó en `src/dao/models/` con la ruta correcta. |
| Faltaba la dependencia `mongoose-paginate-v2`. | Se instaló. |
| Variable de entorno de la base mal configurada. | Se unificó en `MONGO_URI` con `.env.example`. |
| Frontend y backend en URLs distintas; había que "despertar" el backend. | Express sirve el frontend compilado: una sola URL, rutas relativas, sin CORS. |
| Fechas que podían quedar `Invalid Date` o correrse un día. | Validación de fechas y guardado a medianoche UTC; visualización en `es-AR`. |
| DNI duplicados. | Índice único + verificación previa + manejo del error `11000` → 409. |
| Al refrescar en `/alumnos` el servidor no encontraba la ruta. | Fallback de la SPA a `index.html` después de las rutas de la API, compatible con Express 5. |
| Rutas de API inexistentes devolvían HTML. | Manejador 404 en JSON para `/api`. |
| Había que recargar la página para ver cambios. | Recarga automática tras cada acción y avisos por Socket.io. |
| Fotos pesadas. | Se achican en el navegador y se guardan aparte en la colección `fotos`. |
| Cualquiera con el enlace podía usar la aplicación. | Inicio de sesión con roles (HU 9): JWT en cookie httpOnly y permisos en el servidor. |
| Las cuentas del personal solo se podían crear con el seed, desde la terminal. | Pantalla Personal (HU 10): administración crea, edita, activa o desactiva cuentas y cambia contraseñas. |
| Al editar la cuenta propia, el menú seguía mostrando el nombre viejo. | `actualizarUsuario` en `AuthContext` reemplaza los datos en pantalla. |
| Los ingresos se vinculaban al alumno por DNI: al corregir un DNI, los ingresos anteriores aparecían como "Alumno eliminado". | El ingreso guarda el `_id` del alumno (y el DNI como dato histórico); script de migración para los ingresos viejos. |
| La cuota vencía siempre a los 30 días: no servía para planes semanales o trimestrales, y "mes" no era mes calendario. | Planes de cuota (HU 11): el vencimiento se calcula según la duración del plan, en meses calendario o días fijos, con reglas para pago adelantado y tarde. |
| Vulnerabilidades en dependencias (`npm audit`: Mongoose, Engine.IO, body-parser). | `npm audit fix` dentro de las mismas versiones mayores; 0 vulnerabilidades. |
| Solo se guardaba el último pago: no se sabía cuánto se cobró ni cómo, y un pago cargado por error no se podía deshacer. | Historial de pagos (HU 12): colección `pagos` con monto, medio y quién lo registró; anulación del último pago, con transacción. |
| Después de "Salir", el login recordaba la última pantalla (la próxima persona caía ahí). | `AuthContext` registra si la sesión se cerró a propósito y `RutaProtegida` no la recuerda en ese caso. |

## 17. Limitaciones y trabajo futuro

- **Cerrar las sesiones abiertas al cambiar una contraseña** (hoy hay que desactivar la cuenta para
  cortar el acceso en el momento).
- **Paginación** del listado de alumnos (la librería ya está instalada; se pospuso a propósito).
- **Editar la fecha de pago** desde "Editar alumno" cambia el vencimiento, pero no el historial: es
  una corrección de datos, no un pago. Si se usa mucho, convendría corregir desde el historial.
- Reportes de recaudación (HU 13).
- Reglas de prórroga, pagos parciales, pase diario, control de días por semana y descuentos.
- Pruebas automatizadas (por ejemplo, con Vitest y Supertest).
- Bloquear o advertir el ingreso con cuota vencida según lo que decida el gimnasio.
- Exportar datos a Excel o PDF.

## 18. Conclusiones

El proyecto permitió aplicar de punta a punta el desarrollo de una aplicación web full-stack con
JavaScript: diseño de una API REST, modelado de datos en MongoDB, construcción de una interfaz en React,
comunicación en tiempo real y preparación para producción.

El principal aprendizaje técnico fue que la **arquitectura de despliegue** influye tanto como el código:
separar frontend y backend en servicios gratuitos distintos causaba fallas que el usuario final no
podía entender. Unificar todo bajo una sola URL simplificó la configuración, eliminó los problemas de
CORS y hizo la aplicación más fiable para su uso real en el gimnasio.

## 19. Glosario

- **API REST:** forma de comunicar el frontend con el servidor mediante URLs y métodos HTTP
  (GET, POST, PUT, DELETE) que intercambian JSON.
- **SPA (Single Page Application):** aplicación que carga una sola página y cambia de sección sin
  recargarla.
- **CORS:** regla de seguridad del navegador que limita pedidos entre sitios con distinto origen.
- **Variable de entorno:** valor de configuración (como una contraseña) que se define fuera del código.
- **Build:** proceso que transforma el código del frontend en archivos optimizados para publicar.
- **Health check:** ruta que el hosting consulta para saber si el servicio funciona.
- **Socket.io / WebSocket:** conexión abierta entre navegador y servidor para enviar avisos al instante.
- **ODM (Mongoose):** librería que permite trabajar con MongoDB usando modelos y validaciones.
- **Hash (bcrypt):** resumen de la contraseña que no se puede revertir; para comprobarla se calcula el
  hash de lo escrito y se compara con el guardado.
- **JWT (JSON Web Token):** texto firmado por el servidor que dice quién es el usuario y hasta cuándo
  vale. Si alguien lo modifica, la firma deja de coincidir.
- **Cookie httpOnly:** dato que el navegador guarda y manda solo en cada pedido al servidor, pero que
  el JavaScript de la página no puede leer.
- **401 / 403:** "no sé quién sos" (hay que iniciar sesión) / "sé quién sos, pero no tenés permiso".
- **Middleware:** función de Express que se ejecuta antes de la ruta y puede dejar pasar o cortar el
  pedido (por ejemplo, `requireAuth`).
- **Custom hook:** función propia que empieza con `use` y reúne hooks de React para reutilizarlos
  (por ejemplo, `useAuth`, `useHistorialPagos` y `useFiltroEstado`).
- **Transacción:** grupo de cambios en la base que se guardan todos juntos o ninguno (si uno falla, se
  deshacen los demás).
