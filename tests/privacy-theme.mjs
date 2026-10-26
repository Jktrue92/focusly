import assert from "node:assert/strict";
import { chromium } from "playwright-core";
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_EXECUTABLE_PATH || "/usr/bin/chromium",
  args: ["--no-sandbox"],
});
try {
  const context = await browser.newContext({ colorScheme: "light" });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("http://127.0.0.1:3000/login", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Dark theme", exact: true }).click();
  assert.equal(await page.locator("html").getAttribute("data-theme"), "dark");
  await page.reload({ waitUntil: "networkidle" });
  assert.equal(await page.locator("html").getAttribute("data-theme"), "dark");
  assert.equal(
    await page
      .getByRole("button", { name: "Dark theme", exact: true })
      .getAttribute("aria-pressed"),
    "true",
  );
  const second = await context.newPage();
  await second.goto("http://127.0.0.1:3000/");
  await page.getByRole("button", { name: "Light theme", exact: true }).click();
  await second.waitForFunction(
    () => document.documentElement.dataset.theme === "light",
  );
  await page
    .getByRole("button", { name: "Use system theme", exact: true })
    .click();
  await page.emulateMedia({ colorScheme: "dark" });
  await page.waitForFunction(
    () => document.documentElement.dataset.theme === "dark",
  );
  await page.emulateMedia({ colorScheme: "light" });
  await page.waitForFunction(
    () => document.documentElement.dataset.theme === "light",
  );
  await page.goto("http://127.0.0.1:3000/signup", { waitUntil: "networkidle" });
  assert.equal(
    await page.getByRole("textbox", { name: "Email address" }).count(),
    0,
  );
  await page.getByRole("button", { name: "Under 13", exact: true }).click();
  await page
    .getByRole("heading", { name: "Account creation isn’t available." })
    .waitFor();
  assert.equal(await page.getByRole("textbox").count(), 0);
  await page.reload({ waitUntil: "networkidle" });
  await page
    .getByRole("heading", { name: "Account creation isn’t available." })
    .waitFor();
  await page.evaluate(() => localStorage.removeItem("focusly-age-blocked"));
  await page.reload();
  await page.getByRole("button", { name: "13 or older", exact: true }).click();
  await page.getByRole("textbox", { name: "Email address" }).waitFor();
  const exportResponse = await page.request.get(
    "http://127.0.0.1:3000/api/account/export",
  );
  assert.equal(exportResponse.status(), 401);
  assert.match(exportResponse.headers()["cache-control"], /no-store/);
  await page.goto("http://127.0.0.1:3000/privacy", {
    waitUntil: "networkidle",
  });
  assert.equal(
    await page
      .getByRole("link", { name: "hellofocusly@gmail.com" })
      .first()
      .getAttribute("href"),
    "mailto:hellofocusly@gmail.com",
  );
  await page.getByRole("button", { name: "Dark theme", exact: true }).click();
  await page.screenshot({
    path: ".test-artifacts/privacy-dark.png",
    fullPage: true,
  });
  for (const width of [375, 768, 1440])
    for (const theme of ["Light theme", "Dark theme"]) {
      await page.setViewportSize({ width, height: 900 });
      for (const route of [
        "/",
        "/login",
        "/signup",
        "/forgot-password",
        "/privacy",
      ]) {
        await page.goto("http://127.0.0.1:3000" + route, {
          waitUntil: "networkidle",
        });
        await page.getByRole("button", { name: theme, exact: true }).click();
        assert.equal(
          await page.evaluate(
            () => document.documentElement.scrollWidth > innerWidth + 1,
          ),
          false,
          "Overflow " + route + " " + width + " " + theme,
        );
      }
    }
  assert.deepEqual(errors, []);
  console.log(
    "PASS: theme persistence/cross-tab/system behavior; neutral age gate blocks under-13 before email and across reloads; anonymous data-export denied; privacy contact; responsive light/dark public pages. No real accounts or emails used.",
  );
} finally {
  await browser.close();
}
