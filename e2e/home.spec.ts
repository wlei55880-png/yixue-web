import { expect, test } from "@playwright/test";

test.describe("首页与产品说明", () => {
  test("首屏即为排盘工具", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { level: 1 })).toContainText("排盘有据");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("断语可溯");
    await expect(page.getByLabel("年")).toBeVisible();
    await expect(page.getByLabel("月")).toBeVisible();
    await expect(page.getByLabel("性别")).toBeVisible();
    await expect(page.getByRole("link", { name: "关于产品" })).toBeVisible();
  });

  test("关于产品页保留边界声明", async ({ page }) => {
    await page.goto("/about");

    const disclaimer = page.locator("#disclaimer");
    await expect(disclaimer.getByText("学习用途与边界声明")).toBeVisible();
    await expect(disclaimer).toContainText("不构成医疗、法律、投资、婚姻");
    await expect(disclaimer).toContainText("不提供任何以改运、消灾为名的付费服务");
  });

  test("关于产品页标记 M1 已完成", async ({ page }) => {
    await page.goto("/about");

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
    await expect(page.getByText("命理依据：《渊海子平》").first()).toBeVisible();
    await expect(page.getByText(/规则编号|bazi\./)).toHaveCount(0);
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
    const closing = "命理仅为参考，人生在于个人选择。本内容由 AI 提供，仅供传统文化学习与娱乐参考。";
    const markdown = [
      "# 第一篇：原局剖析·生命蓝图与性格底色",
      "## 1. 能量格局与人生主线",
      "您的日主为丙火，生于子月。",
      "## 2. 宫位与心理图景",
      "年柱看原生家庭，月柱看青年职场。",
      "## 3. 关系课题与暗藏伏笔",
      "「地支子午冲」像一条暗线。",
      "# 第二篇：岁运推演·时空环境与吉凶触发",
      "## 1. 当前大运基调",
      "稳中求进，先搭系统再谈扩张。",
      "## 2. 流年震荡与破局点",
      "把变化拆成可执行清单。",
      "# 第三篇：宗师寄语",
      "先安顿身心，再谈远方。",
      closing,
    ].join("\n\n");

    await page.route("**/api/report", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          report: {
            provider: "llm",
            model: "test-model",
            title: "八字结构解读报告",
            markdown,
            text: markdown,
            ruleIds: [],
            conflictGroups: [],
            safetyReplacements: [],
          },
        }),
      }),
    );

    await page.goto("/");

    await page.getByRole("button", { name: "排盘" }).click();
    await expect(page.getByText("查看排盘 JSON")).toHaveCount(0);
    await page.getByRole("button", { name: "生成报告" }).click();

    const report = page.locator("#ai-report");
    await expect(report.getByRole("heading", { name: "AI 智能解读报告" })).toBeVisible();
    await expect(report.getByRole("heading", { name: "第一篇：原局剖析·生命蓝图与性格底色" })).toBeVisible();
    await expect(report.getByRole("heading", { name: "第二篇：岁运推演·时空环境与吉凶触发" })).toBeVisible();
    await expect(report.getByRole("heading", { name: "第三篇：宗师寄语" })).toBeVisible();
    await expect(report).toContainText("日主为丙火");
    await expect(report).toContainText(closing);
    await expect(report).not.toContainText("本地模板");
    await expect(report).not.toContainText("暂不调用");

    const text = await report.innerText();
    for (const word of ["必定", "注定", "破财", "改运", "必死"]) {
      expect(text).not.toContain(word);
    }
  });

  test("AI 接口异常时只展示排队提示", async ({ page }) => {
    await page.route("**/api/report", (route) =>
      route.fulfill({ status: 500, contentType: "text/plain", body: "internal stack trace" }),
    );

    await page.goto("/");
    await page.getByRole("button", { name: "排盘" }).click();
    await page.getByRole("button", { name: "生成报告" }).click();

    const report = page.locator("#ai-report");
    await expect(report).toContainText("AI 正在排队中，请稍后再试。");
    await expect(report).not.toContainText("internal stack trace");
  });
});
