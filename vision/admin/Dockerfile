# Context is the idobata repository root.
FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
COPY policy/backend/package.json policy/backend/
COPY policy/frontend/package.json policy/frontend/
COPY vision/idea-discussion/backend/package.json vision/idea-discussion/backend/
COPY vision/admin/package.json vision/admin/
COPY vision/frontend/package.json vision/frontend/
RUN npm install --workspace=admin

COPY vision/admin vision/admin
WORKDIR /app/vision/admin
# ALB が /api を API コンテナへ送るので、画面と同じホストを使う。
ENV VITE_API_BASE_URL=
ENV VITE_BASE_PATH=/admin/
RUN npx vite build

FROM nginx:1.27-alpine
COPY vision/admin/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/vision/admin/dist /usr/share/nginx/html/admin
EXPOSE 8080
