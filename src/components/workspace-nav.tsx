"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  CalendarDays,
  LayoutDashboard,
  ListTodo,
  Settings,
  Layers,
} from "lucide-react";
const items = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/classes", label: "My classes", icon: BookOpen },
  { href: "/schedule", label: "Schedule", icon: CalendarDays },
  { href: "/assignments", label: "Assignments", icon: ListTodo },
  { href: "/study", label: "Study", icon: Layers },
  { href: "/settings", label: "Settings", icon: Settings },
];
export function WorkspaceNav() {
  const pathname = usePathname();
  return (
    <nav>
      {items.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={
            pathname === href || pathname.startsWith(href + "/")
              ? "nav-active"
              : ""
          }
          aria-current={
            pathname === href || pathname.startsWith(href + "/")
              ? "page"
              : undefined
          }
        >
          <Icon size={19} />
          {label}
        </Link>
      ))}
    </nav>
  );
}
