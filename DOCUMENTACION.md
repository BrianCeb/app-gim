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

La aplicación tiene una pantalla pública de **Inicio** y cinco secciones que requieren iniciar sesión:

| Sección | Qué permite hacer |
|---|---|
| **Inicio** (`/ingresar`) | Propuesta de valor de la aplicación y formulario de ingreso (email y contraseña). Es la única pantalla que se ve sin sesión. |
| **Panel** | Registrar un ingreso por DNI; ver ingresos del día y cantidad de alumnos al día, por vencer y vencidos; lista de "cuotas a revisar" con botón "Pagó". |
| **Ingresos** | Registrar ingresos y ver el listado de ingresos de cualquier día (hora, alumno, estado de su cuota). |
| **Alumnos** | Listado completo; búsqueda por nombre, apellido o DNI (sin importar tildes ni puntos); filtro por estado; alta, edición, eliminación con confirmación, registro de pago y foto. |
| **Pagos** | Alumnos ordenados por vencimiento (los más urgentes primero), filtro por estado y botón para registrar el pago. |
| **Estadísticas** | Gráfico de barras de ingresos por día (últimos 30 días), promedio diario, total de alumnos y gráfico de torta con el estado de las cuotas. |

### Roles del personal

Cada cuenta tiene uno de dos roles. El menú muestra solo las secciones permitidas.

| Puede… | Recepción | Administración |
|---|---|---|
| Panel, Ingresos y Pagos | ✔ | ✔ |
| Ver, crear y editar alumnos; registrar pagos y fotos | ✔ | ✔ |
| Eliminar alumnos | — | ✔ |
| Estadísticas | — | ✔ |

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

- La cuota vence **30 días** después de la fecha de pago.
- Estados de la cuota:
  - **Vencido:** la fecha de vencimiento ya pasó.
  - **Por vencer:** faltan 3 días o menos.
  - **Al día:** faltan más de 3 días.
- **Registrar pago** toma la fecha de hoy (hora de Argentina) por defecto, aunque se puede elegir otra,
  y recalcula el vencimiento.
- El **DNI** es único por alumno. Se aceptan puntos o espacios ("12.345.678") y se guarda solo con
  números ("12345678"). Debe tener entre 6 y 9 dígitos.
- Son obligatorios: nombre, apellido, DNI, email válido y fecha de pago.
- Un ingreso solo se registra si existe un alumno con ese DNI. El ingreso se registra aunque la cuota
  esté vencida, pero la pantalla lo avisa claramente en rojo.
- Las fechas se muestran en formato argentino (dd/mm/aaaa).

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
│   │   └── crearAdmin.js           # seed del primer administrador (npm run seed:admin)
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
│       │   └── Usuario.js
│       └── routes/
│           ├── auth.router.js      # login, logout, yo
│           ├── alumnos.router.js
│           └── ingresos.router.js
└── frontend/
    ├── package.json
    ├── vite.config.js      # plugins y proxy de desarrollo hacia el backend
    ├── index.html
    └── src/
        ├── main.jsx                # rutas de la aplicación
        ├── index.css
        ├── pages/                  # Inicio, Panel, Ingresos, Alumnos, Pagos, Estadísticas
        ├── components/             # Layout, RutaProtegida, AlumnoForm, IngresoRapido, RegistrarPago, Modal, ui
        ├── context/                # AuthContext (sesión), DatosContext (datos + Socket.io), AvisosContext (toasts)
        ├── hooks/                  # useAuth (custom hook)
        └── lib/                    # api.js, permisos.js, fechas.js, alumnos.js, imagen.js
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
| `fechaVencimiento` | Date | Calculada: fechaPago + 30 días. |
| `fotoUrl` | String | Ruta a la foto (`/api/alumnos/:id/foto?v=...`) o vacío. |

### Colección `ingresos` (modelo `Ingreso`)
| Campo | Tipo | Detalle |
|---|---|---|
| `dni` | String | DNI del alumno que ingresó. |
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

