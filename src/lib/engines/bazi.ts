import { Solar } from "lunar-javascript";

import {
  ELEMENT_CONTROLS as CONTROLS,
  ELEMENT_GENERATES as GENERATES,
  ganElement,
  zhiElement,
} from "@/lib/domain/wuxing";
import {
  BaziRequestSchema,
  ChartFactsSchema,
  GAN_VALUES,
  type BaziRequest,
  type ChartFacts,
  type Element,
  type PillarKey,
} from "@/lib/schemas/chart-facts";

const PILLAR_ORDER: readonly PillarKey[] = ["year", "month", "day", "hour"];

const PILLAR_LABELS: Record<PillarKey, string> = {
  year: "年柱",
  month: "月柱",
  day: "日柱",
  hour: "时柱",
};

type ElementCount = Record<Element, number>;

const YANG_GAN = new Set(["甲", "丙", "戊", "庚", "壬"]);

function ganAt(index: number): string {
  const gan = GAN_VALUES[index];
  if (!gan) throw new Error(`天干索引越界：${index}`);
  return gan;
}

/** 以日主天干推导另一天干的十神，用于修正晚子时（sect=2）的时干。 */
function tenGodOf(dayGan: string, targetGan: string): string {
  const dayElement = ganElement(dayGan);
  const targetElement = ganElement(targetGan);
  const samePolarity = YANG_GAN.has(dayGan) === YANG_GAN.has(targetGan);

  if (dayElement === targetElement) return samePolarity ? "比肩" : "劫财";
  if (GENERATES[dayElement] === targetElement) return samePolarity ? "食神" : "伤官";
  if (CONTROLS[dayElement] === targetElement) return samePolarity ? "偏财" : "正财";
  if (CONTROLS[targetElement] === dayElement) return samePolarity ? "七杀" : "正官";
  return samePolarity ? "偏印" : "正印";
}

function emptyElementCount(): ElementCount {
  return { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };
}

/**
 * 确定性八字排盘：四柱、十神、藏干、十二长生、五行统计、大运与起运。
 * 排盘完全由 lunar-javascript 与本地映射完成，不涉及任何模型推断。
 */
export function getBaziChart(input: BaziRequest): ChartFacts {
  const parsedInput = BaziRequestSchema.parse(input);
  const { year, month, day, hour, minute, gender } = parsedInput;
  const sect = parsedInput.sect === 2 ? 2 : 1;

  const dateCheck = new Date(year, month - 1, day);
  if (dateCheck.getFullYear() !== year || dateCheck.getMonth() !== month - 1 || dateCheck.getDate() !== day) {
    throw new Error("出生日期不存在，请检查月份与日期");
  }

  const solar = Solar.fromYmdHms(year, month, day, hour, minute, 0);
  const lunar = solar.getLunar();
  const eightChar = lunar.getEightChar();
  eightChar.setSect(sect);

  const dayGan = eightChar.getDayGan();
  const isLateZiWithTodaySect = sect === 2 && hour === 23;
  const timeGan = isLateZiWithTodaySect
    ? ganAt(((GAN_VALUES.indexOf(dayGan as (typeof GAN_VALUES)[number]) % 5) * 2) % 10)
    : eightChar.getTimeGan();
  const timeShiShenGan = isLateZiWithTodaySect ? tenGodOf(dayGan, timeGan) : eightChar.getTimeShiShenGan();

  const pillars = {
    year: {
      key: "year" as const,
      label: PILLAR_LABELS.year,
      gan: eightChar.getYearGan(),
      zhi: eightChar.getYearZhi(),
      ganZhi: eightChar.getYear(),
      shiShenGan: eightChar.getYearShiShenGan(),
      hideGan: eightChar.getYearHideGan(),
      shiShenZhi: eightChar.getYearShiShenZhi(),
      diShi: eightChar.getYearDiShi(),
    },
    month: {
      key: "month" as const,
      label: PILLAR_LABELS.month,
      gan: eightChar.getMonthGan(),
      zhi: eightChar.getMonthZhi(),
      ganZhi: eightChar.getMonth(),
      shiShenGan: eightChar.getMonthShiShenGan(),
      hideGan: eightChar.getMonthHideGan(),
      shiShenZhi: eightChar.getMonthShiShenZhi(),
      diShi: eightChar.getMonthDiShi(),
    },
    day: {
      key: "day" as const,
      label: PILLAR_LABELS.day,
      gan: eightChar.getDayGan(),
      zhi: eightChar.getDayZhi(),
      ganZhi: eightChar.getDay(),
      shiShenGan: eightChar.getDayShiShenGan(),
      hideGan: eightChar.getDayHideGan(),
      shiShenZhi: eightChar.getDayShiShenZhi(),
      diShi: eightChar.getDayDiShi(),
    },
    hour: {
      key: "hour" as const,
      label: PILLAR_LABELS.hour,
      gan: timeGan,
      zhi: eightChar.getTimeZhi(),
      ganZhi: `${timeGan}${eightChar.getTimeZhi()}`,
      shiShenGan: timeShiShenGan,
      hideGan: eightChar.getTimeHideGan(),
      shiShenZhi: eightChar.getTimeShiShenZhi(),
      diShi: eightChar.getTimeDiShi(),
    },
  };

  const visible = emptyElementCount();
  const hidden = emptyElementCount();
  for (const key of PILLAR_ORDER) {
    const pillar = pillars[key];
    visible[ganElement(pillar.gan)] += 1;
    visible[zhiElement(pillar.zhi)] += 1;
    for (const gan of pillar.hideGan) {
      hidden[ganElement(gan)] += 1;
    }
  }
  const total = emptyElementCount();
  for (const element of Object.keys(total) as Element[]) {
    total[element] = visible[element] + hidden[element];
  }

  const yun = eightChar.getYun(gender === "male" ? 1 : 0, 2);
  const daYun = yun
    .getDaYun(10)
    .filter((item) => item.getIndex() > 0)
    .map((item) => ({
      index: item.getIndex(),
      ganZhi: item.getGanZhi(),
      startAge: item.getStartAge(),
      endAge: item.getEndAge(),
      startYear: item.getStartYear(),
      endYear: item.getEndYear(),
    }));

  return ChartFactsSchema.parse({
    input: { ...parsedInput, sect },
    genderLabel: gender === "male" ? "男" : "女",
    solar: {
      text: solar.toYmdHms(),
      year,
      month,
      day,
      hour,
      minute,
    },
    lunar: {
      text: lunar.toString(),
    },
    dayMaster: dayGan,
    pillars,
    wuXing: { visible, hidden, total },
    luck: {
      forward: yun.isForward(),
      startAge: {
        years: yun.getStartYear(),
        months: yun.getStartMonth(),
        days: yun.getStartDay(),
        hours: yun.getStartHour(),
      },
      startSolar: yun.getStartSolar().toYmdHms(),
      daYun,
    },
    conventions: {
      sect,
      sectLabel: sect === 1 ? "晚子时换日（23:00 起算次日）" : "晚子时归当日（00:00 换日）",
      yearBoundary: "以立春交接时刻为年柱分界",
      monthBoundary: "以节气交接时刻为月柱分界",
      timezone: "按输入钟表时间直接排盘，暂未做真太阳时与经度校正",
      luckStartMethod: "按出生时刻与节气交接时刻的分钟差折算，3 日折 1 年",
    },
  });
}
