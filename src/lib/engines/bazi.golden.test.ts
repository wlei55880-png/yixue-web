import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { getBaziChart } from "@/lib/engines/bazi";
import { ChartFactsSchema, type BaziRequest, type ChartFacts } from "@/lib/schemas/chart-facts";

interface GoldenCase {
  name: string;
  description: string;
  reference: string;
  input: BaziRequest;
  expected: ChartFacts;
}

const GOLDEN_DIR = resolve(process.cwd(), "data/cases/golden/bazi");
const goldenFiles = readdirSync(GOLDEN_DIR)
  .filter((file) => file.endsWith(".json"))
  .sort();
const goldenCases = goldenFiles.map((file) => ({
  file,
  data: JSON.parse(readFileSync(join(GOLDEN_DIR, file), "utf8")) as GoldenCase,
}));

describe("黄金案例目录", () => {
  it("至少包含 3 个案例，并覆盖普通、立春交界、23 点子时", () => {
    expect(goldenFiles.length).toBeGreaterThanOrEqual(3);
    expect(goldenFiles.some((file) => file.includes("normal"))).toBe(true);
    expect(goldenFiles.some((file) => file.includes("lichun"))).toBe(true);
    expect(goldenFiles.some((file) => file.includes("zi-hour"))).toBe(true);
  });
});

describe.each(goldenCases)("黄金案例 $file", ({ data }) => {
  it("排盘结果与黄金快照完全一致", () => {
    expect(getBaziChart(data.input)).toEqual(data.expected);
  });

  it("黄金快照本身通过 ChartFactsSchema 校验", () => {
    const parsed = ChartFactsSchema.safeParse(data.expected);
    const detail = parsed.success ? "" : JSON.stringify(parsed.error.issues);
    expect(parsed.success, detail).toBe(true);
  });
});

describe("立春交接时刻分界", () => {
  it("交接前 1 分 39 秒仍属己卯年、丁丑月", () => {
    const chart = getBaziChart({ year: 2000, month: 2, day: 4, hour: 20, minute: 39, gender: "male" });
    expect(chart.pillars.year.ganZhi).toBe("己卯");
    expect(chart.pillars.month.ganZhi).toBe("丁丑");
  });

  it("交接后同一小时内切换为庚辰年、戊寅月", () => {
    const chart = getBaziChart({ year: 2000, month: 2, day: 4, hour: 20, minute: 41, gender: "male" });
    expect(chart.pillars.year.ganZhi).toBe("庚辰");
    expect(chart.pillars.month.ganZhi).toBe("戊寅");
  });
});

describe("23 点子时换日口径", () => {
  const base = { year: 1988, month: 2, day: 15, hour: 23, minute: 30, gender: "male" as const };

  it("默认 sect=1：23:00 起算次日，日柱辛丑、时柱戊子", () => {
    const chart = getBaziChart(base);
    expect(chart.input.sect).toBe(1);
    expect(chart.pillars.day.ganZhi).toBe("辛丑");
    expect(chart.pillars.hour.ganZhi).toBe("戊子");
  });

  it("sect=2：晚子时归当日，日柱庚子、时柱丙子，时干十神为七杀", () => {
    const chart = getBaziChart({ ...base, sect: 2 });
    expect(chart.input.sect).toBe(2);
    expect(chart.pillars.day.ganZhi).toBe("庚子");
    expect(chart.pillars.hour.ganZhi).toBe("丙子");
    expect(chart.pillars.hour.shiShenGan).toBe("七杀");
    expect(ChartFactsSchema.safeParse(chart).success).toBe(true);
  });
});

describe("引擎输入防护", () => {
  it("拒绝不存在的公历日期", () => {
    expect(() => getBaziChart({ year: 2023, month: 2, day: 30, hour: 12, minute: 0, gender: "female" })).toThrow(
      "出生日期不存在，请检查月份与日期",
    );
  });
});
