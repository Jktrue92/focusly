import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
const db = new PGlite();
const a = "11111111-1111-4111-8111-111111111111",
  b = "22222222-2222-4222-8222-222222222222";
await db.exec(
  `create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key,raw_user_meta_data jsonb not null default '{}'::jsonb);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth to authenticated,anon;grant execute on function auth.uid() to authenticated,anon;insert into auth.users(id) values('${a}'),('${b}');`,
);
for (const file of [
  "202610250001_initial.sql",
  "202610260002_signup_eligibility.sql",
  "202610260003_account_privacy.sql",
  "202610260004_study_tools.sql",
  "202610260005_schedule_import.sql",
])
  await db.exec(
    await readFile(
      new URL("../supabase/migrations/" + file, import.meta.url),
      "utf8",
    ),
  );
async function asUser(user, run) {
  await db.exec(
    `begin;set local role authenticated;set local "request.jwt.claim.sub"='${user}';`,
  );
  try {
    const result = await run();
    await db.exec("commit");
    return result;
  } catch (e) {
    await db.exec("rollback");
    throw e;
  }
}
const deck = await asUser(
  a,
  async () =>
    (
      await db.query(
        "insert into public.study_decks(title) values ('Biology') returning id",
      )
    ).rows[0].id,
);
const card = await asUser(
  a,
  async () =>
    (
      await db.query(
        "insert into public.flashcards(deck_id,term,definition) values ($1,'Cell','Basic unit of life') returning id",
        [deck],
      )
    ).rows[0].id,
);
await asUser(b, async () => {
  assert.equal(
    (await db.query("select * from public.study_decks")).rows.length,
    0,
  );
  assert.equal(
    (await db.query("select * from public.flashcards")).rows.length,
    0,
  );
  assert.equal(
    (
      await db.query("delete from public.flashcards where id=$1 returning id", [
        card,
      ])
    ).rows.length,
    0,
  );
});
await assert.rejects(
  asUser(b, () =>
    db.query(
      "insert into public.flashcards(deck_id,term,definition) values ($1,'Foreign','No')",
      [deck],
    ),
  ),
  /foreign key/i,
);
await assert.rejects(
  asUser(b, () =>
    db.query("select public.record_card_review($1,true)", [card]),
  ),
  /unavailable/i,
);
await asUser(a, async () => {
  await db.query("select public.record_card_review($1,true)", [card]);
  await db.query("select public.record_card_review($1,false)", [card]);
  const row = (await db.query("select * from public.flashcard_progress"))
    .rows[0];
  assert.equal(row.review_count, 2);
  assert.equal(row.known, false);
});
await asUser(a, async () => {
  for (let i = 1; i < 200; i++)
    await db.query(
      "insert into public.flashcards(deck_id,term,definition) values ($1,$2,'Answer')",
      [deck, "Term " + i],
    );
});
await assert.rejects(
  asUser(a, () =>
    db.query(
      "insert into public.flashcards(deck_id,term,definition) values ($1,'Overflow','No')",
      [deck],
    ),
  ),
  /200 cards/i,
);
assert.equal(
  await asUser(
    a,
    async () =>
      (await db.query("select public.claim_ai_request() as allowed")).rows[0]
        .allowed,
  ),
  true,
);
assert.equal(
  await asUser(
    a,
    async () =>
      (await db.query("select public.claim_ai_request() as allowed")).rows[0]
        .allowed,
  ),
  false,
);
await assert.rejects(
  asUser(a, () => db.query("update public.ai_usage set hour_count=0")),
  /permission denied/i,
);
for (let i = 1; i < 5; i++) {
  await db.query(
    "update public.ai_usage set last_request=now()-interval '61 seconds' where user_id=$1",
    [a],
  );
  assert.equal(
    await asUser(
      a,
      async () =>
        (await db.query("select public.claim_ai_request() as allowed")).rows[0]
          .allowed,
    ),
    true,
  );
}
await db.query(
  "update public.ai_usage set last_request=now()-interval '61 seconds' where user_id=$1",
  [a],
);
assert.equal(
  await asUser(
    a,
    async () =>
      (await db.query("select public.claim_ai_request() as allowed")).rows[0]
        .allowed,
  ),
  false,
);
await db.query(
  "update public.ai_usage set hour_start=now()-interval '2 hours',last_request=now()-interval '61 seconds',day_count=20 where user_id=$1",
  [a],
);
assert.equal(
  await asUser(
    a,
    async () =>
      (await db.query("select public.claim_ai_request() as allowed")).rows[0]
        .allowed,
  ),
  false,
);
const draft = {
  classes: [
    {
      name: "Physics",
      color: "#7065F0",
      existing_id: null,
      meetings: [{ weekday: 1, start_time: "09:00", end_time: "10:00" }],
    },
  ],
  assignments: [
    {
      title: "Lab report",
      class_index: 0,
      due_date: "2026-11-01",
      priority: "medium",
    },
  ],
};
const token = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const importDraft = (user, payload, receipt = token) =>
  asUser(
    user,
    async () =>
      (
        await db.query(
          "select public.import_reviewed_schedule($1,'2026-10-01','2026-12-31','America/New_York',$2) as result",
          [JSON.stringify(payload), receipt],
        )
      ).rows[0].result,
  );
