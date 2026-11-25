# Frontend — Documento funcional

**Producto:** Follow Activities (SPA)  
**Ubicación:** `frontend/`  
**Versión analizada:** commit `ebe2a2711ea9672526fd99bed730c895a5b53377`

## 1. Propósito

Aplicación web para registrar, consultar y analizar horas de trabajo por proyecto. Permite a operadores cargar sus actividades y a administradores gestionar usuarios, proyectos, KPIs y reportes de costo.

## 2. Actores y perfiles

| Perfil | Quién es | Qué puede hacer en la UI |
|--------|----------|--------------------------|
| **Operator** | Colaborador de proyecto | Login, ver/crear sus actividades, listar proyectos |
| **Administrator** | Administrador del sistema | Todo lo del Operator + editar/eliminar actividades, dashboard KPI, reportes, costos, administración de usuarios y alta de proyectos |

La autorización de pantallas se aplica con `authGuard` (sesión) y `profileGuard` (perfiles en `data.profiles`).

## 3. Funcionalidades por módulo

### 3.1 Autenticación

- **Login** (`/login`): email + contraseña → JWT + datos de usuario en `localStorage`.
- **Logout**: limpia sesión y redirige a login.
- **Registro de usuarios** (`/users/new`): solo Administrator; no hay auto-registro público.

### 3.2 Actividades

- **Listado** (`/activities`):
  - Operator: solo sus actividades.
  - Administrator: todas, con filtro opcional por usuario.
  - Filtros por rango de fechas (`start_date` / `end_date`).
  - Agrupación e indicadores en pantalla.
  - Exportación a Excel (generada en el cliente).
- **Alta** (`/activities/new`): proyecto, horas, tareas, fecha de actividad.
- **Edición** (`/activities/:id/edit`): solo Administrator.

### 3.3 Proyectos

- **Listado** (`/projects`): consulta de proyectos; alta restringida a Administrator.
- **Reporte de equipo** (`/projects/:id/team-report`): horas por integrante (Administrator).

### 3.4 Dashboard KPI

Ruta `/dashboard` (Administrator). Tres gráficos de barras (Chart.js):

1. Horas por equipo  
2. Horas por proyecto  
3. Horas por rol  

Periodo seleccionable: semana / mes (vía API).

### 3.5 Reportes

| Ruta | Contenido |
|------|-----------|
| `/reports/activities` | Horas por proyecto / usuario / mes |
| `/reports/project-costs` | Horas × `cost_per_hour` por usuario y proyecto |

Ambos con descarga Excel en cliente.

### 3.6 Usuarios

- Listado y administración (`/users`): CRUD, roles, cambio de contraseña, costo por hora.
- Alta vía formulario de registro administrativo.

## 4. Navegación (mapa)

```
/login
/
  ├─ /activities (+ /new, /:id/edit)
  ├─ /projects (+ /:id/team-report)
  ├─ /dashboard              [Administrator]
  ├─ /reports/activities     [Administrator]
  ├─ /reports/project-costs  [Administrator]
  └─ /users (+ /new)         [Administrator]
```

Diagrama de componentes: [Árbol de componentes frontend](../diagramas/07-arbol-componentes-frontend.html).

## 5. Reglas de negocio visibles en UI

1. Sin token → redirección a `/login`.
2. Rutas admin sin perfil Administrator → bloqueo por `profileGuard`.
3. Navbar oculta enlaces admin si el usuario no es Administrator.
4. Fechas de actividad y filtros se envían a la API; el front no calcula KPIs ni costos (los recibe del backend).
5. Export Excel es presentación local de datos ya filtrados/cargados.

## 6. Estados de interfaz

| Estado | Comportamiento típico |
|--------|------------------------|
| Cargando | Flags `loading` en listados/dashboard |
| Error | Mensajes en pantalla (p. ej. fallo de carga del dashboard) |
| Vacío | Listados sin filas tras filtros |
| Sesión inválida | Interceptor/guards derivan a login |

## 7. Textos e idioma

- Interfaz actual mayormente en inglés (etiquetas Navbar: *My activities*, *Dashboard*, *Logout*).
- Formato de fechas dependiente del navegador / inputs HTML date.

## 8. Integración

- Base URL API: `environment.apiUrl`  
  - Dev: `http://localhost:3000/api`  
  - Prod: API Gateway `…/dev/api`
- Cabecera `Authorization: Bearer <token>` vía `authInterceptor`.

## 9. Diagramas relacionados

- [Arquitectura frontend](../diagramas/03-arquitectura-frontend.html)
- [Secuencia de login](../diagramas/06-secuencia-login.html)
- [Flujo de datos actividades](../diagramas/08-dataflow-actividades.html)
