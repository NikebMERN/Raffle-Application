# --- Build stage: produce the static bundle ---------------------------------
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# VITE_* values are read from .env at build time. Set VITE_API_URL to your
# deployed API URL (e.g. via compose build args) before building for production.
RUN npm run build

# --- Runtime stage: serve with nginx (SPA fallback) -------------------------
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
