# Backend — Documento funcional

**Producto:** Follow Activities API  
**Ubicación:** `backend/`  
**Versión analizada:** commit `ebe2a2711ea9672526fd99bed730c895a5b53377`

## 1. Propósito

API REST que autentica usuarios, persiste actividades/proyectos y expone agregaciones para dashboard y reportes. Corre en local con Express o en AWS Lambda detrás de API Gateway (SAM).

## 2. Actores y autorización

| Perfil JWT | Alcance funcional |
|------------|-------------------|
| **Operator** | Login; CRUD limitado a **crear** y **leer** sus propias actividades; listar/leer proyectos |
| **Administrator** | Todo lo anterior + editar/eliminar cualquier actividad; CRUD usuarios; crear proyectos; dashboard; reportes de equipo/actividades/costos |

Middleware: `authenticate` (Bearer JWT) + `requireAdministrator` / `requireProfiles`.

Registro de usuarios: `POST /api/auth/register` exige Administrator (no hay signup público).

## 3. Catálogo de endpoints

### Salud

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/health` | No | Estado del servicio |

### Auth (`/api/auth`)

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/login` | No | Credenciales → `{ token, user }` |
| POST | `/register` | Admin | Alta de usuario (+ roles opcionales) |

### Usuarios (`/api/users`) — todo Admin

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/` | Listado |
| GET | `/:id` | Detalle |
| POST | `/` | Crear |
| PUT | `/:id` | Actualizar datos/perfil/costo |
| POST | `/:id/roles` | Asignar roles N:M |
| PUT | `/:id/password` | Cambiar contraseña |
| DELETE | `/:id` | Eliminar |

### Roles (`/api/roles`)

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/` | Sí | Catálogo de roles (`admin`, `manager`, `developer`, `designer`, …) |

### Proyectos (`/api/projects`)

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/` | Sí | Listado |
| GET | `/:id` | Sí | Detalle |
| POST | `/` | Admin | Crear |
| GET | `/cost-report` | Admin | Costos por proyecto/usuario |
| GET | `/:id/team-report` | Admin | Horas por miembro |
| GET | `/:id/activities-report` | Admin | Horas por usuario/mes |

### Actividades (`/api/activities`)

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/` | Sí | Lista (Operator: propias; Admin: todas + `user_id`, fechas) |
| GET | `/:id` | Sí | Detalle (Operator solo propias) |
| POST | `/` | Sí | Crear para el usuario autenticado |
| PUT | `/:id` | Admin | Actualizar |
| DELETE | `/:id` | Admin | Eliminar |

Query filters: `user_id`, `start_date`, `end_date`.

### Dashboard (`/api/dashboard`) — Admin

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/hours-by-team` | Agregado por equipo/usuario |
| GET | `/hours-by-project` | Agregado por proyecto |
| GET | `/hours-by-role` | Agregado por rol |

Query: `period` (`week` \| `month`).

## 4. Reglas de negocio

1. Login solo si `users.status = 'A'`.
2. Password hasheado con bcrypt (12 rounds); nunca se expone `password_hash`.
3. JWT incluye `id`, `email`, `profile`; caducidad por defecto 7 días (`JWT_EXPIRES_IN`).
4. Operator no puede editar/borrar actividades ni administrar usuarios.
5. Validación de entrada con `express-validator` en altas/ediciones críticas.
6. Rate limit global: 100 req / 15 min.
7. CORS según `CORS_ORIGIN`.
8. Costos de reporte usan `users.cost_per_hour` (y columnas históricas en `activities` según migraciones).

## 5. Modelo de datos (funcional)

Entidades: **users**, **roles**, **user_roles**, **projects**, **activities**.

Campos clave de actividad: `hours`, `tasks`, `activity_date`, `project_id`, `user_id`.

Diagrama: [ERD modelo de datos](../diagramas/05-erd-modelo-datos.html).

## 6. Flujos funcionales principales

1. **Login** → token → llamadas autenticadas ([secuencia](../diagramas/06-secuencia-login.html)).
2. **Registrar actividad** → INSERT con `user_id` del token.
3. **Consultar KPIs** → agregaciones SQL por periodo.
4. **Reporte de costos** → horas × tarifa.

Flujo agregado: [Dataflow actividades](../diagramas/08-dataflow-actividades.html).

## 7. Errores típicos

| HTTP | Situación |
|------|-----------|
| 400 | Validación / JSON inválido |
| 401 | Sin token, token inválido, perfil inválido |
| 403 | Perfil insuficiente |
| 404 | Ruta desconocida |
| 429 | Rate limit |
| 500 | Error interno / JWT no configurado |

Cuerpo habitual: `{ "message": "…" }`.

## 8. Operación

- Local: `npm run dev` → `:3000`
- Migraciones: `backend/migrations/001` … `004` vía `psql`
- AWS: `npm run deploy` (SAM) — ver documento de arquitectura
