import { NextResponse } from "next/server";
import { z } from "zod";

import { buildQueuedReport, requestBaziReport } from "@/lib/llm/gateway";
import { ChartFactsSchema } from "@/lib/schemas/chart-facts";
import { RuleHitSchema } from "@/lib/schemas/rule-card";

export const runtime = "nodejs";

const ReportRequestSchema = z
  .object({
    chart: ChartFactsSchema,
    hits: z.array(RuleHitSchema).max(60),
    currentYear: z.number().int().min(1900).max(2200).optional(),
  })
  .strict();

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "请求格式不正确，请重新排盘后再试。" }, { status: 400 });
  }

  const parsed = ReportRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "排盘数据不完整，请重新排盘后再试。" }, { status: 400 });
  }

  try {
    return NextResponse.json({ report: await requestBaziReport(parsed.data) });
  } catch {
    return NextResponse.json({ report: buildQueuedReport(parsed.data) });
  }
}
