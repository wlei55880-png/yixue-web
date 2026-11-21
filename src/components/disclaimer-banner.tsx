import { ShieldAlert } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DISCLAIMER_POINTS, DISCLAIMER_TEXT } from "@/lib/project";

export function DisclaimerBanner() {
  return (
    <section id="disclaimer" className="scroll-mt-24 border-t border-border/70 pt-14">
      <Card className="border-primary/25 bg-primary/[0.04]">
        <CardHeader className="flex-row items-center gap-3 space-y-0">
          <span className="flex h-9 w-9 items-center justify-center rounded-full border border-primary/25 text-primary">
            <ShieldAlert className="h-4 w-4" aria-hidden />
          </span>
          <CardTitle className="font-serif text-lg">学习用途与边界声明</CardTitle>
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
