# Graph Report - frontend  (2026-11-24)

## Corpus Check
- 37 files · ~13,830 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 401 nodes · 671 edges · 20 communities (16 shown, 4 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 4 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ebe2a271`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- app.routes.ts
- index.ts
- activity-list.component.ts
- follow-activities
- dependencies
- devDependencies
- compilerOptions
- ActivityFormComponent
- ActivityListComponent
- DashboardComponent
- NavbarComponent
- options
- ProjectListComponent
- UserAdminComponent
- tsconfig.app.json
- app.config.ts
- TimerService
- environment.prod.ts

## God Nodes (most connected - your core abstractions)
1. `ActivityListComponent` - 25 edges
2. `Project` - 21 edges
3. `AuthService` - 19 edges
4. `ProjectService` - 19 edges
5. `User` - 19 edges
6. `compilerOptions` - 18 edges
7. `ProjectListComponent` - 17 edges
8. `UserAdminComponent` - 17 edges
9. `UserService` - 15 edges
10. `ActivityFormComponent` - 15 edges

## Surprising Connections (you probably didn't know these)
- `ActivityFormComponent` --references--> `Project`  [EXTRACTED]
  src/app/features/activities/activity-form/activity-form.component.ts → src/app/shared/models/index.ts
- `ActivityEntry` --references--> `Activity`  [EXTRACTED]
  src/app/features/activities/activity-list/activity-list.component.ts → src/app/shared/models/index.ts
- `ActivityListComponent` --references--> `Activity`  [EXTRACTED]
  src/app/features/activities/activity-list/activity-list.component.ts → src/app/shared/models/index.ts
- `ActivityListComponent` --references--> `User`  [EXTRACTED]
  src/app/features/activities/activity-list/activity-list.component.ts → src/app/shared/models/index.ts
- `ProjectListComponent` --references--> `Project`  [EXTRACTED]
  src/app/features/projects/project-list.component.ts → src/app/shared/models/index.ts

## Import Cycles
- None detected.

## Communities (20 total, 4 thin omitted)

### Community 0 - "app.routes.ts"
Cohesion: 0.07
Nodes (14): authGuard(), ProjectService, Injectable, TeamReportComponent, Component, ActivitiesReportComponent, Component, ProjectCostReportComponent (+6 more)

### Community 1 - "index.ts"
Cohesion: 0.09
Nodes (17): profileGuard(), AuthService, Injectable, Injectable, UpdateUserRequest, UserService, LoginComponent, Component (+9 more)

### Community 2 - "activity-list.component.ts"
Cohesion: 0.10
Nodes (14): Pipe, ActivityFilters, ActivityService, Injectable, ActivityCalendarComponent, Component, ActivityEntry, ActivityIndicators (+6 more)

### Community 3 - "follow-activities"
Cohesion: 0.07
Nodes (30): build, serve, builder, configurations, defaultConfiguration, development, production, buildTarget (+22 more)

### Community 4 - "dependencies"
Cohesion: 0.07
Nodes (29): @angular/animations, @angular/cdk, @angular/common, @angular/compiler, @angular/core, @angular/forms, @angular/platform-browser, @angular/platform-browser-dynamic (+21 more)

### Community 5 - "devDependencies"
Cohesion: 0.07
Nodes (26): @angular/cli, @angular/compiler-cli, @angular-devkit/build-angular, autoprefixer, devDependencies, @angular/cli, @angular/compiler-cli, @angular-devkit/build-angular (+18 more)

### Community 6 - "compilerOptions"
Cohesion: 0.07
Nodes (26): dom, ES2022, angularCompilerOptions, enableI18nLegacyMessageIdFormat, strictInjectionParameters, strictInputAccessModifiers, strictTemplates, compileOnSave (+18 more)

### Community 7 - "ActivityFormComponent"
Cohesion: 0.13
Nodes (6): CollaborationService, Injectable, ActivityFormComponent, Component, ActivityAttachment, ActivityComment

### Community 9 - "DashboardComponent"
Cohesion: 0.17
Nodes (7): CompareRow, DashboardRange, DashboardService, Injectable, DashboardComponent, Component, DashboardData

### Community 10 - "NavbarComponent"
Cohesion: 0.17
Nodes (5): LayoutComponent, Component, NavbarComponent, Component, AppNotification

### Community 11 - "options"
Cohesion: 0.15
Nodes (13): options, assets, browser, index, outputPath, polyfills, scripts, styles (+5 more)

### Community 14 - "tsconfig.app.json"
Cohesion: 0.20
Nodes (9): src/**/*.d.ts, src/main.ts, ./tsconfig.json, compilerOptions, outDir, types, extends, files (+1 more)

### Community 15 - "app.config.ts"
Cohesion: 0.31
Nodes (5): AppComponent, Component, appConfig, routes, authInterceptor()

### Community 16 - "TimerService"
Cohesion: 0.32
Nodes (3): TimerService, TimerState, Injectable

## Knowledge Gaps
- **93 isolated node(s):** `$schema`, `version`, `newProjectRoot`, `projectType`, `style` (+88 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `ActivityListComponent` connect `ActivityListComponent` to `app.routes.ts`, `index.ts`, `activity-list.component.ts`?**
  _High betweenness centrality (0.063) - this node is a cross-community bridge._
- **Why does `User` connect `index.ts` to `app.routes.ts`, `activity-list.component.ts`, `ActivityListComponent`, `NavbarComponent`, `ProjectListComponent`, `UserAdminComponent`?**
  _High betweenness centrality (0.044) - this node is a cross-community bridge._
- **Why does `UserAdminComponent` connect `UserAdminComponent` to `app.routes.ts`, `index.ts`?**
  _High betweenness centrality (0.037) - this node is a cross-community bridge._
- **What connects `$schema`, `version`, `newProjectRoot` to the rest of the system?**
  _93 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `app.routes.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06862745098039216 - nodes in this community are weakly interconnected._
- **Should `index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08653061224489796 - nodes in this community are weakly interconnected._
- **Should `activity-list.component.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0962566844919786 - nodes in this community are weakly interconnected._