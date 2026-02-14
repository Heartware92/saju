declare module 'lunar-javascript' {
  export class Solar {
    static fromYmd(year: number, month: number, day: number): Solar;
    static fromYmdHms(year: number, month: number, day: number, hour: number, minute: number, second: number): Solar;
    getLunar(): Lunar;
    toYmd(): string;
    toYmdHms(): string;
  }

  export class Lunar {
    getYear(): number;
    getMonth(): number;
    getDay(): number;
    getHour(): number;
    getMinute(): number;
    getYearInGanZhi(): string;
    getYearInGanZhiExact(): string;
    getMonthInGanZhi(): string;
    getDayInGanZhi(): string;
    getTimeInGanZhi(): string;
    getEightChar(): EightChar;
    toFullString(): string;
  }

  export class EightChar {
    getYear(): string;
    getMonth(): string;
    getDay(): string;
    getTime(): string;
    getYearGan(): string;
    getYearZhi(): string;
    getMonthGan(): string;
    getMonthZhi(): string;
    getDayGan(): string;
    getDayZhi(): string;
    getTimeGan(): string;
    getTimeZhi(): string;
    getYun(gender: number): Yun;
  }

  export class Yun {
    getStartYear(): number;
    getDaYun(): DaYun[];
  }

  export class DaYun {
    getStartYear(): number;
    getEndYear(): number;
    getGanZhi(): string;
    getLiuNian(): LiuNian[];
  }

  export class LiuNian {
    getYear(): number;
    getGanZhi(): string;
  }
}
