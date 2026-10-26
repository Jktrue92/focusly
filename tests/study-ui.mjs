// Interactive component fixtures. Actions are test-only stubs; no auth bypass routes ship.
import assert from "node:assert/strict";
import { build } from "esbuild";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { chromium } from "playwright-core";
const root = process.cwd(),
  out = path.join(root, ".test-artifacts");
await mkdir(out, { recursive: true });
const css = (
  await Promise.all(
    (await readdir(".next/static/chunks"))
      .filter((f) => f.endsWith(".css"))
      .map((f) => readFile(".next/static/chunks/" + f, "utf8")),
  )
).join("\n");
const entry = `import React from 'react';import {createRoot} from 'react-dom/client';import {StudySession} from './src/components/study-session';import {StudyLibrary} from './src/components/study-library';import {DeckEditor} from './src/components/deck-editor';import {StudyAgent} from './src/components/study-agent';import {ScheduleImport} from './src/components/schedule-import';import {ScheduleView} from './src/components/schedule-view';import {Brand} from './src/components/brand';import {WorkspaceNav} from './src/components/workspace-nav';
const id='11111111-1111-4111-8111-111111111111';const deck={id,title:'Biology · Cell structures',description:'A little practice for the next seminar.',color:'#7065F0',created_at:''};
const cards=[['Cell','Basic unit of life.'],['DNA','Carries genetic information.'],['Mitochondria','Produces ATP.'],['Nucleus','Contains DNA.']].map(([term,definition],i)=>({id:'22222222-2222-4222-8222-22222222222'+i,deck_id:id,term,definition,source_excerpt:'',created_at:''}));const classes=[{id,name:'Physics',color:'#7065F0'}];
const meetings=[{id:'m1',class_id:id,weekday:1,start_time:'09:00:00',end_time:'10:00:00',term_start:'2026-10-01',term_end:'2026-12-31',timezone:'America/New_York'}];
window.__fixture=new URLSearchParams(location.search).get('fixture')||'session';
const views={session:<StudySession deckId={id} title={deck.title} cards={cards}/>,small:<StudySession deckId={id} title={deck.title} cards={cards.slice(0,2)}/>,library:<StudyLibrary decks={[deck]} cards={cards} progress={[]} available/>,empty:<StudyLibrary decks={[]} cards={[]} progress={[]} available/>,editor:<DeckEditor deck={deck} cards={cards} progress={[]}/>,agent:<StudyAgent decks={[deck]} enabled/>,agentCf:<StudyAgent decks={[deck]} enabled providerLabel="Cloudflare Workers AI" providerId="cloudflare"/>,disabled:<StudyAgent decks={[deck]} enabled={false}/>,import:<ScheduleImport classes={classes} enabled/>,importCf:<ScheduleImport classes={classes} enabled providerLabel="Cloudflare Workers AI" providerId="cloudflare"/>,schedule:<ScheduleView classes={classes} meetings={meetings} available/>};
createRoot(document.getElementById('root')).render(<div className="workspace"><aside className="sidebar"><Brand/><span className="nav-caption">YOUR WORKSPACE</span><WorkspaceNav/></aside><main className="workspace-main">{views[window.__fixture]}</main></div>);`;
const scheduleDraft = {
  classes: [
    {
      name: "Physics",
      color: "#7065F0",
      meetings: [
        {
          weekday: 1,
          start_time: "09:00",
          end_time: "10:00",
          source_excerpt: "Physics Monday 09:00-10:00.",
        },
      ],
    },
  ],
  assignments: [
    {
      title: "Lab report",
      class_index: 0,
      due_date: "2026-11-01",
      priority: "medium",
      source_excerpt: "Lab report due 2026-11-01.",
    },
  ],
  warnings: ["Check the room and semester dates yourself."],
};
await build({
  stdin: { contents: entry, loader: "tsx", resolveDir: root },
  bundle: true,
  platform: "browser",
  format: "iife",
  jsx: "automatic",
  alias: { "@": path.join(root, "src") },
  outfile: path.join(out, "study-harness.js"),
  plugins: [
    {
      name: "isolated-test-boundaries",
      setup(builder) {
        builder.onResolve(
          {
            filter:
              /^@\/app\/(study-actions|study-ai-actions|schedule-actions)$/,
          },
          (args) => ({ path: args.path, namespace: "test" }),
        );
        builder.onResolve({ filter: /^next\/(link|navigation)$/ }, (args) => ({
          path: args.path,
          namespace: "test",
        }));
        builder.onLoad({ filter: /.*/, namespace: "test" }, (args) => {
          if (args.path === "next/link")
            return {
              contents: `import React from 'react';export default function Link({href,children,...props}){return <a href={href} {...props}>{children}</a>}`,
              loader: "jsx",
              resolveDir: root,
            };
          if (args.path === "next/navigation")
            return {
              contents: `export function usePathname(){return window.__fixture==='schedule'?'/schedule':'/study'}`,
              loader: "js",
            };
          return {
            loader: "js",
            contents: `export async function saveDeck(){};export async function deleteDeck(){};export async function saveCard(){};export async function deleteCard(){};export async function saveMeeting(){};export async function deleteMeeting(){};
export async function recordReview(id,correct){window.__reviewCalls=(window.__reviewCalls||0)+1;await new Promise(r=>setTimeout(r,20));return window.__failReview?{ok:false,message:'Injected save failure'}:{ok:true};}
export async function generateStudyDraft(previous,form){if(form.get('ai_consent')!=='on')return {message:'Consent required'};return {message:'Draft ready for review.',draft:{summary:'Different cell structures have different roles.',cards:[{term:'Cell',definition:'Basic unit of life.',source_excerpt:'A cell is the basic unit of life.'}]}};}
export async function saveStudyDraft(previous,form){window.__savedDraft=Object.fromEntries(form.entries());return {message:'Reviewed cards saved in test.'};}
export async function analyzeSchedule(previous,form){if(form.get('ai_consent')!=='on')return {message:'Consent required'};return {message:'Draft ready. Nothing saved.',draft:${JSON.stringify(scheduleDraft)},token:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',termStart:'2026-10-01',termEnd:'2026-12-31',timezone:'UTC'};}
export async function saveReviewedSchedule(previous,form){window.__savedSchedule=Object.fromEntries(form.entries());return {message:'Reviewed schedule saved in test.'};}`,
          };
        });
      },
    },
  ],
});
await writeFile(
  path.join(out, "study-harness.html"),
  '<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="root"></div><script src="./study-harness.js"></script></body></html>',
);
const server = createServer(async (req, res) => {
  const file =
    req.url?.split("?")[0] === "/study-harness.js"
      ? "study-harness.js"
      : "study-harness.html";
  res.setHeader(
    "Content-Type",
    file.endsWith(".js") ? "application/javascript" : "text/html",
  );
  res.end(await readFile(path.join(out, file)));
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_EXECUTABLE_PATH || "/usr/bin/chromium",
  args: ["--no-sandbox"],
});
try {
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const url = "http://127.0.0.1:" + server.address().port + "/";
  async function open(fixture) {
    await page.goto(url + "?fixture=" + fixture);
    await page.locator(".workspace-main").waitFor();
    await page.addStyleTag({ content: css });
  }
  await open("session");
  await page
    .getByRole("button", { name: "Reveal answer", exact: true })
    .focus();
  await page.keyboard.press("Space");
  assert.equal(
    await page
      .locator(".flip-card")
      .getAttribute("class")
      .then((c) => c.includes("is-flipped")),
    true,
  );
  assert.equal(await page.evaluate(() => window.__reviewCalls || 0), 0);
  await page.evaluate(() => (window.__failReview = true));
  await page.getByRole("button", { name: "I knew it" }).click();
  await page.getByRole("alert").waitFor();
  assert.equal(
    await page.getByRole("button", { name: "Next card" }).count(),
    0,
  );
  await page.evaluate(() => (window.__failReview = false));
  await page.getByRole("button", { name: "I knew it" }).evaluate((button) => {
    button.click();
    button.click();
  });
  await page.locator(".answer-result.correct").waitFor();
  assert.equal(
    await page.evaluate(() => window.__reviewCalls),
    2,
    "double click should save only once",
  );
  await page
    .getByRole("button", { name: "Written recall", exact: true })
    .click();
  await page.getByLabel("Your answer").fill("  BASIC  unit of life. ");
  await page.getByRole("button", { name: "Check answer", exact: true }).click();
  await page.locator(".answer-result.correct").waitFor();
  await page
    .getByRole("button", { name: "Multiple choice", exact: true })
    .click();
  const correct = {
    Cell: "Basic unit of life.",
    DNA: "Carries genetic information.",
    Mitochondria: "Produces ATP.",
    Nucleus: "Contains DNA.",
  };
  for (let i = 0; i < 4; i++) {
    const question = await page.locator(".recall-card h2").innerText();
    assert.equal(await page.locator(".quiz-options>button").count(), 4);
    await page
      .locator(".quiz-options>button")
      .filter({ hasText: correct[question] })
      .click();
    await page.locator(".answer-result.correct").waitFor();
    await page
      .getByRole("button", {
        name: i === 3 ? "See results" : "Next card",
        exact: true,
      })
      .click();
  }
  await page.getByRole("heading", { name: "Look at that progress." }).waitFor();
  assert.match(await page.locator(".session-finish").innerText(), /4 of 4/);
  await open("small");
  assert.equal(
    await page
      .getByRole("button", { name: "Multiple choice", exact: true })
      .isDisabled(),
    true,
  );
  await page.emulateMedia({ reducedMotion: "reduce" });
  assert.equal(
    await page
      .locator(".flip-inner")
      .evaluate((el) => getComputedStyle(el).transitionDuration),
    "0s",
  );
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await open("disabled");
  assert.equal(
    await page
      .getByRole("button", { name: "Draft summary & flashcards" })
      .isDisabled(),
    true,
  );
  await open("agent");
  await page
    .getByLabel("Your study notes")
    .fill(
      "A cell is the basic unit of life. These notes describe how cell structures work together and support everyday cellular processes.",
    );
  await page.getByRole("checkbox").check();
  await page
    .getByRole("button", { name: "Draft summary & flashcards" })
    .click();
  await page
    .getByRole("heading", { name: "A starting point for your study session." })
    .waitFor();
  assert.equal(await page.evaluate(() => !!window.__savedDraft), false);
  await page.getByRole("checkbox", { name: /I have reviewed/ }).check();
  await page.getByRole("button", { name: "Save reviewed cards" }).click();
  await page.getByRole("alert").waitFor();
  assert.equal(await page.evaluate(() => window.__savedDraft.term_0), "Cell");
  await open("import");
  await page.locator("input[type=file]").setInputFiles({
    name: "schedule.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(
      "Physics Monday 09:00-10:00. Lab report due 2026-11-01.",
    ),
  });
  await page.getByLabel("Term starts", { exact: true }).fill("2026-10-01");
  await page.getByLabel("Term ends", { exact: true }).fill("2026-12-31");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Create schedule preview" }).click();
  await page
    .getByRole("heading", { name: "Make this schedule yours." })
    .waitFor();
  assert.equal(await page.evaluate(() => !!window.__savedSchedule), false);
  await page.getByRole("checkbox", { name: /I have checked/ }).check();
  await page.getByRole("button", { name: "Save reviewed schedule" }).click();
  await page.getByRole("alert").waitFor();
  assert.equal(
    await page.evaluate(() => window.__savedSchedule.review_confirmed),
    "on",
  );
  for (const fixture of ["agentCf", "importCf"]) {
    await open(fixture);
    const content = await page.locator(".workspace-main").innerText();
    assert.equal(
      content.includes("OpenAI"),
      false,
      "Provider notice must not name the wrong vendor",
    );
    assert.match(content, /Cloudflare Workers AI/);
    assert.equal(
      await page.locator('input[name="ai_provider"]').inputValue(),
      "cloudflare",
    );
    assert.equal(
      await page.locator('input[name="ai_consent_version"]').inputValue(),
      "2026-10-26-provider-beta",
    );
    await page
      .getByRole("checkbox", { name: /Cloudflare Workers AI/ })
      .waitFor();
  }
  for (const fixture of [
    "library",
    "empty",
    "editor",
    "session",
    "agent",
    "agentCf",
    "import",
    "importCf",
    "schedule",
  ])
    for (const width of [375, 768, 1440])
      for (const theme of ["light", "dark"]) {
        await page.setViewportSize({ width, height: 1000 });
        await open(fixture);
        await page.evaluate(
          (theme) => (document.documentElement.dataset.theme = theme),
          theme,
        );
        await page.waitForTimeout(200);
        assert.equal(
          await page.evaluate(
            () => document.documentElement.scrollWidth > innerWidth + 1,
          ),
          false,
          "Overflow " + fixture + " " + width + " " + theme,
        );
        if (width === 375 || width === 1440)
          await page.screenshot({
            path: path.join(
              out,
              "study-" + fixture + "-" + width + "-" + theme + ".png",
            ),
            fullPage: true,
          });
      }
  assert.deepEqual(errors, []);
  console.log(
    "PASS: interactive flip/write/quiz sessions, save-failure handling, duplicate-click protection, results, reduced motion, AI disabled/review-first behavior, schedule preview/approval, responsive light/dark study/schedule views. Actions and AI are isolated test stubs; no live accounts, emails, or paid calls.",
  );
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
