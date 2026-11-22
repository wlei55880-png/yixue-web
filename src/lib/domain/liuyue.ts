import type { Gan, Zhi } from "@/lib/schemas/chart-facts";

export const GAN_CHARS = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"] as const;
export const ZHI_CHARS = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"] as const;

export interface GanZhi {
  gan: Gan;
  zhi: Zhi;
  text: string;
}

/** 公历年转干支。 */
export function yearGanZhi(year: number): GanZhi {
  const offset = year - 4;
  const gan = GAN_CHARS[((offset % 10) + 10) % 10] ?? "甲";
  const zhi = ZHI_CHARS[((offset % 12) + 12) % 12] ?? "子";
  return { gan, zhi, text: `${gan}${zhi}` };
}

export const MONTH_LABELS = [
  "正月",
  "二月",
  "三月",
  "四月",
  "五月",
  "六月",
  "七月",
  "八月",
  "九月",
  "十月",
  "冬月",
  "腊月",
] as const;

const MONTH_ZHI: readonly Zhi[] = ["寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥", "子", "丑"];

/** 五虎遁：年干决定正月天干，甲己丙、乙庚戊、丙辛庚、丁壬壬、戊癸甲。 */
const FIRST_MONTH_GAN: Record<Gan, number> = {
  甲: 2,
  己: 2,
  乙: 4,
  庚: 4,
  丙: 6,
  辛: 6,
  丁: 8,
  壬: 8,
  戊: 0,
  癸: 0,
};

export interface LiuYueItem {
  /** 0 = 正月（寅月）。 */
  index: number;
  label: string;
  gan: Gan;
  zhi: Zhi;
  ganZhi: string;
}

/** 由流年天干推十二个流月（正月建寅）。 */
export function liuYueOf(yearGan: Gan): LiuYueItem[] {
  const first = FIRST_MONTH_GAN[yearGan];
  return MONTH_ZHI.map((zhi, index) => {
    const gan = GAN_CHARS[(first + index) % 10] ?? "甲";
    return { index, label: MONTH_LABELS[index] ?? "", gan, zhi, ganZhi: `${gan}${zhi}` };
  });
}

/** 当前月令索引：0 = 寅月（立春起），与流月数组对齐。 */
export function currentMonthIndex(): number {
  return (new Date().getMonth() + 1 + 10) % 12;
}
