import { readAll } from "../src/lib/read-all.ts";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { createRequire } from "node:module";
import { mkdir } from "node:fs/promises";
import { PDFDocument } from "pdf-lib";
import {
  answerMatches,
  quizChoices,
  quizAvailable,
  shuffled,
} from "../src/lib/study.ts";
import {
  validateScheduleDraft,
  reviewedSchedule,
  validTerm,
  validDate,
  validTimezone,
} from "../src/lib/schedule.ts";
// Isolate provider fixtures from deployment selection; all network calls below are mocked.
process.env.DAYLANE_AI_PROVIDER = "openai";
await mkdir(".test-artifacts", { recursive: true });
await build({
  stdin: {
    contents:
      "export * from './src/lib/study-ai';export * from './src/lib/schedule-ai';export * from './src/lib/ai-provider';",
    loader: "ts",
    resolveDir: process.cwd(),
  },
  bundle: true,
  platform: "node",
  format: "cjs",
  packages: "external",
  outfile: ".test-artifacts/schedule-ai-test.cjs",
});
const {
  readScheduleAsset,
  extractScheduleFromProvider,
  validateStudyDraft,
  generateStudyDraftFromProvider,
  AIProviderError,
  aiFailureMessage,
  aiConfigured,
  aiProvider,
  AI_CONSENT_VERSION,
  providerConsentMatches,
  cloudflareStructured,
  cloudflareDocumentText,
  AIDocumentError,
} = createRequire(import.meta.url)("../.test-artifacts/schedule-ai-test.cjs");
const cards = [
  { id: "1", term: "Cell", definition: "Basic unit of life." },
  { id: "2", term: "DNA", definition: "Carries genetic information." },
  { id: "3", term: "Mitochondria", definition: "Produces ATP." },
  { id: "4", term: "Nucleus", definition: "Contains DNA." },
].map((c) => ({ ...c, deck_id: "d", source_excerpt: "", created_at: "" }));
assert.equal(
  answerMatches("  BASIC  unit of life. ", "Basic unit of life."),
  true,
);
assert.equal(answerMatches("Similar idea", "Basic unit of life."), false);
assert.equal(quizAvailable(cards), true);
assert.equal(
  quizAvailable([
    ...cards.slice(0, 3),
    { ...cards[3], definition: cards[0].definition },
  ]),
  false,
);
const choices = quizChoices(cards[0], cards, () => 0.4);
assert.equal(choices.length, 4);
assert.equal(new Set(choices).size, 4);
assert.equal(choices.filter((c) => c === cards[0].definition).length, 1);
assert.equal(quizChoices(cards[0], cards.slice(0, 3)).length, 0);
assert.equal(shuffled(cards, () => 0.5).length, 4);
assert.equal(cards[0].id, "1");
const notes =
  "A cell is the basic unit of life. DNA carries genetic information. Mitochondria produce ATP for cellular processes.";
