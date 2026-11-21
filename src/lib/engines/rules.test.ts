import { describe, expect, it } from "vitest";

import { getBaziChart } from "@/lib/engines/bazi";
import { evaluateRules } from "@/lib/engines/rules";
import { BAZI_RULES } from "@/lib/rules/bazi";
import { RuleHitSchema } from "@/lib/schemas/rule-card";

function chartOf(input: { year: number; month: number; day: number; hour: number; minute: number }) {
  return getBaziChart({ ...input, gender: "male" });
}

const normal = chartOf({ year: 1990, month: 1, day: 1, hour: 12, minute: 0 });
const lichun = chartOf({ year: 2000, month: 2, day: 4, hour: 20, minute: 39 });
const ziHour = chartOf({ year: 1988, month: 2, day: 15, hour: 23, minute: 30 });
const missingFire = chartOf({ year: 1971, month: 3, day: 7, hour: 0, minute: 30 });
const strong = chartOf({ year: 1970, month: 1, day: 18, hour: 12, minute: 30 });
const noHit = chartOf({ year: 1970, month: 1, day: 3, hour: 0, minute: 30 });

describe("evaluateRules 命中", () => {
  it("普通案例：子午冲 + 子巳暗合，按规则库顺序返回", () => {
    const hits = evaluateRules(normal, BAZI_RULES);
    expect(hits.map((hit) => hit.name)).toEqual(["地支子午冲", "地支暗合"]);
    expect(hits[0]?.evidence[0]).toContain("月支子 与 时支午 构成子午冲");
    expect(hits[1]?.evidence[0]).toContain("月支子 与 年支巳 暗合");
    expect(hits.every((hit) => RuleHitSchema.safeParse(hit).success)).toBe(true);
  });

  it("立春交界案例：天干透正官（年干己）", () => {
    const hits = evaluateRules(lichun, BAZI_RULES);
    expect(hits).toHaveLength(1);
    expect(hits[0]?.ruleId).toBe("bazi.ten-god.visible-zhengguan.001");
    expect(hits[0]?.evidence[0]).toContain("年干己为正官");
  });

  it("23 点子时案例：寅丑暗合", () => {
    const hits = evaluateRules(ziHour, BAZI_RULES);
    expect(hits).toHaveLength(1);
    expect(hits[0]?.name).toBe("地支暗合");
    expect(hits[0]?.evidence[0]).toContain("月支寅 与 日支丑 暗合");
  });

  it("五行缺火：1971-03-07 00:30 的五行合计无火", () => {
    const hits = evaluateRules(missingFire, BAZI_RULES);
    expect(hits.map((hit) => hit.name)).toEqual(["五行缺火"]);
    expect(hits[0]?.evidence[0]).toContain("「火」为 0");
  });

  it("日主同党极旺：1970-01-18 12:30 同党占比 70.6%", () => {
    const hits = evaluateRules(strong, BAZI_RULES);
    expect(hits.map((hit) => hit.name)).toEqual(["日主同党极旺（≥60%）"]);
    expect(hits[0]?.evidence[0]).toContain("12/17");
    expect(hits[0]?.confidence).toBe("low");
  });

  it("无命中时返回空数组", () => {
    expect(evaluateRules(noHit, BAZI_RULES)).toEqual([]);
    expect(evaluateRules(normal, [])).toEqual([]);
  });

  it("命中结果携带来源、冲突组与结论", () => {
    const hit = evaluateRules(lichun, BAZI_RULES)[0];
    expect(hit?.school).toBe("子平·十神");
    expect(hit?.source.work).toBe("《子平真诠》");
    expect(hit?.conflictGroup).toBe("ten-god.officer");
    expect(hit?.output.caveat.length).toBeGreaterThan(0);
  });
});
