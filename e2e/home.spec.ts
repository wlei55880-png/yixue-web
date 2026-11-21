import { expect, test } from "@playwright/test";

test.describe("首页与边界声明", () => {
  test("展示 V1 闭环与可追溯主张", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { level: 1 })).toContainText("排盘有据");
    await expect(page.getByText("八字单点闭环", { exact: true })).toBeVisible();
    await expect(page.getByText("规则编号").first()).toBeVisible();
    await expect(page.getByText("知识库未覆盖").first()).toBeVisible();
  });

  test("边界声明与免责文案可见", async ({ page }) => {
    await page.goto("/");

    const disclaimer = page.locator("#disclaimer");
    await expect(disclaimer.getByText("学习用途与边界声明")).toBeVisible();
    await expect(disclaimer).toContainText("不构成医疗、法律、投资、婚姻");
    await expect(disclaimer).toContainText("不提供任何以改运、消灾为名的付费服务");
  });

  test("路线图标记 M1 已完成", async ({ page }) => {
    await page.goto("/");

    const firstMilestone = page.locator("#roadmap ol > li").first();
    await expect(firstMilestone).toContainText("M1");
    await expect(firstMilestone).toContainText("已完成");
  });

  test("移动端无横向溢出", async ({ page }) => {
    await page.goto("/");

    const overflow = await page.evaluate(() => {
      const root = document.scrollingElement ?? document.documentElement;
      return root.scrollWidth - root.clientWidth;
    });

    expect(overflow).toBeLessThanOrEqual(1);
  });
});
