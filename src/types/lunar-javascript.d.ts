declare module "lunar-javascript" {
  export interface DaYun {
    getIndex(): number;
    getGanZhi(): string;
    getStartAge(): number;
    getEndAge(): number;
    getStartYear(): number;
    getEndYear(): number;
  }

  export interface Yun {
    isForward(): boolean;
    getStartYear(): number;
    getStartMonth(): number;
    getStartDay(): number;
    getStartHour(): number;
    getStartSolar(): Solar;
    getDaYun(n?: number): DaYun[];
  }

  export interface EightChar {
    setSect(sect: number): void;
    getSect(): number;
    getYear(): string;
    getYearGan(): string;
    getYearZhi(): string;
    getYearHideGan(): string[];
    getYearShiShenGan(): string;
    getYearShiShenZhi(): string[];
    getYearDiShi(): string;
    getMonth(): string;
    getMonthGan(): string;
    getMonthZhi(): string;
    getMonthHideGan(): string[];
    getMonthShiShenGan(): string;
    getMonthShiShenZhi(): string[];
    getMonthDiShi(): string;
    getDay(): string;
    getDayGan(): string;
    getDayZhi(): string;
    getDayHideGan(): string[];
    getDayShiShenGan(): string;
    getDayShiShenZhi(): string[];
    getDayDiShi(): string;
    getTime(): string;
    getTimeGan(): string;
    getTimeZhi(): string;
    getTimeHideGan(): string[];
    getTimeShiShenGan(): string;
    getTimeShiShenZhi(): string[];
    getTimeDiShi(): string;
    getYun(gender: number, sect?: number): Yun;
  }

  export interface Lunar {
    getEightChar(): EightChar;
    toString(): string;
  }

  export interface Solar {
    getLunar(): Lunar;
    toYmd(): string;
    toYmdHms(): string;
  }

  export const Solar: {
    fromYmdHms(year: number, month: number, day: number, hour: number, minute: number, second: number): Solar;
  };
}
