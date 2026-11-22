import { COMPLIANCE_RULES, scanCompliance, type ComplianceCategory } from "@/lib/compliance";
import { ELEMENT_CONTROLS, ELEMENT_GENERATES, ganElement, zhiElement } from "@/lib/domain/wuxing";
import { groupRuleHits } from "@/lib/engines/rules";
import {
  REPORT_CLOSING,
  REPORT_QUEUE_MESSAGE,
  REPORT_TITLE,
  type BaziReport,
  type ReportRequest,
  type SafetyReplacement,
} from "@/lib/llm/report-types";
import { CONFLICT_GROUP_LABELS } from "@/lib/rules/bazi";
import { GAN_VALUES, ZHI_VALUES, type ChartFacts, type Element, type PillarKey } from "@/lib/schemas/chart-facts";
import type { RuleConfidence, RuleHit } from "@/lib/schemas/rule-card";

export { REPORT_CLOSING, REPORT_QUEUE_MESSAGE } from "@/lib/llm/report-types";
export type { BaziReport, ReportRequest, SafetyReplacement } from "@/lib/llm/report-types";

/**
 * 报告 System Prompt：供未来真实 LLM 网关直接复用。
 * 本地 mock 生成器不调用模型，但输出必须遵循同一份结构与安全约束。
 */
export const REPORT_SYSTEM_PROMPT = `你是一位融合传统子平八字、盲派象法与荣格分析心理学的“宗师级”导师。你的文字既要古朴深邃，又要有现代心理学的抚慰感；你只做结构解读与成长建议，不做绝对化预测，不制造恐惧。

【工作原则】
1. 只依据输入的 ChartFacts（四柱、十神、藏干、十二长生、纳音、空亡、神煞、五行、大运）与 RuleHit[]（规则编号、流派、来源、证据、置信度、冲突组）写作；不得自行排盘、补算或编造规则编号，也不得增删命盘里未出现的神煞。
2. 多流派并列：子平、盲派或不同规则给出冲突判断时，明确写出“并列保留，不做单一裁决”，禁止强行合并。
3. 证据分级：优先引用高置信度规则；中低置信度必须写明“可作观察线索”。所有判断都要落在具体干支、十神或刑冲合害事实上。
4. 语言风格：古朴、克制、有画面感；用现代心理学词汇解释传统术语，但不贴诊断标签，不替代心理咨询。
5. 请结合命盘中的神煞（如天乙贵人、桃花等）和十二长生状态，进行综合解读。
6. 输出为纯 Markdown，不要代码块，不要额外的前言或结语标题。

【内容结构】（严格按此格式输出）
# 第一篇：原局剖析·生命蓝图与性格底色
## 1. 能量格局与人生主线
（结合日主旺衰、月令、十神分布，用现代词汇解释。例如：“比劫林立”代表同辈竞争激烈；“财星破印”代表现实物质挤压了精神追求。）
## 2. 宫位与心理图景
（按年柱原生家庭、月柱青年职场、日柱中年伴侣、时柱晚年归宿，分别解析心理映射。）
## 3. 关系课题与暗藏伏笔
（通过刑冲合害与十神组合，分析爱情、婚姻、人际中的潜在冲突，例如“子午冲”代表理智与欲望的交战。）
# 第二篇：岁运推演·时空环境与吉凶触发
## 1. 当前大运基调
（结合当前大运，分析这十年的事业、财务与情感主旋律。）
## 2. 流年震荡与破局点
（结合今年流年，指出健康、职场摩擦、财务风险的观察点，给出务实建议，不使用恐吓式表达。）
# 第三篇：宗师寄语
（结合《道德经》等国学经典，给予有文采、有力量的人生建议，把命局中的张力转化为成长特质。）

【安全与免责（硬拦截）】
1. 严禁出现“必定、注定、改运、必死、破财”等词汇，也不得使用“血光之灾、大凶之兆、灾祸难逃”等恐吓表达。
2. 不得给出医疗、法律、投资、婚姻的具体决策建议，只能建议咨询对应领域专业人士。
3. 结尾必须原样附上：“命理仅为参考，人生在于个人选择。本内容由 AI 提供，仅供传统文化学习与娱乐参考。”`;

