# Focusly Inc.: 13+ privacy operations

Owner: Focusly Inc. · Public contact: hellofocusly@gmail.com · Reviewed against published sources on October 26, 2026.

This is an implementation and operating checklist, not a legal opinion or a declaration of complete COPPA compliance. Daylane remains a 13+ service. It does not offer accounts to children under 13, collect birth dates, or provide a parental-consent system. A 13+ label alone does not determine whether COPPA applies: actual audience, presentation, marketing, and actual knowledge matter. Existing accounts have not been retroactively age-verified.

## Implemented technical controls

- Neutral age-group screen before signup email fields; under-13 selections are blocked locally without creating an account. A browser-only flag discourages immediate retry. This can be bypassed by clearing browser data and is not verified age assurance.
- Server-side eligibility and policy acknowledgement; apply the signup migration to enforce declared eligibility in direct Supabase Auth API requests too.
- No advertising integrations, tracking SDKs, birth-date collection, school identifiers, public profiles, or student-to-student sharing in the app.
- Per-user database ownership, password/session management, minimized authentication error logs, protected data export without passwords/tokens, and password-confirmed deletion of the requesting user's account.
- Public privacy policy with operator, monitored contact, data categories, purposes, providers, essential authentication cookies, local theme/age-block storage, user choices, and children's privacy disclosures.

## Owner actions required before a compliance claim

- Obtain an audience/applicability assessment from qualified privacy counsel; review actual users, marketing, school deployments, and whether the service is child-directed or mixed-audience. Do not target under-13 students or accept school authorization as a blanket substitute for applicable consent requirements.
- If COPPA applies, have counsel complete the required operator-contact disclosures (including applicable business address and telephone information), notices, parental rights and consent analysis. The current 13+ privacy page is not a substitute for a covered operator’s complete notice.
- Apply all database migrations, verify RLS and anonymous restrictions in the real project, and test eligibility bypass attempts through Auth APIs. Verify self-service deletion/export with two controlled 13+ accounts. Local embedded database tests are not proof of hosted configuration.
- Maintain a written security program appropriate to actual data and risk, name responsible personnel, assess threats and access at least annually and when material risks change, enable MFA for Supabase/Vercel/GitHub administrator accounts, and document incident response and service-provider oversight. No administrative MFA setting has been enabled by this code change.
- Inventory Supabase, Vercel, SMTP providers, subprocessors, regions, logs, backups and contracts. Confirm the published policy matches actual settings, including any tools added outside this repository. Where COPPA applies, obtain the required written assurances from providers and third parties about confidentiality, security and integrity; a vendor account alone is not that assurance.
- Set and record retention periods and deletion schedules for live records, support messages, logs and backups based on legitimate purposes and obligations. Configure provider retention and secure disposal; do not retain children's personal information indefinitely. This repository does not control provider backup retention. Where COPPA applies, the written retention policy must specify collection purposes, the business need for retention and deletion timeframes, and be included in the required online notice.
- Monitor hellofocusly@gmail.com, document privacy requests, verify requesters proportionately, and set appropriate response targets. Avoid collecting identity documents or additional child data unless necessary and lawfully handled.
- Review material changes before release; if adding under-13 access, advertising, sharing or new data collection, stop and design the applicable notices, consent and parent rights before collecting child information. The existing age declaration is not parental consent.

## Actual-knowledge / suspected under-13 report

1. Triage the report through the privacy inbox; do not ask for a child's password, full birth date, school ID, or other unnecessary information.
2. Verify the relevant account and authority to act with the least additional information required. Do not disclose workspace data to an unverified third party. Escalate uncertainty to the responsible privacy/legal owner.
3. If the operator learns an account belongs to a child under 13, promptly prevent further account use/collection through the Supabase administrative controls while investigating. Blocking/deleting a known-under-13 account is an operator action; this app does not silently infer ages.
4. For confirmed ineligible collection, coordinate appropriate deletion of the auth account, cascading classes/assignments, relevant support records and affected provider data, subject to lawful obligations. Do not request parental consent as a workaround for a product that is configured to prohibit under-13 use.
5. Record the action and completion status without retaining unnecessary child details. Address backups and logs under the documented deletion schedule. Explain any lawful retained data to the verified requester as appropriate.
6. Review how the child accessed the service and address product/marketing issues. Reassess COPPA applicability if actual use differs from the intended 13+ audience.

## Account deletion deployment

Apply `supabase/migrations/202610260003_account_privacy.sql`. Its `delete_own_account()` function has no user-ID parameter, derives identity from `auth.uid()`, is unavailable to anonymous callers, and deletes only the caller. Auth-user deletion cascades workspace records. The UI requires current-password verification and typing DELETE. Do not test against real student data; use controlled test accounts. Backups/logs are governed by providers and the operator's retention policy.

## Sources

- [FTC children's privacy guidance](https://www.ftc.gov/business-guidance/privacy-security/childrens-privacy)
- [Current COPPA Rule, 16 CFR Part 312](https://www.ecfr.gov/current/title-16/chapter-I/subchapter-C/part-312), including applicability/definitions, notices, verifiable parental consent, parent rights, information security, retention and deletion.

These sources were accessible during implementation. The law and actual service configuration must be reassessed before claiming compliance; a code review cannot certify legal compliance.

## Optional AI processing and study data

Study/schedule features add saved flashcards, selected source excerpts, review outcomes, class meeting times/timezones and import receipts. Keep data exports/deletion complete when applying migrations. The optional AI beta sends only explicitly submitted notes or the selected entire file to OpenAI, with per-request consent, bounded inputs and server-enforced user quotas. Review the provider agreement, 13+ use, retention, project spending controls and accurate policy disclosures before enabling. No raw notes/files are intentionally retained in the app database. Do not treat `store:false` as a guarantee of no provider retention. See `ai-study-beta.md` for operator actions and verification limits.
