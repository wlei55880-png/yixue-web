import { ShieldAlert } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const DISCLAIMER_TEXT =
  "易学研习提供的是传统文化学习与娱乐参考，不构成任何现实决策依据。请把解读当作一面镜子，而不是标准答案。";

const DISCLAIMER_POINTS = [
  "不提供医疗、法律、投资、婚姻等专业建议。",
  "不承诺改运、消灾或任何具体结果。",
  "不作绝对化预测，不制造焦虑与恐惧。",
  "如遇心理困扰，请寻求专业心理咨询或医疗帮助。",
] as const;

export function DisclaimerBanner() {
  return (
    <section id="disclaimer" className="scroll-mt-24 border-t border-border/70 pt-14">
      <Card className="border-primary/25 bg-primary/[0.04]">
        <CardHeader className="flex-row items-center gap-3 space-y-0">
          <span className="flex h-9 w-9 items-center justify-center rounded-full border border-primary/25 text-primary">
            <ShieldAlert className="h-4 w-4" aria-hidden />
          </span>
          <CardTitle className="font-serif text-lg">温馨提示</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm leading-7 text-muted-foreground">{DISCLAIMER_TEXT}</p>
          <ul className="grid gap-2 text-sm leading-6 text-muted-foreground sm:grid-cols-2">
            {DISCLAIMER_POINTS.map((point) => (
              <li key={point} className="flex gap-2">
                <span aria-hidden className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </section>
  );
}
