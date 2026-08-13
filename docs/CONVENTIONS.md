# Convenciones SiGAT

Documento de prácticas y reglas del monorepo **SiGAT** (Sistema de Gestión de Activos Tecnológicos).  
Fuente operativa para el equipo y para asistentes de IA. El resumen corto para agentes vive en [`AGENTS.md`](../AGENTS.md).

---

## 1. Principios generales

| Principio | Aplicación en SiGAT |
|-----------|---------------------|
| **KISS / YAGNI** | Sin Clean Architecture estricta, sin Feature-Sliced Design completo, sin TypeScript/React Query hasta que duela de verdad. |
| **Dominio primero** | Carpetas por dominio de negocio, no por tipo de archivo (`routes/`, `models/`, `pages/`, …). |
| **Dependencias unidireccionales** | Las capas internas no conocen las externas; el “core” no importa módulos/features de negocio. |
| **Capa HTTP delgada** | Routers (backend) y pages (frontend) orquestan; la lógica vive en services / hooks / api. |
| **DRY con sentido** | Extraer solo cuando se reutiliza o el archivo se vuelve un “God file”. |
| **Un cambio, un foco** | No mezclar migración de carpetas + TypeScript + nueva feature en el mismo PR. |

### Stack y herramientas

| Área | Herramienta | Regla |
|------|-------------|--------|
| Frontend paquetes | **pnpm** | Nunca `npm` / `yarn` para instalar o scripts. Solo `pnpm-lock.yaml`. |
| Backend paquetes | **uv** | Preferir `uv` frente a `pip` suelto. |
| Frontend UI | **MUI v9** | Solo API `slots` / `slotProps` (ver §4). |
| Backend API | **FastAPI + SQLAlchemy 2 + Pydantic v2** | Settings con `pydantic-settings`. |
| BD | **PostgreSQL 16** | Schema en `database/init.sql` + `database/migrations/` (SQL). **Sin Alembic** por ahora. |
| Contenedores | **Docker Compose** | Dev: `docker-compose.yml`. Prod: `docker-compose.prod.yml`. |

### Idioma

- **Documentación y comentarios de código:** español.
- **Commits:** Conventional Commits (inglés o español, pero tipo `feat:`, `fix:`, etc.).
- **Código / identificadores:** inglés o español según el dominio existente; **consistente dentro del módulo**.

---

## 2. Estructura del monorepo

```
SiGAT-main/
├── backend/          # API FastAPI (paquete app/)
├── frontend/         # SPA React + Vite
├── database/         # init.sql + migraciones SQL + imagen Postgres
├── docs/             # Documentación de proyecto (este archivo)
├── AGENTS.md         # Reglas cortas para asistentes
├── README.md         # Cómo levantar el sistema
├── docker-compose.yml
└── docker-compose.prod.yml
```

**Alineación de dominios** (mismo vocabulario en API y UI):

| Backend `modules/` | Frontend `features/` |
|--------------------|----------------------|
| `activos` | `inventario` |
| `auth` | `auth` |
| `empleados` | `empleados` |
| `catalogos` | `catalogos` |
| `licencias` | `licencias` |
| `asignaciones` | `asignaciones` |
| `checklist` | `checklist` |
| `facturas` | `facturas` |
| `dashboard` | `dashboard` |
| `usuarios` | `usuarios` |
| `solicitudes_baja` | `solicitudes-baja` |
| `trazabilidad` | `trazabilidad` |
| `historial` | (vía activos / trazabilidad) |
| org (dpto/empresa) | `organizacion` |

---

## 3. Backend — FastAPI (dominio-first)

### 3.1 Árbol objetivo

```
backend/
├── app/
│   ├── main.py                 # Factory FastAPI + include_router
│   ├── bootstrap.py
│   ├── core/                   # Transversal; NO importa modules.*
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── security.py
│   │   ├── dependencies.py
│   │   ├── exceptions.py
│   │   └── middleware.py
│   ├── modules/
│   │   └── <dominio>/
│   │       ├── router.py
│   │       ├── schemas.py
│   │       ├── models.py
│   │       ├── service.py
│   │       ├── repository.py   # Solo si las queries son densas
│   │       └── dependencies.py # Opcional, deps del módulo
│   └── shared/                 # Utilidades entre módulos (sin HTTP)
├── tests/
├── pyproject.toml
├── requirements.txt
└── Dockerfile
```

Entrypoint: `uvicorn app.main:app` (WORKDIR Docker = `backend/`).  
Shim opcional: `backend/main.py` reexporta `app` por compatibilidad.

### 3.2 Regla de dependencias

