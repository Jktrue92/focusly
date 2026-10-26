import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
const db = new PGlite();
const alice = "11111111-1111-4111-8111-111111111111";
const bob = "22222222-2222-4222-8222-222222222222";
await db.exec(`create role anon; create role authenticated;
create schema auth; create table auth.users(id uuid primary key);
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true),'')::uuid $$;
grant usage on schema auth to authenticated, anon;
grant execute on function auth.uid() to authenticated, anon;
insert into auth.users values ('${alice}'), ('${bob}');`);
await db.exec(
  await readFile(
    new URL("../supabase/migrations/202610250001_initial.sql", import.meta.url),
    "utf8",
  ),
);
async function asUser(user, operation) {
  await db.exec(
    `begin; set local role authenticated; set local "request.jwt.claim.sub" = '${user}';`,
  );
  try {
    const result = await operation();
    await db.exec("commit");
    return result;
  } catch (e) {
    await db.exec("rollback");
    throw e;
  }
}
const repair = await readFile(
  new URL(
    "../supabase/migrations/202610260001_repair_partial_setup.sql",
    import.meta.url,
  ),
  "utf8",
);
// Simulate the hosted partial setup: classes exists, assignments does not.
await db.exec("drop table public.assignments");
await db.exec(repair);
const course = await asUser(
  alice,
  async () =>
    (
      await db.query(
        "insert into public.classes(name,color) values ('Biology','#7065F0') returning id",
      )
    ).rows[0].id,
);
const assignment = await asUser(
  alice,
  async () =>
    (
      await db.query(
        "insert into public.assignments(title,due_date,class_id) values ('Lab report','2026-11-01',$1) returning id",
        [course],
      )
    ).rows[0].id,
);
// Repair must be repeatable and retain existing student work.
await db.exec(repair);
await db.exec(repair);
assert.equal((await db.query("select id from public.classes")).rows.length, 1);
assert.equal(
  (await db.query("select id from public.assignments")).rows.length,
  1,
);
await asUser(bob, async () => {
  assert.equal((await db.query("select * from public.classes")).rows.length, 0);
  assert.equal(
    (await db.query("select * from public.assignments")).rows.length,
    0,
  );
  assert.equal(
    (
      await db.query(
        "update public.assignments set completed=true where id=$1 returning id",
        [assignment],
      )
    ).rows.length,
    0,
  );
  assert.equal(
    (
      await db.query("delete from public.classes where id=$1 returning id", [
        course,
      ])
    ).rows.length,
    0,
  );
});
await assert.rejects(
  asUser(bob, () =>
    db.query(
      "insert into public.assignments(title,due_date,class_id) values ('Intrusion','2026-11-01',$1)",
      [course],
    ),
  ),
  /foreign key/i,
);
await assert.rejects(
  asUser(bob, () =>
    db.query("insert into public.classes(name,user_id) values ('Spoof',$1)", [
      alice,
    ]),
  ),
  /row.level security/i,
);
await assert.rejects(
  asUser(alice, () =>
    db.query("update public.assignments set user_id=$1 where id=$2", [
      bob,
      assignment,
    ]),
  ),
  /row.level security/i,
);
for (const sql of [
  "insert into public.classes(name,color) values ('Bad','red')",
  "insert into public.classes(name) values (' ')",
  "insert into public.assignments(title,due_date,priority) values ('Bad','2026-11-01','urgent')",
]) {
  await assert.rejects(
    asUser(alice, () => db.exec(sql)),
    /check constraint/i,
  );
}
await asUser(alice, async () => {
  await db.query(
    "update public.assignments set completed=true,priority='high' where id=$1",
    [assignment],
  );
  assert.equal(
    (
      await db.query("select completed from public.assignments where id=$1", [
        assignment,
      ])
    ).rows[0].completed,
    true,
  );
  await db.query("delete from public.classes where id=$1", [course]);
  assert.equal(
    (
      await db.query("select class_id from public.assignments where id=$1", [
        assignment,
      ])
    ).rows[0].class_id,
    null,
  );
});
await db.exec("begin; set local role anon;");
await assert.rejects(
  db.query("select * from public.assignments"),
  /permission denied/i,
);
await db.exec("rollback");
await db.query("delete from auth.users where id=$1", [alice]);
assert.equal(
  (await db.query("select * from public.assignments")).rows.length,
  0,
);
console.log(
  "PASS: migration, CRUD, per-user RLS, cross-owner references, constraints, anonymous denial, class unlinking, auth-user cascade (embedded PostgreSQL; not hosted Supabase).",
);
// Eligibility trigger applies only to future accounts, not existing users.
await db.exec(
  "alter table auth.users add column raw_user_meta_data jsonb not null default '{}'::jsonb",
);
await db.exec(
  await readFile(
    new URL(
      "../supabase/migrations/202610260002_signup_eligibility.sql",
      import.meta.url,
    ),
    "utf8",
  ),
);
for (const metadata of [
  {},
  { age_13_or_older: false, privacy_policy_version: "2026-10-26" },
  { age_13_or_older: true },
]) {
  await assert.rejects(
    db.query(
      "insert into auth.users(id,raw_user_meta_data) values (gen_random_uuid(), $1)",
      [JSON.stringify(metadata)],
    ),
    /eligibility/,
  );
}
await db.query(
  "insert into auth.users(id,raw_user_meta_data) values (gen_random_uuid(), $1)",
  [
    JSON.stringify({
      age_13_or_older: true,
      privacy_policy_version: "2026-10-26",
    }),
  ],
);
console.log(
  "PASS: database rejects absent/under-13 attestations and missing policy acknowledgements; eligible signup succeeds.",
);
await db.exec(
  await readFile(
    new URL(
      "../supabase/migrations/202610260003_account_privacy.sql",
      import.meta.url,
    ),
    "utf8",
  ),
);
const charlie = "33333333-3333-4333-8333-333333333333";
await db.query("insert into auth.users(id,raw_user_meta_data) values ($1,$2)", [
  charlie,
  JSON.stringify({
    age_13_or_older: true,
    privacy_policy_version: "2026-10-26",
  }),
]);
await asUser(bob, async () => {
  const course = (
    await db.query(
      "insert into public.classes(name) values ('Bob private class') returning id",
    )
  ).rows[0].id;
  await db.query(
    "insert into public.assignments(title,due_date,class_id) values ('Bob task','2026-11-01',$1)",
    [course],
  );
});
await asUser(charlie, () =>
  db.query("insert into public.classes(name) values ('Charlie private class')"),
);
await db.exec("begin; set local role anon;");
await assert.rejects(
  db.query("select public.delete_own_account()"),
  /permission denied/i,
);
await db.exec("rollback");
await assert.rejects(
  asUser("", () => db.query("select public.delete_own_account()")),
  /Authentication required/,
);
await asUser(bob, () => db.query("select public.delete_own_account()"));
assert.equal(
  (await db.query("select id from auth.users where id=$1", [bob])).rows.length,
  0,
);
assert.equal(
  (await db.query("select id from public.classes where user_id=$1", [bob])).rows
    .length,
  0,
);
assert.equal(
  (await db.query("select id from public.assignments where user_id=$1", [bob]))
    .rows.length,
  0,
);
assert.equal(
  (await db.query("select id from auth.users where id=$1", [charlie])).rows
    .length,
  1,
);
assert.equal(
  (await db.query("select id from public.classes where user_id=$1", [charlie]))
    .rows.length,
  1,
);
console.log(
  "PASS: anonymous/missing-identity deletion denied; self-deletion cascades only caller records and preserves another account.",
);
await db.close();
