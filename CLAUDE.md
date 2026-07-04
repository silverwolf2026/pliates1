# 健康测评系统 — CLAUDE.md

## 项目概述

构建一个健康测评（Health Assessment / Pilates Funnel）系统的完整后端架构。参考竞品 [BetterMe Quiz Funnel](https://betterme-pilates.com/first-page-brand-palette?flow=2117)，支撑从用户填写问卷 → 数据持久化 → 服务端计算 → 订阅鉴权 → 结果展示的完整流程。

---

## 技术栈

| 层 | 技术 | 说明 |
|---|---|---|
| **后端框架** | **Express + TypeScript** | 干净的路由分层，中间件模式适合鉴权场景 |
| **数据库 ORM** | **Prisma** | 类型安全的查询，自动生成的 types |
| **数据库** | PostgreSQL | 本地安装 |
| **前端** | **Vue 3** + Vite + Pinia + Vue Router | — |
| **测试** | **Vitest** + Supertest | 单元 + 集成 |
| **启动脚本** | `start.bat` | 一键启动前后端 + 自动打开浏览器 |

---

## 目录结构

```
pilates/
├── start.bat                       # 一键启动脚本
├── backend/
│   ├── src/
│   │   ├── index.ts                # Express 入口
│   │   ├── config/env.ts           # 环境变量
│   │   ├── db/prisma.ts            # PrismaClient 单例
│   │   ├── schemas/                # Zod 校验
│   │   │   ├── assessment.ts
│   │   │   ├── payment.ts
│   │   │   └── common.ts
│   │   ├── routes/
│   │   │   ├── index.ts            # 路由聚合
│   │   │   ├── session.ts          # POST /api/v1/session
│   │   │   ├── assessment.ts       # 分步保存 + 进度恢复 + 提交
│   │   │   ├── results.ts          # 结果(含鉴权差异化)
│   │   │   └── payment.ts          # POST /api/v1/pay
│   │   ├── services/
│   │   │   ├── healthCalculator.ts # BMI / 摄入量 / 预测日期
│   │   │   └── subscriptionGuard.ts
│   │   ├── middleware/session.ts   # Session 鉴权
│   │   └── utils/errors.ts         # 统一错误类
│   ├── prisma/
│   │   ├── schema.prisma           # User / Assessment / Subscription
│   │   └── migrations/
│   ├── tests/
│   │   ├── setup.ts / helpers.ts
│   │   ├── healthCalculator.test.ts  # 32 tests
│   │   ├── assessment.test.ts        # 13 tests
│   │   ├── subscription.test.ts      # 11 tests
│   │   └── paymentFlow.test.ts       # 5 tests
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/index.ts            # Axios + API 函数
│   │   ├── stores/assessment.ts    # Pinia 状态管理
│   │   ├── router/index.ts
│   │   └── views/
│   │       ├── QuizPage.vue        # 4步问卷
│   │       ├── ResultPage.vue      # 结果展示
│   │       └── PaymentPage.vue     # 模拟支付
│   ├── Dockerfile + nginx.conf
│   └── vite.config.ts
├── docker-compose.yml
└── .env.example
```

---

## 数据库设计 (Prisma Schema)

```prisma
model User {
  id            String         @id @default(uuid())
  sessionToken  String         @unique @default(uuid())
  assessments   Assessment[]
  subscription  Subscription?
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
}

model Assessment {
  id              String    @id @default(uuid())
  userId          String
  user            User      @relation(fields: [userId], references: [id])
  step            Int       @default(0)
  isCompleted     Boolean   @default(false)
  gender          String?
  goal            String?
  age             Int?
  heightCm        Float?
  weightKg        Float?
  targetWeightKg  Float?
  activityLevel   String?
  bmi             Float?
  dailyCalories   Float?
  predictedDate   DateTime?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  @@index([userId])
}

model Subscription {
  id         String   @id @default(uuid())
  userId     String   @unique
  user       User     @relation(fields: [userId], references: [id])
  status     String   @default("none")
  planType   String?
  paidAt     DateTime?
  expiresAt  DateTime?
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  @@index([userId])
}
```

### 表关系
```
User  1──*  Assessment      # 一用户可多次测评
User  1──0..1 Subscription  # 一用户最多一个订阅
```

---

## API 设计

| 方法 | 路径 | 说明 | 鉴权 |
|---|---|---|---|
| POST | `/api/v1/session` | 创建/获取 Session | 无 |
| POST | `/api/v1/assessment/step` | 保存单步数据（增量合并） | Session |
| GET  | `/api/v1/assessment/progress` | 获取进度数据 | Session |
| POST | `/api/v1/assessment/submit` | 提交 → 触发计算 | Session |
| GET  | `/api/v1/results` | 获取结果（会员/非会员差异） | Session |
| POST | `/api/v1/pay` | 模拟支付回调 | Session |
| GET  | `/api/v1/health` | 健康检查 | 无 |

---

## 测试覆盖

| 文件 | 用例数 | 覆盖内容 |
|---|---|---|
| `healthCalculator.test.ts` | 32 | BMI/热量/预测的正常值、零值、负值、极端值、精度 |
| `assessment.test.ts` | 13 | 分步保存、中断恢复、乱序拒绝、非法值拦截、token校验 |
| `subscription.test.ts` | 11 | 非会员脱敏、会员完整、过期会员、404/401边界 |
| `paymentFlow.test.ts` | 5 | 支付→状态变更→脱敏→完整、幂等、无效planType |
| **总计** | **61** | **全部通过** |

---

## 一站式启动

双击 `start.bat` 即可自动完成：检查环境 → 数据库迁移 → 启动后端(:3001) → 启动前端(:5173) → 打开浏览器。

---

## AI 协作原则

1. **从不盲信 AI 生成的 Schema** — 每次 Migration 前检查是否反映真实业务关系
2. **测试优先** — 让 AI 先生成测试用例，再实现业务逻辑（TDD）
3. **类型先行** — 先定义 Zod schema 和 TypeScript 类型，再路由实现
4. **每次 AI 生成的代码投入仓库前，必须问自己**："这段代码在哪些边界情况下会出问题？"
