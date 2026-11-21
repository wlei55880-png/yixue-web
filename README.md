# yixue-web

网页版易学学习工具。V1 只做八字单点闭环：**输入出生信息 → 确定性排盘 → 命中规则卡 → 可追溯解释报告**。V2 再独立接入紫微、六爻，禁止混派硬断。

## 快速开始

```bash
pnpm install
pnpm dev            # http://localhost:3000
```

> 本仓库使用 pnpm 的 `node-linker=hoisted` 布局，以兼容没有符号链接权限的 Windows 环境；在常规开发机与 CI 上同样可用。
> Playwright 默认使用 Chromium；本机未下载浏览器时可用 `PLAYWRIGHT_CHANNEL=msedge pnpm test:e2e` 复用系统 Edge。

## 质量门禁

```bash
pnpm typecheck      # TypeScript 严格模式
pnpm lint           # ESLint（next/core-web-vitals + typescript）
pnpm test           # Vitest 单元测试
pnpm test:e2e       # Playwright（首次需 pnpm exec playwright install chromium）
pnpm build          # 生产构建
```

## 已实现

- M1：Next.js 16 App Router + TypeScript + Tailwind CSS v4 + shadcn/ui 风格组件（本地 vendored）
- M1：首页：V1 闭环说明、产品边界、里程碑路线、免责声明
- M1：`src/lib/compliance.ts`：绝对化预测 / 恐吓 / 付费改运 / 越界专业建议的词表扫描，后续用于校验 LLM 报告
- M2：`src/lib/engines/bazi.ts`：基于 lunar-javascript 的确定性排盘（四柱、十神、藏干、十二长生、五行统计、大运与起运），显式记录子时流派与节气分界
- M2：`src/lib/schemas/chart-facts.ts`：zod 入参 / 出参 Schema，拦截干支拼接、五行合计、大运跨度等结构性错误
- M2：`POST /api/bazi/chart`：服务端排盘接口，返回完整 `ChartFacts` JSON
- M2：`data/cases/golden/bazi/`：3 个黄金案例（普通、立春交界、23 点子时），Vitest 全量快照回归
- M2：首页「快速排盘」表单，客户端直接调用排盘引擎并展示四柱与原始 JSON
- M3：`src/lib/schemas/rule-card.ts`：规则卡 Schema（编号、流派、来源、条件、结论、冲突组、置信度），条件 DSL 覆盖同党占比、日主通根、月令关系、五行缺失、十神透干、六冲、三合与暗合
- M3：`data/rules/bazi/`：15 条基础规则（旺衰、十神、五行、刑冲合害，子平与盲派并存）
- M3：`src/lib/engines/rules.ts`：确定性 `evaluateRules()` 输出命中规则与可追溯证据；`groupRuleHits()` 按冲突组聚合，同组多条并列、不合并裁决
- M3：首页四柱改为横向网格，每柱列出天干十神与地支藏干；「命理分析（规则命中）」按冲突组分列展示流派与置信度，无命中时显示「当前排盘未命中知识库规则」

## API：确定性排盘

```bash
curl -X POST http://localhost:3000/api/bazi/chart \
  -H "Content-Type: application/json" \
  -d '{"year":1990,"month":1,"day":1,"hour":12,"minute":0,"gender":"male"}'
```

- 必填：`year` 1900–2100、`month` 1–12、`day` 1–31、`hour` 0–23、`minute` 0–59、`gender`（`male` / `female`）
- 可选：`sect`（1 = 晚子时 23:00 换日，默认；2 = 晚子时归当日）
- 成功：200，返回 `ChartFacts`（四柱、十神、藏干、十二长生、五行统计、大运、起运、口径说明）
- 失败：400，`{ "error": { "code": "INVALID_JSON" | "INVALID_INPUT" | "CHART_FAILED", "message": "...", "issues"?: [...] } }`

## 架构边界（硬约束）

1. 排盘、安星、装卦只由确定性代码库完成，禁止 LLM 参与。
2. LLM 只接收「排盘事实 + 命中规则卡 + 冲突组」，输出结构化 JSON，不得新增命盘事实。
3. 每条断语可回溯：规则编号、流派、来源、置信度、适用条件、冲突提示。
4. 多派结论并列展示，不合并为单一结论。
5. 不做绝对化预测、恐吓、付费改运，不提供医疗/法律/投资/婚姻建议。
6. 知识库未收录的主题显示「知识库未覆盖」，禁止编造。

## 目录

```text
src/
  app/             # App Router 页面与 /api/bazi/chart
  components/      # 站点组件 + ui 原子组件
  lib/
    engines/       # 确定性排盘引擎与规则执行器
    rules/         # 规则库加载与校验
    schemas/       # zod 入参 / 出参 Schema
data/cases/golden/ # 黄金命例快照
data/rules/bazi/   # 八字规则卡 JSON
e2e/               # Playwright 用例
```

## 环境变量

复制 `.env.example` 为 `.env`。数据库（M5）与 LLM 网关（M4）按里程碑逐步启用；未配置 LLM Key 时使用 mock provider。
