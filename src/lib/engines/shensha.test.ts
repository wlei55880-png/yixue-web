import { describe, expect, it } from "vitest";

import { SHEN_SHA_DEFINITIONS, matchShenSha } from "../../../data/rules/bazi/shensha";
import { getBaziChart } from "@/lib/engines/bazi";
import { naYinOf } from "@/lib/domain/nayin";
import type { Gan, PillarKey, Zhi } from "@/lib/schemas/chart-facts";

const DEFAULT_CHART = getBaziChart({ year: 1990, month: 1, day: 1, hour: 12, minute: 0, gender: "male" });

describe("纳音五行", () => {
  it.each([
    ["甲子", "海中金", "金"],
    ["乙丑", "海中金", "金"],
    ["丙寅", "炉中火", "火"],
    ["戊辰", "大林木", "木"],
    ["庚午", "路旁土", "土"],
    ["壬戌", "大海水", "水"],
    ["癸亥", "大海水", "水"],
  ])("%s → %s（%s）", (ganZhi, name, element) => {
    expect(naYinOf(ganZhi)).toEqual({ name, element });
  });

  it("拒绝非法或阴阳不匹配的干支", () => {
    expect(() => naYinOf("")).toThrow();
    expect(() => naYinOf("甲")).toThrow();
    expect(() => naYinOf("子甲")).toThrow();
    expect(() => naYinOf("甲丑")).toThrow("阴阳不匹配");
  });

  it("四柱纳音与六十甲子表一致", () => {
    expect(DEFAULT_CHART.pillars.year.naYin).toEqual({ name: "大林木", element: "木" });
    expect(DEFAULT_CHART.pillars.month.naYin).toEqual({ name: "涧下水", element: "水" });
    expect(DEFAULT_CHART.pillars.day.naYin).toEqual({ name: "炉中火", element: "火" });
    expect(DEFAULT_CHART.pillars.hour.naYin).toEqual({ name: "沙中金", element: "金" });
  });
});

describe("空亡", () => {
  it("丙寅日属甲子旬，日柱与年柱旬空均为戌亥", () => {
    expect(DEFAULT_CHART.kongWang.day.branches).toEqual(["戌", "亥"]);
    expect(DEFAULT_CHART.kongWang.year.branches).toEqual(["戌", "亥"]);
  });

  it("辛丑日属甲午旬，旬空辰巳，年支辰命中空亡神煞", () => {
    const chart = getBaziChart({ year: 1988, month: 2, day: 15, hour: 23, minute: 30, gender: "male" });
    expect(chart.pillars.day.ganZhi).toBe("辛丑");
    expect(chart.kongWang.day.branches).toEqual(["辰", "巳"]);
    expect(chart.pillars.year.zhi).toBe("辰");
    expect(chart.pillars.year.shenSha.map((item) => item.name)).toContain("空亡");
  });
});

describe("神煞字典", () => {
  it("首期收录 18 个核心神煞且无重名", () => {
    expect(SHEN_SHA_DEFINITIONS).toHaveLength(18);
    expect(new Set(SHEN_SHA_DEFINITIONS.map((item) => item.name)).size).toBe(18);
    for (const name of ["天乙贵人", "文昌贵人", "桃花", "驿马", "华盖", "空亡", "羊刃", "将星", "劫煞", "灾煞"]) {
      expect(SHEN_SHA_DEFINITIONS.map((item) => item.name)).toContain(name);
    }
  });

  function hitsOf(zhi: Zhi, options: { dayGan?: Gan; yearGan?: Gan; dayZhi?: Zhi; yearZhi?: Zhi } = {}) {
    return matchShenSha({
      dayGan: options.dayGan ?? "甲",
      yearGan: options.yearGan ?? "甲",
      dayZhi: options.dayZhi ?? "申",
      yearZhi: options.yearZhi ?? "申",
      dayXunKong: ["戌", "亥"],
      pillars: [{ key: "year" as PillarKey, zhi }],
    }).year;
  }

  it("三合局神煞按申子辰等局查地支", () => {
    expect(hitsOf("酉").map((item) => item.name)).toContain("桃花");
    expect(hitsOf("寅").map((item) => item.name)).toContain("驿马");
    expect(hitsOf("辰").map((item) => item.name)).toContain("华盖");
    expect(hitsOf("子").map((item) => item.name)).toContain("将星");
    expect(hitsOf("巳").map((item) => item.name)).toContain("劫煞");
    expect(hitsOf("午").map((item) => item.name)).toContain("灾煞");
    expect(hitsOf("亥").map((item) => item.name)).toContain("亡神");
  });

  it("按年支查孤辰、寡宿、红鸾、天喜", () => {
    expect(hitsOf("寅", { yearZhi: "亥" }).map((item) => item.name)).toContain("孤辰");
    expect(hitsOf("戌", { yearZhi: "亥" }).map((item) => item.name)).toContain("寡宿");
    expect(hitsOf("辰", { yearZhi: "亥" }).map((item) => item.name)).toContain("红鸾");
    expect(hitsOf("戌", { yearZhi: "亥" }).map((item) => item.name)).toContain("天喜");
  });

  it("天乙贵人按日干优先、年干兜底，并记录命中依据", () => {
    const byDayGan = hitsOf("酉", { dayGan: "丙", yearGan: "己" });
    expect(byDayGan.find((item) => item.name === "天乙贵人")).toMatchObject({
      name: "天乙贵人",
      basedOn: "日干丙",
    });

    const byYearGan = hitsOf("子", { dayGan: "丙", yearGan: "己" });
    expect(byYearGan.find((item) => item.name === "天乙贵人")).toMatchObject({
      name: "天乙贵人",
      basedOn: "年干己",
    });
  });

  it("同一神煞在日干、年干同时命中时只保留一次", () => {
    const hits = hitsOf("丑", { dayGan: "甲", yearGan: "戊" });
    expect(hits.filter((item) => item.name === "天乙贵人")).toHaveLength(1);
    expect(hits.find((item) => item.name === "天乙贵人")?.basedOn).toBe("日干甲");
  });

  it("默认命盘逐柱命中核心神煞", () => {
    expect(DEFAULT_CHART.pillars.year.shenSha.map((item) => item.name)).toEqual(["禄神", "亡神"]);
    expect(DEFAULT_CHART.pillars.month.shenSha.map((item) => item.name)).toEqual(["天乙贵人", "灾煞"]);
    expect(DEFAULT_CHART.pillars.day.shenSha.map((item) => item.name)).toEqual(["国印贵人", "劫煞"]);
    expect(DEFAULT_CHART.pillars.hour.shenSha.map((item) => item.name)).toEqual(["羊刃", "桃花", "将星"]);
  });

  it("每条神煞命中都带五行与依据", () => {
    for (const key of ["year", "month", "day", "hour"] as const) {
      for (const item of DEFAULT_CHART.pillars[key].shenSha) {
        expect(item.element).toMatch(/^[木火土金水]$/);
        expect(item.basedOn.length).toBeGreaterThan(0);
      }
    }
  });
});
