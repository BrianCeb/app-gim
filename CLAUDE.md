# GimnasioApp — Contexto para Claude Code

## Qué es este proyecto

Aplicación web para administrar un gimnasio chico (el de la tía de Brian): alumnos, cuotas, ingresos por DNI y estadísticas. La usa el personal desde la recepción o el celular, entrando a **un solo enlace web**.

También es el **proyecto final de la carrera** de Brian y su hermano, que lo presentan en equipo ante tribunal en:

- **Programación 3** (4/12/2026): código React + Node + MongoDB, hooks y custom hooks.
- **Arquitectura y diseño de interfaces** (3/12/2026): las pantallas Inicio, Dashboard (Panel) y Pagos son el prototipo de la materia.
- **Práctica Profesionalizante III + Gestión de proyectos** (semana del 7/12/2026): se trabaja con Scrum y Jira.

Por eso, además de que funcione, **los dos tienen que poder explicar cada decisión y cada línea**.

## Documentos de referencia

- `DOCUMENTACION.md`: documentación técnica completa (arquitectura, modelo de datos, API, decisiones). Es la referencia principal; leerla antes de proponer cambios.
- `README.md`: guía rápida de uso, API y deploy.
- Si algo de estos documentos no coincide con el código real, **avisar antes de decidir**.

## Stack y arquitectura

- Backend: Node ≥ 22.12, Express 5, Mongoose 8, Socket.io 4, dotenv, ES Modules.
- Frontend: React 19, Vite, React Router 7, Tailwind CSS 4, Recharts, lucide-react.
- Base de datos: MongoDB Atlas.
- Express sirve la API (`/api/...`) y el frontend compilado (`frontend/dist`) bajo la misma URL. El frontend usa rutas relativas: sin CORS ni URL de backend configurada.
- Socket.io solo avisa cambios; los datos siempre viajan por la API REST.
- Hosting previsto: Render, un único Web Service con health check en `/healthz`.

No cambiar de framework, librería o versión sin justificarlo y sin aprobación de Brian.

## Reglas de negocio vigentes

- La cuota vence 30 días después de la fecha de pago (se va a reemplazar por planes de cuota en la HU 11).
- Estados: vencido (fecha pasada), por vencer (3 días o menos), al día (más de 3 días).
- DNI único, se guarda solo con números, entre 6 y 9 dígitos.
- Fechas de pago guardadas a medianoche UTC; se muestran en formato `es-AR`. Ingresos en hora de Argentina.
- No inventar reglas de negocio (prórrogas, pagos parciales, bloqueos): preguntar a Brian.

## Seguridad (obligatorio)

- Nunca escribir credenciales, la `MONGO_URI` ni contraseñas en código, logs, commits o prompts.
- No leer ni modificar `backend/.env`. Si hace falta una variable nueva, decir cuál y actualizar `.env.example`.
- `.env` debe seguir en `.gitignore`.
- Los secretos en producción se cargan como variables del hosting.

## Alcance actual (backlog en Jira, clave GA)

Ya hecho (incremento previo): HU 1 a 8 (alumnos, foto, pagos, ingresos por DNI, estadísticas).

Pendiente:

| HU | Historia | Sprint |
|---|---|---|
| 9 | Login con rol (administración o recepción) | 1 |
| 10 | Gestión de cuentas del personal | 1 |
| — | Tarea técnica: vincular ingresos al alumno por `ObjectId` en vez de DNI | 1 |
| 11 | Planes de cuota con precio (el vencimiento depende del plan) | 2 |
| 12 | Registro de cada pago con monto y medio de pago (historial) | 2 |
| 13 | Recaudación por mes | 3 |
| 14 | Exportar alumnos y pagos a Excel | 3 |

También: custom hooks (Sprint 2) y tests con Vitest + Supertest (Sprint 3).

No agregar funcionalidades fuera de este backlog sin preguntar. La paginación no es prioridad.

## Forma de trabajo

1. Antes de editar, mostrar un plan numerado de archivos a crear o modificar y esperar el OK.
2. Trabajar **de a un archivo por vez**. Después de cada uno, explicar en 3 a 5 líneas qué hace y por qué, y cómo verificarlo (comando, request de Postman o acción en pantalla). No seguir hasta que Brian confirme.
3. Mantener el estilo del código existente: nombres en español, ES Modules, validación en cliente y en servidor, errores con formato `{ "error": "mensaje" }`.
4. Una rama por historia: `GA-<número>-<descripcion-corta>`. Commits chicos con la clave de Jira al principio del mensaje. **No hacer push ni merge sin preguntar.**
5. No afirmar que algo funciona sin haberlo probado.
6. Al terminar una historia, listar las preguntas que podría hacer el tribunal sobre esa parte, con respuestas cortas.