# Daylane

Formerly Focusly. Daylane is the product name; Focusly Inc. remains the operator and `hellofocusly@gmail.com` remains the privacy contact. Existing GitHub/Vercel/Supabase project names and browser storage keys are retained so this rebrand does not reset preferences or the under-13 block.

**Less stress. More progress.** A responsive student productivity app built with Next.js App Router, TypeScript, Tailwind CSS, Supabase SSR Auth, PostgreSQL, and lucide-react.

## First milestone

Landing page, email/password signup and login, session refresh, protected overview, class and assignment CRUD, priorities, due dates, completion statistics, password settings, and logout. All workspace data uses Supabase; there is no demo database or fake account. The landing page contains a labeled illustrative preview only.

## Local setup

1. Use Node.js 24 LTS and npm. Run `npm install` (or `npm ci` with the committed lockfile).
2. Create a project at https://supabase.com/dashboard. In its SQL editor run `supabase/migrations/202610250001_initial.sql` once. Alternatively apply the migration with the Supabase CLI against your linked project.
3. Copy `.env.example` to `.env.local`. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` from Project Settings → API. These are public client credentials. Never add a service-role or secret key.
4. In Supabase Authentication → URL Configuration set Site URL to your app origin, e.g. `http://localhost:3000`, and allow `http://localhost:3000/auth/callback` (and the corresponding production origin). Enable email/password authentication. With email confirmation enabled, confirm the signup email before logging in. Supabase's default confirmation link can return to the Site URL; then log in. The callback route also supports PKCE code exchange.
5. Run `npm run dev`. Open your app on port 3000. Public pages render without Supabase; workspace routes redirect to login until configured.

Cloud environment: if the home npm cache is unavailable, prefix npm commands with `npm_config_cache=/workspace/.npm-cache`. No database runs locally; connectivity to your project’s `*.supabase.co` hostname is required. Add your exact project hostname to restricted network settings if needed. Set the same public variables in deployment settings; rebuild after changing them.

## Checks

```sh
npm run lint
npm run typecheck
npm run build
npm start
```

## Live acceptance checks (require a configured Supabase project)

- Sign up two separate accounts and confirm their emails; log in and log out.
- Create, edit, and delete classes, including colors. Create assignments with and without a class; edit titles, due dates, and priorities; toggle completion. Reload and sign in again to verify persistence.
- Delete a class with assignments: assignments must remain with no class.
- Verify overview counts, overdue items, upcoming items, and the selectable planning date. The default planning date is UTC; select a date for your local day.
- Update your password in Account settings and verify the new credentials.
- Verify a logged-out request to `/dashboard` redirects to `/login`.
- Using each account’s client session, attempt to read/update/delete the other account’s rows and assign its class ID. RLS must prevent access and the composite ownership foreign key must reject cross-account class references.
- Check narrow mobile and desktop layouts, keyboard navigation, and form validation.

No live Supabase or browser end-to-end test is claimed without performing these checks. No payment, notifications, recurring tasks, account deletion, or password recovery flow is included in this milestone.

## Security and storage

Server actions verify the user with `auth.getUser()`, validate lengths, IDs, date formats, colors and priorities, and constrain writes by owner. Database checks and row-level policies enforce ownership independently; a composite foreign key stops assignment links to another user's class. Deleting an auth user cascades their data. Only authentication email/password (managed by Supabase), classes, and assignments are stored. No student profiles, school identifiers, or other student personal details are collected. Supabase handles password hashing. Keys in `NEXT_PUBLIC_*` must be public keys with RLS enabled, never privileged keys.

The request proxy refreshes cookie sessions. Protected pages and every mutation independently verify authentication. Errors show a retry state rather than revealing database details. Use HTTPS in production and configure Supabase password policy, email delivery, authentication rate limits, and site URLs before public launch.

## Automated verification

`npm run test:db` runs the real migration in embedded PostgreSQL (PGlite), with a minimal simulated Supabase auth schema and two database roles. It checks RLS isolation, ownership spoofing, cross-user class references, database constraints, assignment completion, class deletion behavior, anonymous denial, and auth-user deletion cascading. It does not verify the hosted Supabase configuration or email delivery.

`npm run test:smoke` requires a running app at port 3000 **without Supabase configuration**, plus a Chromium installation. Set `CHROMIUM_EXECUTABLE_PATH` if Chromium is not at `/usr/bin/chromium`. It checks landing/signup/login navigation, setup messages, logged-out protection for all workspace routes, browser errors, and page overflow at mobile, tablet, and desktop sizes. It writes screenshots to your system `/tmp` directory. Authenticated UI and live CRUD still require the live acceptance checks above.

