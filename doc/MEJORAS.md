# Mejoras propuestas — Follow Activities

Documento de backlog orientado a **usabilidad** y **funcionalidades adicionales**, derivado del análisis del código (frontend Angular 19 + backend Express/Lambda) en el commit `ebe2a2711ea9672526fd99bed730c895a5b53377`.

Prioridad sugerida: **P0** inmediato / riesgo, **P1** alto valor, **P2** evolutivo.

---

## 1. Usabilidad

### 1.1 Idioma y copy (P0)

- La UI está en inglés (*My activities*, *Logout*, *Failed to load…*) mientras el producto y la documentación se comunican en español (Perú).
- **Mejora:** unificar textos a español (o i18n `es-PE` / `en` con selector).
- **Impacto:** reduce fricción del usuario final y soporte.

### 1.2 Navegación móvil (P1)

- Navbar horizontal densa con muchos enlaces admin; sin menú hamburguesa ni colapso responsive explícito.
- **Mejora:** drawer/menú colapsable &lt;768px; agrupar *Reports* / *Project Costs* en un submenú.

### 1.3 Feedback de formularios (P1)

- Errores de API suelen ser un `message` genérico; poco mapeo campo a campo en pantallas.
- **Mejora:** mostrar errores por campo (horas, email, fechas), toasts de éxito al guardar/eliminar, confirmación modal antes de delete.

### 1.4 Listado de actividades (P1) — MVP en `feat/mejoras-mvp`

- Filtros, agrupación e indicadores en una sola vista muy cargada.
- **Mejora:**
  - Persistencia de filtros en query string (compartibles/bookmark). ✅
  - Paginación o virtual scroll si el volumen crece. ✅ (paginación cliente)
  - Empty states con CTA “Registrar primera actividad”. ✅
  - Skeleton loaders en lugar de solo flag `loading`. ✅

### 1.5 Dashboard (P1) — MVP en `feat/mejoras-mvp`

- Tres charts sin drill-down ni tooltips contextuales ricos.
- **Mejora:** clic en barra → filtrar actividades; selector de rango custom (no solo week/month); totales resumidos arriba de cada chart. ✅

### 1.6 Accesibilidad (P2)

- Revisar contraste, `aria-label` en iconos/botones, foco visible, orden de tabulación en formularios.
- Etiquetas asociadas a inputs en todos los forms.

### 1.7 Sesión y seguridad percibida (P0/P1)

- JWT en `localStorage` sin refresh ni aviso de expiración.
- **Mejora:** aviso “sesión por expirar”, logout automático en 401 del interceptor, considerar `sessionStorage` o cookies httpOnly (con cambios de API).

### 1.8 Fechas (P1) — MVP en `feat/mejoras-mvp`

- Alinear presentación a `dd/mm/aaaa` (Perú) en listados y reportes; hoy depende del input `date` del navegador. ✅ (`fechaPe` pipe)

### 1.9 Onboarding (P2)

- Primera vez: tour corto (crear proyecto → registrar actividad → ver reporte) y página de ayuda / FAQ.

---

## 2. Funcionalidades adicionales

### 2.1 Seguridad y operaciones (P0)

| Mejora | Detalle |
|--------|---------|
| Rotar secretos | Eliminar passwords/defaults sensibles del `template.yaml`; usar Secrets Manager / SSM también para DB |
| Política de contraseñas | Longitud, complejidad, bloqueo tras N intentos |
| Reset password | Flujo “olvidé mi contraseña” por correo |
| Auditoría | Tabla `audit_log` (quién editó/eliminó actividad/usuario) |
| Hardening CORS | Evitar `*` en producción; origins explícitos |

### 2.2 Productividad del operador (P1) — MVP en `feat/mejoras-mvp`

- **Plantillas / copia de actividad** del día anterior. ✅
- **Carga masiva** CSV/Excel de horas. ✅ (CSV)
- **Recordatorio** de días sin registro (opcional, feature flag). ✅ (`REMINDERS_ENABLED`)
- **Timer** o marcador de inicio/fin de tarea (genera horas al cerrar). ✅ (localStorage)

### 2.3 Gestión de proyectos (P1) — MVP en `feat/mejoras-mvp`

- Editar/archivar proyectos (hoy create + list; status poco explotado en UI). ✅
- Asignación de miembros a proyecto (hoy cualquier usuario puede imputar a cualquier proyecto). ✅
- Presupuesto de horas/costo vs real. ✅

### 2.4 Reportes y analytics (P1) — MVP en `feat/mejoras-mvp`

- Filtros multi-proyecto y exportación server-side (XLSX real) para datasets grandes. ✅ (sync exceljs)
- Comparativo periodo vs periodo. ✅
- Vista calendario de actividades. ✅
- API de exportación con job asíncrono si el volumen lo requiere. ❌ (fuera de MVP; sync only)

### 2.5 Roles y permisos (P1)

- Hoy: perfil binario Operator/Administrator + roles “de trabajo” (developer, etc.) sin permisos finos.
- **Mejora:** matriz de permisos (p. ej. Manager ve su equipo; no todo el tenant).
- Separar claramente “perfil de acceso” vs “rol laboral” en la UI.

### 2.6 Calidad de ingeniería (P1)

- Tests unitarios/integración API (Vitest/Jest + DB de prueba).
- Tests E2E (Playwright) de login → alta actividad → reporte.
- CI (lint, test, build) en GitHub Actions.
- Lazy loading de rutas Angular.
- OpenAPI/Swagger generado desde rutas o contratos.

### 2.7 Observabilidad (P2)

- Structured logging + correlation id.
- Métricas CloudWatch (latencia, 4xx/5xx, cold starts).
- Alarmas de error rate y RDS connections.

### 2.8 Frontend hosting (P2)

- IaC para SPA (S3 + CloudFront) alineado al backend SAM.
- Pipeline de deploy front + invalidación CDN.

### 2.9 Colaboración (P2) — MVP local en `feat/mejoras-mvp`

- Comentarios en actividades. ✅
- Adjuntos (evidencias) en S3 con URL prefirmada. ⚠️ MVP: disco local `backend/uploads/` (no durable en Lambda)
- Notificaciones in-app (sin spam de correo salvo opt-in). ✅

---

## 3. Roadmap sugerido (90 días)

| Fase | Enfoque | Entregables |
|------|---------|-------------|
| **Días 1–30** | Riesgo + UX base | Secretos fuera del repo, español UI, 401→logout, confirmaciones delete, filtros en URL |
| **Días 31–60** | Valor negocio | Asignación a proyectos, edit/archive proyectos, reportes con rango custom, tests API críticos |
| **Días 61–90** | Escala | Permisos Manager, export server-side, hosting front IaC, observabilidad básica |

---

## 4. Relación con diagramas actuales

Al implementar mejoras mayores, actualizar:

- [Arquitectura sistema](./diagramas/01-arquitectura-sistema.html)
- [Despliegue AWS](./diagramas/02-despliegue-aws.html)
- [Dataflow](./diagramas/08-dataflow-actividades.html)
- Docs `frontend/*` y `backend/*`