const draft = {
  summary: "Cell structures have different functions.",
  cards: [
    {
      term: "Cell",
      definition: "Basic unit of life.",
      source_excerpt: "A cell is the basic unit of life.",
    },
  ],
};
assert.ok(validateStudyDraft(draft, notes, 5));
assert.equal(
  validateStudyDraft(
    {
      ...draft,
      cards: [{ ...draft.cards[0], source_excerpt: "Invented source" }],
    },
    notes,
    5,
  ),
  null,
);
assert.equal(validateStudyDraft({ ...draft, cards: [] }, notes, 5), null);
let requestBody;
const mock = async (url, init) => {
  assert.equal(url, "https://api.openai.com/v1/chat/completions");
  requestBody = JSON.parse(init.body);
  assert.equal(requestBody.store, false);
  assert.equal(init.headers.Authorization, "Bearer test-key");
  return new Response(
    JSON.stringify({
      choices: [{ message: { content: JSON.stringify(draft) } }],
    }),
    { status: 200 },
  );
};
assert.deepEqual(
  await generateStudyDraftFromProvider(
    notes,
    5,
    "test-key",
    "test-model",
    mock,
  ),
  draft,
);
assert.equal(requestBody.messages[1].content.includes(notes), true);
await assert.rejects(
  generateStudyDraftFromProvider(
    notes,
    5,
    "test-key",
    "test-model",
    async () => new Response("{}", { status: 429 }),
  ),
  /unavailable/,
);
await assert.rejects(
  generateStudyDraftFromProvider(
    notes,
    5,
    "test-key",
    "test-model",
    async () =>
      new Response(
        JSON.stringify({ choices: [{ message: { content: "not json" } }] }),
      ),
  ),
  /unavailable/,
);
const text = "Physics Monday 09:00-10:00. Lab report due 2026-11-01.";
const schedule = {
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
  warnings: [],
};
assert.ok(validateScheduleDraft(schedule, "2026-10-01", "2026-12-31", text));
assert.equal(
  validateScheduleDraft(
    {
      ...schedule,
      assignments: [{ ...schedule.assignments[0], due_date: "2027-01-01" }],
    },
    "2026-10-01",
    "2026-12-31",
    text,
  ),
  null,
);
assert.equal(
  validateScheduleDraft(
    {
      ...schedule,
      classes: [
        {
          ...schedule.classes[0],
          meetings: [
            { ...schedule.classes[0].meetings[0], start_time: "25:00" },
          ],
        },
      ],
    },
    "2026-10-01",
    "2026-12-31",
    text,
  ),
  null,
);
assert.equal(
  validateScheduleDraft(
    schedule,
    "2026-10-01",
    "2026-12-31",
    "Unrelated source",
  ),
  null,
);
assert.equal(validDate("2026-02-30"), false);
assert.equal(validTerm("2026-10-01", "2028-01-01"), false);
assert.equal(validTimezone("Made/Up"), false);
assert.equal(
  (
    await readScheduleAsset(
      new File([text], "schedule.csv", { type: "text/csv" }),
    )
  ).kind,
  "text",
);
await assert.rejects(
  readScheduleAsset(new File(["short"], "schedule.txt")),
  /characters/,
);
await assert.rejects(
  readScheduleAsset(
    new File([new Uint8Array(4 * 1024 * 1024 + 1)], "large.pdf"),
  ),
  /4 MB/,
);
await assert.rejects(
  readScheduleAsset(new File(["not an image"], "schedule.png")),
  /Use PDF/,
);
const pdf = await PDFDocument.create();
pdf.addPage();
assert.equal(
  (await readScheduleAsset(new File([await pdf.save()], "schedule.pdf"))).kind,
  "pdf",
);
const bigPdf = await PDFDocument.create();
for (let i = 0; i < 11; i++) bigPdf.addPage();
await assert.rejects(
  readScheduleAsset(new File([await bigPdf.save()], "large.pdf")),
  /10 pages/,
);
const scheduleMock = async (url, init) => {
  assert.equal(url, "https://api.openai.com/v1/responses");
  const body = JSON.parse(init.body);
  assert.equal(body.store, false);
  assert.equal(body.input[1].content[1].text, text);
  return new Response(
    JSON.stringify({
      output: [
        {
          type: "message",
          content: [{ type: "output_text", text: JSON.stringify(schedule) }],
        },
      ],
    }),
  );
};
assert.deepEqual(
  await extractScheduleFromProvider(
    { kind: "text", text },
    "2026-10-01",
    "2026-12-31",
    "UTC",
    "test-key",
    "test-model",
    scheduleMock,
  ),
  schedule,
);
const form = new FormData();
for (const [key, value] of Object.entries({
  term_start: "2026-10-01",
  term_end: "2026-12-31",
  timezone: "UTC",
  import_token: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  review_confirmed: "on",
  class_count: "1",
  assignment_count: "1",
  include_class_0: "on",
  class_name_0: "Physics",
  class_color_0: "#7065F0",
  existing_class_0: "",
  meeting_count_0: "1",
  include_meeting_0_0: "on",
  weekday_0_0: "1",
  start_0_0: "09:00",
  end_0_0: "10:00",
  include_assignment_0: "on",
  assignment_title_0: "Lab report",
  assignment_date_0: "2026-11-01",
  assignment_priority_0: "medium",
  assignment_class_0: "0",
}))
  form.set(key, value);
assert.ok("draft" in reviewedSchedule(form));
form.delete("include_class_0");
assert.match(reviewedSchedule(form).error, /excluded class/);
form.set("assignment_class_0", "");
assert.ok("draft" in reviewedSchedule(form));
form.delete("review_confirmed");
assert.match(reviewedSchedule(form).error, /confirm/);
console.log(
  "PASS: recall grading, unique quiz choices, grounded AI drafts, provider contracts/failures, file magic/size/PDF page limits, schedule validation, reviewed import mapping and consent. Provider calls mocked; no money or real data sent.",
);

const large = Array.from({ length: 1201 }, (_, id) => ({ id }));
assert.equal(
  (
    await readAll(async (start, end) => ({
      data: large.slice(start, end + 1),
      error: null,
    }))
  ).data.length,
  1201,
);
assert.equal(
  (
    await readAll(
      async (start, end) => ({
        data: large.slice(start, end + 1),
        error: null,
      }),
      1000,
    )
  ).error.code,
  "ROW_LIMIT",
);
assert.equal(
  (await readAll(async () => ({ data: null, error: { code: "42501" } }))).error
    .code,
  "42501",
);
console.log(
  "PASS: paged reads avoid silent database API row truncation and fail explicitly on oversized datasets.",
);

assert.equal(
  (
    await readAll(async (start) => ({
      data: large.slice(start, start + 100),
      error: null,
    }))
  ).data.length,
  1201,
);
console.log(
  "PASS: pagination handles a server row cap smaller than the requested page size.",
);

assert.match(aiFailureMessage(new AIProviderError(401)), /server API key/);
assert.match(aiFailureMessage(new AIProviderError(429)), /billing or usage/);
assert.equal(
  aiFailureMessage(new Error("private provider data")).includes(
    "private provider data",
  ),
  false,
);
console.log(
  "PASS: provider configuration/billing errors are actionable without exposing raw responses.",
);

