# Focusly

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