const REPORT_MODEL = "local-template-v2";

const PILLAR_ORDER: readonly PillarKey[] = ["year", "month", "day", "hour"];

const CONFIDENCE_LABELS: Record<RuleConfidence, string> = {
  high: "高",
  medium: "中",
  low: "低",
};

const GAN_YANG = new Set(["甲", "丙", "戊", "庚", "壬"]);

type TenGodGroup = "比劫" | "食伤" | "财星" | "官杀" | "印星";

const TEN_GOD_GROUP: Record<string, TenGodGroup> = {
  日主: "比劫",
  比肩: "比劫",
  劫财: "比劫",
  食神: "食伤",
  伤官: "食伤",
  偏财: "财星",
  正财: "财星",
  七杀: "官杀",
  正官: "官杀",
  偏印: "印星",
  正印: "印星",
};

const GROUP_PSYCHOLOGY: Record<TenGodGroup, string> = {
  比劫: "自我边界、同辈竞争与「我是谁」的确认，是人生的主轴",
  食伤: "表达、创造与被看见，是驱动你向前的主要力量",
  财星: "现实资源、成果感与可掌控的生活，是安全感的重要来源",
  官杀: "规则、责任与压力下的应变，是社会化进程的主线",
  印星: "学习、保护与意义感，是你理解世界的方式",
};

const TEN_GOD_PSYCHOLOGY: Record<string, string> = {
  日主: "自我核心与生命 direction",
  比肩: "独立的自我边界与同伴并肩的能量",
  劫财: "资源共享中的竞争感与行动力",
  食神: "松弛的表达、审美与创造",
  伤官: "锋利的表达、突破欲与不服输",
  偏财: "流动资源、机会嗅觉与人脉",
  正财: "稳定积累、责任意识与务实",
  七杀: "压力驱动、危机应变与魄力",
  正官: "秩序感、社会角色与自我要求",
  偏印: "直觉、隐喻与内在探索",
  正印: "学习、保护与价值认同",
};

const TEN_GOD_LIFE: Record<string, string> = {
  比肩: "自主、协作与同辈关系",
  劫财: "竞争、资源分配与团队边界",
  食神: "创造、生活品质与稳定输出",
  伤官: "表达、突破与专业能见度",
  偏财: "机会、流动资源与外部合作",
  正财: "稳健积累、责任与长期主义",
  七杀: "压力、转型与危机中的成长",
  正官: "职位、责任与社会认可",
  偏印: "学习、直觉与内在探索",
  正印: "资质、支持与价值沉淀",
};

const PILLAR_ROLE: Record<PillarKey, { scene: string; psychology: string }> = {
  year: { scene: "原生家庭与早年安全感", psychology: "家庭脚本与早年安全感在这里埋下伏笔" },
  month: { scene: "青年职场与社会角色", psychology: "群体期待与自我定位在这里交锋" },
  day: { scene: "中年伴侣与自我核心", psychology: "亲密关系里的需求与边界在这里显影" },
  hour: { scene: "晚年归宿与内在愿景", psychology: "晚年如何安放自己，取决于此处的精神资源" },
};

const RELATION_PSYCHOLOGY: Record<string, string> = {
  "branch.clash": "两股力量彼此牵引，亲密关系中容易在靠近与抽离之间摆动",
  "branch.hidden-combine": "存在未说出口的默契与牵连，容易形成隐性期待",
  "branch.triple-combine": "容易形成同温层或资源联盟，也可能对外部变化反应偏慢",
  "branch.punishment": "自我审判与反复内耗，关系里容易过度承担",
  "branch.harm": "隐性消耗与误会，需要更直接地表达边界",
  "gan.combine": "对关系有黏合倾向，容易把外部期待内化为责任",
  "ten-god.output-officer": "表达锋芒与规则要求相互拉扯，沟通中容易先硬后软",
  "ten-god.food-kill": "习惯用创造力与行动力化解压力，但也要允许自己求助",
  "ten-god.officer-seal": "倾向用责任与学习来换取安全感，容易把自己绷得太紧",
  "ten-god.kill-seal": "压力越大越会向内寻求意义，需要把独处变成恢复而非逃避",
  "ten-god.wealth-mix": "机会与稳定之间的取舍，是亲密关系里的现实课题",
  "ten-god.output-mix": "表达欲与松弛感并存，需避免用言语替代倾听",
};

