import { ELEMENT_VALUES, GAN_VALUES, ZHI_VALUES, type Element } from "@/lib/schemas/chart-facts";

/** 纳音全名，每两个干支共用一组，顺序与六十甲子一致。 */
const NA_YIN_NAMES: readonly string[] = [
  "海中金",
  "炉中火",
  "大林木",
  "路旁土",
  "剑锋金",
  "山头火",
  "涧下水",
  "城头土",
  "白蜡金",
  "杨柳木",
  "泉中水",
  "屋上土",
  "霹雳火",
  "松柏木",
  "长流水",
  "沙中金",
  "山下火",
  "平地木",
  "壁上土",
  "金箔金",
  "覆灯火",
  "天河水",
  "大驿土",
  "钗钏金",
  "桑柘木",
  "大溪水",
  "沙中土",
  "天上火",
  "石榴木",
  "大海水",
];

function isElement(value: string): value is Element {
  return (ELEMENT_VALUES as readonly string[]).includes(value);
}

export interface NaYin {
  name: string;
  element: Element;
}

/**
 * 按干支查纳音。
 * 使用本地六十甲子表而非 lunar-javascript 的时柱纳音，确保 sect=2 晚子时修正后的时柱与展示一致。
 */
export function naYinOf(ganZhi: string): NaYin {
  const ganIndex = (GAN_VALUES as readonly string[]).indexOf(ganZhi.charAt(0));
  const zhiIndex = (ZHI_VALUES as readonly string[]).indexOf(ganZhi.charAt(1));
  if (ganZhi.length !== 2 || ganIndex < 0 || zhiIndex < 0) {
    throw new Error(`无法识别纳音干支：${ganZhi}`);
  }
  // 六十甲子中天干与地支阴阳属性必须一致，排除「甲丑」这类无效组合。
  if (ganIndex % 2 !== zhiIndex % 2) {
    throw new Error(`纳音干支阴阳不匹配：${ganZhi}`);
  }

  // 解同余：i ≡ 天干序（mod 10），i ≡ 地支序（mod 12）。
  const cycleIndex = (((ganIndex * 6 - zhiIndex * 5) % 60) + 60) % 60;
  const name = NA_YIN_NAMES[Math.floor(cycleIndex / 2)];
  if (!name) throw new Error(`纳音表缺失：${ganZhi}`);

  const element = name.slice(-1);
  if (!isElement(element)) throw new Error(`纳音五行异常：${name}`);

  return { name, element };
}
