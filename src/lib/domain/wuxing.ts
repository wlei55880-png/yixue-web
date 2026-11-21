import type { Element } from "@/lib/schemas/chart-facts";

export const GAN_ELEMENT: Record<string, Element> = {
  甲: "木",
  乙: "木",
  丙: "火",
  丁: "火",
  戊: "土",
  己: "土",
  庚: "金",
  辛: "金",
  壬: "水",
  癸: "水",
};

export const ZHI_ELEMENT: Record<string, Element> = {
  寅: "木",
  卯: "木",
  巳: "火",
  午: "火",
  辰: "土",
  戌: "土",
  丑: "土",
  未: "土",
  申: "金",
  酉: "金",
  亥: "水",
  子: "水",
};

export const ELEMENT_GENERATES: Record<Element, Element> = {
  木: "火",
  火: "土",
  土: "金",
  金: "水",
  水: "木",
};

export const ELEMENT_CONTROLS: Record<Element, Element> = {
  木: "土",
  土: "水",
  水: "火",
  火: "金",
  金: "木",
};

/** 生我之五行，如「火」的生我五行为「木」。 */
export const ELEMENT_GENERATED_BY: Record<Element, Element> = {
  木: "水",
  火: "木",
  土: "火",
  金: "土",
  水: "金",
};

export function ganElement(gan: string): Element {
  const element = GAN_ELEMENT[gan];
  if (!element) throw new Error(`未知天干：${gan}`);
  return element;
}

export function zhiElement(zhi: string): Element {
  const element = ZHI_ELEMENT[zhi];
  if (!element) throw new Error(`未知地支：${zhi}`);
  return element;
}