```
router → service → repository → models
         ↘ schemas
router / service → core  (config, db, security, exceptions)
core ↛ modules.*
```

- `main.py` es el **único** lugar que conoce e incluye todos los routers de módulos.
- `core/` no importa ningún módulo de negocio.
- Catálogos CRUD simples: agrupar en `modules/catalogos/` (no una carpeta por tabla).

### 3.3 Responsabilidad por archivo

| Archivo | Debe | No debe |
|---------|------|---------|
| `router.py` | HTTP, `Depends`, status codes, llamar a `service` | Reglas de negocio, queries largas |
| `schemas.py` | Pydantic v2 (`Create` / `Update` / `Out`) | Lógica de BD |
| `models.py` | SQLAlchemy 2.0 ORM | Validación de API |
| `service.py` | Reglas, orquestación, transacciones | Detalle de routing HTTP |
| `repository.py` | Acceso a datos denso/reutilizable | Reglas de negocio |
| `core/config.py` | Settings tipados (env) | Lógica de dominio |
| `shared/` | Helpers transversales (p. ej. eliminación) | Endpoints |

### 3.4 Repository: cuándo sí / cuándo no

- **Sí:** activos, dashboard, trazabilidad (joins/aggregations densas).
- **No (YAGNI):** CRUD de catálogos (marca, cargo, planta…); la query puede vivir en `service` o en el router delgado si es trivial — preferible `service`.

### 3.5 Auth y seguridad

- JWT y hash en `core/security.py`.
- Guards de rol en `modules/auth/dependencies.py` (`get_current_user`, `require_admin`, `require_editor`).
- Excepciones de dominio en `core/exceptions.py` + handlers registrados en la factory.

### 3.6 Base de datos y migraciones

- Fuente de esquema: [`database/init.sql`](../database/init.sql) + [`database/migrations/`](../database/migrations/).
- No introducir Alembic salvo decisión explícita del equipo (ORM-first).
- Sesión: `get_db` en `core/database.py`; una sesión por request.

### 3.7 Tests backend

- Ubicación: `backend/tests/` (espejo por módulo bajo `tests/modules/`).
- Preferir tests de **service** sin HTTP para reglas críticas.
- `conftest.py` puede sobrescribir `get_db`.
- Ejecutar desde `backend` con `PYTHONPATH=.` y `pytest`.

### 3.8 Qué no hacer (backend)

- Big-bang de 27 routers en un solo commit sin verificar imports.
- Un `repository.py` por cada tabla de catálogo.
- Onion/Clean con entities/use-cases puros en un proyecto de título.
- Meter reglas de negocio en `router.py`.
- Que `core` importe `modules.*`.

---

## 4. Frontend — feature-first + MUI v9

### 4.1 Árbol objetivo

```
frontend/src/
├── main.jsx                    # Providers + mount
├── app/
│   ├── App.jsx                 # BrowserRouter (thin)
│   ├── routes.jsx              # ÚNICA fuente: path, roles, label, icon
│   └── layout/
│       ├── Layout.jsx
│       └── ProtectedRoute.jsx
├── core/                       # Transversal; NO importa features
│   ├── http/axiosClient.js
│   ├── auth/
│   ├── dialog/
│   └── theme/
├── shared/
│   ├── ui/                     # Componentes sin dominio
│   └── lib/                    # formatters, etc.
└── features/
    └── <dominio>/
        ├── pages/
        ├── components/
        ├── hooks/              # Opcional
        ├── api.js              # Única puerta HTTP del dominio
        └── config/             # Opcional (tablas declarativas)
```

Entrypoint: `src/main.jsx` → `app/App.jsx`.  
Lint: `pnpm lint` ([`frontend/eslint.config.js`](../frontend/eslint.config.js)).

### 4.2 Regla de dependencias

```
page / component → hooks → api.js → core/http (axiosClient)
page / component → shared/ui
page / component → core/auth | core/dialog
core ↛ features.*
shared ↛ features.*
```

- **Prohibido:** importar `axiosClient` desde `pages/` o `components/` de un feature.
- Toda llamada HTTP sale de `features/<dominio>/api.js`.
- Features no se importan entre sí salvo APIs públicas mínimas (p. ej. `empleados/api` para un select). Preferir consumir el `api.js` del dueño del dato.

### 4.3 Responsabilidad por archivo

