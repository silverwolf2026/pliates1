# 🎯 健康测评系统 — 项目任务追踪

> 本文件记录项目交付要求及完成进度，每次改动后同步更新。

---

## 一、交付要求总览

| # | 需求 | 优先级 | 状态 | 备注 |
|---|------|--------|------|------|
| 1 | 后端框架 (Express + TS) | P0 | ✅ | 已完成 |
| 2 | 数据库建模 (Prisma Schema) | P0 | ✅ | User / Assessment / Subscription |
| 3 | 分步保存 + 进度恢复 | P0 | ✅ | step 只增不减，增量合并 |
| 4 | 服务端计算 (BMI/热量/预测日期) | P0 | ✅ | Mifflin-St Jeor BMR |
| 5 | 订阅鉴权 + 差异化返回 | P0 | ✅ | 非会员脱敏 vs 会员完整 |
| 6 | 模拟支付回调 (/pay) | P0 | ✅ | 幂等设计 |
| 7 | Zod 数据校验 | P0 | ✅ | 枚举/范围/非法值 |
| 8 | 自动化测试 (61 个) | P0 | ✅ | 4 文件全覆盖 |
| 9 | 前端 (Vue 3) | P1 | ✅ | 基础可用，不做 UI 深度优化 |
| 10 | **公网部署 (阿里云 ECS)** | **P0** | **✅** | 前后端 + PostgreSQL 已上线，http://121.43.48.184 |
| 11 | **已支付测试 sessionId** | **P0** | **🔴** | **待生成** |
| 12 | **数据库 Schema 图** | **P1** | **🔴** | **未生成** |
| 13 | **AI 使用复盘补充** | **P1** | **🟡** | 已有初版，需补充案例 |
| 14 | GitHub Actions CI | P2-加分 | ⏸️ | 暂缓，部署优先 |
| 15 | 前端 UI 优化 | P2 | ⏸️ | 保持现状，不做 |

---

## 二、详细需求对照

### 第一阶段 · 测评数据流与状态恢复

| 功能点 | 状态 | 说明 |
|--------|------|------|
| 分步保存接口 | ✅ | `POST /api/v1/assessment/step` |
| 进度恢复逻辑 | ✅ | `GET /api/v1/assessment/progress` |
| Session 鉴权 | ✅ | 基于 x-session-token 中间件 |
| Zod 校验 | ✅ | 字段类型/范围/枚举 |

### 第二阶段 · 服务端计算逻辑

| 功能点 | 状态 | 说明 |
|--------|------|------|
| BMI 计算 | ✅ | 含分类 (underweight/normal/overweight/obese) |
| 建议摄入量 | ✅ | Mifflin-St Jeor BMR × 活动系数 × 目标调整 |
| 目标预测日期 | ✅ | 基于 TDEE 差值 + 7700 kcal/kg |
| 结果持久化 | ✅ | submit 后写入 assessment 记录 |

### 第三阶段 · 订阅鉴权与权限保护

| 功能点 | 状态 | 说明 |
|--------|------|------|
| 逻辑拦截 | ✅ | subscriptionGuard 中间件 |
| 非会员脱敏 | ✅ | BMI 区间、热量约数、predictedDate = null |
| 会员完整数据 | ✅ | 精确值全返回 |
| 模拟支付回调 | ✅ | POST /api/v1/pay，幂等 |
| 过期会员处理 | ✅ | 过期 → 降级为脱敏数据 |

### 第四阶段 · 测试与质量保障

| 覆盖场景 | 文件 | 用例数 | 状态 |
|----------|------|--------|------|
| 健康算法单元 (边界/极端/非法) | `healthCalculator.test.ts` | 32 | ✅ |
| 分步保存 + 进度恢复 | `assessment.test.ts` | 13 | ✅ |
| 鉴权差异化 + 脱敏 | `subscription.test.ts` | 11 | ✅ |
| 支付流程端到端 | `paymentFlow.test.ts` | 5 | ✅ |
| **总计** | | **61** | ✅ |

### 部署 & 交付物

| 交付物 | 状态 | 操作 |
|--------|------|------|
| GitHub 仓库 | ✅ | https://github.com/silverwolf2026/pliates1 |
| 公网 URL | 🔴 | 待部署到阿里云 ECS |
| 已支付测试 sessionId | 🔴 | 部署后生成 |
| Schema 图 (Mermaid) | 🔴 | 待添加到 README |
| AI 使用复盘 | 🟡 | 已有基础内容，可补充 |
| 一键 npm test | ✅ | 已配置 |

