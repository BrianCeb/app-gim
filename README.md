# GimnasioApp

App web para administrar el gimnasio: alumnos, cuotas, ingresos por DNI y estadísticas.

- **Backend:** Node + Express 5 + MongoDB Atlas (Mongoose). Socket.io solo avisa cambios para que las pantallas abiertas se actualicen solas.
- **Frontend:** React + Vite + Tailwind CSS 4.
- **Una sola URL:** en producción, Express sirve la API (`/api/...`) y el frontend compilado (`frontend/dist`).

```
gimnasio-app/
├── package.json        # scripts para build/start de todo el proyecto (los usa Render)
├── backend/            # API Express
│   ├── server.js
│   ├── .env            # NO se sube a git (ver .env.example)
│   └── src/
│       ├── config/db.js
│       ├── dao/models/  # Alumno, Ingreso, Foto
│       └── routes/      # alumnos.router.js, ingresos.router.js
├── frontend/           # React
│   └── src/
│       ├── pages/       # Panel, Ingresos, Alumnos, Pagos, Estadísticas
│       ├── components/
│       ├── context/     # datos compartidos y avisos
│       └── lib/         # api, fechas, imágenes
```

## Trabajar en tu computadora

Requisito: Node 22.12 o superior.

1. Copiá `backend/.env.example` a `backend/.env` y poné tu `MONGO_URI` real.
2. Instalá dependencias (una sola vez): `npm install --prefix backend` y `npm install --prefix frontend`.
3. Abrí **dos terminales**:
   - `npm run dev:backend` → API en http://localhost:3000 (se reinicia sola al guardar).
   - `npm run dev:frontend` → app en **http://localhost:5173** (se recarga sola al guardar).

En desarrollo, Vite reenvía `/api` y `/socket.io` al backend, así que el frontend nunca usa URLs absolutas.

Para probar como en producción: `npm run build` y después `npm start` → todo en http://localhost:3000.

## Reglas de negocio

- La cuota vence **30 días** después de la fecha de pago.
- Estado: **Vencido** si el vencimiento ya pasó; **Por vencer** si faltan 3 días o menos; si no, **Al día**.
- "Registrar pago" usa la fecha de hoy (se puede cambiar) y recalcula el vencimiento.
- Las fechas se guardan a medianoche UTC y se muestran en formato argentino (dd/mm/aaaa).
- Las fotos se achican en el navegador (máx. 400 px) y se guardan en MongoDB, en la colección `fotos`.

## API

| Método | Ruta | Qué hace |
|---|---|---|
| GET | `/api/alumnos` | Lista de alumnos (orden: apellido, nombre) |
| POST | `/api/alumnos` | Crear alumno (`nombre, apellido, dni, email, fechaPago`) |
| GET | `/api/alumnos/dni/:dni` | Buscar por DNI |
| PUT | `/api/alumnos/:id` | Editar alumno |
| DELETE | `/api/alumnos/:id` | Eliminar alumno (y su foto) |
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
   - **Environment:** `MONGO_URI` = tu URI de Atlas (como secreto) y `NODE_VERSION` = `22`
   - **Plan:** uno pago (Starter) para que el servicio no se "duerma". El gratuito se apaga tras 15 min sin uso y tarda en despertar.
4. En MongoDB Atlas → **Network Access**: permití las IP de salida de Render (aparecen en el panel del servicio, en *Connect → Outbound*) o, si no, `0.0.0.0/0` con un usuario de base con contraseña fuerte.

### Publicar una actualización

Hacé commit y `git push` a la rama principal: Render vuelve a compilar y publica solo. Si algo falla, el deploy anterior sigue funcionando.
