"use client";
import { useSyncExternalStore } from "react";
const subscribe = () => () => {};
export function TimezoneInput({ initial }: { initial?: string }) {
  const detected = useSyncExternalStore(
    subscribe,
    () => Intl.DateTimeFormat().resolvedOptions().timeZone,
    () => "UTC",
  );
  return (
    <label>
      Time zone
      <input
        key={initial ?? detected}
        name="timezone"
        defaultValue={initial ?? detected}
        required
        maxLength={80}
        placeholder="e.g. America/New_York"
      />
    </label>
  );
}
