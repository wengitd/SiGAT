# Docker: entornos de desarrollo y producción

## Producción

Imágenes inmutables (sin bind mounts de código). Solo persiste `postgres_data`.

```bash
docker compose up --build -d
```

- UI: http://localhost:8080
- Health: http://localhost:8080/healthz
- API vía Nginx: http://localhost:8080/api/...

## Desarrollo

Hot reload con bind mounts. Único volumen de dependencias: `frontend_node_modules`.

```bash
docker compose -f docker-compose.dev.yml up --build
```

- Vite: http://localhost:5173
- API: http://localhost:8000
- Postgres: puerto definido en `.env` (`POSTGRES_PORT`)

## Refrescar dependencias Node (dev)

```bash
docker compose -f docker-compose.dev.yml build frontend
docker volume rm sigat-main_frontend_node_modules
docker compose -f docker-compose.dev.yml up -d frontend
```

## Notas

- Producción no publica puertos de backend ni Postgres.
- En desarrollo no se monta volumen de `__pycache__`; se desactiva bytecode con `PYTHONDONTWRITEBYTECODE=1`.
- Frontend usa `pnpm`; backend instala con `uv` dentro de la imagen.
