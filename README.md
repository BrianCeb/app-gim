# GimnasioApp

App web para administrar el gimnasio: alumnos, cuotas, ingresos por DNI y estadísticas.

- **Backend:** Node + Express 5 + MongoDB Atlas (Mongoose). Socket.io solo avisa cambios para que las pantallas abiertas se actualicen solas.
- **Frontend:** React + Vite + Tailwind CSS 4.
- **Una sola URL:** en producción, Express sirve la API (`/api/...`) y el frontend compilado (`frontend/dist`).
- **Inicio de sesión con rol:** recepción o administración. La sesión es un JWT en una cookie httpOnly; la API controla los permisos (401 sin sesión, 403 sin permiso).

```
gimnasio-app/
├── package.json        # scripts para build/start de todo el proyecto (los usa Render)
├── backend/            # API Express
│   ├── server.js
│   ├── .env            # NO se sube a git (ver .env.example)
│   ├── scripts/        # crearAdmin.js (seed del primer administrador), vincularIngresos.js y migrarPlanes.js (migraciones)
│   └── src/
│       ├── config/      # db.js, auth.js (JWT y cookie)
│       ├── middlewares/ # auth.js: requireAuth, requireRol
│       ├── dao/models/  # Alumno, Ingreso, Foto, Plan, Usuario
│       ├── routes/      # auth, alumnos, ingresos, planes y usuarios (.router.js)
│       └── utils/       # vencimiento.js: cálculo del vencimiento según el plan
├── frontend/           # React
│   └── src/
│       ├── pages/       # Inicio, Panel, Ingresos, Alumnos, Pagos, Estadísticas, Planes, Personal
│       ├── components/  # Layout, RutaProtegida, formularios, ui
│       ├── context/     # sesión (AuthContext), datos compartidos y avisos
│       ├── hooks/       # useAuth
│       └── lib/         # api, permisos, fechas, planes, imágenes
```

## Trabajar en tu computadora

Requisito: Node 22.12 o superior.