const SIX_CLASH_PAIRS = [
  ["子", "午"],
  ["丑", "未"],
  ["寅", "申"],
  ["卯", "酉"],
  ["辰", "戌"],
  ["巳", "亥"],
] as const;

const CATEGORY_REPLACEMENTS: Record<ComplianceCategory, string> = {
  absolute_prediction: "可能",
  fear_inducement: "注意",
  paid_fate_change: "建议",
  professional_advice: "建议咨询专业人士",
};

/** 用户要求的硬词优先覆盖为「可能 / 建议 / 注意」口径。 */
const REQUIRED_REPLACEMENTS: Record<string, string> = {
  必定: "可能",
  注定: "可能",
  必死: "需要重视健康",
  破财: "注意支出",
  改运: "建议调整",
};

function buildSafetyMappings(): { from: string; to: string }[] {
  const map = new Map<string, string>();
  for (const rule of COMPLIANCE_RULES) {
    for (const phrase of rule.phrases) {
      map.set(phrase, CATEGORY_REPLACEMENTS[rule.category]);
    }
  }
  for (const [phrase, replacement] of Object.entries(REQUIRED_REPLACEMENTS)) {
    map.set(phrase, replacement);
  }
  return [...map.entries()]
    .map(([from, to]) => ({ from, to }))
    .sort((left, right) => right.from.length - left.from.length);
}

/** 安全词表：长词优先，避免「破财免灾」被拆成半截替换。 */
export const SAFETY_MAPPINGS: readonly { from: string; to: string }[] = buildSafetyMappings();

/** 报告文本安全过滤：命中合规词表即替换为条件性、建议性表述。 */
export function sanitizeReportText(input: string): { text: string; replacements: SafetyReplacement[] } {
  let text = input;
  const counts = new Map<string, { to: string; count: number }>();

  for (const { from, to } of SAFETY_MAPPINGS) {
    if (!text.includes(from)) continue;
    const count = text.split(from).length - 1;
    text = text.split(from).join(to);
    const previous = counts.get(from);
    counts.set(from, { to, count: (previous?.count ?? 0) + count });
  }

  for (const hit of scanCompliance(text)) {
    text = text.split(hit.phrase).join("需留意");
    counts.set(hit.phrase, { to: "需留意", count: 1 });
  }

  return {
    text,
    replacements: [...counts.entries()].map(([from, value]) => ({ from, to: value.to, count: value.count })),
  };
}

function tenGodOf(dayGan: string, targetGan: string): string {
  const dayElement = ganElement(dayGan);
  const targetElement = ganElement(targetGan);
  const samePolarity = GAN_YANG.has(dayGan) === GAN_YANG.has(targetGan);

  if (dayElement === targetElement) return samePolarity ? "比肩" : "劫财";
  if (ELEMENT_GENERATES[targetElement] === dayElement) return samePolarity ? "偏印" : "正印";
  if (ELEMENT_GENERATES[dayElement] === targetElement) return samePolarity ? "食神" : "伤官";
  if (ELEMENT_CONTROLS[dayElement] === targetElement) return samePolarity ? "偏财" : "正财";
  return samePolarity ? "七杀" : "正官";
}

function relationTone(targetElement: Element, dayElement: Element): string {
  if (targetElement === dayElement) return "同气叠加，主题偏向自我确认、同辈协作与资源整合";
  if (ELEMENT_GENERATES[targetElement] === dayElement) return "生扶日主，支持感与资源感增强，适合学习、积累与借力";
  if (ELEMENT_GENERATES[dayElement] === targetElement) return "输出与消耗并存，创造力活跃，但需要守住作息与节奏";
  if (ELEMENT_CONTROLS[dayElement] === targetElement) return "可控资源与成果感增强，适合整理、落地与长期经营";
  return "压力与规则感上升，需要明确优先级、边界与恢复方式";
}

