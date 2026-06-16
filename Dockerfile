# ---- Build stage ----
# Vite bakes VITE_* env vars at BUILD time, so pass them as build args.
FROM node:20-alpine AS build
WORKDIR /app

ARG VITE_API_URL=/api/v1
ARG VITE_DEMO_MODE=true
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_DEMO_MODE=$VITE_DEMO_MODE

COPY package.json package-lock.json* ./
RUN npm install

COPY . .
RUN npm run build

# ---- Serve stage ----
FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
