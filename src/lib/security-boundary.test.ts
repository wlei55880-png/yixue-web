import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const SRC = join(process.cwd(), "src");

/** 前端可见范围：页面、布局与组件。API 路由不在此列。 */
const FRONTEND_ROOTS = [
  join(SRC, "app", "page.tsx"),
  join(SRC, "app", "layout.tsx"),
  join(SRC, "app", "about"),
  join(SRC, "components"),
];

/** 只允许在服务端接口中出现的核心机密依赖。 */
const FORBIDDEN_IMPORTS = [
  "@/lib/llm/gateway",
  "@/lib/rules/bazi",
  "data/rules/bazi",
  "@/lib/engines/bazi",
  "@/lib/engines/rules",
] as const;

function collect(path: string): string[] {
  if (statSync(path).isFile()) return [path];
  return readdirSync(path, { withFileTypes: true }).flatMap((entry) => collect(join(path, entry.name)));
}

describe("前后端安全边界", () => {
  it("前端页面与组件不得引用规则库、排盘引擎或 System Prompt", () => {
    const files = FRONTEND_ROOTS.flatMap(collect).filter((file) => /\.(ts|tsx|js|jsx)$/.test(file));
    expect(files.length).toBeGreaterThan(0);

    const violations: string[] = [];
    for (const file of files) {
      const content = readFileSync(file, "utf8");
      for (const token of FORBIDDEN_IMPORTS) {
        if (content.includes(token)) violations.push(`${file} -> ${token}`);
      }
    }

    expect(violations).toEqual([]);
  });

  it("核心逻辑只存在于 generate-report 接口", () => {
    const route = readFileSync(join(SRC, "app", "api", "generate-report", "route.ts"), "utf8");
    expect(route).toContain("@/lib/engines/bazi");
    expect(route).toContain("@/lib/engines/rules");
    expect(route).toContain("@/lib/rules/bazi");
    expect(route).toContain("@/lib/llm/gateway");
  });
});