function yearGanZhi(year: number): { gan: string; zhi: string } {
  const gan = GAN_VALUES[(((year - 4) % 10) + 10) % 10] ?? "甲";
  const zhi = ZHI_VALUES[(((year - 4) % 12) + 12) % 12] ?? "子";
  return { gan, zhi };
}

function dominantGroup(chart: ChartFacts): TenGodGroup {
  const counts: Record<TenGodGroup, number> = { 比劫: 0, 食伤: 0, 财星: 0, 官杀: 0, 印星: 0 };
  for (const key of PILLAR_ORDER) {
    const group = TEN_GOD_GROUP[chart.pillars[key].shiShenGan] ?? "比劫";
    counts[group] += 1;
  }
  const order: TenGodGroup[] = ["比劫", "食伤", "财星", "官杀", "印星"];
  return order.reduce((best, current) => (counts[current] > counts[best] ? current : best), "比劫");
}

function currentDaYun(chart: ChartFacts, year: number) {
  const list = chart.luck.daYun;
  return (
    list.find((item) => year >= item.startYear && year <= item.endYear) ??
    (year < (list[0]?.startYear ?? 0) ? list[0] : list.at(-1))
  );
}

function evidenceLine(hits: readonly RuleHit[]): string {
  if (hits.length === 0) return "本次排盘未命中当前知识库规则，以下分析只保留排盘事实层面的观察。";
  const cited = hits
    .slice(0, 3)
    .map((hit) => `「${hit.name}」（${hit.ruleId}，${hit.school}，置信度${CONFIDENCE_LABELS[hit.confidence]}）`)
    .join("、");
  return `本次引用规则：${cited}${hits.length > 3 ? ` 等 ${hits.length} 条` : ""}。`;
}

/**
 * 本地模板报告生成器（mock provider）。
 * 按同一份 System Prompt 结构输出 Markdown；不发起任何外部请求，相同输入得到相同输出。
 */
