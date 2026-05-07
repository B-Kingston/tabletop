# === Frontend Dockerfile ===
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .

ARG VITE_CLERK_PUBLISHABLE_KEY
ARG VITE_CLERK_JWT_TEMPLATE
ARG VITE_API_URL
ENV VITE_CLERK_PUBLISHABLE_KEY=$VITE_CLERK_PUBLISHABLE_KEY
ENV VITE_CLERK_JWT_TEMPLATE=$VITE_CLERK_JWT_TEMPLATE
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# Production serve with nginx
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
