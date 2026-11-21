import { describe, expect, it } from "vitest";

import { getBaziChart } from "@/lib/engines/bazi";
import { BaziRequestSchema, ChartFactsSchema, type BaziRequest } from "@/lib/schemas/chart-facts";

const VALID_REQUEST = { year: 1990, month: 1, day: 1, hour: 12, minute: 0, gender: "male" } satisfies BaziRequest;

describe("BaziRequestSchema", () => {
  it("接受合法输入，sect 可省略", () => {
    const parsed = BaziRequestSchema.safeParse(VALID_REQUEST);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.sect).toBeUndefined();
    }
  });

  it("接受 sect=2", () => {
    expect(BaziRequestSchema.safeParse({ ...VALID_REQUEST, sect: 2 }).success).toBe(true);
  });

  it.each([
    ["年份越界", { year: 1899 }],
    ["月份越界", { month: 13 }],
    ["日期越界", { day: 0 }],
    ["小时越界", { hour: 24 }],
    ["分钟越界", { minute: 60 }],
    ["非整数年份", { year: 1990.5 }],
    ["非法性别", { gender: "other" }],
    ["非法 sect", { sect: 3 }],
  ])("拒绝%s", (_label, patch) => {
    expect(BaziRequestSchema.safeParse({ ...VALID_REQUEST, ...patch }).success).toBe(false);
  });

  it("拒绝缺少性别", () => {
    expect(
      BaziRequestSchema.safeParse({ year: 1990, month: 1, day: 1, hour: 12, minute: 0 }).success,
    ).toBe(false);
  });

  it("拒绝多余字段", () => {
    expect(BaziRequestSchema.safeParse({ ...VALID_REQUEST, name: "张三" }).success).toBe(false);
  });
});

describe("ChartFactsSchema", () => {
  const chart = getBaziChart(VALID_REQUEST);

  it("引擎输出通过校验，且截断默认口径", () => {
    const parsed = ChartFactsSchema.safeParse(chart);
    expect(parsed.success).toBe(true);
    expect(chart.input.sect).toBe(1);
    expect(chart.conventions.sectLabel).toContain("23:00");
  });

  it("拒绝被篡改的干支组合", () => {
    const tampered = structuredClone(chart);
    tampered.pillars.year.ganZhi = "甲子";
    expect(ChartFactsSchema.safeParse(tampered).success).toBe(false);
  });

  it("拒绝五行总数与明细不一致", () => {
    const tampered = structuredClone(chart);
    tampered.wuXing.total.木 += 1;
    expect(ChartFactsSchema.safeParse(tampered).success).toBe(false);
  });

  it("拒绝日主与日柱天干不一致", () => {
    const tampered = structuredClone(chart);
    tampered.dayMaster = chart.dayMaster === "甲" ? "乙" : "甲";
    expect(ChartFactsSchema.safeParse(tampered).success).toBe(false);
  });

  it("拒绝日柱天干十神不是「日主」", () => {
    const tampered = structuredClone(chart);
    tampered.pillars.day.shiShenGan = "比肩";
    expect(ChartFactsSchema.safeParse(tampered).success).toBe(false);
  });

  it("拒绝藏干与藏干十神数量不一致", () => {
    const tampered = structuredClone(chart);
    tampered.pillars.year.shiShenZhi = tampered.pillars.year.shiShenZhi.slice(0, 1);
    expect(ChartFactsSchema.safeParse(tampered).success).toBe(false);
  });

  it("拒绝大运跨度不是 10 年", () => {
    const tampered = structuredClone(chart);
    const firstDaYun = tampered.luck.daYun.at(0);
    expect(firstDaYun).toBeDefined();
    if (!firstDaYun) return;
    firstDaYun.endYear += 1;
    expect(ChartFactsSchema.safeParse(tampered).success).toBe(false);
  });

  it("拒绝多余字段", () => {
    const tampered = structuredClone(chart) as Record<string, unknown>;
    tampered.extra = true;
    expect(ChartFactsSchema.safeParse(tampered).success).toBe(false);
  });
});
