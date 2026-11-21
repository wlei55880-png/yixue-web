import { describe, expect, it } from "vitest";

import { COMPLIANCE_RULES, isCompliant, scanCompliance } from "@/lib/compliance";

describe("scanCompliance", () => {
  it("对干净文案返回空数组", () => {
    expect(scanCompliance("按规则 R-001 的条件，此组合偏向稳健，置信度中。")).toEqual([]);
    expect(isCompliant("知识库未覆盖该主题。")).toBe(true);
  });

  it("命中绝对化断言并给出规则编号与位置", () => {
    const hits = scanCompliance("你必定在明年转运。");
    expect(hits).toHaveLength(1);
    expect(hits[0]).toMatchObject({
      ruleId: "C-ABS-001",
      category: "absolute_prediction",
      phrase: "必定",
      index: 1,
    });
  });

  it("命中恐吓、付费改运与越界建议", () => {
    const hits = scanCompliance("此为血光之灾，需开光化解；另建议停药。");
    expect(hits.map((hit) => hit.category)).toEqual([
      "fear_inducement",
      "paid_fate_change",
      "professional_advice",
    ]);
  });

  it("同一短语多次出现时全部记录", () => {
    const hits = scanCompliance("注定如此，仍然注定。");
    expect(hits).toHaveLength(2);
    expect(hits.map((hit) => hit.index)).toEqual([0, 7]);
  });

  it("每条规则都有唯一编号与非空词表", () => {
    const ids = COMPLIANCE_RULES.map((rule) => rule.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const rule of COMPLIANCE_RULES) {
      expect(rule.phrases.length).toBeGreaterThan(0);
      expect(rule.guidance.length).toBeGreaterThan(0);
    }
  });
});
