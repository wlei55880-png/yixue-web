import { describe, expect, it } from "vitest";

import { scanCompliance } from "@/lib/compliance";
import { getBaziChart } from "@/lib/engines/bazi";
import { evaluateRules } from "@/lib/engines/rules";
import { BAZI_RULES } from "@/lib/rules/bazi";

import { generateBaziReport, REPORT_DISCLAIMER, sanitizeReportText } from "./gateway";

const chart = getBaziChart({ year: 1990, month: 1, day: 1, hour: 12, minute: 0, gender: "male" });
const hits = evaluateRules(chart, BAZI_RULES);
const report = generateBaziReport({ chart, hits });

describe("generateBaziReport（本地 mock）", () => {
  it("引用排盘事实与命中规则", () => {
    expect(report.provider).toBe("mock");
    expect(report.text).toContain("日主为丙火");
    expect(report.text).toContain("四柱为「己巳 丙子 丙寅 甲午」");
    expect(report.text).toContain("地支子午冲");
    expect(report.ruleIds).toEqual(hits.map((hit) => hit.ruleId));
    expect(report.text).toContain(REPORT_DISCLAIMER);
  });

  it("相同输入输出完全一致", () => {
    const again = generateBaziReport({ chart, hits });
    expect(again.text).toBe(report.text);
    expect(again.safetyReplacements).toEqual(report.safetyReplacements);
  });

  it("报告长度在约 300 字的合理区间", () => {
    expect(report.text.length).toBeGreaterThan(250);
    expect(report.text.length).toBeLessThan(800);
  });

  it("输出通过合规词表扫描", () => {
    expect(scanCompliance(report.text)).toEqual([]);
    for (const word of ["必定", "注定", "破财", "改运"]) {
      expect(report.text).not.toContain(word);
    }
  });

  it("冲突组在报告中并列提示，不做单一裁决", () => {
    const officerChart = getBaziChart({ year: 1970, month: 1, day: 1, hour: 18, minute: 30, gender: "male" });
    const officerReport = generateBaziReport({ chart: officerChart, hits: evaluateRules(officerChart, BAZI_RULES) });
    expect(officerReport.conflictGroups).toContain("ten-god.officer-mix");
    expect(officerReport.text).toContain("官杀同透");
    expect(officerReport.text).toContain("保留分歧");
  });

  it("无命中时明确说明知识库边界", () => {
    const emptyChart = getBaziChart({ year: 1962, month: 2, day: 9, hour: 18, minute: 30, gender: "male" });
    const emptyReport = generateBaziReport({ chart: emptyChart, hits: [] });
    expect(emptyReport.paragraphs.join("")).toContain("未命中当前知识库");
  });
});

describe("sanitizeReportText", () => {
  it("将绝对化与恐吓词替换为条件性表述", () => {
    const result = sanitizeReportText("您必定破财，注定要改运，还可能有血光之灾。");
    expect(result.text).toContain("可能");
    expect(result.text).toContain("注意");
    expect(result.text).toContain("建议");
    expect(scanCompliance(result.text)).toEqual([]);
    expect(result.replacements.length).toBeGreaterThan(0);
    for (const word of ["必定", "注定", "破财", "改运"]) {
      expect(result.text).not.toContain(word);
    }
  });

  it("长词优先替换，避免半截残留", () => {
    const result = sanitizeReportText("破财免灾");
    expect(result.text).toBe("注意");
  });
});
