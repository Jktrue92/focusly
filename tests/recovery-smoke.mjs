import assert from "node:assert/strict";
import { chromium } from "playwright-core";
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_EXECUTABLE_PATH || "/usr/bin/chromium",
  args: ["--no-sandbox"],
});
try {
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("http://127.0.0.1:3000/login", { waitUntil: "networkidle" });
  await page.getByRole("link", { name: "Forgot password?" }).click();
  await page.getByRole("heading", { name: "Forgot your password?" }).waitFor();
  await page.getByRole("textbox", { name: "Email address" }).fill("not-an-email");
  assert.equal(
    await page.getByRole("textbox", { name: "Email address" }).evaluate((e) => e.checkValidity()),
    false,
  );
  await page.goto("http://127.0.0.1:3000/reset-password", {
    waitUntil: "networkidle",
  });
  assert.equal(new URL(page.url()).pathname, "/forgot-password");
  await page.goto(
    "http://127.0.0.1:3000/auth/callback?next=https://attacker.invalid",
    { waitUntil: "networkidle" },
  );
  assert.equal(new URL(page.url()).pathname, "/login");
  await page.goto("http://127.0.0.1:3000/auth/callback?next=/reset-password", {
    waitUntil: "networkidle",
  });
  assert.equal(new URL(page.url()).pathname, "/forgot-password");
  await page.goto("http://127.0.0.1:3000/signup", { waitUntil: "networkidle" });
  assert.equal(await page.getByRole("checkbox").count(), 2);
  for (const box of await page.getByRole("checkbox").all())
    assert.equal((await box.getAttribute("required")) !== null, true);
  // Deliberately bypass native validation; the server must reject an unchecked age gate.
  await page.getByRole("textbox", { name: "Email address" }).fill("eligibility-test@example.com");
  await page
    .locator('input[name="password"]:visible')
    .fill("NeverSubmittedToSupabase123!");
  await page.locator("form:visible").evaluate((form) => {
    form.noValidate = true;
  });
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL(
    (url) => url.pathname === "/signup" && url.searchParams.has("message"),
  );
  assert.match(new URL(page.url()).searchParams.get("message"), /ages 13/);
  await page.goto("http://127.0.0.1:3000/privacy", {
    waitUntil: "networkidle",
  });
  await page
    .getByRole("heading", { name: "7. Children’s privacy and COPPA" })
    .waitFor();
  for (const width of [375, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ["/privacy", "/forgot-password", "/signup"]) {
      await page.goto("http://127.0.0.1:3000" + route, {
        waitUntil: "networkidle",
      });
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth + 1,
        ),
        false,
        "Overflow " + route + " " + width,
      );
    }
  }
  assert.deepEqual(errors, []);
  console.log(
    "PASS: forgot-password navigation, invalid email validation, logged-out reset protection, callback redirect restrictions, required signup declarations enforced on server, policy content, responsive public pages. No recovery emails sent or accounts created.",
  );
} finally {
  await browser.close();
}
