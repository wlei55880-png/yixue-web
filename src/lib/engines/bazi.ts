import { Solar } from "lunar-javascript";

export type Gender = "male" | "female";

/** 子时换日流派：1 = 晚子时（23:00 起）算次日；2 = 晚子时算当日（lunar-javascript 默认）。 */
export type DaySect = 1 | 2;

export type PillarKey = "year" | "month" | "day" | "hour";

export interface BaziInput {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  gender: Gender;
  /** 默认 2（晚子时归当日），与 lunar-javascript 默认一致。 */
  sect?: DaySect;
}

export interface BaziPillar {
  key: PillarKey;
  label: string;
  /** 天干 */
  gan: string;
  /** 地支 */
  zhi: string;
  /** 干支，如「甲子」 */
  ganZhi: string;
  /** 天干十神（日柱为「日主」） */
  shiShenGan: string;
  /** 藏干 */
  hideGan: string[];
  /** 藏干对应的十神，与 hideGan 一一对应 */
  shiShenZhi: string[];
}

export interface BaziChart {
  input: BaziInput;
  genderLabel: string;
  solar: {
    text: string;
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
  };
  lunar: {
    text: string;
  };
  dayMaster: string;
  pillars: Record<PillarKey, BaziPillar>;
  conventions: {
    sect: DaySect;
    sectLabel: string;
    yearBoundary: string;
    monthBoundary: string;
    timezone: string;
  };
}

const PILLAR_LABELS: Record<PillarKey, string> = {
  year: "年柱",
  month: "月柱",
  day: "日柱",
  hour: "时柱",
};

function assertInteger(name: string, value: number, min: number, max: number) {
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new Error(`${name}需为 ${min}–${max} 的整数`);
  }
}

export function getBaziChart(input: BaziInput): BaziChart {
  const { year, month, day, hour, minute, gender } = input;
  const sect: DaySect = input.sect === 1 ? 1 : 2;

  if (gender !== "male" && gender !== "female") {
    throw new Error("性别需为 male 或 female");
  }
  assertInteger("年份", year, 1900, 2100);
  assertInteger("月份", month, 1, 12);
  assertInteger("日期", day, 1, 31);
  assertInteger("小时", hour, 0, 23);
  assertInteger("分钟", minute, 0, 59);

  const dateCheck = new Date(year, month - 1, day);
  if (dateCheck.getFullYear() !== year || dateCheck.getMonth() !== month - 1 || dateCheck.getDate() !== day) {
    throw new Error("出生日期不存在，请检查月份与日期");
  }

  const solar = Solar.fromYmdHms(year, month, day, hour, minute, 0);
  const lunar = solar.getLunar();
  const eightChar = lunar.getEightChar();
  eightChar.setSect(sect);

  const pillars: Record<PillarKey, BaziPillar> = {
    year: {
      key: "year",
      label: PILLAR_LABELS.year,
      gan: eightChar.getYearGan(),
      zhi: eightChar.getYearZhi(),
      ganZhi: eightChar.getYear(),
      shiShenGan: eightChar.getYearShiShenGan(),
      hideGan: eightChar.getYearHideGan(),
      shiShenZhi: eightChar.getYearShiShenZhi(),
    },
    month: {
      key: "month",
      label: PILLAR_LABELS.month,
      gan: eightChar.getMonthGan(),
      zhi: eightChar.getMonthZhi(),
      ganZhi: eightChar.getMonth(),
      shiShenGan: eightChar.getMonthShiShenGan(),
      hideGan: eightChar.getMonthHideGan(),
      shiShenZhi: eightChar.getMonthShiShenZhi(),
    },
    day: {
      key: "day",
      label: PILLAR_LABELS.day,
      gan: eightChar.getDayGan(),
      zhi: eightChar.getDayZhi(),
      ganZhi: eightChar.getDay(),
      shiShenGan: eightChar.getDayShiShenGan(),
      hideGan: eightChar.getDayHideGan(),
      shiShenZhi: eightChar.getDayShiShenZhi(),
    },
    hour: {
      key: "hour",
      label: PILLAR_LABELS.hour,
      gan: eightChar.getTimeGan(),
      zhi: eightChar.getTimeZhi(),
      ganZhi: eightChar.getTime(),
      shiShenGan: eightChar.getTimeShiShenGan(),
      hideGan: eightChar.getTimeHideGan(),
      shiShenZhi: eightChar.getTimeShiShenZhi(),
    },
  };

  return {
    input: { year, month, day, hour, minute, gender, sect },
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
    dayMaster: eightChar.getDayGan(),
    pillars,
    conventions: {
      sect,
      sectLabel: sect === 1 ? "晚子时换日（23:00 起算次日）" : "晚子时归当日（00:00 换日）",
      yearBoundary: "以立春交接时刻为年柱分界",
      monthBoundary: "以节气交接时刻为月柱分界",
      timezone: "按输入钟表时间直接排盘，暂未做真太阳时与经度校正",
    },
  };
}