assert.deepEqual(await importDraft(a, draft), {
  classes: 1,
  meetings: 1,
  assignments: 1,
});
assert.deepEqual(await importDraft(a, draft), {
  classes: 1,
  meetings: 1,
  assignments: 1,
});
assert.equal(
  (await db.query("select * from public.class_meetings")).rows.length,
  1,
);
assert.equal(
  (await db.query("select * from public.assignments")).rows.length,
  1,
);
const ownClass = (
  await db.query("select id from public.classes where user_id=$1", [a])
).rows[0].id;
await assert.rejects(
  importDraft(b, {
    classes: [{ ...draft.classes[0], existing_id: ownClass }],
    assignments: [],
  }),
  /Class unavailable/i,
);
const invalid = {
  classes: [
    {
      ...draft.classes[0],
      name: "Should rollback",
      meetings: [{ weekday: 1, start_time: "12:00", end_time: "10:00" }],
    },
  ],
  assignments: [],
};
await assert.rejects(
  importDraft(a, invalid, "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"),
  /check constraint/i,
);
assert.equal(
  (await db.query("select * from public.classes where name='Should rollback'"))
    .rows.length,
  0,
);
assert.equal(
  (
    await db.query(
      "select * from public.schedule_imports where token='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'",
    )
  ).rows.length,
  0,
);
await asUser(b, async () =>
  assert.equal(
    (await db.query("select * from public.class_meetings")).rows.length,
    0,
  ),
);
await db.exec("begin;set local role anon;");
await assert.rejects(
  db.query("select * from public.study_decks"),
  /permission denied/i,
);
await db.exec("rollback");
await db.exec("begin;set local role anon;");
await assert.rejects(
  db.query("select public.claim_ai_request()"),
  /permission denied/i,
);
await db.exec("rollback");
assert.equal(
  await asUser(
    b,
    async () =>
      (await db.query("select public.get_own_ai_usage() as usage")).rows[0]
        .usage,
  ),
  null,
);
const ownUsage = await asUser(
  a,
  async () =>
    (await db.query("select public.get_own_ai_usage() as usage")).rows[0].usage,
);
assert.equal(ownUsage.day_count, 20);
assert.equal(ownUsage.consent_version, "2026-10-26-ai-beta");
await db.exec("begin;set local role anon;");
await assert.rejects(
  db.query("select public.get_own_ai_usage()"),
  /permission denied/i,
);
await db.exec("rollback");
await asUser(a, () => db.query("select public.delete_own_account()"));
for (const table of [
  "study_decks",
  "flashcards",
  "flashcard_progress",
  "ai_usage",
  "class_meetings",
  "schedule_imports",
  "classes",
  "assignments",
])
  assert.equal(
    (await db.query("select * from public." + table + " where user_id=$1", [a]))
      .rows.length,
    0,
  );
assert.equal(
  (await db.query("select id from auth.users where id=$1", [b])).rows.length,
  1,
);
console.log(
  "PASS: study/schedule migrations, owner isolation, cross-owner references, review counters, 200-card limit, private AI quotas/cooldown/hour/day limits, atomic/idempotent schedule import, rollback, and complete self-deletion. Embedded PostgreSQL only.",
);
await db.close();
