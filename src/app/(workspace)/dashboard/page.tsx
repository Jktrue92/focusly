import Link from "next/link";
import {
  ArrowUpRight,
  BookOpen,
  CheckCheck,
  Clock3,
  Plus,
  Sparkles,
} from "lucide-react";
import { workspaceData } from "@/lib/data";
import { AssignmentList } from "@/components/assignments";
export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { classes, assignments } = await workspaceData();
  const requested = (await searchParams).date;
  const today =
    requested && /^\d{4}-\d{2}-\d{2}$/.test(requested)
      ? requested
      : new Date().toISOString().slice(0, 10);
  const complete = assignments.filter((a) => a.completed).length;
  const pending = assignments.filter((a) => !a.completed);
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">A FRESH LITTLE START</span>
          <h1>
            Let’s find your focus <span className="purple">✦</span>
          </h1>
          <p>One thing at a time. You’re making progress.</p>
        </div>
        <Link href="/assignments" className="button small">
          <Plus size={17} /> New assignment
        </Link>
      </div>
      <div className="stats-grid">
        {[
          [
            Clock3,
            "Due today",
            pending.filter((a) => a.due_date === today).length,
          ],
          [CheckCheck, "Completed", complete],
          [BookOpen, "Active classes", classes.length],
        ].map(([Icon, label, value]) => {
          const I = Icon as typeof Clock3;
          return (
            <div className="stat-card" key={String(label)}>
              <span className="feature-icon">
                <I size={21} />
              </span>
              <div>
                <p>{String(label)}</p>
                <strong>{String(value).padStart(2, "0")}</strong>
              </div>
            </div>
          );
        })}
      </div>
      <div className="dashboard-grid">
        <div>
          <section className="panel">
            <div className="section-heading">
              <h2>Today’s focus</h2>
              <span className="pill">
                {pending.filter((a) => a.due_date <= today).length} to do
              </span>
            </div>
            <form className="date-form">
              <label>
                Planning date
                <input type="date" name="date" defaultValue={today} required />
              </label>
              <button className="text-button">Update</button>
            </form>
            <p className="muted tiny">
              Includes overdue assignments · defaults to today in UTC
            </p>
            <AssignmentList
              assignments={pending.filter((a) => a.due_date <= today)}
              classes={classes}
            />
          </section>
          <section className="panel">
            <div className="section-heading">
              <h2>Coming up</h2>
              <Link href="/assignments" className="text-link">
                View all <ArrowUpRight size={15} />
              </Link>
            </div>
            <AssignmentList
              assignments={pending
                .filter((a) => a.due_date > today)
                .slice(0, 5)}
              classes={classes}
            />
          </section>
        </div>
        <div>
          <section className="progress-panel">
            <Sparkles size={23} />
            <h2>Look at you go.</h2>
            <p>Every completed task is a little more room to breathe.</p>
            <div className="big-number">
              {assignments.length
                ? Math.round((complete / assignments.length) * 100)
                : 0}
              <span>%</span>
            </div>
            <div className="progress-track">
              <div
                style={{
                  width: `${assignments.length ? (complete / assignments.length) * 100 : 0}%`,
                }}
              />
            </div>
            <small>
              {complete} of {assignments.length} assignments complete
            </small>
          </section>
          <section className="panel">
            <div className="section-heading">
              <h2>My classes</h2>
              <Link href="/classes" aria-label="Manage classes">
                <ArrowUpRight size={18} />
              </Link>
            </div>
            {classes.length ? (
              classes.map((c) => (
                <div className="class-mini" key={c.id}>
                  <span style={{ background: c.color }} />
                  {c.name}
                  <small>
                    {pending.filter((a) => a.class_id === c.id).length} to do
                  </small>
                </div>
              ))
            ) : (
              <p className="muted">
                Your semester starts with a class.{" "}
                <Link className="text-link" href="/classes">
                  Add your first →
                </Link>
              </p>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