export function generateBaziReport({ chart, hits, currentYear }: ReportRequest): BaziReport {
  const year = currentYear ?? new Date().getFullYear();
  const groups = groupRuleHits(hits);
  const dayElement = ganElement(chart.dayMaster);
  const monthZhi = chart.pillars.month.zhi;
  const monthMainGod = chart.pillars.month.shiShenZhi[0] ?? "比肩";
  const dominant = dominantGroup(chart);
  const hitsByName = new Map(hits.map((hit) => [hit.name, hit]));

  const strong = [...hitsByName.values()].find((hit) => hit.name.includes("极旺"));
  const weak = [...hitsByName.values()].find((hit) => hit.name.includes("偏弱"));
  const rootless = [...hitsByName.values()].find((hit) => hit.name.includes("无根"));
  const monthSupport = [...hitsByName.values()].find((hit) => hit.name.includes("得月令"));

  const strengthSentence = strong
    ? `同党之气偏聚，落在「${strong.name}」的观察范围：自我主张强，人生主线常围绕自我确立、同辈竞争与资源整合展开。`
    : weak
      ? `根气偏轻，符合「${weak.name}」的观察：人生主线多在借力、学习与寻找稳定支点中展开，适合先搭系统再谈扩张。`
      : rootless
        ? `四支缺少同日主之根（${rootless.name}）：对环境变化较敏感，适合用技能、作品与关系网络补足底盘。`
        : monthSupport
          ? `月令对日主有生扶（${monthSupport.name}）：成长环境里容易获得某种托举，也要留意依赖惯性与舒适区。`
          : "旺衰信号不极端，气势较为中平：人生主线更依赖后天选择、所处环境与长期习惯。";

  const missingElements = hits.filter((hit) => hit.conflictGroup.startsWith("wuxing.missing"));
  const missingSentence =
    missingElements.length > 0
      ? `命局中${missingElements.map((hit) => `「${hit.name.replace("五行缺", "")}」`).join("、")}之气不显，相关主题往往需要后天主动补位。`
      : "";

  const lines: string[] = [];
  lines.push("# 第一篇：原局剖析·生命蓝图与性格底色", "");
  lines.push("## 1. 能量格局与人生主线", "");
  lines.push(
    `您的日主为${chart.dayMaster}${dayElement}，生于${monthZhi}月。四柱为「${PILLAR_ORDER.map((key) => chart.pillars[key].ganZhi).join(" ")}」，五行分布为木${chart.wuXing.total.木}、火${chart.wuXing.total.火}、土${chart.wuXing.total.土}、金${chart.wuXing.total.金}、水${chart.wuXing.total.水}。${strengthSentence}${missingSentence}`,
    "",
  );
  lines.push(
    `以月令${monthMainGod}气为骨架，可把生命底色看作「${GROUP_PSYCHOLOGY[TEN_GOD_GROUP[monthMainGod] ?? "比劫"]}」。四柱明透以${dominant}为主，${GROUP_PSYCHOLOGY[dominant]}。${evidenceLine(hits)}`,
    "",
  );

  lines.push("## 2. 宫位与心理图景", "");
  for (const key of PILLAR_ORDER) {
    const pillar = chart.pillars[key];
    const role = PILLAR_ROLE[key];
    const god = pillar.shiShenGan;
    const hiddenGod = pillar.shiShenZhi[0] ?? "比肩";
    const godText = god === "日主" ? "日主自身" : `天干${god}`;
    lines.push(
      `${role.scene}看${pillar.label}（${pillar.ganZhi}）：${godText}，${TEN_GOD_PSYCHOLOGY[god] ?? "自我表达"};地支${pillar.zhi}藏${pillar.hideGan[0]}（${hiddenGod}），${role.psychology}。`,
    );
  }
  lines.push("");

  lines.push("## 3. 关系课题与暗藏伏笔", "");
  const relationHits = hits.filter((hit) => RELATION_PSYCHOLOGY[hit.conflictGroup]);
  if (relationHits.length > 0) {
    for (const hit of relationHits.slice(0, 3)) {
      lines.push(
        `「${hit.name}」（${hit.school}，置信度${CONFIDENCE_LABELS[hit.confidence]}）像一条暗线：${RELATION_PSYCHOLOGY[hit.conflictGroup]}。它未必对应具体事件，更像关系里反复出现的心理剧本。`,
      );
    }
  } else {
    lines.push(
      "原局刑冲合害不显，关系课题更多来自日常沟通模式：你更容易在熟悉的人面前放松，也更容易忽略边界与疲惫信号。",
    );
  }
  const conflictGroups = groups.filter((group) => group.hits.length > 1);
  if (conflictGroups.length > 0) {
    const label = CONFLICT_GROUP_LABELS[conflictGroups[0]?.conflictGroup ?? ""] ?? conflictGroups[0]?.conflictGroup ?? "";
    const schools = [...new Set(conflictGroups.flatMap((group) => group.hits.map((hit) => hit.school)))].join("、");
    lines.push(
      `在「${label}」上，${schools} 给出并列判断，本报告保留分歧，不做单一裁决。你可以把两种描述都当作观察自己的镜子，而不是互相排斥的结论。`,
    );
  }
  lines.push("");

  lines.push("# 第二篇：岁运推演·时空环境与吉凶触发", "");
  lines.push("## 1. 当前大运基调", "");
  const daYun = currentDaYun(chart, year);
  if (daYun) {
    const dyGan = daYun.ganZhi.charAt(0);
    const dyZhi = daYun.ganZhi.charAt(1);
    const dyTenGod = tenGodOf(chart.dayMaster, dyGan);
    const dyZhiElement = zhiElement(dyZhi);
    lines.push(
      `当前处于 ${daYun.ganZhi} 大运（${daYun.startYear}–${daYun.endYear}，约 ${daYun.startAge}–${daYun.endAge} 岁）。大运天干${dyGan}为${dyTenGod}，这十年的主旋律偏向${TEN_GOD_LIFE[dyTenGod] ?? "自我调整与外部适应"}；地支${dyZhi}属${dyZhiElement}，${relationTone(dyZhiElement, dayElement)}。`,
      "",
    );
    lines.push(
      `落到现实层面：事业上适合围绕「${TEN_GOD_LIFE[dyTenGod] ?? "长期积累"}」建立可复用的方法，而不是频繁换赛道；财务上宜保留缓冲，把机会分成可承受与不可承受两档；情感上需要把期待说清楚，避免用忙碌替代沟通。`,
      "",
    );
  } else {
    lines.push("当前大运信息不足，暂以原局结构与流年环境为主进行观察。", "");
  }

  lines.push("## 2. 流年震荡与破局点", "");
  const liuNian = yearGanZhi(year);
  const lnTenGod = tenGodOf(chart.dayMaster, liuNian.gan);
  const lnGroup = TEN_GOD_GROUP[lnTenGod] ?? "比劫";
  const lnElement = zhiElement(liuNian.zhi);
  const clashNotes: string[] = [];
  for (const key of PILLAR_ORDER) {
    const pillar = chart.pillars[key];
    const pair = SIX_CLASH_PAIRS.find(
      ([left, right]) =>
        (liuNian.zhi === left && pillar.zhi === right) || (liuNian.zhi === right && pillar.zhi === left),
    );
    if (pair) {
      clashNotes.push(`${pillar.label.replace("柱", "支")}${pillar.zhi}与流年${liuNian.zhi}相冲`);
    }
  }

  lines.push(
    `${year} 年为${liuNian.gan}${liuNian.zhi}流年，天干${liuNian.gan}为${lnTenGod}，主题落在${TEN_GOD_LIFE[lnTenGod] ?? "自我调整"}；地支${liuNian.zhi}属${lnElement}，${relationTone(lnElement, dayElement)}。${clashNotes.length > 0 ? `${clashNotes.join("，")}，生活节奏上可能出现旧安排被重新洗牌的体感。` : "原局与流年未见明显六冲，节奏更适合稳中求进。"}`,
    "",
  );
  lines.push(
    `${lnGroup === "官杀" ? "职场上容易接到更重的责任或更明确的考核，建议把压力拆成可执行清单，先保交付再谈表现。" : lnGroup === "财星" ? "财务主题被激活，机会与支出同时增多，建议先做预算再决定是否加杠杆。" : lnGroup === "食伤" ? "表达与创造欲增强，适合输出作品与方案，但要留意言辞过直带来的摩擦。" : lnGroup === "印星" ? "学习与休整的能量增强，适合进修、复盘与修复关系，不宜用拖延替代休息。" : "同辈与协作主题增强，适合明确分工与利益边界，避免在人情里过度消耗。"}健康上留意睡眠、情绪波动与久坐带来的疲劳，安排规律运动和固定休息；财务上预留缓冲，重要支出先做预算；职场上把冲突转化为流程问题，用复盘代替情绪化回应。`,
    "",
  );
  lines.push(
    `破局点不在于回避变化，而在于把「${relationTone(lnElement, dayElement)}」转成可管理的节奏：每周固定一次复盘，先处理最重要的三件事，再决定哪些机会可以放弃。`,
    "",
  );

  lines.push("# 第三篇：宗师寄语", "");
  const quote =
    strong !== undefined
      ? "持而盈之，不如其已。"
      : weak !== undefined || rootless !== undefined
        ? "天下之至柔，驰骋天下之至坚。"
        : clashNotes.length > 0
          ? "反者道之动。"
          : "知人者智，自知者明。";
  const trait =
    strong !== undefined
      ? "旺盛的行动力与自我主张"
      : weak !== undefined || rootless !== undefined
        ? "敏感、借力与柔韧的适应力"
        : clashNotes.length > 0
          ? "在拉扯中保持清醒的能力"
          : "稳定、自省与持续学习的能力";
  lines.push(`《道德经》说：「${quote}」命局里的${trait}，从来不是需要被修正的缺点，而是一块尚未打磨的璞玉。`, "");
  lines.push(
    "把这份特质用在合适的位置，它就会成为你的专业感、边界感与生命力。愿你既看得见命局里的风，也记得自己才是掌舵的人：先安顿身心，再谈远方；先做好一件小事，再让时间替你累积答案。",
    "",
  );
  lines.push(REPORT_CLOSING);

  const sanitized = sanitizeReportText(lines.join("\n"));
  const markdown = sanitized.text;
  const ruleIds = hits.map((hit) => hit.ruleId);

  return {
    provider: "mock",
    model: REPORT_MODEL,
    title: REPORT_TITLE,
    markdown,
    text: markdown,
    ruleIds,
    conflictGroups: conflictGroups.map((group) => group.conflictGroup),
    safetyReplacements: sanitized.replacements,
  };
}

