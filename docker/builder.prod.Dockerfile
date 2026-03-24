FROM node:20-alpine AS build
WORKDIR /app
COPY frontend-email-builder/package*.json ./
RUN npm install
COPY frontend-email-builder/ .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY docker/builder.nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
