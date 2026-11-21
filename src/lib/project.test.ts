import { describe, expect, it } from "vitest";

import { isCompliant } from "@/lib/compliance";
import { DISCLAIMER_POINTS, DISCLAIMER_TEXT, MILESTONES, PRINCIPLES, V1_STEPS } from "@/lib/project";

describe("项目常量", () => {
  it("里程碑编号唯一，且仅有一个进行中", () => {
    const ids = MILESTONES.map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(MILESTONES.filter((item) => item.status === "in_progress").length).toBeLessThanOrEqual(1);
    expect(ids).toEqual(["M1", "M2", "M3", "M4", "M5", "M6", "M7"]);
  });

  it("V1 闭环包含录入、排盘、报告三个阶段", () => {
    expect(V1_STEPS).toHaveLength(3);
    expect(V1_STEPS.map((step) => step.title)).toEqual(["录入出生信息", "确定性排盘", "命中规则·生成报告"]);
  });

  it("边界声明与产品原则本身通过合规扫描", () => {
    const corpus = [DISCLAIMER_TEXT, ...DISCLAIMER_POINTS, ...PRINCIPLES.map((item) => item.description)].join("\n");
    expect(isCompliant(corpus)).toBe(true);
  });
});
