export type ComplianceCategory =
  | "absolute_prediction"
  | "fear_inducement"
  | "paid_fate_change"
  | "professional_advice";

export interface ComplianceRule {
  id: string;
  category: ComplianceCategory;
  categoryLabel: string;
  label: string;
  phrases: readonly string[];
  guidance: string;
}

/**
 * 文案合规硬约束（对应产品约束 5）。
 * 这些词表用于校验 LLM 输出与前端文案，命中即视为需要改写。
 */
export const COMPLIANCE_RULES: readonly ComplianceRule[] = [
  {
    id: "C-ABS-001",
    category: "absolute_prediction",
    categoryLabel: "绝对化预测",
    label: "绝对化断言",
    phrases: ["必定", "必然会", "一定会", "百分之百", "100%", "注定", "铁定", "绝对会", "逃不掉"],
    guidance: "改为条件性表述，并标注规则编号、适用条件与置信度。",
  },
  {
    id: "C-FEAR-001",
    category: "fear_inducement",
    categoryLabel: "恐吓式表达",
    label: "灾祸恐吓",
    phrases: ["血光之灾", "大凶之兆", "灾祸难逃", "必遭横祸", "破财免灾", "短命", "克夫", "克妻", "绝后"],
    guidance: "删除灾祸与克亲断言；如需讨论传统术语，仅作知识性说明并注明流派争议。",
  },
  {
    id: "C-PAY-001",
    category: "paid_fate_change",
    categoryLabel: "付费改运",
    label: "付费改运/消灾",
    phrases: ["付费改运", "花钱改运", "开光", "转运符", "法事化解", "消灾套餐", "购买改运", "化解收费"],
    guidance: "产品不提供任何付费改运、消灾或法事类服务，删除相关引导。",
  },
  {
    id: "C-PRO-001",
    category: "professional_advice",
    categoryLabel: "越界专业建议",
    label: "医疗/法律/投资/婚姻决策建议",
    phrases: ["建议停药", "无需就医", "包治", "投资建议", "建议买入", "建议卖出", "法律建议", "建议离婚", "必须离婚", "包生男"],
    guidance: "改为提示咨询对应领域专业人士，不作具体决策建议。",
  },
] as const;

export interface ComplianceHit {
  ruleId: string;
  category: ComplianceCategory;
  categoryLabel: string;
  phrase: string;
  index: number;
  guidance: string;
}

/** 扫描文本中的不合规表达，按出现位置升序返回。 */
export function scanCompliance(text: string): ComplianceHit[] {
  const hits: ComplianceHit[] = [];

  for (const rule of COMPLIANCE_RULES) {
    for (const phrase of rule.phrases) {
      let from = 0;
      while (from <= text.length - phrase.length) {
        const index = text.indexOf(phrase, from);
        if (index === -1) break;
        hits.push({
          ruleId: rule.id,
          category: rule.category,
          categoryLabel: rule.categoryLabel,
          phrase,
          index,
          guidance: rule.guidance,
        });
        from = index + phrase.length;
      }
    }
  }

  return hits.sort((a, b) => a.index - b.index);
}

export function isCompliant(text: string): boolean {
  return scanCompliance(text).length === 0;
}
