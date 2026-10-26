# Daylane AI study beta

This release provides a constrained study assistant, not a general autonomous agent. It can draft a summary and flashcards from user-submitted notes and extract a proposed timetable/deadline list from one user-submitted schedule file. It does not browse the web, run tools, read unrelated workspace records, access school portals, or save generated work without review.

## Enable on Vercel

1. Apply the study and schedule SQL migrations in order after the existing app migrations:
   - `202610260004_study_tools.sql`
   - `202610260005_schedule_import.sql`
2. Create/use an OpenAI API project with billing. A ChatGPT subscription alone is not an API credential. Set appropriate project spending controls/alerts and monitor actual usage; verify which provider budget settings enforce a hard stop. App quotas are not a global billing guarantee.
3. In Vercel project → Settings → Environment Variables set:
   - `DAYLANE_AI_ENABLED=true`
   - `DAYLANE_AI_API_KEY` to the API key, server-side only. Never use `NEXT_PUBLIC_` for it or put it in chat, Git, or saved scripts.
   - Optional `DAYLANE_AI_MODEL=gpt-4.1-mini`, the default. Use a model available to the API project that supports structured output and image/PDF inputs for schedule import.
4. Redeploy. Keep the beta disabled if billing, provider terms, privacy review or migrations are incomplete. To stop new AI requests, set `DAYLANE_AI_ENABLED=false` and redeploy; remove/revoke a compromised key immediately.
5. Verify using a controlled 13+ account and non-sensitive notes/documents. No real provider call was performed during implementation because no API credential was available. Tests stub provider responses and do not validate current model availability, billing, OCR quality, or live retention settings.

## Data and consent

Users must opt in on every generation request and confirm that they are 13+. Only the text they paste, or the entire single file they explicitly upload, is sent to OpenAI. The app does not attach account emails, other classes, decks or conversations. Redact personal information and file metadata before upload. The original notes/files are held in request memory and are not saved to Daylane's database. File names sent to the provider are generic. Source excerpts may be saved as part of reviewed flashcards; reviewed schedule entries are saved only after explicit approval.

The provider may retain/process requests under its API settings and policies. `store:false` is set on API requests; that is not a claim of zero provider retention. Obtain the appropriate agreements and review suitability for a 13+ service before enabling. The privacy policy and operations checklist describe the new processing; this beta does not establish COPPA compliance.

Daylane stores per-account request counters and the latest request/consent timestamp and consent version, not prompts or raw provider outputs. Application error logs intentionally avoid notes, files, provider response bodies and keys. Platform/infrastructure logs are governed by provider settings and need operator review. Account export includes study/schedule records and AI usage metadata; deletion removes them from live tables. Provider backups/logs follow separate retention policies.

## Limits and failure behavior

- AI attempts share a database-enforced per-user limit: one per minute, five per rolling hour window, twenty per UTC calendar day. Failed paid requests and file-parsing attempts consume quota. Missing configuration/consent/basic invalid request checks happen before quota consumption. Callers cannot directly reset counters. Provider project budgets and monitoring are still required.
- Notes: 100–12,000 characters; drafts of up to 5 or 10 cards. No full chat history or autonomous modifications.
- Schedule: one file up to 4 MB. PDF: unencrypted, at most ten pages. Images: PNG/JPEG/WebP identified by file magic. Text/CSV: UTF-8, 40–12,000 characters. The app validates file structure; it does not claim perfect malware detection or automatic redaction. Never upload untrusted sensitive documents.
- Server Action body allowance is 5 MB; app input remains capped at 4 MB to leave multipart overhead and fit typical Vercel request limits. Provider calls have abort timeouts, and AI pages request a 60-second platform execution limit. Platform limits may vary by plan.
- Structured outputs are validated on the server. Flashcard source excerpts must appear in supplied notes. Text schedule excerpts are checked against the text; image/PDF excerpts cannot be independently verified by the app. Even matching quotes do not prove that generated claims or dates are correct.
- AI drafts are visible, editable, selectable and unsaved. Users must confirm review before saving. Schedule imports validate term/date/timezone bounds and map selected classes. Recurring class meetings are not assignment deadlines. Overnight meetings need separate manual entries; ambiguous entries should be omitted with warnings.
- A schedule save is one database transaction; invalid entries roll back all writes. A preview token makes retries of the same confirmed import idempotent. Generating a new preview and importing it is a new operation; review existing-class matches to avoid duplicates.
- Study sets cap at 200 cards through a database trigger. Saving edited cards clears their current review progress. “Learned” is the most recent self-rating/answer result, not a scientifically validated mastery score or spaced-repetition schedule.

## Provider references

- [OpenAI structured outputs](https://platform.openai.com/docs/guides/structured-outputs)
- [OpenAI PDF inputs](https://platform.openai.com/docs/guides/pdf-files)
- [OpenAI API data controls](https://platform.openai.com/docs/guides/your-data)
- [OpenAI API pricing](https://openai.com/api/pricing/)

Review current provider documentation/terms and pricing before enabling. Model names and capabilities are configurable and may change. A later tutoring chat, school integration, notification sender, or autonomous agent requires a separate scoped design and data/permission review.

## Large libraries and exports

Library summaries and exports use paged reads instead of silently accepting the database API's per-response cap. They fail explicitly above 20,000 rows per table. The downloadable JSON export is limited to 4 MB to fit platform response limits; larger exports return an error directing the user to the privacy team for a complete copy. The operator must fulfill those requests through an appropriate secure process rather than treating the app limit as a reason to deny access. A study session reads only the selected set's maximum 200 cards.
