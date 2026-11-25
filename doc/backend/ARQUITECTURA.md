# Backend — Documento de arquitectura

**Producto:** Follow Activities API  
**Stack:** Node.js 20, Express 4, TypeScript 5.5, PostgreSQL (`pg`), JWT (`jsonwebtoken`), bcryptjs, AWS SAM + Lambda + HTTP API + Secrets Manager + RDS

## 1. Resumen ejecutivo

El backend es un monolito Express tipado con doble entrada: proceso HTTP local (`server.ts`) y handler Lambda (`lambda.ts` + `@codegenie/serverless-express`). La persistencia es PostgreSQL (RDS en AWS).

Diagramas:

- [Arquitectura del sistema](../diagramas/01-arquitectura-sistema.html)
- [Despliegue AWS](../diagramas/02-despliegue-aws.html)
- [Capas backend](../diagramas/04-arquitectura-backend.html)
- [ERD](../diagramas/05-erd-modelo-datos.html)

## 2. Patrón arquitectónico

Capas clásicas **Route → Middleware → Controller → (Service) → SQL**:

| Capa | Ubicación | Rol |
|------|-----------|-----|
| Entry | `server.ts`, `lambda.ts` | Arranque / adaptador cloud |
| App | `app.ts` | CORS, rate limit, body parse, mount rutas |
| Routes | `routes/*` | Wiring HTTP + políticas |
| Middleware | `middleware/*` | JWT, validación |
| Controllers | `controllers/*` | Orquestación request/response + SQL o service |
| Services | `services/*` | Auth y agregaciones dashboard |
| Models | `models/*` | Tipos TypeScript (no ORM) |
| Config | `config/database.ts` | Pool `pg` |

No hay ORM: SQL parametrizado directo.

## 3. Estructura

```
backend/
  src/
    app.ts
    server.ts
    lambda.ts
    config/database.ts
    controllers/
    middleware/
    models/
    routes/
    services/
  migrations/
  template.yaml          # SAM
  samconfig.toml
  README-SERVERLESS.md
  VPC-SETUP.md
```

## 4. Componentes runtime

### Dual runtime

1. **Local:** `tsx watch src/server.ts` escucha `PORT` (3000).
2. **AWS:** `lambda.handler` inicializa serverless-express una vez (warm start).

Adaptaciones serverless en `app.ts`:

- `trust proxy` cuando corre en Lambda
- Parseo de body ya materializado por API Gateway
- Strip del prefijo de stage (`/dev`) para mantener rutas `/api/...`

### Seguridad

- JWT Bearer; secreto desde env / Secrets Manager
- Perfiles en claim; gates `requireAdministrator`
- Rate limiting 100/15min
- CORS configurable
- bcrypt 12 rounds

### Datos

- Pool: max 10 local / max 2 en Lambda
- SSL opcional (`DB_SSL`), `rejectUnauthorized` configurable
- Migraciones SQL incrementales 001–004

## 5. Despliegue (SAM)

Recursos principales en `template.yaml`:

| Recurso | Tipo | Notas |
|---------|------|-------|
| `HttpApi` | `AWS::Serverless::HttpApi` | Stage = Environment |
| `ApiFunction` | `AWS::Serverless::Function` | nodejs20.x, 512 MB, 30 s, VPC |
| `LambdaSecurityGroup` | EC2 SG | ENI Lambda |
| `LambdaToRDSIngress` | SG Ingress | 5432 desde Lambda SG |
| `JWTSecret` | Secrets Manager | string 64 chars |

Flujo: **Internet → HTTP API → Lambda (subnet privada) → RDS :5432**.

Build: Metadata `esbuild` entry `src/lambda.ts` → handler `lambda.handler`.

Comandos: `npm run deploy` / `deploy:guided`.

**Nota de seguridad:** el template contiene parámetros sensibles por defecto; deben rotarse y no versionarse en claro (ver `doc/MEJORAS.md`).

## 6. Integraciones

| Sistema | Uso |
|---------|-----|
| PostgreSQL/RDS | Persistencia |
| Secrets Manager | `JWT_SECRET` |
| API Gateway HTTP | Front door público |
| VPC / SG | Aislamiento Lambda↔RDS |

No hay colas, bus de eventos ni Cognito: auth es JWT propia.

## 7. Observabilidad

- `console.error` en errores globales y pool
- `/health` para liveness básica
- Sin X-Ray/OpenTelemetry cableado en código

## 8. Testing

No hay suite de pruebas automatizadas en `backend/package.json` (solo build/dev/deploy). Recomendado en mejoras.

## 9. Decisiones clave

- Express reutilizado en Lambda (menor reescritura, cold start + VPC).
- Controllers con SQL directo → velocidad de entrega, menor abstracción.
- Roles N:M (`user_roles`) separados del **perfil** de autorización (`Operator`/`Administrator`).
- Export Excel ocurre en el front; el API solo entrega JSON.

## 10. Diagramas relacionados

- [Secuencia login](../diagramas/06-secuencia-login.html)
- [Dataflow](../diagramas/08-dataflow-actividades.html)
- Documento funcional: [FUNCIONAL.md](./FUNCIONAL.md)