/** 排队/异常时的统一兜底报告，不暴露任何底层错误细节。 */
export function buildQueuedReport(request: Pick<ReportRequest, "hits">): BaziReport {
  const markdown = `${REPORT_QUEUE_MESSAGE}\n\n${REPORT_CLOSING}`;
  return {
    provider: "unavailable",
    model: "llm",
    title: REPORT_TITLE,
    markdown,
    text: markdown,
    ruleIds: request.hits.map((hit) => hit.ruleId),
    conflictGroups: [],
    safetyReplacements: [],
  };
}

function resolveChatEndpoint(baseUrl: string): string {
  const trimmed = baseUrl.replace(/\/+$/, "");
  return trimmed.endsWith("/chat/completions") ? trimmed : `${trimmed}/chat/completions`;
}

function buildLlmUserPrompt({ chart, hits, currentYear }: ReportRequest): string {
  const year = currentYear ?? new Date().getFullYear();
  return [
    `当前年份：${year} 年。请严格依据以下排盘事实与规则命中生成三篇报告。`,
    "只输出 Markdown 正文，不要代码块，不要额外的前言或说明。",
    "排盘事实与规则命中（JSON）：",
    JSON.stringify({ chart, hits }),
  ].join("\n\n");
}

function extractMessageContent(data: unknown): string | null {
  if (typeof data !== "object" || data === null) return null;
  const choices = (data as { choices?: unknown }).choices;
  if (!Array.isArray(choices) || choices.length === 0) return null;
  const first = choices[0];
  if (typeof first !== "object" || first === null) return null;
  const message = (first as { message?: unknown }).message;
  if (typeof message !== "object" || message === null) return null;
  const content = (message as { content?: unknown }).content;
  return typeof content === "string" && content.trim().length > 0 ? content.trim() : null;
}

