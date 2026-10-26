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
    contents: `import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';import {DashboardView} from './src/components/dashboard-view';import {Brand} from './src/components/brand';import {writeFileSync} from 'node:fs';
const classes=[{id:'c1',name:'Introduction to Psychology',color:'#7065f0'},{id:'c2',name:'Design Studio',color:'#bd9a65'},{id:'c3',name:'World Literature',color:'#74a58f'}];
const assignments=[{id:'a1',title:'Read chapter 4 and write a reflection',class_id:'c1',due_date:'2026-10-26',priority:'high',completed:false},{id:'a2',title:'Finish the visual research moodboard',class_id:'c2',due_date:'2026-10-26',priority:'medium',completed:false},{id:'a3',title:'Review notes for the seminar',class_id:'c3',due_date:'2026-10-28',priority:'low',completed:false},{id:'a4',title:'Submit the first project proposal',class_id:'c2',due_date:'2026-10-24',priority:'medium',completed:true}];
for(const [name,data] of [['populated',{classes,assignments}],['empty',{classes:[],assignments:[]}]]){const html=renderToStaticMarkup(<div className="workspace"><aside className="sidebar"><Brand/><span className="nav-caption">YOUR WORKSPACE</span><nav><a className="nav-active" href="/dashboard">Overview</a><a href="/classes">My classes</a><a href="/assignments">Assignments</a><a href="/settings">Settings</a></nav></aside><main className="workspace-main"><DashboardView {...data} today="2026-10-26"/></main></div>);writeFileSync('.test-artifacts/'+name+'.html','<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>'+html+'</body></html>');}`,
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
            "export async function toggleAssignment(){};export async function deleteAssignment(){};export async function saveAssignment(){};",
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
  for (const fixture of ["populated", "empty"])
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
        await page.getByRole("heading", { name: "Today’s focus" }).waitFor();
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
    "PASS: real dashboard component, populated/empty fixtures, summary counts and no overflow at 375/768/1440px. Server mutations are stubbed only in this isolated test.",
  );
} finally {
  await browser.close();
}
