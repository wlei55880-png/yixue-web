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
            <p className="text-xs tracking-[0.3em] text-primary">传统子平 · AI 解读</p>
            <h1 className="font-serif text-4xl leading-[1.25] tracking-wide text-balance sm:text-5xl lg:text-6xl">
              读懂命盘，
              <br />
              看清自己。
            </h1>
            <p className="max-w-xl text-sm leading-7 text-muted-foreground sm:text-base">
              输入出生时间，查看四柱、五行、神煞与大运，并获得一份结合命盘的 AI 智能解读。
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
