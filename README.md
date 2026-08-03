# SiGAT - Sistema de Gestión de Activos Tecnológicos

Proyecto de título - Forestal Leonera - 2026

## Stack

- Backend: Python + FastAPI
- Frontend: React + Vite
- BD: PostgreSQL 16
- Contenedores: Docker + Docker Compose
- Paquetes: `pnpm` (frontend), `uv` (backend)

## Requisitos

1. Clonar el repositorio
2. Copiar `.env.example` a `.env` y completar valores
3. Tener Docker Desktop en ejecución

## Producción (inmutable)

Levanta Nginx (frontend estático), FastAPI y PostgreSQL.
Solo se publica el puerto del frontend; el backend y la BD quedan en la red interna.
El único volumen nombrado es `postgres_data`.

```bash
docker compose up --build -d
```

- Aplicación: http://localhost:8080
- Healthcheck Nginx: http://localhost:8080/healthz
- API (vía proxy): http://localhost:8080/api/health

Detener:

```bash
docker compose down
```

## Desarrollo (hot reload)

Bind-mount del código fuente. El volumen `frontend_node_modules` evita que el mount oculte las dependencias instaladas en la imagen. No se usa volumen de `__pycache__` (`PYTHONDONTWRITEBYTECODE=1`).

```bash
docker compose -f docker-compose.dev.yml up --build
```

- Frontend (Vite): http://localhost:5173
- Backend (FastAPI): http://localhost:8000
- Docs API: http://localhost:8000/docs
- PostgreSQL: localhost:${POSTGRES_PORT}

Detener:

```bash
docker compose -f docker-compose.dev.yml down
```

## Actualizar dependencias del frontend

Tras cambiar `package.json` / `pnpm-lock.yaml` en desarrollo:

```bash
docker compose -f docker-compose.dev.yml build frontend
docker volume rm sigat-main_frontend_node_modules
docker compose -f docker-compose.dev.yml up -d frontend
```

## Limpieza de volúmenes (sin borrar datos de Postgres de producción)

Solo el volumen de `node_modules` de desarrollo:

```bash
docker compose -f docker-compose.dev.yml down
docker volume rm sigat-main_frontend_node_modules
```

Borrar también la BD de desarrollo (cuidado: pierde datos):

```bash
docker compose -f docker-compose.dev.yml down -v
```

Borrar la BD de producción (cuidado: pierde datos):

```bash
docker compose down -v
```

## Frontend local (sin Docker)

1. Instalar Node.js 20+ (incluye Corepack)
2. Ir a `frontend`
3. `pnpm install`
4. `pnpm run dev`
5. Abrir http://localhost:5173

## Backend local (sin Docker)

1. Crear entorno con `uv venv` en la raíz del proyecto
2. `uv pip install -r backend/requirements.txt`
3. Ejecutar Uvicorn desde `backend` con las variables de `.env`