| Pieza | Debe | No debe |
|-------|------|---------|
| `pages/*Page.jsx` | Orquestar estado UI, abrir diálogos, llamar hooks/api | URLs Axios, payloads HTTP crudos duplicados |
| `components/` | UI del dominio, props claras | Conocer rutas de otras features |
| `hooks/` | Estado/servidor del dominio | Llamar a axios directo |
| `api.js` | `get/post/put/delete` del dominio | JSX |
| `config/` | Tablas declarativas (p. ej. mantenedor `GRUPOS`) | Lógica de negocio |
| `app/routes.jsx` | path + roles + meta nav | Lógica de pantalla |
| `core/` | HTTP, JWT, theme, dialog global | Dominio de negocio |

### 4.4 Rutas y navegación

- **Una sola fuente:** [`frontend/src/app/routes.jsx`](../frontend/src/app/routes.jsx).
- `Layout` construye el sidebar con `buildNavItems(...)` a partir de esa tabla.
- No hardcodear paths de menú en el Layout aparte de `routes.jsx`.
- Roles: `ProtectedRoute` + campo `roles` en la ruta.

### 4.5 MUI v9 (obligatorio)

Usar **slots / `slotProps`** (camelCase). No usar props legacy:

- No: `PaperProps`, `BackdropProps`, `TransitionComponent`, `components`, `componentsProps`, `SlotProps` (mal tipado).
- Sí:
  - Paper de Dialog/Drawer: `slotProps={{ paper: { sx: { … } } }}`
  - Transición: `slots={{ transition: MyTransition }}`
  - TextField: `slotProps={{ input: {…}, htmlInput: {…}, inputLabel: {…} }}`

Si hay duda, revisar tipos en `node_modules/@mui/material/<Component>`.

### 4.6 Estado

- Auth y diálogos globales: Context en `core/`.
- Datos de pantalla: `useState` / hooks del feature.
- **No** introducir Redux, Zustand ni React Query en esta fase salvo decisión explícita.

### 4.7 Qué no hacer (frontend)

- Big-bang de 50 archivos sin `pnpm run build` verde.
- Feature-Sliced Design completo (`entities/`, `widgets/`, `processes/`).
- Un Context global por cada lista de la API.
- Duplicar rutas en App y en Layout.
- Migrar a TypeScript al mismo tiempo que se reorganizan carpetas.
- Volver a capas `pages/` + `services/` + `components/` planos para código nuevo.

---

## 5. Código nuevo (regla de oro)

A partir de ahora:

1. **Backend:** código nuevo en `backend/app/modules/<dominio>/` (o `core/` / `shared/` si es transversal).
2. **Frontend:** código nuevo en `frontend/src/features/<dominio>/` (o `app/` / `core/` / `shared/` si aplica).
3. Si un módulo legacy aún no migró del todo, el código nuevo **igual** sigue el patrón dominio-first; no ampliar el patrón antiguo.

---

## 6. Git y PRs

- Commits: Conventional Commits (`feat:`, `fix:`, `refactor:`, `docs:`, `chore:`, …).
- No commits de secretos (`.env`, credenciales).
- No `push --force` a `main`/`master`.
- PRs: descripción con resumen + plan de prueba; un dominio/feature por PR cuando sea posible.

---

## 7. Docker y entornos

- **Dev:** bind-mount de código; hot reload. Compose por defecto: `docker-compose.yml` (solo motor Docker local).
- **Prod:** imágenes inmutables; `docker-compose.prod.yml`; API detrás de Nginx en `/api`.
- Variables: plantilla en `.env.example`; no commitear `.env`.
- Frontend: `VITE_API_URL` en dev; en prod suele ir por proxy `/api`.

---

## 8. Checklist rápido (antes de merge)

**Backend**

- [ ] ¿El router está delgado y delega en `service`?
- [ ] ¿`core` sigue sin importar `modules`?
- [ ] ¿Schemas Pydantic y models ORM separados?
- [ ] ¿Migración SQL en `database/migrations/` si cambió el esquema?
- [ ] ¿Tests de reglas críticas si tocó lógica de negocio?

**Frontend**

- [ ] ¿La HTTP sale solo de `features/*/api.js`?
- [ ] ¿Ruta/nav añadidos en `app/routes.jsx` (no solo en Layout)?
- [ ] ¿MUI con `slots` / `slotProps`?
- [ ] ¿`pnpm run build` y `pnpm lint` OK?
- [ ] ¿Sin `package-lock.json` nuevo?

---

## 9. Referencias

| Documento | Rol |
|-----------|-----|
| [`AGENTS.md`](../AGENTS.md) | Resumen corto para asistentes |
| [`README.md`](../README.md) | Cómo levantar y operar |
| [`docs/docker.md`](docker.md) | Notas Docker |
| Backend entry | `backend/app/main.py` |
| Frontend entry | `frontend/src/main.jsx` |
| Rutas UI | `frontend/src/app/routes.jsx` |
