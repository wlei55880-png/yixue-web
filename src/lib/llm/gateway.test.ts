import { describe, expect, it } from "vitest";

import { scanCompliance } from "@/lib/compliance";
import { getBaziChart } from "@/lib/engines/bazi";
import { evaluateRules } from "@/lib/engines/rules";
import { BAZI_RULES } from "@/lib/rules/bazi";

import { generateBaziReport, REPORT_CLOSING, REPORT_SYSTEM_PROMPT, sanitizeReportText } from "./gateway";

const chart = getBaziChart({ year: 1990, month: 1, day: 1, hour: 12, minute: 0, gender: "male" });
const hits = evaluateRules(chart, BAZI_RULES);
const report = generateBaziReport({ chart, hits, currentYear: 2026 });

const FORBIDDEN_WORDS = ["必定", "注定", "破财", "改运", "必死"] as const;

describe("generateBaziReport（本地 mock）", () => {
  it("按三篇结构输出 Markdown，并引用排盘事实", () => {
    expect(report.provider).toBe("mock");
    expect(report.markdown).toContain("# 第一篇：原局剖析·生命蓝图与性格底色");
    expect(report.markdown).toContain("## 1. 能量格局与人生主线");
    expect(report.markdown).toContain("## 2. 宫位与心理图景");
    expect(report.markdown).toContain("## 3. 关系课题与暗藏伏笔");
    expect(report.markdown).toContain("# 第二篇：岁运推演·时空环境与吉凶触发");
    expect(report.markdown).toContain("## 1. 当前大运基调");
    expect(report.markdown).toContain("## 2. 流年震荡与破局点");
    expect(report.markdown).toContain("# 第三篇：宗师寄语");
    expect(report.markdown).toContain("日主为丙火");
    expect(report.markdown).toContain("四柱为「己巳 丙子 丙寅 甲午」");
    expect(report.markdown).toContain("地支子午冲");
    expect(report.markdown.endsWith(REPORT_CLOSING)).toBe(true);
    expect(report.ruleIds).toEqual(hits.map((hit) => hit.ruleId));
  });

  it("相同输入输出完全一致", () => {
    const again = generateBaziReport({ chart, hits, currentYear: 2026 });
    expect(again.markdown).toBe(report.markdown);
    expect(again.safetyReplacements).toEqual(report.safetyReplacements);
  });

  it("三篇报告长度在合理区间", () => {
    expect(report.markdown.length).toBeGreaterThan(1200);
    expect(report.markdown.length).toBeLessThan(8000);
  });

  it("输出通过合规词表扫描", () => {
    expect(scanCompliance(report.markdown)).toEqual([]);
    for (const word of FORBIDDEN_WORDS) {
      expect(report.markdown).not.toContain(word);
    }
  });

  it("冲突组在报告中并列提示，不做单一裁决", () => {
    const officerChart = getBaziChart({ year: 1970, month: 1, day: 1, hour: 18, minute: 30, gender: "male" });
    const officerReport = generateBaziReport({
      chart: officerChart,
      hits: evaluateRules(officerChart, BAZI_RULES),
      currentYear: 2026,
    });
    expect(officerReport.conflictGroups).toContain("ten-god.officer-mix");
    expect(officerReport.markdown).toContain("官杀同透");
    expect(officerReport.markdown).toContain("保留分歧");
  });

  it("无命中时明确说明知识库边界", () => {
    const emptyChart = getBaziChart({ year: 1962, month: 2, day: 9, hour: 18, minute: 30, gender: "male" });
    const emptyReport = generateBaziReport({ chart: emptyChart, hits: [], currentYear: 2026 });
    expect(emptyReport.markdown).toContain("未命中当前知识库");
    expect(emptyReport.markdown.endsWith(REPORT_CLOSING)).toBe(true);
  });
});

describe("REPORT_SYSTEM_PROMPT", () => {
  it("包含宗师角色、三篇结构与硬拦截要求", () => {
    expect(REPORT_SYSTEM_PROMPT).toContain("宗师");
    expect(REPORT_SYSTEM_PROMPT).toContain("荣格");
    expect(REPORT_SYSTEM_PROMPT).toContain("# 第一篇：原局剖析·生命蓝图与性格底色");
    expect(REPORT_SYSTEM_PROMPT).toContain("# 第二篇：岁运推演·时空环境与吉凶触发");
    expect(REPORT_SYSTEM_PROMPT).toContain("# 第三篇：宗师寄语");
    expect(REPORT_SYSTEM_PROMPT).toContain("严禁出现“必定、注定、改运、必死、破财”");
    expect(REPORT_SYSTEM_PROMPT).toContain(REPORT_CLOSING);
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
    for (const word of FORBIDDEN_WORDS) {
      expect(result.text).not.toContain(word);
    }
  });

  it("单独拦截「必死」", () => {
    const result = sanitizeReportText("此局必死");
    expect(result.text).toBe("此局需要重视健康");
  });

  it("长词优先替换，避免半截残留", () => {
    const result = sanitizeReportText("破财免灾");
    expect(result.text).toBe("注意");
  });
});
