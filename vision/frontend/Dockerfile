# Context is the idobata repository root.
FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
COPY policy/backend/package.json policy/backend/
COPY policy/frontend/package.json policy/frontend/
COPY vision/idea-discussion/backend/package.json vision/idea-discussion/backend/
COPY vision/admin/package.json vision/admin/
COPY vision/frontend/package.json vision/frontend/
RUN npm install --workspace=idobata-frontend

COPY vision/frontend vision/frontend
WORKDIR /app/vision/frontend
# Same-origin: the ALB sends /api and /socket.io to the API container.
ENV VITE_API_BASE_URL=
RUN npx vite build

FROM nginx:1.27-alpine
COPY vision/frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/vision/frontend/dist /usr/share/nginx/html
EXPOSE 8080
