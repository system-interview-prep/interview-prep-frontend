# syntax=docker/dockerfile:1.7
#
# Production image for INTERVIA (Next.js 16, pnpm 11, output: "standalone").
#
#   docker build \
#     --build-arg NEXT_PUBLIC_API_URL=https://api.phongvan.app \
#     --build-arg NEXT_PUBLIC_SOCKET_URL=https://api.phongvan.app \
#     --build-arg NEXT_PUBLIC_GOOGLE_CLIENT_ID=<client-id> \
#     -t intervia-frontend .
#   docker run -p 3000:3000 intervia-frontend
#
# NEXT_PUBLIC_* values are inlined into the browser bundle at build time,
# so each environment (local, production) needs its own image.

# pnpm 11 needs Node >= 22.13; CI also runs on Node 24.
# Debian (glibc), not Alpine: the traced sharp binary is linux-x64 glibc.
ARG NODE_IMAGE=node:24-bookworm-slim

FROM ${NODE_IMAGE} AS deps
WORKDIR /app
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile --store-dir /pnpm/store

FROM deps AS build
ARG NEXT_PUBLIC_API_URL=http://localhost:5000
ARG NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
ARG NEXT_PUBLIC_GOOGLE_CLIENT_ID=
ARG NEXT_PUBLIC_RAG_API_URL=
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_SOCKET_URL=$NEXT_PUBLIC_SOCKET_URL \
    NEXT_PUBLIC_GOOGLE_CLIENT_ID=$NEXT_PUBLIC_GOOGLE_CLIENT_ID \
    NEXT_PUBLIC_RAG_API_URL=$NEXT_PUBLIC_RAG_API_URL \
    NEXT_TELEMETRY_DISABLED=1
COPY . .
RUN pnpm build

FROM ${NODE_IMAGE} AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    NEXT_TELEMETRY_DISABLED=1
# The standalone folder carries server.js and only the node_modules it needs;
# static assets and public/ are served by the same server.
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:3000/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]
CMD ["node", "server.js"]
