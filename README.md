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
│   ├── scripts/        # crearAdmin.js (seed del primer administrador)
│   └── src/
│       ├── config/      # db.js, auth.js (JWT y cookie)
│       ├── middlewares/ # auth.js: requireAuth, requireRol
│       ├── dao/models/  # Alumno, Ingreso, Foto, Usuario
│       └── routes/      # auth.router.js, alumnos.router.js, ingresos.router.js
├── frontend/           # React
│   └── src/
│       ├── pages/       # Inicio, Panel, Ingresos, Alumnos, Pagos, Estadísticas
│       ├── components/  # Layout, RutaProtegida, formularios, ui
│       ├── context/     # sesión (AuthContext), datos compartidos y avisos
│       ├── hooks/       # useAuth
│       └── lib/         # api, permisos, fechas, imágenes
```

## Trabajar en tu computadora

Requisito: Node 22.12 o superior.

1. Copiá `backend/.env.example` a `backend/.env` y completá `MONGO_URI`, `JWT_SECRET` y los datos del primer administrador (`ADMIN_NOMBRE`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` de 8 caracteres o más). El `.env.example` explica cómo generar `JWT_SECRET`.
2. Instalá dependencias (una sola vez): `npm install --prefix backend` y `npm install --prefix frontend`.
   Creá el primer administrador (una sola vez): `npm run seed:admin --prefix backend`.
3. Abrí **dos terminales**:
   - `npm run dev:backend` → API en http://localhost:3000 (se reinicia sola al guardar).
   - `npm run dev:frontend` → app en **http://localhost:5173** (se recarga sola al guardar).

En desarrollo, Vite reenvía `/api` y `/socket.io` al backend, así que el frontend nunca usa URLs absolutas.

Para probar como en producción: `npm run build` y después `npm start` → todo en http://localhost:3000.

La app abre en el **Inicio** (`/ingresar`): ingresá con el email y la contraseña del administrador.

## Reglas de negocio

- La cuota vence **30 días** después de la fecha de pago.
- Estado: **Vencido** si el vencimiento ya pasó; **Por vencer** si faltan 3 días o menos; si no, **Al día**.
- "Registrar pago" usa la fecha de hoy (se puede cambiar) y recalcula el vencimiento.
- Las fechas se guardan a medianoche UTC y se muestran en formato argentino (dd/mm/aaaa).
- Las fotos se achican en el navegador (máx. 400 px) y se guardan en MongoDB, en la colección `fotos`.

## Roles

| Puede… | Recepción | Administración |
|---|---|---|
| Panel, Ingresos, Pagos | ✔ | ✔ |
| Ver, crear y editar alumnos; registrar pagos y fotos | ✔ | ✔ |
| Eliminar alumnos | — | ✔ |
| Estadísticas | — | ✔ |

Las cuentas no se borran: se desactivan. Contraseña mínima: 8 caracteres. La sesión dura 12 horas.

## API

Todas las rutas `/api` piden sesión, salvo login y logout. Sin sesión → **401**; sin permiso → **403**.

| Método | Ruta | Qué hace |
|---|---|---|
| POST | `/api/auth/login` | Iniciar sesión (`email, password`); deja la cookie `sesion` |
| POST | `/api/auth/logout` | Cerrar sesión (borra la cookie) |
| GET | `/api/auth/yo` | Usuario de la sesión actual |
| GET | `/api/alumnos` | Lista de alumnos (orden: apellido, nombre) |
| POST | `/api/alumnos` | Crear alumno (`nombre, apellido, dni, email, fechaPago`) |
| GET | `/api/alumnos/dni/:dni` | Buscar por DNI |
| PUT | `/api/alumnos/:id` | Editar alumno |
| DELETE | `/api/alumnos/:id` | Eliminar alumno (y su foto) — **solo administración** |
| POST | `/api/alumnos/:id/pago` | Registrar pago (`fechaPago` opcional, por defecto hoy) |
| GET / PUT / DELETE | `/api/alumnos/:id/foto` | Ver / subir (`imagen` en base64) / quitar foto |
| GET | `/api/ingresos` | Lista de ingresos (más recientes primero) |
| POST | `/api/ingresos` | Registrar ingreso (`dni`); devuelve también el alumno |
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
4. Primer administrador: en Render → **Shell**, con `ADMIN_NOMBRE`, `ADMIN_EMAIL` y `ADMIN_PASSWORD` cargadas como variables, corré `npm run seed:admin --prefix backend`. Después podés borrar esas tres variables.
5. En MongoDB Atlas → **Network Access**: permití las IP de salida de Render (aparecen en el panel del servicio, en *Connect → Outbound*) o, si no, `0.0.0.0/0` con un usuario de base con contraseña fuerte.

### Publicar una actualización

Hacé commit y `git push` a la rama principal: Render vuelve a compilar y publica solo. Si algo falla, el deploy anterior sigue funcionando.