function normalizeMarkdown(content: string): string {
  const stripped = content
    .replace(/^```(?:markdown|md)?\s*\n?/i, "")
    .replace(/\n?```\s*$/, "")
    .trim();
  if (stripped.includes(REPORT_CLOSING)) return stripped;
  return `${stripped}\n\n${REPORT_CLOSING}`;
}

/**
 * 服务端真实 LLM 调用（兼容 SiliconFlow / OpenAI Chat Completions）。
 * 任何失败都返回统一排队文案，不向前端泄露状态码、堆栈或提供商信息。
 */
export async function requestBaziReport(request: ReportRequest): Promise<BaziReport> {
  const apiKey = process.env.LLM_API_KEY?.trim();
  const baseUrl = process.env.LLM_BASE_URL?.trim();
  const model = process.env.LLM_MODEL?.trim();

  if (!apiKey || !baseUrl || !model) return buildQueuedReport(request);

  try {
    const response = await fetch(resolveChatEndpoint(baseUrl), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: REPORT_SYSTEM_PROMPT },
          { role: "user", content: buildLlmUserPrompt(request) },
        ],
        temperature: 0.7,
        max_tokens: 4096,
        stream: false,
      }),
      signal: AbortSignal.timeout(60_000),
    });

    if (!response.ok) return buildQueuedReport(request);

    const content = extractMessageContent(await response.json());
    if (!content) return buildQueuedReport(request);

    const sanitized = sanitizeReportText(normalizeMarkdown(content));
    const conflictGroups = groupRuleHits(request.hits).filter((group) => group.hits.length > 1);

    return {
      provider: "llm",
      model,
      title: REPORT_TITLE,
      markdown: sanitized.text,
      text: sanitized.text,
      ruleIds: request.hits.map((hit) => hit.ruleId),
      conflictGroups: conflictGroups.map((group) => group.conflictGroup),
      safetyReplacements: sanitized.replacements,
    };
  } catch {
    return buildQueuedReport(request);
  }
}
