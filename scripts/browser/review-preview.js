async (page) => {
  const base = page
    .url()
    .startsWith("https://nassrudin.github.io/nexivo-preview")
    ? "https://nassrudin.github.io/nexivo-preview/"
    : "http://127.0.0.1:3002/";
  const checks = [],
    errors = [],
    failed = [],
    requests = [],
    badResponses = [];
  const check = (name, pass) => {
    if (!pass) throw new Error(name);
    checks.push(name);
  };
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("requestfailed", (r) => {
    if (!r.failure()?.errorText.includes("ABORTED")) failed.push(r.url());
  });
  page.on("request", (r) =>
    requests.push({ url: r.url(), method: r.method() }),
  );
  page.on("response", (r) => {
    if (r.status() >= 400)
      badResponses.push({ url: r.url(), status: r.status() });
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto(base);
  await page.evaluate(() => localStorage.setItem("nexivo-theme", "light"));
  await page.reload();
  await page.getByRole("heading", { name: "Hai, selamat datang!" }).waitFor();
  check(
    "preview notice visible",
    await page.getByText("PREVIEW DESAIN", { exact: true }).isVisible(),
  );
  check(
    "reviewed seed topics load",
    (await page.locator(".featured-programs .program-card").count()) === 3,
  );
  check(
    "logo asset loads from repository base",
    await page
      .locator(".sidebar-brand img")
      .evaluate((e) => e.complete && e.naturalWidth > 0),
  );
  await page.waitForTimeout(800);
  await page.screenshot({
    path: "artifacts/nexivo-pages-desktop.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Masuk", exact: true }).click();
  check(
    "account dialog explains static preview",
    await page
      .getByRole("heading", { name: "Kamu sedang menjelajahi preview desain." })
      .isVisible(),
  );
  check(
    "no password or personal data form in preview",
    (await page.getByRole("dialog").locator("input").count()) === 0,
  );
  await page.keyboard.press("Escape");
  await page
    .getByRole("button", { name: "Kabari saya nanti", exact: true })
    .click();
  check(
    "interest dialog does not collect personal data",
    (await page
      .getByRole("dialog")
      .locator("input,textarea,select")
      .count()) === 0,
  );
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Cari program", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Cari program NEXIVO" })
    .fill("digital");
  await page.waitForFunction(
    () =>
      document.querySelectorAll("dialog .search-results button").length === 1,
  );
  checks.push("search works without backend");
  await page.keyboard.press("Escape");
  await page
    .getByRole("navigation", { name: "Navigasi utama" })
    .getByRole("link", { name: /Webinar/ })
    .click();
  check(
    "full static catalog",
    (await page.locator(".program-card").count()) === 6,
  );
  await page.getByRole("button", { name: "Masuk", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("link", { name: "Jelajahi topik" })
    .click();
  check(
    "preview CTA closes dialog on same route",
    (await page.getByRole("dialog").count()) === 0,
  );
  await page
    .getByRole("searchbox", { name: "Cari di katalog program" })
    .fill("zz-no-match-918273");
  check(
    "search empty state",
    (await page.locator(".program-card").count()) === 0,
  );
  await page
    .getByRole("searchbox", { name: "Cari di katalog program" })
    .fill("");
  await page.addScriptTag({ path: "node_modules/axe-core/axe.min.js" });
  await page.emulateMedia({ reducedMotion: "reduce" });
  const scans = [];
  for (const route of [
    "program",
    "belajarku",
    "sertifikat",
    "tentang",
    "privasi",
  ]) {
    await page.evaluate((hash) => {
      window.location.hash = hash;
    }, route);
    await page.waitForTimeout(180);
    const violations = await page.evaluate(async () =>
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
    scans.push({ route, violations });
  }
  await page.goto(base + "#beranda");
  await page.getByRole("heading", { name: "Hai, selamat datang!" }).waitFor();
  const responsive = [];
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    );
    responsive.push({ width, overflow });
    check("static layout at " + width, !overflow);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(250);
  await page.screenshot({
    path: "artifacts/nexivo-pages-mobile.png",
    fullPage: true,
  });
  check(
    "mobile search has readable label",
    await page.locator(".search-trigger > span").isVisible(),
  );
  check(
    "no API requests on static preview",
    requests.every((r) => !new URL(r.url).pathname.startsWith("/api")),
  );
  check(
    "no server mutations in preview",
    requests.every((r) => ["GET", "HEAD"].includes(r.method)),
  );
  check("no runtime errors", errors.length === 0);
  check("no failed requests", failed.length === 0);
  check("no HTTP errors", badResponses.length === 0);
  check(
    "accessibility scans across all public pages",
    scans.every((scan) => scan.violations.length === 0),
  );
  return {
    base,
    checks,
    scans,
    responsive,
    errors,
    failed,
    badResponses,
    requests: requests.length,
  };
}
