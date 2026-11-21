declare module "lunar-javascript" {
  export interface EightChar {
    setSect(sect: number): void;
    getSect(): number;
    getYear(): string;
    getYearGan(): string;
    getYearZhi(): string;
    getYearHideGan(): string[];
    getYearShiShenGan(): string;
    getYearShiShenZhi(): string[];
    getMonth(): string;
    getMonthGan(): string;
    getMonthZhi(): string;
    getMonthHideGan(): string[];
    getMonthShiShenGan(): string;
    getMonthShiShenZhi(): string[];
    getDay(): string;
    getDayGan(): string;
    getDayZhi(): string;
    getDayHideGan(): string[];
    getDayShiShenGan(): string;
    getDayShiShenZhi(): string[];
    getTime(): string;
    getTimeGan(): string;
    getTimeZhi(): string;
    getTimeHideGan(): string[];
    getTimeShiShenGan(): string;
    getTimeShiShenZhi(): string[];
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
