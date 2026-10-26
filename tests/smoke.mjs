import { chromium } from "playwright-core";
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_EXECUTABLE_PATH || "/usr/bin/chromium",
    headless: true,
    args: ["--no-sandbox"],
  });
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("http://127.0.0.1:3000/", { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: /Your semester/ }).waitFor();
  await page.getByRole("link", { name: "Find your focus" }).click();
  await page
    .getByRole("heading", { name: "Make room for progress." })
    .waitFor();
  if (
    !(await page.getByRole("button", { name: "Create account" }).isDisabled())
  )
    throw Error("Unconfigured signup should be disabled");
  await page.getByRole("link", { name: "Log in", exact: true }).click();
  await page.getByRole("heading", { name: "Welcome back." }).waitFor();
  for (const path of ["/dashboard", "/classes", "/assignments", "/settings"]) {
    await page.goto("http://127.0.0.1:3000" + path, {
      waitUntil: "networkidle",
    });
    if (!new URL(page.url()).pathname.startsWith("/login"))
      throw Error("Unprotected route " + path);
  }
  await page.goto("http://127.0.0.1:3000/", { waitUntil: "networkidle" });
  await page.screenshot({ path: "/tmp/focusly-desktop.png", fullPage: true });
  for (const width of [375, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ["/", "/login", "/signup"]) {
      await page.goto("http://127.0.0.1:3000" + route, {
        waitUntil: "networkidle",
      });
      if (
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth + 1,
        )
      )
        throw Error("Horizontal overflow " + width + " " + route);
    }
  }
  await page.setViewportSize({ width: 375, height: 850 });
  await page.goto("http://127.0.0.1:3000/");
  await page.screenshot({ path: "/tmp/focusly-mobile.png", fullPage: true });
  if (errors.length) throw Error(errors.join("\n"));
  console.log(
    "PASS: public navigation, missing-config states, all four protected routes, no browser errors, no horizontal overflow at 375/768/1440px.",
  );
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
