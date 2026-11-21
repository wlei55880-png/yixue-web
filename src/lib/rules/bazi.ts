import alliesShareRule from "../../../data/rules/bazi/01-day-master-allies-60.json";
import missingFireRule from "../../../data/rules/bazi/02-missing-fire.json";
import visibleZhengGuanRule from "../../../data/rules/bazi/03-visible-zhengguan.json";
import ziWuClashRule from "../../../data/rules/bazi/04-zi-wu-clash.json";
import hiddenCombineRule from "../../../data/rules/bazi/05-branch-hidden-combine.json";
import alliesShareBelowRule from "../../../data/rules/bazi/06-day-master-allies-35.json";
import rootlessRule from "../../../data/rules/bazi/07-day-master-rootless.json";
import monthSupportRule from "../../../data/rules/bazi/08-month-support.json";
import missingMetalRule from "../../../data/rules/bazi/09-missing-metal.json";
import visibleQiShaRule from "../../../data/rules/bazi/10-visible-qisha.json";
import visibleZhengYinRule from "../../../data/rules/bazi/11-visible-zhengyin.json";
import visiblePianYinRule from "../../../data/rules/bazi/12-visible-pianyin.json";
import maoYouClashRule from "../../../data/rules/bazi/13-mao-you-clash.json";
import chenXuClashRule from "../../../data/rules/bazi/14-chen-xu-clash.json";
import shenZiChenRule from "../../../data/rules/bazi/15-shen-zi-chen-combine.json";
import { RuleCardListSchema, type RuleCard } from "@/lib/schemas/rule-card";

/** 已收录的基础规则卡；启动时立即校验，结构不合法会直接抛错。 */
export const BAZI_RULES: RuleCard[] = RuleCardListSchema.parse([
  alliesShareRule,
  missingFireRule,
  visibleZhengGuanRule,
  ziWuClashRule,
  hiddenCombineRule,
  alliesShareBelowRule,
  rootlessRule,
  monthSupportRule,
  missingMetalRule,
  visibleQiShaRule,
  visibleZhengYinRule,
  visiblePianYinRule,
  maoYouClashRule,
  chenXuClashRule,
  shenZiChenRule,
]);

/** 冲突组的人类可读名称。 */
export const CONFLICT_GROUP_LABELS: Record<string, string> = {
  "strength.day-master": "旺衰判断",
  "strength.season": "月令旺衰",
  "wuxing.missing-fire": "五行缺火",
  "wuxing.missing-metal": "五行缺金",
  "ten-god.officer-mix": "官杀同透",
  "ten-god.seal-mix": "印星同透",
  "branch.clash": "地支六冲",
  "branch.hidden-combine": "地支暗合",
  "branch.triple-combine": "地支三合",
};
