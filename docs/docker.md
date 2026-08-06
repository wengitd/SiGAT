# Docker: entornos de desarrollo y producción

## Contextos Docker

- **Local (Docker Desktop):** `docker context use default`
- **Remoto (motor Linux por SSH):** `docker context use void-server`

Los bind mounts de desarrollo (`./backend`, `./frontend`) solo funcionan contra el motor local.
No ejecutes `docker compose` (dev) contra `void-server` desde Windows: las rutas del host no son válidas en Linux.

Postgres incluye `init.sql` en la imagen (`database/Dockerfile`); no hay bind mount de `./database`.
El init de Postgres solo corre con un volumen de datos vacío. Si el primer arranque falló y el esquema no se aplicó, elimina el volumen nombrado y vuelve a subir el stack.

## Producción

Imágenes inmutables (sin bind mounts de código). Solo persiste `postgres_data`.
Archivo: `docker-compose.prod.yml`.

Local:

```bash
docker context use default
docker compose -f docker-compose.prod.yml up --build -d
```

Remoto (`void-server`):

```bash
docker context use void-server
docker compose -f docker-compose.prod.yml up --build -d
```

- UI: http://localhost:8080
- Health: http://localhost:8080/healthz
- API vía Nginx: http://localhost:8080/api/...

Detener:

```bash
docker compose -f docker-compose.prod.yml down
```

## Desarrollo

Hot reload con bind mounts. Único volumen de dependencias: `frontend_node_modules`.
Archivo por defecto: `docker-compose.yml` (no existe `docker-compose.dev.yml`).

```bash
docker context use default
docker compose up --build
```

- Vite: http://localhost:5173
- API: http://localhost:8000
- Postgres: puerto definido en `.env` (`POSTGRES_PORT`)

## Refrescar dependencias Node (dev)

```bash
docker context use default
docker compose build frontend
docker volume rm sigat-main_frontend_node_modules
docker compose up -d frontend
```

## Notas

- Producción no publica puertos de backend ni Postgres.
- En desarrollo no se monta volumen de `__pycache__`; se desactiva bytecode con `PYTHONDONTWRITEBYTECODE=1`.
- Frontend usa `pnpm`; backend instala con `uv` dentro de la imagen.
