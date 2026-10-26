import Link from "next/link";
import { Layers } from "lucide-react";
export function Brand() {
  return (
    <Link href="/" className="brand">
      <span className="brand-icon">
        <Layers size={22} />
      </span>
      focusly<span className="brand-dot">.</span>
    </Link>
  );
}
