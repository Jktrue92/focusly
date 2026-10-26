import Link from "next/link";
import { LogOut, Sparkles } from "lucide-react";
import { WorkspaceNav } from "@/components/workspace-nav";
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
        <WorkspaceNav />
        <div className="sidebar-bottom">
          <Link href="/privacy" className="sidebar-privacy">
            Privacy & children’s privacy
          </Link>
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
