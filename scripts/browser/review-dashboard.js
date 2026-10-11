async (page) => {
  const checks = [],
    errors = [],
    failed = [];
  const calendarInitial = new Date().toLocaleDateString("id-ID", {
    timeZone: "Asia/Jakarta",
    month: "long",
    year: "numeric",
  });
  const check = (name, pass) => {
    if (!pass) throw new Error(name);
    checks.push(name);
  };
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("requestfailed", (r) => {
    if (!r.failure()?.errorText.includes("ABORTED")) failed.push(r.url());
  });
  await page.context().clearCookies();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("http://127.0.0.1:3000");
  await page.evaluate(() => localStorage.setItem("nexivo-theme", "light"));
  await page.reload();
  await page.getByRole("heading", { name: "Hai, selamat datang!" }).waitFor();
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  await page.waitForTimeout(800);
  await page.screenshot({
    path: "artifacts/nexivo-studio-desktop.png",
    fullPage: true,
  });
  await page.addScriptTag({ path: "node_modules/axe-core/axe.min.js" });
  const axeDesktop = await page.evaluate(async () =>
    (
      await window.axe.run(document, {
        runOnly: {
          type: "tag",
          values: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"],
        },
      })
    ).violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      nodes: v.nodes.map((n) => ({
        target: n.target,
        summary: n.failureSummary,
      })),
    })),
  );
  await page.keyboard.press("Tab");
  check(
    "skip link keyboard focus",
    await page
      .getByRole("link", { name: "Lewati ke konten" })
      .evaluate((e) => e === document.activeElement),
  );
  await page.keyboard.press("Enter");
  await page.getByRole("button", { name: "Cari program", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Cari program NEXIVO" })
    .fill("risiko");
  await page.waitForFunction(
    () =>
      document.querySelectorAll("dialog .search-results button").length === 1,
  );
  checks.push("global search filters matching topics");
  await page.keyboard.press("Escape");
  check(
    "dialog returns keyboard focus",
    await page
      .getByRole("button", { name: "Cari program", exact: true })
      .evaluate((e) => e === document.activeElement),
  );
  await page
    .getByRole("group", { name: "Filter bidang di beranda" })
    .getByRole("button", { name: "Teknologi", exact: true })
    .click();
  check(
    "home category filter",
    (await page.locator(".featured-programs .program-card").count()) === 1,
  );
  await page.locator(".featured-programs .card-arrow").click();
  await page.getByRole("dialog").waitFor();
  check(
    "detail contains planned program status",
    await page.getByText("Jadwal belum diumumkan", { exact: true }).isVisible(),
  );
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Bulan berikutnya" }).click();
  check(
    "calendar month navigation",
    (await page.locator(".calendar-month > span").innerText()) !==
      calendarInitial,
  );
  await page
    .locator(".calendar-days")
    .getByRole("button", { name: /^15 / })
    .click();
  check(
    "calendar selects real empty date",
    await page
      .getByRole("heading", { name: "Belum ada agenda", exact: true })
      .isVisible(),
  );
  await page.getByRole("button", { name: "Hari ini", exact: true }).click();
  check(
    "calendar reset",
    (await page.locator(".calendar-month > span").innerText()) ===
      calendarInitial,
  );
  await page.getByRole("button", { name: "Masuk", exact: true }).click();
  await page
    .getByRole("button", { name: "Masuk ke NEXIVO", exact: true })
    .click();
  check(
    "empty login blocked",
    await page
      .getByRole("textbox", { name: "Email", exact: true })
      .evaluate((e) => !e.validity.valid),
  );
  await page
    .getByRole("textbox", { name: "Email", exact: true })
    .fill("preview-missing@example.invalid");
  await page
    .getByLabel("Kata sandi", { exact: true })
    .fill("Invalid-preview-918273");
  await page
    .getByRole("button", { name: "Masuk ke NEXIVO", exact: true })
    .click();
  await page.getByRole("alert").waitFor();
  checks.push("failed login displays generic error");
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Aktifkan tema gelap" }).click();
  await page.waitForTimeout(300);
  const axeDark = await page.evaluate(async () =>
    (
      await window.axe.run(document, {
        runOnly: {
          type: "tag",
          values: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"],
        },
      })
    ).violations.map((v) => ({
      id: v.id,
      nodes: v.nodes.map((n) => ({
        target: n.target,
        summary: n.failureSummary,
      })),
    })),
  );
  await page.screenshot({
    path: "artifacts/nexivo-studio-dark.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Aktifkan tema terang" }).click();
  await page
    .getByRole("navigation", { name: "Navigasi utama" })
    .getByRole("link", { name: /Webinar/ })
    .click();
  await page
    .getByRole("heading", { name: "Pengetahuan untuk langkah berikutnya." })
    .waitFor();
  check(
    "full catalog renders six topics",
    (await page.locator(".program-card").count()) === 6,
  );
  await page.getByRole("button", { name: "Bisnis", exact: true }).click();
  check("catalog filter", (await page.locator(".program-card").count()) === 1);
  await page
    .getByRole("navigation", { name: "Navigasi utama" })
    .getByRole("link", { name: "Belajarku", exact: true })
    .click();
  check(
    "account permission state",
    await page
      .getByRole("button", { name: "Masuk / buat akun", exact: true })
      .isVisible(),
  );
  await page.goto("http://127.0.0.1:3000/#beranda");
  const responsive = [];
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.waitForTimeout(200);
    const result = await page.evaluate(() => ({
      width: innerWidth,
      overflow: document.documentElement.scrollWidth > innerWidth,
    }));
    responsive.push(result);
    check("no horizontal overflow at " + width, !result.overflow);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Buka navigasi" }).click();
  check(
    "mobile menu opens",
    await page.getByRole("navigation", { name: "Navigasi utama" }).isVisible(),
  );
  await page.keyboard.press("Escape");
  check(
    "mobile escape returns focus",
    await page
      .getByRole("button", { name: "Buka navigasi" })
      .evaluate((e) => e === document.activeElement),
  );
  await page.getByRole("button", { name: "Buka navigasi" }).click();
  await page
    .getByRole("navigation", { name: "Navigasi utama" })
    .getByRole("link", { name: /Webinar/ })
    .click();
  check(
    "mobile navigation closes on route",
    !(await page
      .getByRole("navigation", { name: "Navigasi utama" })
      .isVisible()),
  );
  await page.goto("http://127.0.0.1:3000/#beranda");
  await page.getByRole("heading", { name: "Hai, selamat datang!" }).waitFor();
  await page.addScriptTag({
    path: "D:/DATA PROJECT/nexivo/node_modules/axe-core/axe.min.js",
  });
  const axeMobile = await page.evaluate(async () =>
    (
      await window.axe.run(document, {
        runOnly: {
          type: "tag",
          values: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"],
        },
      })
    ).violations.map((v) => ({
      id: v.id,
      nodes: v.nodes.map((n) => ({
        target: n.target,
        summary: n.failureSummary,
      })),
    })),
  );
  await page.screenshot({
    path: "artifacts/nexivo-studio-mobile.png",
    fullPage: true,
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  check(
    "reduced motion stops animations",
    await page.evaluate(
      () =>
        document.getAnimations().filter((a) => a.playState === "running")
          .length === 0,
    ),
  );
  check("desktop accessibility scan", axeDesktop.length === 0);
  check("dark accessibility scan", axeDark.length === 0);
  check("mobile accessibility scan", axeMobile.length === 0);
  check("no runtime errors", errors.length === 0);
  check("no failed network requests", failed.length === 0);
  return { checks, axeDesktop, axeDark, axeMobile, responsive, errors, failed };
}
