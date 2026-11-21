export type MilestoneStatus = "done" | "in_progress" | "planned";

export interface Milestone {
  id: string;
  title: string;
  summary: string;
  status: MilestoneStatus;
}

export const MILESTONES: readonly Milestone[] = [
  {
    id: "M1",
    title: "工程底座与质量基线",
    summary: "Next.js + TypeScript + Tailwind + shadcn/ui 骨架，Vitest / Playwright / ESLint / 类型检查全绿。",
    status: "done",
  },
  {
    id: "M2",
    title: "确定性八字排盘引擎",
    summary: "四柱、十神、藏干、十二长生、五行统计、大运与起运；zod 全量校验、黄金案例回归、POST /api/bazi/chart。",
    status: "done",
  },
  {
    id: "M3",
    title: "规则知识库与冲突组",
    summary: "规则卡 Schema、条件 DSL、15 条旺衰/十神/五行/刑冲合害规则、冲突组聚合与首页命中面板；四柱横向网格展示十神与藏干。",
    status: "in_progress",
  },
  {
    id: "M4",
    title: "LLM 解释网关",
    summary: "服务端网关仅接收排盘事实、命中规则卡与冲突组；结构化 JSON 校验，无 Key 时使用 mock provider。",
    status: "planned",
  },
  {
    id: "M5",
    title: "PostgreSQL 持久化与追溯 API",
    summary: "Prisma 数据模型、排盘与报告存档、按规则编号回溯来源的查询接口。",
    status: "planned",
  },
  {
    id: "M6",
    title: "V1 闭环前端",
    summary: "出生信息录入、命盘展示、规则卡列表、多派并列报告与「知识库未覆盖」态。",
    status: "planned",
  },
  {
    id: "M7",
    title: "E2E 与合规回归",
    summary: "端到端闭环测试、绝对化/恐吓/付费改运文案扫描、移动端无横向溢出验收。",
    status: "planned",
  },
] as const;

export const V1_STEPS = [
  {
    title: "录入出生信息",
    description: "公历/农历、出生时间、地点与性别；时区与时间口径显式记录，避免口径漂移。",
  },
  {
    title: "确定性排盘",
    description: "代码库计算四柱与配套事实，输出可存档的结构化命盘，LLM 不介入此步。",
  },
  {
    title: "命中规则·生成报告",
    description: "规则卡带编号、流派、来源、置信度与冲突组；报告逐条引用，未覆盖即标注未覆盖。",
  },
] as const;

export const PRINCIPLES = [
  {
    title: "排盘不由 LLM 完成",
    description: "四柱、安星、装卦全部由确定性代码库产出；LLM 只能读取排盘事实，不得新增或改写命盘字段。",
  },
  {
    title: "每条断语可回溯",
    description: "断语必须携带规则编号、所属流派、来源出处、置信度、适用条件与冲突提示，缺一不可。",
  },
  {
    title: "多派并列，不合并直断",
    description: "不同流派结论分栏并列展示，保留分歧与适用条件，不加工成「铁口直断」式的单一结论。",
  },
  {
    title: "知识边界诚实可见",
    description: "知识库未收录的主题显示「知识库未覆盖」，不以推测、类比或模型常识补齐。",
  },
  {
    title: "拒绝绝对化与恐吓",
    description: "不出现宿命论断言、百分比式承诺或「铁口」结论，也不以灾祸、疾病、克亲等内容制造恐惧。",
  },
  {
    title: "不越界为专业建议",
    description: "不提供医疗、法律、投资、婚姻决策建议，也不提供任何以改运、消灾为名的付费服务。",
  },
] as const;

export const DISCLAIMER_TEXT =
  "本工具用于传统文化学习与研究，内容不构成医疗、法律、投资、婚姻或其他专业建议，不提供任何以改运、消灾为名的付费服务，也不承诺任何预测结果。请将结果视为理解命理规则的教学材料，并结合现实情况独立判断。";

export const DISCLAIMER_POINTS = [
  "所有断语均为规则卡解释，不是对个人命运的事实断言。",
  "多派结论并列展示，冲突处保留分歧，不做单一裁决。",
  "知识库未覆盖的主题会如实标注，不会编造来源。",
  "如涉及健康、法律、投资或婚姻决策，请咨询对应领域的专业人士。",
] as const;