At initial implementation, dependency installation, lint, TypeScript checks, the production build, embedded database checks, and browser smoke checks passed. A hosted Supabase connection must be configured before claiming live authentication or persistent storage verification.

## Repairing an incomplete Supabase setup

If `classes` exists but `assignments` is missing, run the entire `supabase/migrations/202610260001_repair_partial_setup.sql` file in Supabase SQL Editor. It preserves existing records, creates missing tables/indexes, replaces table policies with owner-only access, and refreshes the REST schema cache. It is transactional and repeatable. If existing columns are incompatible, it fails without committing changes; report the exact SQL error rather than deleting tables. The public publishable key cannot execute schema migrations, so applying this script requires SQL Editor or an authorized migration connection.

## Deploy to Vercel

Import `Jktrue92/focusly` into Vercel after pushing this checkout. Use the Next.js framework preset, the repository root as Root Directory, `npm run build` as Build Command, and Node.js 24.x. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` to the Vercel project's environment variables before deployment, using the same public project settings as `.env.local`. Never upload `.env.local` or use a privileged Supabase key. Cloud-only proxy configuration (`NODE_USE_ENV_PROXY`) is not required on Vercel.

After deployment, set Supabase Authentication → URL Configuration → Site URL to the production HTTPS origin, and add that origin followed by `/auth/callback` to Redirect URLs. Keep localhost URLs only if you still develop locally. Rebuild/redeploy if public environment variables change. Confirm signup/email confirmation/login, class and assignment persistence, and logout on the deployed app before considering it fully verified.

## Dashboard, recovery, and privacy update

The dashboard now includes a seven-day planning strip, due/overdue task summaries, active navigation, progress visualization, class cards, and purposeful empty states. Counts and tasks still come from the authenticated user's Supabase records. `npm run test:visual` renders the actual dashboard component against isolated test fixtures at desktop/tablet/mobile sizes. Test-only action stubs are not exposed through app routes and do not test live mutations.

Password recovery is at `/forgot-password`. It sends a Supabase recovery email, exchanges the PKCE code at `/auth/callback?next=/reset-password`, checks the authenticated session, changes the password, signs out, and returns to login. Users should open a standard PKCE reset email in the same browser that requested it. The callback also supports Supabase recovery `token_hash` links for a custom recovery-email template. Expired/invalid links return to recovery, and callback destinations are restricted to internal dashboard/reset paths.

Set `NEXT_PUBLIC_SITE_URL` in Vercel to the stable production HTTPS origin (not a changing deployment preview URL), and allow the exact origin plus `/auth/callback` in Supabase Auth Redirect URLs. The recovery callback includes `?next=/reset-password`; permit that exact URL too if your allowlist uses exact URL matching. For a custom recovery email template, use `{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=recovery`. Configure Supabase SMTP for reliable email delivery and review rate limits; no email-delivery success is claimed from local tests.

The `/privacy` notice identifies Focusly Inc. and describes actual storage, providers, essential cookies, retention, user choices and children's privacy. The operator supplied `hellofocusly@gmail.com` as the public privacy contact. `NEXT_PUBLIC_PRIVACY_EMAIL` can override it. Keep this inbox monitored before and after launch. `NEXT_PUBLIC_OPERATOR_NAME` can override the operator name. Review the policy against real provider settings and legal obligations before launch. No claim of COPPA certification or complete legal compliance is made.

Daylane is intended for ages 13+, does not offer under-13 accounts or a parental-consent system, and does not collect a date of birth. New signups must affirm 13+ eligibility and acknowledge the policy; server actions enforce both and store only the eligibility attestation and policy version in auth metadata. Apply `supabase/migrations/202610260002_signup_eligibility.sql` in Supabase SQL Editor to enforce these declarations for direct Auth API signups too. Existing accounts are not retroactively age-verified. An attestation is not verified age assurance; supporting children under 13 requires a different product and consent design.

Run `npm run test:auth`, `npm run test:db`, and `npm run test:recovery` (with the app running on port 3000). The database test simulates auth roles in embedded PostgreSQL, including age eligibility rejection. Recovery smoke tests deliberately do not send emails or create accounts. End-to-end reset email delivery and password changes still require a real user-owned account and Supabase configuration.

## Appearance and privacy controls

The fixed appearance switch offers Light, Dark and System modes across the app. Its browser-only preference persists across reloads, follows OS changes in System mode and synchronizes across tabs. It works for the current session if browser storage is unavailable. Theme initialization runs before page paint to reduce a light-theme flash.

New signups now pass a neutral age-group screen before email inputs. Choosing Under 13 blocks signup and stores a browser-only block flag; eligibility remains self-declared, not independently verified. Existing accounts are not age-verified by this change. Read [Daylane's privacy operations checklist](docs/privacy-operations.md) for audience review, actual-knowledge handling, security, retention and provider responsibilities. A 13+ label does not by itself remove COPPA obligations, and no complete-compliance certification is claimed.

Account settings provide a private JSON export and password-confirmed self-service account deletion. Apply `supabase/migrations/202610260003_account_privacy.sql` after the eligibility migration to enable deletion. No privileged Supabase key is used in the app. The function deletes only `auth.uid()` and cascades that account's workspace. Provider backups and logs expire separately under documented operator/provider retention policies. Live export/deletion still require verification with controlled accounts after applying the migration.

Suggested next product features: a focus timer, calendar view, assignment search/filtering, configurable opt-in due reminders, recurring assignments, and private personal study goals. These are suggestions, not implemented features; reminders would require explicit preferences and reliable email delivery.

## Management-page polish

Classes and assignments share the dashboard's light/dark visual language. Class cards show real completion progress and link to class-filtered assignments. Assignment search matches titles or class names; status, class and priority filters and sorting are stored in the URL. Enter a search and use Apply; status tabs preserve the other filters. Clear filters restores the full list. Overdue status is based on the current UTC date; completed assignments are excluded from overdue.

Create forms collapse when records already exist and open on an empty workspace. Saving/completion/deletion controls show pending states. Assignment deletion requires opening its confirmation before submitting; class deletion still preserves assignments. Keyboard users can skip navigation to the workspace, and authenticated navigation has a loading skeleton.

`npm run test:filters` checks combined filters, sorting, date boundaries, query normalization and nonmutation. `npm run test:visual` covers dashboard, classes and assignments with populated/empty/no-result fixtures, safe delete confirmations, and viewport checks in light/dark at 375/768/1440px. Isolated test action stubs do not verify hosted mutations. No new database migration or environment variable is required for these UI changes.

## Study tools, animations, and AI schedule import

Study sets live at `/study`. Create private sets, edit/delete cards, and practice with animated flip cards, written recall, or multiple choice. Multiple choice requires four unique answers. Written recall compares exact wording while ignoring case and repeated whitespace; valid paraphrases may be marked incorrect. Reviews save per-user progress; learned status means the most recent result. Shuffle restarts the current session but does not erase saved progress. Page/card transitions respect reduced-motion preferences. Mobile navigation shows all six sections.

`/schedule` stores recurring class meetings separately from assignment deadlines, including term dates and IANA timezone. Add/edit/delete meetings manually without AI. Times are shown in their saved zone, not converted. Classes display meeting summaries and link to the timetable.

The opt-in AI beta can draft flashcards/summary from notes at `/study/agent` and extract a reviewable schedule from a PDF/image/TXT/CSV file at `/schedule/import`. It does not save suggestions automatically, browse, access school accounts, or ingest unrelated account data. File uploads are bounded, and users must redact sensitive details before sending an entire file to OpenAI. Original notes/files are not stored by Daylane; reviewed entries and chosen source excerpts can be saved. See [AI beta setup and privacy](docs/ai-study-beta.md).

Apply `202610260004_study_tools.sql` and then `202610260005_schedule_import.sql` in Supabase SQL Editor after the earlier migrations. These migrations add owner-only study/schedule tables, atomic review counters, a 200-card-per-set limit, server-enforced AI attempt quotas, atomic/idempotent schedule imports, and updated live-data deletion. Existing classes/assignments remain usable while study/schedule tables are absent; new tools show an unavailable state rather than fake sample data.

For live AI configure server-only `DAYLANE_AI_API_KEY`, `DAYLANE_AI_ENABLED=true`, and optionally `DAYLANE_AI_MODEL` in Vercel and redeploy. Keep it disabled until provider billing, privacy review and migrations are ready. Never put the key in a `NEXT_PUBLIC_` variable or chat. No live AI provider call is claimed without a configured key and actual verification.

Tests: `npm run test:study:models` checks review/quiz logic, grounded output validation, provider contracts/failures with mocked calls, file magic/size/PDF limits and reviewed import mapping. `npm run test:study:db` applies migrations in embedded PostgreSQL and exercises RLS, limits, quotas, import rollback/idempotency and deletion. `npm run test:study:ui` exercises actual components with isolated action stubs, including review failure, double-click protection, quiz results, AI consent/preview/approval, reduced motion, and light/dark responsive layouts. These tests do not prove hosted Supabase configuration or paid-provider behavior.
