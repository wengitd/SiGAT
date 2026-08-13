# syntax=docker/dockerfile:1

# --- Base: dependencias Node ---
FROM node:22-alpine AS base

RUN corepack enable && corepack prepare pnpm@10 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

# --- Desarrollo: Vite con HMR ---
FROM base AS development

COPY . .

EXPOSE 5173

CMD ["pnpm", "run", "dev", "--", "--host", "0.0.0.0"]

# --- Builder: compila el frontend para produccion ---
FROM base AS builder

COPY . .

ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

ARG VITE_SESSION_WARNING_MINUTES=5
ENV VITE_SESSION_WARNING_MINUTES=${VITE_SESSION_WARNING_MINUTES}

ARG VITE_SESSION_IDLE_MINUTES=30
ENV VITE_SESSION_IDLE_MINUTES=${VITE_SESSION_IDLE_MINUTES}

RUN test -n "$VITE_API_URL" || (echo "ERROR: VITE_API_URL build arg is required" && exit 1)

RUN pnpm build

# --- Produccion: Nginx sirve el dist estatico ---
FROM nginxinc/nginx-unprivileged:1.27-alpine AS production

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx/default.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/healthz >/dev/null || exit 1

USER nginx

CMD ["nginx", "-g", "daemon off;"]
