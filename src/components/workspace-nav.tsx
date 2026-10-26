"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, LayoutDashboard, ListTodo, Settings } from "lucide-react";
const items = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/classes", label: "My classes", icon: BookOpen },
  { href: "/assignments", label: "Assignments", icon: ListTodo },
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
          className={pathname === href ? "nav-active" : ""}
          aria-current={pathname === href ? "page" : undefined}
        >
          <Icon size={19} />
          {label}
        </Link>
      ))}
    </nav>
  );
}
