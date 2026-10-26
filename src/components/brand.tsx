import Link from "next/link";
import { DaylaneMark } from "./daylane-mark";
export function Brand() {
  return (
    <Link href="/" className="brand" aria-label="Daylane home">
      <span className="brand-icon">
        <DaylaneMark size={24} />
      </span>
      <span>daylane</span>
    </Link>
  );
}
