# Build stage
FROM node:20-bookworm-slim AS build

WORKDIR /app

RUN apt-get update -qq && apt-get install -y -qq openssl && apt-get clean

COPY package.json package-lock.json* ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Production stage
FROM node:20-bookworm-slim

WORKDIR /app

RUN apt-get update -qq && apt-get install -y -qq openssl && apt-get clean

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

COPY prisma ./prisma
RUN npx prisma generate

COPY --from=build /app/dist ./dist

EXPOSE 3001

CMD ["node", "dist/index.js"]
