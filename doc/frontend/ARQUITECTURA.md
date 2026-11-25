# Frontend — Documento de arquitectura

**Producto:** Follow Activities (SPA Angular)  
**Stack:** Angular 19 standalone, TypeScript ~5.6, Tailwind CSS 3.4, Chart.js 4 / ng2-charts 8, RxJS 7.8

## 1. Resumen ejecutivo

El frontend es una SPA que consume la API REST del backend. No calcula reglas de negocio ni KPIs: orquesta pantallas, guarda la sesión JWT en el navegador y presenta datos.

Diagrama principal: [Arquitectura frontend](../diagramas/03-arquitectura-frontend.html)  
Contexto de sistema: [Arquitectura del sistema](../diagramas/01-arquitectura-sistema.html)

## 2. Patrón arquitectónico

- **SPA feature-based** con componentes **standalone**.
- Capas lógicas:
  1. **Presentation** — `features/*` y `shared/components/*`
  2. **Application/core** — guards, interceptor, services HTTP
  3. **Models** — DTOs tipados en `shared/models`
- Flujo de datos unidireccional: UI → Service → HttpClient → API → Observable → UI.

## 3. Estructura de carpetas

```
frontend/src/
  app/
    core/
      guards/          auth.guard, profile.guard
      interceptors/    auth.interceptor
      services/        auth, activity, project, user, dashboard
    features/
      auth/            login, register
      activities/      list, form
      projects/        list, team-report
      dashboard/
      reports/         activities-report, project-cost-report
      users/           user-admin
    shared/
      components/      layout, navbar
      models/          index.ts
    app.routes.ts
    app.config.ts
  environments/        environment.ts | environment.prod.ts
```

## 4. Componentes

| Componente | Responsabilidad |
|------------|-----------------|
| `AppComponent` | Host de `router-outlet` |
| `LayoutComponent` | Shell autenticado (navbar + outlet) |
| `NavbarComponent` | Menú contextual por perfil + logout |
| `LoginComponent` | Autenticación |
| `RegisterComponent` | Alta de usuario (admin) |
| `ActivityListComponent` | Listado, filtros, Excel, indicadores |
| `ActivityFormComponent` | Alta/edición de actividad |
| `ProjectListComponent` | Catálogo de proyectos |
| `TeamReportComponent` | Horas por miembro de proyecto |
| `DashboardComponent` | KPIs Chart.js (equipo/proyecto/rol) |
| `ActivitiesReportComponent` | Reporte mensual de horas |
| `ProjectCostReportComponent` | Reporte de costos |
| `UserAdminComponent` | Administración de usuarios |

Árbol: [Árbol de componentes](../diagramas/07-arbol-componentes-frontend.html).

## 5. Gestión de estado

- **Sin store global** (no NgRx/Akita).
- Sesión: `localStorage` keys `auth_token` y `auth_user` vía `AuthService`.
- Estado de pantalla: propiedades de componente + señales/flags locales (`loading`, filtros, charts).
- Datos remotos: Observables RxJS por llamada HTTP.

## 6. Routing y seguridad UI

- Rutas definidas en `app.routes.ts`.
- `authGuard`: exige token; si no, `/login`.
- `profileGuard`: exige perfiles en `route.data.profiles`; si no cumple, redirige a `/activities`.
- Wildcard `**` → `/dashboard` (puede rebotar a activities si no es admin por el guard del destino).

## 7. Servicios e integración

| Servicio | Endpoints típicos |
|----------|-------------------|
| `AuthService` | `POST /auth/login`, `POST /auth/register` |
| `ActivityService` | `GET/POST/PUT/DELETE /activities` |
| `ProjectService` | `GET/POST /projects`, reportes |
| `UserService` | CRUD `/users`, roles, password |
| `DashboardService` | `/dashboard/hours-by-*` |

`authInterceptor` adjunta `Authorization: Bearer …`.

## 8. Estilado y UI

- Tailwind CSS (utility-first).
- Tipografía/colores por utilidades (azul `blue-600` en navegación activa).
- Charts: `ng2-charts` + Chart.js barras.
- Logo Cirrus en `assets/cirrus-logo.png`.

## 9. Build y despliegue

| Comando | Uso |
|---------|-----|
| `npm start` | `ng serve` → `:4200` |
| `npm run build` | build producción Angular |
| `npm test` | Karma/unit (configurado en Angular CLI) |

El artefacto estático debe publicarse en hosting web (no hay IaC de front en el repo). En prod, `environment.prod.ts` apunta al HTTP API de AWS.

## 10. Decisiones y límites

- Export Excel en cliente (XML) — acoplado al navegador, sin worker.
- JWT en `localStorage` — susceptible a XSS; no hay refresh token.
- Textos de UI en inglés; documentación de producto en español.
- No hay lazy loading de rutas (todos los componentes importados eagerly).

## 11. Diagramas relacionados

- [Despliegue AWS (API)](../diagramas/02-despliegue-aws.html)
- [Login sequence](../diagramas/06-secuencia-login.html)
- [Dataflow actividades](../diagramas/08-dataflow-actividades.html)
