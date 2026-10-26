export const PRIVACY_VERSION = "2026-10-26";
export function eligibleForSignup(
  age: FormDataEntryValue | null,
  privacy: FormDataEntryValue | null,
) {
  return age === "on" && privacy === "on";
}
