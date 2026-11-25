# Graph Report - track-activities  (2026-11-24)

## Corpus Check
- 111 files · ~558,474 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 624 nodes · 908 edges · 34 communities (27 shown, 7 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 37 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ebe2a271`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- userController.ts
- index.ts
- devDependencies
- dependencies
- dependencies
- options
- ActivityListComponent
- compilerOptions
- AuthService
- compilerOptions
- Frontend — Documento de arquitectura
- devDependencies
- UserAdminComponent
- Track Activities Backend - AWS Serverless
- tsconfig.app.json
- ActivityFormComponent
- ProjectListComponent
- Activity.ts
- Project.ts
- Role.ts
- environment.prod.ts
- Follow Activities
- Backend — Documento funcional
- Frontend — Documento funcional
- Backend — Documento de arquitectura
- dashboardController.ts
- User
- user.service.ts
- app.config.ts
- app.routes.ts
- VPC Configuration for Lambda
- navbar.component.ts

## God Nodes (most connected - your core abstractions)
1. `AuthService` - 18 edges
2. `ActivityListComponent` - 18 edges
3. `compilerOptions` - 18 edges
4. `UserAdminComponent` - 17 edges
5. `User` - 17 edges
6. `Project` - 16 edges
7. `ProjectService` - 15 edges
8. `UserService` - 14 edges
9. `ActivitiesReportComponent` - 12 edges
10. `Track Activities Backend - AWS Serverless` - 12 edges

## Surprising Connections (you probably didn't know these)
- `ActivityFormComponent` --references--> `Project`  [EXTRACTED]
  frontend/src/app/features/activities/activity-form/activity-form.component.ts → frontend/src/app/shared/models/index.ts
- `ActivityEntry` --references--> `Activity`  [EXTRACTED]
  frontend/src/app/features/activities/activity-list/activity-list.component.ts → frontend/src/app/shared/models/index.ts
- `ActivityListComponent` --references--> `User`  [EXTRACTED]
  frontend/src/app/features/activities/activity-list/activity-list.component.ts → frontend/src/app/shared/models/index.ts
- `ProjectListComponent` --references--> `Project`  [EXTRACTED]
  frontend/src/app/features/projects/project-list.component.ts → frontend/src/app/shared/models/index.ts
- `ActivitiesReportComponent` --references--> `User`  [EXTRACTED]
  frontend/src/app/features/reports/activities-report/activities-report.component.ts → frontend/src/app/shared/models/index.ts

## Import Cycles
- None detected.

## Communities (34 total, 7 thin omitted)

### Community 0 - "userController.ts"
Cohesion: 0.06
Nodes (56): app, isServerlessRuntime, jsonParser, limiter, pool, poolConfig, createActivity(), createActivityValidation (+48 more)

### Community 1 - "index.ts"
Cohesion: 0.06
Nodes (19): ActivityFilters, DashboardService, Injectable, ProjectService, Injectable, DashboardComponent, Component, TeamReportComponent (+11 more)

### Community 2 - "devDependencies"
Cohesion: 0.09
Nodes (23): devDependencies, ts-node, tsx, @types/aws-lambda, @types/bcryptjs, @types/cors, @types/express, @types/express-validator (+15 more)

### Community 3 - "dependencies"
Cohesion: 0.07
Nodes (29): @angular/animations, @angular/cdk, @angular/common, @angular/compiler, @angular/core, @angular/forms, @angular/platform-browser, @angular/platform-browser-dynamic (+21 more)

### Community 4 - "dependencies"
Cohesion: 0.06
Nodes (32): dependencies, bcryptjs, @codegenie/serverless-express, cors, dotenv, esbuild, express, express-rate-limit (+24 more)

### Community 5 - "options"
Cohesion: 0.05
Nodes (43): build, serve, builder, configurations, defaultConfiguration, options, development, production (+35 more)

### Community 6 - "ActivityListComponent"
Cohesion: 0.12
Nodes (9): ActivityService, Injectable, ActivityEntry, ActivityIndicators, ActivityListComponent, MonthGroup, Component, UserGroup (+1 more)

### Community 7 - "compilerOptions"
Cohesion: 0.07
Nodes (26): angularCompilerOptions, enableI18nLegacyMessageIdFormat, strictInjectionParameters, strictInputAccessModifiers, strictTemplates, compileOnSave, compilerOptions, baseUrl (+18 more)

### Community 8 - "AuthService"
Cohesion: 0.20
Nodes (5): AuthService, Injectable, AuthResponse, LoginRequest, RegisterRequest

### Community 9 - "compilerOptions"
Cohesion: 0.12
Nodes (15): compilerOptions, esModuleInterop, forceConsistentCasingInFileNames, module, outDir, resolveJsonModule, rootDir, skipLibCheck (+7 more)

### Community 10 - "Frontend — Documento de arquitectura"
Cohesion: 0.05
Nodes (37): 10. Decisiones y límites, 11. Diagramas relacionados, 1. Resumen ejecutivo, 2. Patrón arquitectónico, 3. Estructura de carpetas, 4. Componentes, 5. Gestión de estado, 6. Routing y seguridad UI (+29 more)

### Community 11 - "devDependencies"
Cohesion: 0.07
Nodes (26): @angular/cli, @angular/compiler-cli, @angular-devkit/build-angular, autoprefixer, devDependencies, @angular/cli, @angular/compiler-cli, @angular-devkit/build-angular (+18 more)

### Community 13 - "Track Activities Backend - AWS Serverless"
Cohesion: 0.09
Nodes (21): Architecture, Cleanup, CORS errors, Cost Optimization, Database Setup, Deployment to AWS, Differences from Traditional Server, Environment Variables (+13 more)

### Community 14 - "tsconfig.app.json"
Cohesion: 0.20
Nodes (9): compilerOptions, outDir, types, extends, files, include, src/**/*.d.ts, src/main.ts (+1 more)

### Community 23 - "Follow Activities"
Cohesion: 0.12
Nodes (16): Activities (Protected), API Endpoints, Authentication, Backend, Dashboard (Protected), Database, Environment Variables, Features (+8 more)

### Community 24 - "Backend — Documento funcional"
Cohesion: 0.12
Nodes (16): 1. Propósito, 2. Actores y autorización, 3. Catálogo de endpoints, 4. Reglas de negocio, 5. Modelo de datos (funcional), 6. Flujos funcionales principales, 7. Errores típicos, 8. Operación (+8 more)

### Community 25 - "Frontend — Documento funcional"
Cohesion: 0.12
Nodes (16): 1. Propósito, 2. Actores y perfiles, 3.1 Autenticación, 3.2 Actividades, 3.3 Proyectos, 3.4 Dashboard KPI, 3.5 Reportes, 3.6 Usuarios (+8 more)

### Community 26 - "Backend — Documento de arquitectura"
Cohesion: 0.14
Nodes (14): 10. Diagramas relacionados, 1. Resumen ejecutivo, 2. Patrón arquitectónico, 3. Estructura, 4. Componentes runtime, 5. Despliegue (SAM), 6. Integraciones, 7. Observabilidad (+6 more)

### Community 27 - "dashboardController.ts"
Cohesion: 0.35
Nodes (10): hoursByProject(), hoursByRole(), hoursByTeam(), parsePeriod(), Period, getHoursByProject(), getHoursByRole(), getHoursByTeam() (+2 more)

### Community 28 - "User"
Cohesion: 0.20
Nodes (3): Injectable, UserService, User

### Community 29 - "user.service.ts"
Cohesion: 0.29
Nodes (5): UpdateUserRequest, RegisterComponent, Component, Role, UserProfile

### Community 30 - "app.config.ts"
Cohesion: 0.31
Nodes (5): AppComponent, Component, appConfig, routes, authInterceptor()

### Community 31 - "app.routes.ts"
Cohesion: 0.31
Nodes (4): authGuard(), profileGuard(), LoginComponent, Component

### Community 32 - "VPC Configuration for Lambda"
Cohesion: 0.25
Nodes (7): 1. Get Private Subnet IDs, 2. Get RDS Security Group ID, Architecture, Deploy Command, Important Notes, Required Information Before Deployment, VPC Configuration for Lambda

### Community 33 - "navbar.component.ts"
Cohesion: 0.29
Nodes (4): LayoutComponent, Component, NavbarComponent, Component

## Knowledge Gaps
- **255 isolated node(s):** `name`, `version`, `description`, `main`, `build` (+250 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `ActivityListComponent` connect `ActivityListComponent` to `User`, `app.routes.ts`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **Why does `UserAdminComponent` connect `UserAdminComponent` to `User`, `user.service.ts`, `app.routes.ts`?**
  _High betweenness centrality (0.010) - this node is a cross-community bridge._
- **Why does `User` connect `User` to `index.ts`, `navbar.component.ts`, `ActivityListComponent`, `AuthService`, `UserAdminComponent`, `user.service.ts`?**
  _High betweenness centrality (0.009) - this node is a cross-community bridge._
- **What connects `name`, `version`, `description` to the rest of the system?**
  _255 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `userController.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.058738738738738736 - nodes in this community are weakly interconnected._
- **Should `index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06448087431693988 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.08695652173913043 - nodes in this community are weakly interconnected._