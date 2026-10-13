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
    badResponses = [],
    scans = [];
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
      badResponses.push({ status: r.status(), url: r.url() });
  });
  await page.context().clearCookies();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(base);
  await page.evaluate(() => localStorage.setItem("nexivo-theme", "light"));
  await page.reload();
  await page
    .getByRole("heading", { name: "Wawasan baru. Langkah lebih maju." })
    .waitFor();
  check(
    "public landing is separate from dashboard",
    (await page.locator(".public-header").count()) === 1 &&
      (await page.locator(".app-sidebar").count()) === 0,
  );
  check(
    "public preview notice is visible",
    await page.getByText("PREVIEW DESAIN", { exact: true }).isVisible(),
  );
  check(
    "logo works from repository base",
    await page
      .locator(".public-header img")
      .evaluate((e) => e.complete && e.naturalWidth > 0),
  );
  await page.getByRole("button", { name: "Masuk", exact: true }).click();
  check(
    "preview account dialog has no personal data form",
    (await page
      .getByRole("dialog")
      .locator("input,textarea,select")
      .count()) === 0,
  );
  await page.keyboard.press("Escape");
  await page
    .getByRole("button", { name: "Catat minat saya", exact: true })
    .click();
  check(
    "preview interest dialog has no personal data form",
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
  checks.push("public search works without backend");
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: /05 Teknologi/ }).click();
  await page
    .getByRole("heading", { name: "Pengetahuan untuk langkah berikutnya." })
    .waitFor();
  check(
    "public category opens filtered catalog",
    (await page.locator(".program-card").count()) === 1,
  );
  await page.getByRole("button", { name: "Semua bidang", exact: true }).click();
  check(
    "catalog includes six reviewed seed topics",
    (await page.locator(".program-card").count()) === 6,
  );
  await page
    .getByRole("searchbox", { name: "Cari di katalog program" })
    .fill("zz-empty-review-8271");
  check(
    "catalog empty state works",
    await page
      .getByRole("heading", { name: "Belum menemukan yang kamu cari" })
      .isVisible(),
  );
  await page.getByRole("button", { name: "Reset pencarian" }).click();
  await page.getByRole("button", { name: "Masuk", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("link", { name: "Jelajahi topik" })
    .click();
  check(
    "preview CTA closes dialog on same route",
    (await page.getByRole("dialog").count()) === 0,
  );
  await page.addScriptTag({ path: "node_modules/axe-core/axe.min.js" });
  for (const route of [
    "beranda",
    "program",
    "tentang",
    "privasi",
    "verifikasi",
    "dashboard",
    "belajarku",
    "sertifikat",
    "admin",
  ]) {
    await page.evaluate((hash) => (window.location.hash = hash), route);
    await page.waitForTimeout(100);
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
    if (route === "verifikasi")
      check(
        "verification is public without private certificates",
        (await page.locator(".public-header").count()) === 1 &&
          (await page
            .getByRole("heading", { name: "Sertifikat saya", exact: true })
            .count()) === 0,
      );
    if (route === "dashboard")
      check(
        "participant design preview uses learning sidebar",
        (await page
          .getByRole("navigation", { name: "Navigasi peserta" })
          .isVisible()) && (await page.locator(".public-header").count()) === 0,
      );
    if (route === "admin")
      check(
        "preview does not expose management data",
        (await page
          .getByRole("heading", { name: "Akses pengelola diperlukan" })
          .isVisible()) && (await page.locator("table").count()) === 0,
      );
  }
  const responsive = [];
  for (const route of ["beranda", "dashboard", "admin"]) {
    await page.evaluate((hash) => (window.location.hash = hash), route);
    await page.waitForTimeout(100);
    for (const width of [320, 390, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      );
      responsive.push({ route, width, overflow });
      check("responsive " + route + " " + width, !overflow);
    }
  }
  await page.evaluate(() => (window.location.hash = "beranda"));
  await page.waitForTimeout(100);
  await page.screenshot({
    path: "artifacts/nexivo-pages-public-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "artifacts/nexivo-pages-public-mobile.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Buka menu website" }).click();
  check(
    "mobile public navigation works",
    await page
      .getByRole("navigation", { name: "Navigasi website" })
      .isVisible(),
  );
  await page.keyboard.press("Escape");
  check(
    "no backend API requests",
    requests.every((r) => !new URL(r.url).pathname.includes("/api/")),
  );
  check(
    "no mutation requests",
    requests.every((r) => ["GET", "HEAD"].includes(r.method)),
  );
  check(
    "all public and dashboard scans pass",
    scans.every((s) => s.violations.length === 0),
  );
  check("no runtime errors", errors.length === 0);
  check("no failed requests", failed.length === 0);
  check("no HTTP errors", badResponses.length === 0);
  return { base, checks, scans, responsive, errors, failed, badResponses };
}
