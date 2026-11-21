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

## 已实现（M1）

- Next.js 16 App Router + TypeScript + Tailwind CSS v4 + shadcn/ui 风格组件（本地 vendored）
- 首页：V1 闭环说明、产品边界、里程碑路线、免责声明
- `src/lib/compliance.ts`：绝对化预测 / 恐吓 / 付费改运 / 越界专业建议的词表扫描，后续用于校验 LLM 报告
- Vitest 单测、Playwright 桌面与移动端冒烟、ESLint 与类型检查

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
  app/             # App Router 页面与全局样式
  components/      # 站点组件 + ui 原子组件
  lib/             # 领域无关工具、项目常量、合规扫描
e2e/               # Playwright 用例
```

## 环境变量

复制 `.env.example` 为 `.env`。数据库（M5）与 LLM 网关（M4）按里程碑逐步启用；未配置 LLM Key 时使用 mock provider。
