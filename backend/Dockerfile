FROM node:20-alpine

WORKDIR /app

# 安装依赖 (含 devDependencies — prisma CLI 需要)
COPY package.json package-lock.json* ./
RUN npm ci

# Prisma 生成 client
COPY prisma ./prisma
RUN npx prisma generate

# 源码
COPY . .

EXPOSE 3001

CMD ["npm", "run", "dev"]
