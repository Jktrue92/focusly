import Link from "next/link";
import {
  BookOpen,
  LayoutDashboard,
  ListTodo,
  LogOut,
  Settings,
  Sparkles,
} from "lucide-react";
import { Brand } from "@/components/brand";
import { requireUser } from "@/lib/data";
import { logout } from "@/app/actions";
export default async function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireUser();
  return (
    <div className="workspace">
      <aside className="sidebar">
        <Brand />
        <span className="nav-caption">YOUR WORKSPACE</span>
        <nav>
          <Link href="/dashboard">
            <LayoutDashboard size={19} /> Overview
          </Link>
          <Link href="/classes">
            <BookOpen size={19} /> My classes
          </Link>
          <Link href="/assignments">
            <ListTodo size={19} /> Assignments
          </Link>
          <Link href="/settings">
            <Settings size={19} /> Account settings
          </Link>
        </nav>
        <div className="sidebar-bottom">
          <div className="encouragement">
            <Sparkles size={20} />
            <p>
              Small steps.
              <br />
              Real progress.
            </p>
          </div>
          <form action={logout}>
            <button className="logout">
              <LogOut size={17} /> Log out
            </button>
          </form>
        </div>
      </aside>
      <main className="workspace-main">{children}</main>
    </div>
  );
}
