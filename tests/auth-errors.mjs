import { eligibleForSignup } from "../src/lib/eligibility.ts";
import assert from "node:assert/strict";
import { authErrorMessage } from "../src/lib/auth-errors.ts";
assert.match(
  authErrorMessage({ code: "over_email_send_rate_limit" }, "signup"),
  /Wait a while/,
);
assert.match(authErrorMessage({ status: 429 }, "signup"), /Too many attempts/);
assert.match(
  authErrorMessage({ code: "email_address_not_authorized" }, "signup"),
  /configure an email provider/,
);
assert.match(
  authErrorMessage({ code: "email_not_confirmed" }, "login"),
  /Confirm your email/,
);
assert.match(
  authErrorMessage({ code: "weak_password" }, "signup"),
  /stronger password/,
);
assert.match(authErrorMessage({ status: 401 }, "signup"), /configuration/);
assert.match(
  authErrorMessage({ name: "AuthRetryableFetchError" }, "signup"),
  /Unable to reach/,
);
assert.equal(
  authErrorMessage({ code: "email_exists" }, "signup"),
  authErrorMessage({ code: "invalid_credentials" }, "signup"),
);
assert.equal(
  authErrorMessage({ code: "private-provider-detail" }, "signup").includes(
    "private-provider-detail",
  ),
  false,
);
console.log(
  "PASS: actionable authentication errors, rate limits, configuration failures, and safe fallbacks.",
);

assert.equal(eligibleForSignup(null, null), false);
assert.equal(eligibleForSignup("on", null), false);
assert.equal(eligibleForSignup(null, "on"), false);
assert.equal(eligibleForSignup("on", "on"), true);
console.log(
  "PASS: signup requires both eligibility and privacy acknowledgements.",
);