const settingNames = [
  "DAYLANE_AI_PROVIDER",
  "DAYLANE_AI_ACCOUNT_ID",
  "DAYLANE_AI_API_KEY",
  "DAYLANE_AI_ENABLED",
  "DAYLANE_AI_MODEL",
];
const previousSettings = Object.fromEntries(
  settingNames.map((name) => [name, process.env[name]]),
);
try {
  process.env.DAYLANE_AI_PROVIDER = "cloudflare";
  process.env.DAYLANE_AI_ACCOUNT_ID = "a".repeat(32);
  process.env.DAYLANE_AI_API_KEY = " test-token ";
  process.env.DAYLANE_AI_ENABLED = " true ";
  process.env.DAYLANE_AI_MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";
  assert.equal(aiConfigured(), true);
  assert.equal(aiProvider(), "cloudflare");
  const consent = new FormData();
  consent.set("ai_consent", "on");
  consent.set("ai_provider", "openai");
  consent.set("ai_consent_version", AI_CONSENT_VERSION);
  assert.equal(providerConsentMatches(consent), false);
  consent.set("ai_provider", "cloudflare");
  assert.equal(providerConsentMatches(consent), true);
  consent.set("ai_consent_version", "old");
  assert.equal(providerConsentMatches(consent), false);
  let cfCalls = 0;
  const cfMock = async (url, init) => {
    cfCalls++;
    assert.match(
      url,
      /^https:\/\/api\.cloudflare\.com\/client\/v4\/accounts\/a{32}\/ai\/run\/@cf\/meta\//,
    );
    assert.equal(init.headers.Authorization, "Bearer test-token");
    const body = JSON.parse(init.body);
    assert.equal(body.response_format.type, "json_schema");
    assert.equal(body.response_format.json_schema.type, "object");
    assert.equal(body.stream, false);
    return new Response(
      JSON.stringify({ success: true, result: { response: draft } }),
    );
  };
  assert.deepEqual(
    await generateStudyDraftFromProvider(
      notes,
      5,
      " test-token ",
      process.env.DAYLANE_AI_MODEL,
      cfMock,
      "cloudflare",
    ),
    draft,
  );
  assert.equal(cfCalls, 1);
  assert.match(aiFailureMessage(new AIProviderError(429)), /free daily/);
  await assert.rejects(
    cloudflareStructured(
      [],
      {},
      "test-token",
      "unsupported-model",
      100,
      cfMock,
    ),
    /unavailable/,
  );
  assert.equal(cfCalls, 1);
  let stages = 0;
  const cfSchedule = async (url, init) => {
    stages++;
    assert.match(url, /^https:\/\/api\.cloudflare\.com\//);
    if (url.endsWith("/tomarkdown")) {
      const file = init.body.get("files");
      assert.equal(file.name, "schedule.pdf");
      assert.equal(file.type, "application/pdf");
      assert.equal(init.headers["Content-Type"], undefined);
      return new Response(
        JSON.stringify({
          success: true,
          result: [{ format: "markdown", data: text }],
        }),
      );
    }
    const body = JSON.parse(init.body);
    assert.equal(JSON.parse(body.messages[1].content).document, text);
    return new Response(
      JSON.stringify({
        success: true,
        result: { response: JSON.stringify(schedule) },
      }),
    );
  };
  assert.deepEqual(
    await extractScheduleFromProvider(
      {
        kind: "pdf",
        mime: "application/pdf",
        base64: Buffer.from("%PDF-test").toString("base64"),
      },
      "2026-10-01",
      "2026-12-31",
      "UTC",
      "test-token",
      process.env.DAYLANE_AI_MODEL,
      cfSchedule,
      "cloudflare",
    ),
    schedule,
  );
  assert.equal(stages, 2);
  await assert.rejects(
    cloudflareDocumentText(
      { mime: "image/png", base64: "AA==" },
      "test-token",
      async () =>
        new Response(
          JSON.stringify({ success: true, result: [{ format: "error" }] }),
        ),
    ),
    AIDocumentError,
  );
  await assert.rejects(
    cloudflareDocumentText(
      { mime: "image/png", base64: "AA==" },
      "test-token",
      async () =>
        new Response(
          JSON.stringify({
            success: true,
            result: [{ format: "markdown", data: "x".repeat(12001) }],
          }),
        ),
    ),
    AIDocumentError,
  );
  await assert.rejects(
    cloudflareStructured(
      [],
      {},
      "test-token",
      process.env.DAYLANE_AI_MODEL,
      100,
      async () => new Response("{}", { status: 429 }),
    ),
    /unavailable/,
  );
  process.env.DAYLANE_AI_PROVIDER = "unknown";
  assert.equal(aiProvider(), null);
  assert.equal(aiConfigured(), false);
  console.log(
    "PASS: Cloudflare contracts, free-tier errors, model restrictions, provider-bound consent, PDF/image conversion, no silent source truncation, and no paid-provider fallback. All provider calls mocked.",
  );
} finally {
  for (const name of settingNames) {
    if (previousSettings[name] === undefined) delete process.env[name];
    else process.env[name] = previousSettings[name];
  }
}
