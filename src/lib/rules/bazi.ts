import alliesShareRule from "../../../data/rules/bazi/01-day-master-allies-60.json";
import missingFireRule from "../../../data/rules/bazi/02-missing-fire.json";
import visibleZhengGuanRule from "../../../data/rules/bazi/03-visible-zhengguan.json";
import ziWuClashRule from "../../../data/rules/bazi/04-zi-wu-clash.json";
import hiddenCombineRule from "../../../data/rules/bazi/05-branch-hidden-combine.json";
import { RuleCardListSchema, type RuleCard } from "@/lib/schemas/rule-card";

/** 已收录的基础规则卡；启动时立即校验，结构不合法会直接抛错。 */
export const BAZI_RULES: RuleCard[] = RuleCardListSchema.parse([
  alliesShareRule,
  missingFireRule,
  visibleZhengGuanRule,
  ziWuClashRule,
  hiddenCombineRule,
]);
