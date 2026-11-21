import { BaziForm } from "@/components/bazi-form";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";

export default function HomePage() {
  return (
    <div className="relative min-h-dvh overflow-x-hidden">
      <div aria-hidden className="paper-grain pointer-events-none absolute inset-0 -z-10" />
      <div aria-hidden className="rule-top absolute inset-x-0 top-0 -z-10 h-px" />

      <SiteHeader current="home" />

      <main className="mx-auto w-full max-w-5xl px-5 pb-16 sm:px-8">
        <section className="py-12 sm:py-16">
          <div className="space-y-5">
            <p className="text-xs tracking-[0.3em] text-primary">子平八字 · 规则可溯 · AI 解读</p>
            <h1 className="font-serif text-4xl leading-[1.25] tracking-wide text-balance sm:text-5xl lg:text-6xl">
              排盘有据，
              <br />
              断语可溯。
            </h1>
            <p className="max-w-xl text-sm leading-7 text-muted-foreground sm:text-base">
              输入出生时间，立即得到四柱、命中的规则卡，以及子平、盲派与荣格心理学视角的解读报告。
            </p>
          </div>
        </section>

        <section id="paipan" className="scroll-mt-24">
          <BaziForm />
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
