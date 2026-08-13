# Guidelines for AI Assistants

- **Package Manager**: Always use `pnpm` instead of `npm` for all frontend package operations and build scripts.
- **Python**: Always use `uv` for backend package operations.
- **Convenciones completas**: ver [`docs/CONVENTIONS.md`](docs/CONVENTIONS.md) (arquitectura, dependencias, MUI, checklist).

## Backend — FastAPI (dominio-first)

El backend vive en `backend/app/`:

- `core/` — config, database, security, exceptions, middleware (no importa módulos de negocio)
- `modules/<dominio>/` — `router.py`, `schemas.py`, `models.py`, `service.py` (+ `repository.py` solo si las queries son densas)
- `shared/` — utilidades transversales (eliminación, schemas comunes)
- Dependencias: `router` → `service` → `repository` → `models`
- Entrypoint: `app.main:app` (`uvicorn app.main:app`)
- Tests: `backend/tests/` con `pytest` (PYTHONPATH=backend)

## Frontend — feature-first + MUI v9

El frontend vive en `frontend/src/`:

- `app/` — shell (`App.jsx`, `routes.jsx` única fuente de rutas/nav, layout)
- `core/` — http (axios), auth, dialog, theme (no importa features)
- `shared/` — UI/util sin dominio
- `features/<dominio>/` — `pages/`, `components/`, `hooks/`, `api.js` (+ `config/` si aplica)
- Dependencias: `page/component` → `hooks` → `api.js` → `core/http`
- Las páginas **nunca** importan `axiosClient` directamente
- Entrypoint: `src/main.jsx` → `app/App.jsx`
- Lint: `pnpm lint` (ESLint flat config)

The frontend uses `@mui/material` **v9**. Prefer the slots API; do not use removed/legacy component props.

- Style or configure nested parts with `slots` / `slotProps` (camelCase), never `PaperProps`, `BackdropProps`, `TransitionComponent`, `components`, `componentsProps`, or mistyped `SlotProps`.
- Examples:
  - `Drawer` / `Dialog` paper: `slotProps={{ paper: { sx: { … } } }}`
  - Custom transition: `slots={{ transition: MyTransition }}`
  - TextField adornments / input attrs: `slotProps={{ input: {…}, htmlInput: {…}, inputLabel: {…} }}`
- When adding or editing MUI components, check the installed types under `node_modules/@mui/material/<Component>` if unsure whether a prop still exists.
