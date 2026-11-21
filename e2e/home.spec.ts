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

test.describe("规则命中面板", () => {
  test("默认排盘展示命中的规则卡", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("button", { name: "排盘" }).click();

    await expect(page.getByRole("heading", { name: "命理分析（规则命中）" })).toBeVisible();
    await expect(page.getByText("地支子午冲")).toBeVisible();
    await expect(page.getByText("地支暗合")).toBeVisible();
    await expect(page.getByText("来源：《渊海子平》").first()).toBeVisible();
    await expect(page.getByText("规则编号：bazi.clash.zi-wu.001")).toBeVisible();
  });

  test("无命中时展示空状态", async ({ page }) => {
    await page.goto("/");

    await page.getByLabel("年").fill("1962");
    await page.getByLabel("月").fill("2");
    await page.getByLabel("日").fill("9");
    await page.getByLabel("时").fill("18");
    await page.getByLabel("分").fill("30");
    await page.getByRole("button", { name: "排盘" }).click();

    await expect(page.getByText("当前排盘未命中知识库规则")).toBeVisible();
  });

  test("官杀同透时并列展示冲突组", async ({ page }) => {
    await page.goto("/");

    await page.getByLabel("年").fill("1970");
    await page.getByLabel("月").fill("1");
    await page.getByLabel("日").fill("1");
    await page.getByLabel("时").fill("18");
    await page.getByLabel("分").fill("30");
    await page.getByRole("button", { name: "排盘" }).click();

    await expect(page.getByText("冲突组：官杀同透")).toBeVisible();
    await expect(page.getByText("2 条并列")).toBeVisible();
    await expect(page.getByText("天干透正官")).toBeVisible();
    await expect(page.getByText("天干透七杀")).toBeVisible();
  });

  test("生成 AI 智能解读报告且不含绝对化用语", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("button", { name: "排盘" }).click();
    await page.getByRole("button", { name: "生成报告" }).click();

    const report = page.locator("#ai-report");
    await expect(report.getByRole("heading", { name: "AI 智能解读报告" })).toBeVisible();
    await expect(report.getByRole("heading", { name: "第一篇：原局剖析·生命蓝图与性格底色" })).toBeVisible();
    await expect(report.getByRole("heading", { name: "第二篇：岁运推演·时空环境与吉凶触发" })).toBeVisible();
    await expect(report.getByRole("heading", { name: "第三篇：宗师寄语" })).toBeVisible();
    await expect(report).toContainText("日主为丙火");
    await expect(report).toContainText(
      "命理仅为参考，人生在于个人选择。本内容由 AI 提供，仅供传统文化学习与娱乐参考。",
    );

    const text = await report.innerText();
    for (const word of ["必定", "注定", "破财", "改运", "必死"]) {
      expect(text).not.toContain(word);
    }
  });
});
