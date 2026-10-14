async (page) => {
  const base = "http://127.0.0.1:3014/";
  const checks = [],
    errors = [],
    failed = [],
    scans = [];
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
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(base);
  await page.evaluate(() => localStorage.setItem("nexivo-theme", "light"));
  await page.reload();
  await page
    .getByRole("heading", { name: "Wawasan baru. Langkah lebih maju." })
    .waitFor();
  check(
    "public home uses public navigation and no sidebar",
    (await page.locator(".public-header").count()) === 1 &&
      (await page.locator(".app-sidebar").count()) === 0,
  );
  await page.keyboard.press("Tab");
  check(
    "skip link works from keyboard",
    await page
      .getByRole("link", { name: "Lewati ke konten" })
      .evaluate((e) => e === document.activeElement),
  );
  await page.keyboard.press("Enter");
  await page.screenshot({
    path: "artifacts/nexivo-public-desktop.png",
    fullPage: true,
  });
  await page.addScriptTag({ path: "node_modules/axe-core/axe.min.js" });
  async function scan(name) {
    if (!(await page.evaluate(() => !!window.axe)))
      await page.addScriptTag({ path: "node_modules/axe-core/axe.min.js" });
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
    scans.push({ name, violations });
  }
  await scan("public home light");
  await page.getByRole("button", { name: "Aktifkan tema gelap" }).click();
  await scan("public home dark");
  await page.getByRole("button", { name: "Aktifkan tema terang" }).click();
  await page.getByRole("button", { name: /05 Teknologi/ }).click();
  await page
    .getByRole("heading", { name: "Pengetahuan untuk langkah berikutnya." })
    .waitFor();
  check(
    "public category enters filtered catalog",
    (await page.locator(".program-card").count()) === 1 &&
      (await page
        .getByRole("button", { name: "Teknologi", exact: true })
        .getAttribute("aria-pressed")) === "true",
  );
  check(
    "main receives focus after public navigation",
    await page.locator("main").evaluate((e) => e === document.activeElement),
  );
  await page
    .getByRole("navigation", { name: "Navigasi website" })
    .getByRole("link", { name: "Verifikasi sertifikat" })
    .click();
  await page
    .getByRole("heading", { name: "Periksa keaslian sertifikat." })
    .waitFor();
  check(
    "public verification has no private certificates",
    (await page
      .getByRole("heading", { name: "Sertifikat saya", exact: true })
      .count()) === 0 && (await page.locator(".app-sidebar").count()) === 0,
  );
  await page.goto(base + "#admin");
  await page
    .getByRole("heading", { name: "Akses pengelola diperlukan" })
    .waitFor();
  check(
    "guest cannot see management data",
    (await page.locator("table").count()) === 0,
  );
  await page.goto(base);
  await page.getByRole("button", { name: "Masuk", exact: true }).click();
  await page.getByRole("button", { name: "Masuk ke NEXIVO" }).click();
  check(
    "empty login blocked",
    await page
      .getByLabel("Email", { exact: true })
      .evaluate((e) => !e.validity.valid),
  );
  await page
    .getByLabel("Email", { exact: true })
    .fill("participant@interface.example.test");
  await page
    .getByLabel("Kata sandi", { exact: true })
    .fill("Interface-review-only!2026");
  await page.getByRole("button", { name: "Masuk ke NEXIVO" }).click();
  await page.getByRole("navigation", { name: "Navigasi peserta" }).waitFor();
  check(
    "participant login enters learning dashboard",
    page.url().endsWith("#dashboard") &&
      (await page.locator(".participant-shell").count()) === 1 &&
      (await page.locator(".public-header").count()) === 0,
  );
  await page.getByRole("heading", { name: "Hai, Peserta!" }).waitFor();
  await scan("participant dashboard");
  await page.getByRole("button", { name: "Aktifkan tema gelap" }).click();
  await scan("participant dashboard dark");
  await page.getByRole("button", { name: "Aktifkan tema terang" }).click();
  if (await page.getByRole("button", { name: "Tutup pemberitahuan" }).count())
    await page.getByRole("button", { name: "Tutup pemberitahuan" }).click();
  await page.screenshot({
    path: "artifacts/nexivo-participant-desktop.png",
    fullPage: true,
  });
  await page.getByRole("link", { name: "Website publik", exact: true }).click();
  await page
    .getByRole("heading", { name: "Wawasan baru. Langkah lebih maju." })
    .waitFor();
  check(
    "return to public keeps authenticated session",
    await page
      .getByRole("link", { name: "Dashboard", exact: true })
      .isVisible(),
  );
  await page.getByRole("link", { name: "Dashboard", exact: true }).click();
  await page.getByRole("navigation", { name: "Navigasi peserta" }).waitFor();
  await page.goto(base + "#admin");
  await page
    .getByRole("heading", { name: "Akses pengelola diperlukan" })
    .waitFor();
  check(
    "participant cannot see admin data",
    (await page.locator("table").count()) === 0,
  );
  const status = await page.evaluate(
    async () => (await fetch("/api/admin/overview")).status,
  );
  check("server rejects participant admin access", status === 403);
  await page.getByRole("button", { name: "Keluar akun", exact: true }).click();
  await page.getByRole("button", { name: "Masuk", exact: true }).waitFor();
  check(
    "logout returns to public website",
    page.url().endsWith("#beranda") &&
      (await page.locator(".app-sidebar").count()) === 0,
  );
  await page.getByRole("button", { name: "Masuk", exact: true }).click();
  await page
    .getByLabel("Email", { exact: true })
    .fill("admin@interface.example.test");
  await page
    .getByLabel("Kata sandi", { exact: true })
    .fill("Interface-review-only!2026");
  await page.getByRole("button", { name: "Masuk ke NEXIVO" }).click();
  await page.getByRole("heading", { name: "Ringkasan pengelolaan" }).waitFor();
  await page
    .getByRole("cell", {
      name: "Pengelolaan Limbah B3 & Lingkungan",
      exact: true,
    })
    .waitFor();
  check(
    "admin login enters management workspace",
    page.url().endsWith("#admin") &&
      (await page
        .getByRole("navigation", { name: "Navigasi pengelola" })
        .isVisible()),
  );
  await scan("management overview");
  await page.getByRole("button", { name: "Aktifkan tema gelap" }).click();
  await scan("management dark");
  await page.getByRole("button", { name: "Aktifkan tema terang" }).click();
  if (await page.getByRole("button", { name: "Tutup pemberitahuan" }).count())
    await page.getByRole("button", { name: "Tutup pemberitahuan" }).click();
  await page.screenshot({
    path: "artifacts/nexivo-management-desktop.png",
    fullPage: true,
  });
  await page
    .getByRole("navigation", { name: "Navigasi pengelola" })
    .getByRole("link", { name: "Kelola webinar", exact: true })
    .click();
  await page
    .getByRole("heading", { name: "Kelola webinar", exact: true })
    .waitFor();
  await page.getByRole("heading", { name: "Program & webinar" }).waitFor();
  check(
    "webinar management is focused view",
    (await page
      .getByRole("heading", { name: "Program & webinar" })
      .isVisible()) &&
      (await page
        .getByRole("heading", { name: "Minat program", exact: true })
        .count()) === 0,
  );
  await page.getByRole("button", { name: "Buat webinar" }).click();
  await page.getByRole("dialog").waitFor();
  check(
    "create webinar opens real form",
    await page
      .getByRole("dialog")
      .getByLabel("Judul", { exact: true })
      .isVisible(),
  );
  await scan("admin create dialog");
  await page.keyboard.press("Escape");
  await page
    .getByRole("navigation", { name: "Navigasi pengelola" })
    .getByRole("link", { name: "Peserta & sertifikat", exact: true })
    .click();
  await page
    .getByRole("heading", { name: "Peserta & sertifikat", exact: true })
    .waitFor();
  await page
    .getByText("Belum ada peserta terdaftar.", { exact: true })
    .waitFor();
  check(
    "participants page shows real empty state",
    (await page.getByRole("heading", { name: "Program & webinar" }).count()) ===
      0,
  );
  await page
    .getByRole("navigation", { name: "Navigasi pengelola" })
    .getByRole("link", { name: "Minat program", exact: true })
    .click();
  await page
    .getByText("Belum ada minat program yang tercatat.", { exact: true })
    .waitFor();
  check(
    "interest management shows real empty state",
    (await page.getByRole("heading", { name: "Program & webinar" }).count()) ===
      0,
  );
  await page.getByRole("link", { name: "Website publik", exact: true }).click();
  await page.getByRole("link", { name: "Dashboard", exact: true }).click();
  await page.getByRole("heading", { name: "Ringkasan pengelolaan" }).waitFor();
  checks.push("public dashboard link returns admin to management");
  const responsive = [];
  for (const route of ["beranda", "dashboard", "admin"]) {
    await page.goto(base + "#" + route);
    await page
      .locator(
        route === "beranda"
          ? ".public-hero"
          : route === "dashboard"
            ? ".learning-dashboard"
            : ".admin-stats",
      )
      .waitFor();
    for (const width of [320, 390, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      );
      responsive.push({ route, width, overflow });
      check("no page overflow " + route + " " + width, !overflow);
    }
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Buka navigasi" }).click();
  check(
    "management mobile drawer opens",
    await page
      .getByRole("navigation", { name: "Navigasi pengelola" })
      .isVisible(),
  );
  check(
    "drawer moves keyboard focus inside menu",
    await page
      .locator(".app-sidebar")
      .evaluate((e) => e.contains(document.activeElement)),
  );
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Tab");
  check(
    "drawer keeps tab focus inside menu",
    await page
      .locator(".app-sidebar")
      .evaluate((e) => e.contains(document.activeElement)),
  );
  await scan("management mobile menu open");
  await page.keyboard.press("Escape");
  check(
    "drawer restores keyboard focus",
    await page
      .getByRole("button", { name: "Buka navigasi" })
      .evaluate((e) => e === document.activeElement),
  );
  await page.screenshot({
    path: "artifacts/nexivo-management-mobile.png",
    fullPage: true,
  });
  await scan("management mobile");
  await page.goto(base);
  await page
    .getByRole("heading", { name: "Wawasan baru. Langkah lebih maju." })
    .waitFor();
  await page.addScriptTag({ path: "node_modules/axe-core/axe.min.js" });
  await page.getByRole("button", { name: "Buka menu website" }).click();
  check(
    "public mobile menu opens",
    await page
      .getByRole("navigation", { name: "Navigasi website" })
      .isVisible(),
  );
  await page.keyboard.press("Escape");
  check(
    "public menu restores focus",
    await page
      .getByRole("button", { name: "Buka menu website" })
      .evaluate((e) => e === document.activeElement),
  );
  await page.screenshot({
    path: "artifacts/nexivo-public-mobile.png",
    fullPage: true,
  });
  await scan("public mobile");
  check(
    "reduced motion disables decorative animation",
    await page.evaluate(
      () =>
        document.getAnimations().filter((a) => a.playState === "running")
          .length === 0,
    ),
  );
  check("no unhandled JavaScript errors", errors.length === 0);
  check("no failed network requests", failed.length === 0);
  check(
    "all accessibility scans pass",
    scans.every((scan) => scan.violations.length === 0),
  );
  return { checks, scans, responsive, errors, failed };
}
