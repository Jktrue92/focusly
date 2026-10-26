// Isolated visual fixtures only. No preview route or auth bypass is added to the app.
import { build } from "esbuild";
import { mkdir, readFile, readdir } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { chromium } from "playwright-core";
import path from "node:path";
const root = process.cwd();
const output = path.join(root, ".test-artifacts");
await mkdir(output, { recursive: true });
const cssFiles = (await readdir(".next/static/chunks")).filter((f) =>
  f.endsWith(".css"),
);
const css = (
  await Promise.all(
    cssFiles.map((f) => readFile(".next/static/chunks/" + f, "utf8")),
  )
).join("\n");
await build({
  stdin: {
    contents: `import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';import {DashboardView} from './src/components/dashboard-view';import {Brand} from './src/components/brand';import {AssignmentWorkspace} from './src/components/assignment-workspace';import {ClassesWorkspace} from './src/components/classes-workspace';import {normalizeFilters} from './src/lib/assignment-filters';import {writeFileSync} from 'node:fs';
const classes=[{id:'c1',name:'Introduction to Psychology',color:'#7065f0'},{id:'c2',name:'Design Studio',color:'#bd9a65'},{id:'c3',name:'World Literature',color:'#74a58f'}];
const assignments=[{id:'a1',title:'Read chapter 4 and write a reflection',class_id:'c1',due_date:'2026-10-26',priority:'high',completed:false},{id:'a2',title:'Finish the visual research moodboard',class_id:'c2',due_date:'2026-10-26',priority:'medium',completed:false},{id:'a3',title:'Review notes for the seminar',class_id:'c3',due_date:'2026-10-28',priority:'low',completed:false},{id:'a4',title:'Submit the first project proposal',class_id:'c2',due_date:'2026-10-24',priority:'medium',completed:true}];
for(const [name,data] of [['populated',{classes,assignments}],['empty',{classes:[],assignments:[]}]]){const html=renderToStaticMarkup(<div className="workspace"><aside className="sidebar"><Brand/><span className="nav-caption">YOUR WORKSPACE</span><nav><a className="nav-active" href="/dashboard">Overview</a><a href="/classes">My classes</a><a href="/assignments">Assignments</a><a href="/settings">Settings</a></nav></aside><main className="workspace-main"><DashboardView {...data} today="2026-10-26"/></main></div>);writeFileSync('.test-artifacts/'+name+'.html','<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>'+html+'</body></html>');}
const cases=[['assignments-populated',<AssignmentWorkspace classes={classes} assignments={assignments} filters={normalizeFilters({})} today="2026-10-26"/>],['assignments-empty',<AssignmentWorkspace classes={[]} assignments={[]} filters={normalizeFilters({})} today="2026-10-26"/>],['assignments-no-results',<AssignmentWorkspace classes={classes} assignments={assignments} filters={normalizeFilters({q:'no such assignment'})} today="2026-10-26"/>],['classes-populated',<ClassesWorkspace classes={classes} assignments={assignments}/>],['classes-empty',<ClassesWorkspace classes={[]} assignments={[]}/>]];
for(const [name,view] of cases){const html=renderToStaticMarkup(<div className="workspace"><aside className="sidebar"><Brand/><span className="nav-caption">YOUR WORKSPACE</span><nav><a href="/dashboard">Overview</a><a href="/classes">My classes</a><a href="/assignments">Assignments</a><a href="/settings">Settings</a></nav></aside><main className="workspace-main">{view}</main></div>);writeFileSync('.test-artifacts/'+name+'.html','<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>'+html+'</body></html>');}`,
    resolveDir: root,
    loader: "tsx",
  },
  bundle: true,
  platform: "node",
  format: "cjs",
  packages: "external",
  alias: { "@": path.join(root, "src") },
  outfile: path.join(output, "render.cjs"),
  jsx: "automatic",
  plugins: [
    {
      name: "test-only-server-action-boundary",
      setup(builder) {
        builder.onResolve({ filter: /^@\/app\/actions$/ }, () => ({
          path: "actions",
          namespace: "test",
        }));
        builder.onLoad({ filter: /.*/, namespace: "test" }, () => ({
          contents:
            "export async function toggleAssignment(){};export async function deleteAssignment(){};export async function saveAssignment(){};export async function saveClass(){};export async function deleteClass(){};",
          loader: "js",
        }));
      },
    },
  ],
});
execFileSync(process.execPath, [path.join(output, "render.cjs")], {
  cwd: root,
});
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_EXECUTABLE_PATH || "/usr/bin/chromium",
  args: ["--no-sandbox"],
});
try {
  const page = await browser.newPage();
  for (const fixture of [
    "populated",
    "empty",
    "assignments-populated",
    "assignments-empty",
    "assignments-no-results",
    "classes-populated",
    "classes-empty",
  ])
    for (const width of [375, 768, 1440])
      for (const theme of ["light", "dark"]) {
        await page.setViewportSize({ width, height: 1050 });
        await page.setContent(
          await readFile(path.join(output, fixture + ".html"), "utf8"),
        );
        await page.addStyleTag({ content: css });
        await page.evaluate(
          (theme) => (document.documentElement.dataset.theme = theme),
          theme,
        );
        if (fixture.startsWith("assignments-"))
          await page
            .getByRole("heading", { name: "Your assignments." })
            .waitFor();
        else if (fixture.startsWith("classes-"))
          await page.getByRole("heading", { name: "Your classes." }).waitFor();
        else
          await page.getByRole("heading", { name: "Today’s focus" }).waitFor();
        if (fixture === "assignments-no-results")
          await page
            .getByRole("heading", { name: "Nothing matches this view." })
            .waitFor();
        if (fixture === "assignments-populated") {
          if (
            await page
              .getByRole("button", { name: "Delete permanently" })
              .count()
          )
            throw Error("Delete button exposed before confirmation");
          await page
            .getByLabel("Delete Read chapter 4 and write a reflection", {
              exact: true,
            })
            .click();
          await page
            .getByRole("button", { name: "Delete permanently" })
            .waitFor();
          const box = await page
            .locator(".delete-popover")
            .first()
            .boundingBox();
          if (!box || box.x < 0 || box.x + box.width > width + 1)
            throw Error("Delete confirmation overflows viewport");
          await page
            .getByLabel("Delete Read chapter 4 and write a reflection", {
              exact: true,
            })
            .click();
        }
        if (
          await page.evaluate(
            () => document.documentElement.scrollWidth > innerWidth + 1,
          )
        )
          throw Error("Dashboard overflow: " + fixture + " at " + width);
        if (
          fixture === "populated" &&
          (await page
            .locator(".overview-stat strong")
            .allTextContents()
            .then((values) => values.join(","))) !== "02,01,03,03"
        )
          throw Error("Incorrect task summaries");
        await page.waitForTimeout(250);
        await page.screenshot({
          path: path.join(
            output,
            "dashboard-" + fixture + "-" + width + "-" + theme + ".png",
          ),
          fullPage: true,
        });
      }
  console.log(
    "PASS: real dashboard/classes/assignments views, populated/empty/no-results states, delete confirmations, summary counts and no overflow in light/dark at 375/768/1440px. Server mutations are stubbed only in this isolated test.",
  );
} finally {
  await browser.close();
}