**Relación alumno–ingreso:** se vincula por DNI. Si se elimina un alumno, sus ingresos históricos se
conservan y se muestran como "Alumno eliminado (DNI ...)".

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
| GET | `/api/alumnos` | sesión | Lista de alumnos ordenada por apellido y nombre | 200 |
| POST | `/api/alumnos` | sesión | Crear alumno | 201, 400 (datos inválidos), 409 (DNI repetido) |
| GET | `/api/alumnos/dni/:dni` | sesión | Buscar alumno por DNI | 200, 404 |
| PUT | `/api/alumnos/:id` | sesión | Editar alumno (recalcula el vencimiento) | 200, 400, 404, 409 |
| DELETE | `/api/alumnos/:id` | **admin** | Eliminar alumno y su foto | 200, 400 (ID inválido), 403, 404 |
| POST | `/api/alumnos/:id/pago` | sesión | Registrar pago (`fechaPago` opcional; por defecto hoy) | 200, 400, 404 |
| GET | `/api/alumnos/:id/foto` | sesión | Obtener la foto | 200 (imagen), 404 |
| PUT | `/api/alumnos/:id/foto` | sesión | Subir foto (`imagen` como data URL base64) | 200, 400, 404, 413 |
| DELETE | `/api/alumnos/:id/foto` | sesión | Quitar la foto | 200, 404 |
| GET | `/api/ingresos` | sesión | Lista de ingresos, más recientes primero | 200 |
| POST | `/api/ingresos` | sesión | Registrar ingreso por `dni`; devuelve también el alumno | 201, 400, 404 |
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
  "fechaPago": "2026-11-01"
}
```

Respuesta `201 Created`: el alumno guardado con `_id`, `dni: "12345678"` y
`fechaVencimiento` = 01/12/2026.

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
- **Fotos:** se sirven con `Cache-Control: private`, para que ningún caché compartido las guarde.
- **Limitación conocida:** cerrar sesión borra la cookie, pero el token sigue siendo válido hasta que
  vence (12 h). Lo atenúan la cookie `httpOnly` y que desactivar la cuenta corta el acceso en el
  pedido siguiente. No hay límite de intentos de login (no está en el backlog).

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

Pendiente: probar en pantalla con una cuenta de recepción (menú sin Estadísticas y sin botón
"Eliminar"), cuando exista la gestión de cuentas (HU 10).

Pruebas de aceptación a completar en producción (lista de verificación):

- [ ] La aplicación carga por HTTPS desde un único enlace, en ventana privada y en celular.
- [ ] Crear un alumno y verlo en el listado; persiste al recargar.
- [ ] Búsqueda por DNI y por nombre.
- [ ] Edición de datos y recálculo del vencimiento.
- [ ] Eliminación con confirmación.
- [ ] Registrar pago y ver el cambio de estado.
- [ ] Registrar ingreso por DNI (existente y no existente).
- [ ] Subir y quitar foto.
- [ ] Refrescar la página en cualquier sección.
- [ ] Los errores se muestran de forma comprensible (por ejemplo, DNI repetido).
- [ ] Funciona sin visitar antes ninguna URL de backend.
- [ ] No hay secretos en Git ni en el bundle del frontend.
- [ ] Sin sesión, cualquier sección lleva al Inicio; con sesión, se puede refrescar sin perderla.
- [ ] La cookie de sesión sale con `Secure` (HTTPS) en producción.
- [ ] Recepción no ve Estadísticas ni el botón "Eliminar"; administración sí.

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
| Vulnerabilidades en dependencias (`npm audit`: Mongoose, Engine.IO, body-parser). | `npm audit fix` dentro de las mismas versiones mayores; 0 vulnerabilidades. |
| Después de "Salir", el login recordaba la última pantalla (la próxima persona caía ahí). | `AuthContext` registra si la sesión se cerró a propósito y `RutaProtegida` no la recuerda en ese caso. |

## 17. Limitaciones y trabajo futuro

- **Gestión de cuentas del personal** desde la aplicación (HU 10, en curso): hoy solo existe el
  administrador creado con el seed.
- **Paginación** del listado de alumnos (la librería ya está instalada; se pospuso a propósito).
- **Historial de pagos:** hoy solo se guarda el último pago; podría registrarse cada pago con su monto.
- **Montos y precios** de cuotas, y reportes de recaudación.
- Reglas de prórroga, pagos parciales o distintos planes (semanal, trimestral).
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
  (por ejemplo, `useAuth`).
