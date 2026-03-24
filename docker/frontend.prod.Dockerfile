FROM node:20-slim AS build
WORKDIR /app
COPY frontend/package.json ./
RUN npm install
COPY frontend/ .
RUN npx vite build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY docker/frontend.nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
