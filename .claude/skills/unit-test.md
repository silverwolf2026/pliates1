---
name: unit-test
description: 运行后端单元测试并生成测试报告
---

# 单元测试

运行 Pilates Health Assessment 项目的后端测试，并生成可读的测试报告。

## 使用方法

- `/unit-test` — 运行全部测试并生成报告
- `/unit-test 文件名` — 运行单个测试文件

## 执行步骤

1. 进入 `backend/` 目录
2. 运行测试命令
3. 展示测试结果摘要

### 全部测试

```bash
cd backend && npm test
```

### 单个文件

```bash
cd backend && npx vitest run tests/{{文件名}}
```

### 测试报告

运行全部测试后，输出格式化的测试报告，包含：

- ✅ 总用例数 / 通过数 / 失败数
- 📊 各测试文件的用例分布
- 📋 失败用例的具体错误信息（如有）
- ⏱ 执行耗时
