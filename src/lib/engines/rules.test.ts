import { describe, expect, it } from "vitest";

import { getBaziChart } from "@/lib/engines/bazi";
import { evaluateRules, groupRuleHits } from "@/lib/engines/rules";
import { BAZI_RULES, CONFLICT_GROUP_LABELS } from "@/lib/rules/bazi";
import { RuleHitSchema } from "@/lib/schemas/rule-card";

function chartOf(input: { year: number; month: number; day: number; hour: number; minute: number }) {
  return getBaziChart({ ...input, gender: "male" });
}

const normal = chartOf({ year: 1990, month: 1, day: 1, hour: 12, minute: 0 });
const lichun = chartOf({ year: 2000, month: 2, day: 4, hour: 20, minute: 39 });
const ziHour = chartOf({ year: 1988, month: 2, day: 15, hour: 23, minute: 30 });
const missingFire = chartOf({ year: 1971, month: 3, day: 7, hour: 0, minute: 30 });
const strong = chartOf({ year: 1970, month: 1, day: 18, hour: 12, minute: 30 });
const noHit = chartOf({ year: 1962, month: 2, day: 9, hour: 18, minute: 30 });
const officerMix = chartOf({ year: 1970, month: 1, day: 1, hour: 18, minute: 30 });
const missingMetal = chartOf({ year: 1972, month: 2, day: 5, hour: 12, minute: 30 });
const maoYou = chartOf({ year: 1970, month: 1, day: 1, hour: 6, minute: 30 });
const tripleCombine = chartOf({ year: 1970, month: 4, day: 10, hour: 0, minute: 30 });

describe("evaluateRules 命中", () => {
  it("普通案例：子午冲 + 暗合 + 偏印，按规则库顺序返回", () => {
    const hits = evaluateRules(normal, BAZI_RULES);
    expect(hits.map((hit) => hit.name)).toEqual(["地支子午冲", "地支暗合", "天干透偏印"]);
    expect(hits[0]?.evidence[0]).toContain("月支子 与 时支午 构成子午冲");
    expect(hits[1]?.evidence[0]).toContain("月支子 与 年支巳 暗合");
    expect(hits.every((hit) => RuleHitSchema.safeParse(hit).success)).toBe(true);
  });

  it("立春交界案例：正官、偏弱、偏印、辰戌冲", () => {
    const hits = evaluateRules(lichun, BAZI_RULES);
    expect(hits.map((hit) => hit.name)).toEqual([
      "天干透正官",
      "日主同党偏弱（≤35%）",
      "天干透偏印",
      "地支辰戌冲",
    ]);
    expect(hits[0]?.evidence[0]).toContain("年干己为正官");
  });

  it("23 点子时案例：寅丑暗合 + 正印", () => {
    const hits = evaluateRules(ziHour, BAZI_RULES);
    expect(hits.map((hit) => hit.name)).toEqual(["地支暗合", "天干透正印"]);
    expect(hits[0]?.evidence[0]).toContain("月支寅 与 日支丑 暗合");
  });

  it("五行缺火、偏弱、无根、正印", () => {
    const hits = evaluateRules(missingFire, BAZI_RULES);
    expect(hits.map((hit) => hit.name)).toEqual([
      "五行缺火",
      "日主同党偏弱（≤35%）",
      "日主无根（盲派）",
      "天干透正印",
    ]);
    expect(hits[1]?.evidence[0]).toContain("未超过阈值 35%");
    expect(hits[2]?.evidence[0]).toContain("日主辛无根");
  });

  it("日主极旺、得月令、正印", () => {
    const hits = evaluateRules(strong, BAZI_RULES);
    expect(hits.map((hit) => hit.name)).toEqual([
      "日主同党极旺（≥60%）",
      "日主得月令",
      "天干透正印",
    ]);
    expect(hits[0]?.evidence[0]).toContain("12/17");
    expect(hits[1]?.evidence[0]).toContain("「同气」");
    expect(hits[0]?.confidence).toBe("low");
  });

  it("五行缺金", () => {
    const hits = evaluateRules(missingMetal, BAZI_RULES);
    expect(hits.map((hit) => hit.name)).toContain("五行缺金");
    expect(hits.find((hit) => hit.name === "五行缺金")?.evidence[0]).toContain("「金」为 0");
  });

  it("卯酉冲", () => {
    const hits = evaluateRules(maoYou, BAZI_RULES);
    expect(hits.map((hit) => hit.name)).toContain("地支卯酉冲");
    expect(hits.find((hit) => hit.name === "地支卯酉冲")?.evidence[0]).toContain("构成卯酉冲");
  });

  it("申子辰三合水局", () => {
    const hits = evaluateRules(tripleCombine, BAZI_RULES);
    const hit = hits.find((item) => item.name === "地支申子辰三合水局");
    expect(hit).toBeDefined();
    expect(hit?.evidence[0]).toContain("构成申子辰三合水局");
  });

  it("无命中时返回空数组", () => {
    expect(evaluateRules(noHit, BAZI_RULES)).toEqual([]);
    expect(evaluateRules(normal, [])).toEqual([]);
  });
});

describe("冲突组", () => {
  it("官杀同透时并列归入同一冲突组", () => {
    const hits = evaluateRules(officerMix, BAZI_RULES);
    const groups = groupRuleHits(hits);
    const officerGroup = groups.find((group) => group.conflictGroup === "ten-god.officer-mix");
    expect(officerGroup?.hits.map((hit) => hit.name)).toEqual(["天干透正官", "天干透七杀"]);
    expect(CONFLICT_GROUP_LABELS["ten-god.officer-mix"]).toBe("官杀同透");
  });

  it("旺衰组可同时收录偏弱与无根，且不合并结论", () => {
    const groups = groupRuleHits(evaluateRules(missingFire, BAZI_RULES));
    const strengthGroup = groups.find((group) => group.conflictGroup === "strength.day-master");
    expect(strengthGroup?.hits.map((hit) => hit.school)).toEqual(["子平·旺衰", "盲派·旺衰"]);
    expect(strengthGroup?.hits.map((hit) => hit.confidence)).toEqual(["low", "medium"]);
  });

  it("保持命中首次出现的分组顺序", () => {
    const groups = groupRuleHits(evaluateRules(lichun, BAZI_RULES));
    expect(groups.map((group) => group.hits.length)).toEqual([1, 1, 1, 1]);
  });
});