---

## 三、下一步行动计划

### Phase 1: 公网部署 (P0)

- [ ] 确定 ECS 配置 (OS / 安全组 / 域名)
- [ ] 在 ECS 上安装 Node.js + PostgreSQL
- [ ] 部署后端 + 数据库
- [ ] 构建前端并配置 Nginx 托管
- [ ] 测试全流程 (session → 问卷 → 提交 → 付费 → 结果)
- [ ] 更新 README 中的线上链接

### Phase 2: 完善交付文档 (P1)

- [ ] README 添加 Mermaid Schema 图
- [ ] README 补充已支付测试 sessionId
- [ ] README 补充 AI 复盘案例

### Phase 3: 可选加分

- [ ] GitHub Actions CI（暂缓）
- [ ] 前端视觉优化（暂缓）

---

## 四、已知决策记录

| 日期 | 决策 | 理由 |
|------|------|------|
| 2026-07-04 | 部署到阿里云 ECS | 国内访问快 |
| 2026-07-04 | CI 暂缓 | 优先保证部署上线 |
| 2026-07-04 | 前端保持现状 | 评审重点在后端 |

---

## 五、架构审查 & 修复记录

### 🔴 已修复问题

| # | 问题 | 文件 | 修复方式 |
|---|------|------|----------|
| 1 | `as any` 绕过类型安全 | `routes/assessment.ts:60` | 改为 `Prisma.AssessmentUpdateInput` + 逐字段安全赋值 |
| 2 | `predictTargetDate` 死代码 + 硬编码 1.55 | `services/healthCalculator.ts` | 删除未使用的 `dailyDeficit`；改为接收实际 `tdee` 参数 |
| 3 | `getCategoryFromBMI` 函数重复 | `routes/results.ts` vs `services/healthCalculator.ts` | 删除 routes 中的副本，统一引用 `getBMICategory` |
| 4 | session middleware 动态 `import()` | `middleware/session.ts:31` | 改为顶层静态 import |
| 5 | 业务逻辑在路由层 | `routes/assessment.ts` | 全部抽取到 `services/assessmentService.ts` |
| 6 | 常量可被运行时修改 | `services/healthCalculator.ts` | `ACTIVITY_MULTIPLIERS` + `GOAL_CALORIE_ADJUSTMENT` 加 `as const` |
| 7 | 环境变量无运行时校验 | `config/env.ts` | 引入 Zod schema，启动时 fail fast |

### 🟡 待办（可推后）

| # | 问题 | 说明 |
|---|------|------|
| 1 | 没有 Repository 层 | 当前 service 直接调 prisma，短期内可接受 |
| 2 | 测试依赖真实 PostgreSQL | 长期可用 testcontainers 解决 |
| 3 | 没有请求追踪 ID | 生产环境加 correlation ID middleware |
| 4 | 没有限流 | 生产环境 session 创建应加 rate limiter |
| 5 | `targetWeightKg` 与 `weightKg` 无业务关联校验 | Zod 层可加前后端交叉校验（如相差不超过 200kg） |

---

## 六、部署进展 (阿里云 ECS)

### 当前状态

| 项目 | 状态 |
|------|------|
| ECS 实例 | ✅ Ubuntu 24.04, IP: 121.43.48.184 |
| Docker 安装 | ✅ 已安装 + 镜像源已配置 |
| PostgreSQL 容器 | ✅ 运行中 |
| 后端容器 | ✅ 运行中 |
| 前端容器 | ✅ 端口已改为 80 |
| 安全组 80 端口 | ✅ 已配置 |
| **前端访问** | **http://121.43.48.184** |
| 已支付 sessionId | 🔴 待生成 |

### 剩余步骤

```bash
# 生成已支付 sessionId + 全流程验证
```

---

## 七、已做的部署准备工作

| 改动 | 说明 |
|------|------|
| `backend/Dockerfile` | multi-stage build：`npm run build` 编译 TS → `node dist/index.js` 运行 |
| `docker-compose.yml` | 添加 `restart: unless-stopped`；前端端口改为 `80:80`；生产命令 |
| `.dockerignore` | 排除 node_modules/.git/.env，减少上下文体积 |
