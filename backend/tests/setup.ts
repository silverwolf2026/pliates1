import { beforeAll, afterAll } from 'vitest';

/**
 * 测试全局 setup
 *
 * 注意：需要本地 PostgreSQL 实例运行
 * 生产 CI 会通过 docker-compose 启动 test DB
 */
beforeAll(async () => {
  // 确保测试环境变量
  process.env.NODE_ENV = 'test';
});

afterAll(async () => {
  // 清理 Prisma 连接
  const { prisma } = await import('../src/db/prisma');
  await prisma.$disconnect();
});
