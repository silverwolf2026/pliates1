# Pilates Health Assessment

> 健康测评系统 — 支持分步问卷、服务端计算、订阅鉴权、差异化结果展示的完整 Funnel 架构
>
> 🌐 **线上地址：** [http://121.43.48.184](http://121.43.48.184)

参考竞品：[BetterMe Quiz Funnel](https://betterme-pilates.com/first-page-brand-palette?flow=2117)

---

## 目录

- [技术栈](#技术栈)
- [快速启动](#快速启动)
- [手动启动](#手动启动)
- [项目结构](#项目结构)
- [数据库设计](#数据库设计)
- [API 文档](#api-文档)
- [测试](#测试)
- [付费前后对比](#付费前后对比)
- [cURL 快速测试](#curl-快速测试)
- [AI 使用复盘](#ai-使用复盘)

---

## 技术栈

| 层 | 技术 |
|---|---|
| **后端** | Express + TypeScript |
| **数据库 ORM** | Prisma + PostgreSQL |
| **前端** | Vue 3 + Vite + Pinia + Vue Router |
| **数据校验** | Zod |
| **测试** | Vitest + Supertest |
| **运行环境** | Node.js 20+ / PostgreSQL 16+ |

---

## 快速启动

### 一键 Docker 部署（推荐）

```bash
# 1. 安装 Docker（如果未安装）
curl -fsSL https://get.docker.com | sudo sh

# 2. 启动全部服务
sudo docker compose up -d
# → 后端: http://localhost:3001
# → 前端: http://localhost:80
```

### 本地开发启动

**前置条件：** [Node.js](https://nodejs.org/) 20+、[PostgreSQL](https://www.postgresql.org/) 16+

```bash
# 创建数据库
psql -U postgres -c "CREATE DATABASE pilates_health;"

# 双击 `start.bat` 一键启动
```

或手动分步启动：

```bash
cd backend
npm install
npx prisma db push
npm run dev     # → http://localhost:3001

cd ../frontend
npm install
npm run dev     # → http://localhost:5173
```

> ⚠️ 如果 `start.bat` 里的 PostgreSQL 服务名与你的版本不一致，请手动编辑 bat 中的 `net start postgresql-x64-18` 改为你的版本号。

---

## 手动启动

```bash
# 1. 安装后端依赖
cd backend
npm install

# 2. 配置环境变量（复制 .env.example 为 backend/.env，修改密码）
#    DATABASE_URL="postgresql://postgres:你的密码@localhost:5432/pilates_health?schema=public"

# 3. 数据库迁移
npx prisma db push

# 4. 启动后端（终端 1）
npm run dev
# → http://localhost:3001

# 5. 启动前端（终端 2）
cd ../frontend
npm install
npm run dev
# → http://localhost:5173
```

---

## 项目结构

```
pilates/
├── start.bat                          # 一键启动脚本
├── backend/
│   ├── src/
│   │   ├── index.ts                   # Express 入口
│   │   ├── config/env.ts              # 环境变量
│   │   ├── db/prisma.ts               # PrismaClient 单例
│   │   ├── schemas/                   # Zod 校验规则
│   │   ├── routes/                    # API 路由
│   │   │   ├── session.ts             # 会话创建
│   │   │   ├── assessment.ts          # 分步保存 + 进度恢复 + 提交
│   │   │   ├── results.ts             # 结果 (含鉴权差异化)
│   │   │   └── payment.ts             # 模拟支付
│   │   ├── services/
│   │   │   ├── healthCalculator.ts    # 核心算法 (BMI/热量/预测)
│   │   │   └── subscriptionGuard.ts   # 鉴权守卫 + 脱敏
│   │   ├── middleware/session.ts      # Session 鉴权中间件
│   │   └── utils/errors.ts            # 统一错误处理
│   ├── prisma/schema.prisma           # 数据模型
│   ├── tests/                         # 测试文件 (61 tests)
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/index.ts               # Axios 封装
│   │   ├── stores/assessment.ts       # Pinia 状态管理
│   │   ├── router/index.ts            # 路由配置
│   │   └── views/
│   │       ├── QuizPage.vue           # 4 步问卷
│   │       ├── ResultPage.vue         # 结果展示
│   │       └── PaymentPage.vue        # 支付页面
│   └── package.json
├── docker-compose.yml                 # Docker 编排
└── .env.example
```

---

## 数据库设计

### ER 图

```mermaid
erDiagram
    User {
        string id UUID
        string sessionToken UUID "unique"
        datetime createdAt
        datetime updatedAt
    }
    Assessment {
        string id UUID
        string userId FK
        int step "进度 0-5"
        boolean isCompleted "是否已提交"
        string gender "male | female"
        string goal "lose_weight | gain_musile | maintain | improve_flexibility"
        int age "10-120"
        float heightCm "cm"
        float weightKg "kg"
        float targetWeightKg "kg"
        string activityLevel "sedentary | light | moderate | heavy | extreme"
        float bmi "评估结果，submit 后写入"
        float dailyCalories "评估结果，submit 后写入"
        datetime predictedDate "评估结果，submit 后写入"
        datetime createdAt
        datetime updatedAt
    }
    Subscription {
        string id UUID
        string userId FK "unique"
        string status "none | active | expired"
        string planType "monthly | yearly"
        datetime paidAt "支付时间"
        datetime expiresAt "到期时间"
        datetime createdAt
        datetime updatedAt
    }
    User ||--o{ Assessment : "测评"
    User ||--o| Subscription : "订阅"
```

### 设计要点

- **所有输入字段可空** — 支持分步保存，逐步填充
- **`step` 只增不减** — 防止客户端乱序覆盖
- **计算结果 submit 后写入** — bmi / dailyCalories / predictedDate 初始为 null
- **Subscription `userId` 加 `@unique`** — 一用户一订阅
- **`sessionToken` 用 UUID** — 无登录系统，匿名使用

---

## API 文档

### 接口总览

| 方法 | 路径 | 说明 | 鉴权 |
|---|---|---|---|
| POST | `/api/v1/session` | 创建/获取 Session | ❌ |
| POST | `/api/v1/assessment/step` | 保存单步数据 | ✅ |
| GET | `/api/v1/assessment/progress` | 获取进度数据 | ✅ |
| POST | `/api/v1/assessment/submit` | 提交 → 触发计算 | ✅ |
| GET | `/api/v1/results` | 获取结果（差异化） | ✅ |
| POST | `/api/v1/pay` | 模拟支付 | ✅ |
| GET | `/api/v1/health` | 健康检查 | ❌ |

### POST /api/v1/session

创建匿名会话。如果 Header 已有有效 `x-session-token` 则复用。

```json
// Request
POST /api/v1/session

// Response 201
{
  "userId": "f117e0e7-...",
  "sessionToken": "a552952c-...",
  "isNew": true
}
```

### POST /api/v1/assessment/step

分步保存，增量合并。`step` 只增不减。

```json
// Request
{
  "step": 1,
  "data": {
    "gender": "female",
    "goal": "lose_weight"
  }
}

// Response 200
{
  "userId": "f117e0e7-...",
  "currentStep": 1,
  "completed": false,
  "message": "Step 1 saved"
}
```

**校验规则：**

| 字段 | 类型 | 范围 |
|---|---|---|
| gender | enum | male / female |
| goal | enum | lose_weight / gain_muscle / maintain / improve_flexibility |
| age | number | 10 ~ 120 |
| heightCm | number | 50 ~ 250 |
| weightKg | number | 20 ~ 500 |
| targetWeightKg | number | 15 ~ 500 |
| activityLevel | enum | sedentary / light / moderate / heavy / extreme |

### GET /api/v1/assessment/progress

```json
// Response 200
{
  "userId": "f117e0e7-...",
  "currentStep": 3,
  "completed": false,
  "data": {
    "gender": "female",
    "goal": "lose_weight",
    "age": 28,
    "heightCm": 165,
    "weightKg": 70,
    "targetWeightKg": 60,
    "activityLevel": null,
    "bmi": null,
    "dailyCalories": null,
    "predictedDate": null
  }
}
```

### POST /api/v1/assessment/submit

校验所有字段 → 计算 BMI/摄入量/预测日期 → 持久化。

```json
// Response 200
{
  "userId": "f117e0e7-...",
  "completed": true,
  "results": {
    "bmi": 25.7,
    "bmiCategory": "overweight",
    "dailyCalories": 1717,
    "predictedDate": "2026-12-06T06:17:56.151Z"
  }
}
```

### GET /api/v1/results

根据订阅状态差异化返回。

**非会员响应：**
```json
{
  "userId": "f117e0e7-...",
  "subscriptionStatus": "none",
  "results": {
    "bmi": "25~29.9 (Overweight range)",
    "dailyCalories": "About 1650~1750 kcal",
    "predictedDate": null,
    "isPremium": false,
    "requiresPayment": true,
    "paymentMessage": "Subscribe now to unlock your personalized health predictions!"
  }
}
```

**会员响应：**
```json
{
  "userId": "f117e0e7-...",
  "subscriptionStatus": "active",
  "results": {
    "bmi": 25.7,
    "bmiCategory": "overweight",
    "dailyCalories": 1717,
    "predictedDate": "2026-12-06T06:17:56.151Z",
    "isPremium": true
  }
}
```

### POST /api/v1/pay

模拟支付回调。幂等设计—重复调用返回当前状态。

```json
// Request
{ "planType": "monthly" }

// Response 200
{
  "status": "active",
  "planType": "monthly",
  "paidAt": "2026-07-04T06:17:56.362Z",
  "expiresAt": "2026-08-04T06:17:56.362Z"
}
```

---

## 测试

### 运行全部测试

```bash
cd backend
npm test
```

### 运行单个测试文件

```bash
npx vitest run tests/healthCalculator.test.ts
```

### 测试覆盖（61 个用例）

| 文件 | 数量 | 覆盖场景 |
|---|---|---|
| `healthCalculator.test.ts` | 32 | BMI/BMR/热量/预测的正常值、零值、负值、极端值、精度校验 |
| `assessment.test.ts` | 13 | 分步保存→累积、中断恢复、乱序拒绝、非法值拦截、token 校验 |
| `subscription.test.ts` | 11 | 非会员脱敏、会员完整、过期会员、未登录访问、非法 token |
| `paymentFlow.test.ts` | 5 | 支付→状态变更→结果脱敏→完整、幂等、无效 planType |
| **总计** | **61** | **全部通过** ✅ |

### 测试场景说明

- **Happy path**：完整填写→提交→支付→完整结果
- **边界值**：step 倒退被拒绝、身高=0、年龄=200、BMI 极端值
- **非法注入**：gender="alien"、planType="lifetime"、NaN、负数
- **幂等性**：重复 step 提交、重复支付
- **鉴权**：无 token、无效 token、无权限访问

---

## 付费前后对比

| 数据项 | 免费用户 | 付费用户 |
|---|---|---|
| BMI | 区间描述 "25~29.9 (Overweight range)" | 精确值 "25.7" |
| 每日摄入量 | 约数 "About 1650~1750 kcal" | 精确值 "1717" |
| 目标预测日期 | null | "2026-12-06" |
| isPremium | false | true |
| requiresPayment | true | 无 |

---

## cURL 快速测试

以下命令可用于验证完整的 API 流程：
> ⚠️ 将 `121.43.48.184` 替换为你的服务器 IP，或使用 `localhost` 本地测试。

```bash
# 1. 创建会话
curl -s -X POST http://121.43.48.184/api/v1/session

# 记下返回的 sessionToken，替换下面的 <token>

# 2. 分步保存（每步都需带 Content-Type: application/json）
curl -s -X POST http://121.43.48.184/api/v1/assessment/step \
  -H "Content-Type: application/json" \
  -H "x-session-token: <token>" \
  -d '{"step":1,"data":{"gender":"female","goal":"lose_weight"}}'

curl -s -X POST http://121.43.48.184/api/v1/assessment/step \
  -H "Content-Type: application/json" \
  -H "x-session-token: <token>" \
  -d '{"step":2,"data":{"age":28,"heightCm":165}}'

curl -s -X POST http://121.43.48.184/api/v1/assessment/step \
  -H "Content-Type: application/json" \
  -H "x-session-token: <token>" \
  -d '{"step":3,"data":{"weightKg":70,"targetWeightKg":60}}'

curl -s -X POST http://121.43.48.184/api/v1/assessment/step \
  -H "Content-Type: application/json" \
  -H "x-session-token: <token>" \
  -d '{"step":4,"data":{"activityLevel":"moderate"}}'

# 3. 提交计算
curl -s -X POST http://121.43.48.184/api/v1/assessment/submit \
  -H "Content-Type: application/json" \
  -H "x-session-token: <token>"

# 4. 查看免费结果（脱敏数据）
curl -s http://121.43.48.184/api/v1/results \
  -H "x-session-token: <token>"

# 5. 模拟支付
curl -s -X POST http://121.43.48.184/api/v1/pay \
  -H "Content-Type: application/json" \
  -H "x-session-token: <token>" \
  -d '{"planType":"monthly"}'

# 6. 查看付费结果（完整数据）
curl -s http://121.43.48.184/api/v1/results \
  -H "x-session-token: <token>"
```

### 已支付的测试 Session

每次部署后执行以下命令即可获得一个已支付的测试 token：

```bash
# 创建 session
TOKEN=$(curl -s -X POST http://121.43.48.184/api/v1/session | grep -o '"sessionToken":"[^"]*"' | cut -d'"' -f4)

# 分步填表（所有 POST 请求都需 Content-Type）
curl -s -X POST http://121.43.48.184/api/v1/assessment/step \
  -H "Content-Type: application/json" -H "x-session-token: $TOKEN" \
  -d '{"step":1,"data":{"gender":"female","goal":"lose_weight"}}' > /dev/null
curl -s -X POST http://121.43.48.184/api/v1/assessment/step \
  -H "Content-Type: application/json" -H "x-session-token: $TOKEN" \
  -d '{"step":2,"data":{"age":28,"heightCm":165}}' > /dev/null
curl -s -X POST http://121.43.48.184/api/v1/assessment/step \
  -H "Content-Type: application/json" -H "x-session-token: $TOKEN" \
  -d '{"step":3,"data":{"weightKg":70,"targetWeightKg":60}}' > /dev/null
curl -s -X POST http://121.43.48.184/api/v1/assessment/step \
  -H "Content-Type: application/json" -H "x-session-token: $TOKEN" \
  -d '{"step":4,"data":{"activityLevel":"moderate"}}' > /dev/null

# 提交
curl -s -X POST http://121.43.48.184/api/v1/assessment/submit \
  -H "Content-Type: application/json" -H "x-session-token: $TOKEN" > /dev/null

# 支付
curl -s -X POST http://121.43.48.184/api/v1/pay \
  -H "Content-Type: application/json" -H "x-session-token: $TOKEN" \
  -d '{"planType":"monthly"}' > /dev/null

# 查看完整结果
echo "=== 付费后完整结果 ==="
echo "Session Token: $TOKEN"
curl -s http://121.43.48.184/api/v1/results \
  -H "x-session-token: $TOKEN" | python3 -m json.tool 2>/dev/null || \
  curl -s http://121.43.48.184/api/v1/results -H "x-session-token: $TOKEN"
```

> 💡 **本地已生成的测试 token：** `9daac383-3ba8-440f-955c-0859bcb0d8bf`  
> 该 token 已完成完整填表 → 提交 → 支付全流程，可直接用于测试会员结果。  
> 如需刷新，在本地或部署后按上述脚本重新生成即可。

---

## AI 使用复盘

### 如何利用 AI

1. **数据库建模**：AI 生成了 Prisma Schema 的初版，包含了 User / Assessment / Subscription 三张表及其关系。人工审阅后增加了 `@@index` 和字段约束。

2. **生成接口骨架**：AI 生成了所有路由的框架代码（session、assessment、results、payment），以及 Express 入口、中间件、错误处理的基础架构。

3. **核心算法**：`healthCalculator.ts` 中的 Mifflin-St Jeor BMR 公式、活动系数映射、目标调整逻辑由 AI 生成，人工补充了边界校验和 NaN/Infinity 防护。

4. **测试用例**：
   - `healthCalculator.test.ts` 的 32 个测试用例（包括零值、负值、极端值等边界情况）由 AI 生成
   - 集成测试中的分步保存、中断恢复、乱序拒绝等场景由 AI 设计
   - 人工补充了「确保非会员拿不到精确字段」的测试

5. **前端页面**：Vue 3 的问卷页、结果页、支付页由 AI 生成，包含进度条、选项卡片、响应式布局。

### 否决的 AI 方案

**1. SQLite 替代方案被否决**  
最初 AI 建议使用 SQLite 避免 PostgreSQL 安装环节。但考虑到生产环境需要 PostgreSQL，且用户明确要求安装 PG，最终否决了 SQLite 方案，保留了 PostgreSQL。

**2. 数据库迁移策略**  
AI 生成的 Dockerfile 首次使用了 `npx prisma migrate deploy` + migration 文件的方式。后来发现本地开发场景下 `npx prisma db push` 更简洁，且无需先创建 migration 文件，因此改用了 db push 作为开发启动方式。

**3. Zod 校验器设计**  
AI 初版将 Zod schema 直接放在路由文件中。人工重构为独立的 `schemas/` 目录，并将枚举类型抽取到 `common.ts` 复用。

### 未覆盖的测试场景

- **并发写入冲突**：两个请求同时写入同一用户的 step 数据。当前 `step` 字段在应用层做了 `Math.max` 保护，但缺少数据库层的悲观锁或乐观锁机制。
- **多浏览器标签页冲突**：同一 session 在多个标签页打开时，step 和 formData 的同步问题。
- **大流量压力测试**：未做高并发下的性能测试。
- **支付回调安全**：/pay 接口无签名校验，仅为模拟支付，生产环境需要接入真实的支付网关 Webhook 签名验证。

### 与 AI 协作的效率

- 估算节省了约 60% 的重复代码编写时间
- 测试用例生成效率最高（32 个算法测试用例从提出到生成约 2 分钟）
- 最大短板：AI 生成的代码需要人工审阅每一行，特别是在边界处理和类型安全方面
- 结论：AI 适合生成「模式化」代码（路由、CRUD、测试样板），但「业务逻辑的边界值覆盖」和「架构决策」仍需人工主导

---

## License

MIT
