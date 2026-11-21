import { NextResponse } from "next/server";

import { getBaziChart } from "@/lib/engines/bazi";
import { BaziRequestSchema } from "@/lib/schemas/chart-facts";

function errorResponse(status: number, code: string, message: string, issues?: { path: string; message: string }[]) {
  return NextResponse.json({ error: { code, message, ...(issues ? { issues } : {}) } }, { status });
}

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return errorResponse(400, "INVALID_JSON", "请求体必须是合法 JSON");
  }

  const parsed = BaziRequestSchema.safeParse(payload);
  if (!parsed.success) {
    return errorResponse(
      400,
      "INVALID_INPUT",
      "出生信息校验失败",
      parsed.error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })),
    );
  }

  try {
    return NextResponse.json(getBaziChart(parsed.data), { status: 200 });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "排盘失败";
    return errorResponse(400, "CHART_FAILED", message);
  }
}
