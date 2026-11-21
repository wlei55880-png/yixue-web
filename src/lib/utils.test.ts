import { describe, expect, it } from "vitest";

import { cn } from "@/lib/utils";

describe("cn", () => {
  it("合并条件类名", () => {
    expect(cn("px-2", false && "hidden", undefined, "text-sm")).toBe("px-2 text-sm");
  });

  it("后者覆盖冲突的 Tailwind 工具类", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });
});
