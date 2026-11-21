import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { RuleCardListSchema, RuleCardSchema } from "@/lib/schemas/rule-card";

const RULES_DIR = resolve(process.cwd(), "data/rules/bazi");
const ruleFiles = readdirSync(RULES_DIR)
  .filter((file) => file.endsWith(".json"))
  .sort();
const ruleDocuments = ruleFiles.map(
  (file) => JSON.parse(readFileSync(join(RULES_DIR, file), "utf8")) as unknown,
);

describe("规则卡文件", () => {
  it("收录 5 条基础规则，且全部通过 Schema 校验", () => {
    expect(ruleFiles).toHaveLength(5);
    const parsed = RuleCardListSchema.safeParse(ruleDocuments);
    const detail = parsed.success ? "" : JSON.stringify(parsed.error.issues);
    expect(parsed.success, detail).toBe(true);
  });

  it("规则编号唯一", () => {
    const ids = ruleDocuments.map((rule) => RuleCardSchema.parse(rule).id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("RuleCardSchema 防护", () => {
  const base = RuleCardSchema.parse(ruleDocuments[0]);

  it("拒绝非法置信度", () => {
    expect(RuleCardSchema.safeParse({ ...base, confidence: "very-high" }).success).toBe(false);
  });

  it("拒绝非法的地支六冲对", () => {
    const invalid = { ...base, condition: { type: "branchClash", branches: ["子", "丑"] } };
    expect(RuleCardSchema.safeParse(invalid).success).toBe(false);
  });

  it("拒绝非法的地支暗合对", () => {
    const invalid = { ...base, condition: { type: "branchHiddenCombine", pairs: [["子", "午"]] } };
    expect(RuleCardSchema.safeParse(invalid).success).toBe(false);
  });

  it("拒绝非法的规则编号与冲突组", () => {
    expect(RuleCardSchema.safeParse({ ...base, id: "rule-1" }).success).toBe(false);
    expect(RuleCardSchema.safeParse({ ...base, conflictGroup: "冲突组" }).success).toBe(false);
  });

  it("拒绝多余字段", () => {
    expect(RuleCardSchema.safeParse({ ...base, weight: 1 }).success).toBe(false);
  });

  it("拒绝重复编号的规则列表", () => {
    expect(RuleCardListSchema.safeParse([base, base]).success).toBe(false);
  });
});