1. Copiá `backend/.env.example` a `backend/.env` y completá `MONGO_URI`, `JWT_SECRET` y los datos del primer administrador (`ADMIN_NOMBRE`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` de 8 caracteres o más). El `.env.example` explica cómo generar `JWT_SECRET`.
2. Instalá dependencias (una sola vez): `npm install --prefix backend` y `npm install --prefix frontend`.
   Creá el primer administrador (una sola vez): `npm run seed:admin --prefix backend`.
   Si la base tiene ingresos viejos (guardados solo con DNI), vinculalos con su alumno una vez: `npm run migrar:ingresos --prefix backend -- --aplicar` (sin `--aplicar` solo muestra qué cambiaría).
   Si la base tiene alumnos sin plan (de antes de la HU 11), asignales el plan "Mensual" una vez: `npm run migrar:planes --prefix backend -- --aplicar` (no toca los vencimientos).
3. Abrí **dos terminales**:
   - `npm run dev:backend` → API en http://localhost:3000 (se reinicia sola al guardar).
   - `npm run dev:frontend` → app en **http://localhost:5173** (se recarga sola al guardar).

En desarrollo, Vite reenvía `/api` y `/socket.io` al backend, así que el frontend nunca usa URLs absolutas.

Para probar como en producción: `npm run build` y después `npm start` → todo en http://localhost:3000.

La app abre en el **Inicio** (`/ingresar`): ingresá con el email y la contraseña del administrador.

## Reglas de negocio

- Cada alumno tiene un **plan de cuota** (obligatorio): nombre, duración en meses o días, precio y días de aviso.
- Meses = mes calendario (31/1 + 1 mes = 28/2); días = días fijos (semanal = 7).
- Pago tarde: el período cuenta desde el día del pago. Pago adelantado: se suma al vencimiento actual.
- Cambiar el plan al editar se aplica desde el próximo pago; al registrar el pago se puede elegir otro plan.
- Los planes no se borran: se desactivan. Con un plan desactivado no se puede dar de alta ni cobrar.
- Estado: **Vencido** si el vencimiento ya pasó; **Por vencer** si faltan tantos días o menos como el aviso del plan (3 en el Mensual); si no, **Al día**.
- "Registrar pago" usa la fecha de hoy y el plan del alumno (se pueden cambiar), pide el medio de pago y recalcula el vencimiento.
- Cada pago queda en el historial con monto (precio del plan), medio y quién lo registró. Administración puede anular el último pago de un alumno: el vencimiento vuelve al anterior y el pago queda tachado, no se borra.
- Las fechas se guardan a medianoche UTC y se muestran en formato argentino (dd/mm/aaaa).
- Las fotos se achican en el navegador (máx. 400 px) y se guardan en MongoDB, en la colección `fotos`.
- Cada ingreso guarda el `_id` del alumno (y el DNI de ese día): corregir el DNI de un alumno no le hace perder sus ingresos.

## Roles

| Puede… | Recepción | Administración |
|---|---|---|
| Panel, Ingresos, Pagos | ✔ | ✔ |
| Ver, crear y editar alumnos; registrar pagos y fotos | ✔ | ✔ |
| Ver el historial de pagos | ✔ | ✔ |
| Anular el último pago de un alumno | — | ✔ |
| Elegir el plan de un alumno y ver los precios | ✔ | ✔ |
| Ajustes → Planes: crear, editar, activar/desactivar planes | — | ✔ |
| Eliminar alumnos | — | ✔ |
| Estadísticas | — | ✔ |
| Ajustes → Personal: crear, editar, activar/desactivar cuentas y cambiar contraseñas | — | ✔ |

Las cuentas no se borran: se desactivan. Contraseña mínima: 8 caracteres. La sesión dura 12 horas.
Nadie puede cambiar su propio rol ni desactivarse, y siempre queda al menos un administrador activo.

## API

Todas las rutas `/api` piden sesión, salvo login y logout. Sin sesión → **401**; sin permiso → **403**.

| Método | Ruta | Qué hace |
|---|---|---|
| POST | `/api/auth/login` | Iniciar sesión (`email, password`); deja la cookie `sesion` |
| POST | `/api/auth/logout` | Cerrar sesión (borra la cookie) |
| GET | `/api/auth/yo` | Usuario de la sesión actual |
| GET | `/api/alumnos` | Lista de alumnos (orden: apellido, nombre) |
| POST | `/api/alumnos` | Crear alumno (`nombre, apellido, dni, email, fechaPago, plan, medio`); registra el primer pago |
| GET | `/api/alumnos/dni/:dni` | Buscar por DNI |
| PUT | `/api/alumnos/:id` | Editar alumno (`plan` opcional; el vencimiento cambia solo si cambia la fecha de pago) |
| DELETE | `/api/alumnos/:id` | Eliminar alumno (y su foto) — **solo administración** |
| POST | `/api/alumnos/:id/pago` | Registrar pago (`medio` obligatorio; `fechaPago` y `plan` opcionales: por defecto hoy y su plan) |
| GET | `/api/alumnos/:id/pagos` | Historial de pagos del alumno (incluye los anulados) |
| POST | `/api/pagos/:id/anular` | Anular el último pago del alumno (solo administración) |
| GET / PUT / DELETE | `/api/alumnos/:id/foto` | Ver / subir (`imagen` en base64) / quitar foto |
| GET | `/api/ingresos` | Lista de ingresos (más recientes primero) |
| POST | `/api/ingresos` | Registrar ingreso (`dni`); devuelve también el alumno |
| GET | `/api/planes` | Planes de cuota (cualquier rol) |
| POST | `/api/planes` | Crear plan (`nombre, duracion: { cantidad, unidad }, precio, diasAviso`) — **solo administración** |
| PUT | `/api/planes/:id` | Editar plan (mismos campos + `activo`) — **solo administración** |
| GET | `/api/usuarios` | Cuentas del personal — **solo administración** (igual que las tres siguientes) |
| POST | `/api/usuarios` | Crear cuenta (`nombre, email, rol, password`) |
| PUT | `/api/usuarios/:id` | Editar cuenta (`nombre, email, rol, activo`) |
| PUT | `/api/usuarios/:id/password` | Poner una contraseña nueva (`password`) |
| GET | `/healthz` | Estado del servidor y de la base (503 si la base no responde) |

Los errores siempre vuelven como JSON: `{ "error": "mensaje para mostrar" }`.

## Deploy en Render (un solo servicio)

1. Subí este repo a GitHub (privado).
2. En Render: **New → Web Service** → elegí el repo.
3. Configuración:
   - **Build Command:** `npm run build`
   - **Start Command:** `npm start`
   - **Health Check Path:** `/healthz`
   - **Environment:** `MONGO_URI` = tu URI de Atlas (secreto), `JWT_SECRET` = una clave larga y distinta de la de desarrollo (secreto), `NODE_ENV` = `production` (activa la cookie `Secure`) y `NODE_VERSION` = `22`
   - **Plan:** uno pago (Starter) para que el servicio no se "duerma". El gratuito se apaga tras 15 min sin uso y tarda en despertar.
> **Por qué el build usa `--include=dev`:** con `NODE_ENV=production`, `npm ci` saltea las devDependencies, y `vite` es una devDependency del frontend. Sin ese flag el build falla con `vite: not found` (exit 127). La variable se deja igual porque en ejecución activa la cookie `Secure`.

4. Primer administrador: en Render → **Shell**, con `ADMIN_NOMBRE`, `ADMIN_EMAIL` y `ADMIN_PASSWORD` cargadas como variables, corré `npm run seed:admin --prefix backend`. Después podés borrar esas tres variables. Si la base de producción es otra y tiene ingresos viejos, corré también `npm run migrar:ingresos --prefix backend -- --aplicar` y `npm run migrar:planes --prefix backend -- --aplicar`.
5. En MongoDB Atlas → **Network Access**: permití las IP de salida de Render (aparecen en el panel del servicio, en *Connect → Outbound*) o, si no, `0.0.0.0/0` con un usuario de base con contraseña fuerte.

### Publicar una actualización

Hacé commit y `git push` a la rama principal: Render vuelve a compilar y publica solo. Si algo falla, el deploy anterior sigue funcionando.
