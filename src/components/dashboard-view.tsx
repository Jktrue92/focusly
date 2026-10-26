import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  Check,
  CheckCheck,
  Clock3,
  Plus,
  Sparkles,
  Target,
} from "lucide-react";
import type { Assignment, ClassRecord } from "@/lib/data";
import { AssignmentList } from "@/components/assignments";
export function DashboardView({
  classes,
  assignments,
  today,
}: {
  classes: ClassRecord[];
  assignments: Assignment[];
  today: string;
}) {
  const pending = assignments.filter((a) => !a.completed);
  const completed = assignments.length - pending.length;
  const due = pending.filter((a) => a.due_date === today);
  const overdue = pending.filter((a) => a.due_date < today);
  const upcoming = pending.filter((a) => a.due_date > today);
  const percentage = assignments.length
    ? Math.round((completed / assignments.length) * 100)
    : 0;
  const date = new Date(today + "T12:00:00Z");
  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(date);
    d.setUTCDate(date.getUTCDate() + i);
    return d;
  });
  return (
    <div className="dashboard-v2">
      <header className="dashboard-topline">
        <span>
          <span className="live-dot" /> YOUR PERSONAL WORKSPACE
        </span>
        <span>
          <CalendarDays size={14} />
          {date.toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
            timeZone: "UTC",
          })}
        </span>
      </header>
      <div className="dashboard-welcome">
        <div>
          <span className="eyebrow">LESS STRESS. MORE PROGRESS.</span>
          <h1>
            A little clarity.
            <br />
            <span>A lot of possibility.</span>
          </h1>
          <p>Welcome to your space to get things done.</p>
        </div>
        <Link href="/assignments" className="button">
          <Plus size={17} /> Add assignment
        </Link>
      </div>
      <section className="focus-banner">
        <div className="focus-banner-copy">
          <span className="banner-label">
            <Sparkles size={14} /> LET’S MAKE TODAY COUNT
          </span>
          <h2>
            {due.length
              ? `${due.length} ${due.length === 1 ? "step" : "steps"} closer to done.`
              : overdue.length
                ? "A fresh start for unfinished things."
                : "A little breathing room."}
          </h2>
          <p>
            {due.length
              ? "Your next deadline doesn’t need to take up your whole head. Start with one thing."
              : overdue.length
                ? "Pick up where you left off. A small step still counts."
                : "Plan what’s next, organize a class, or enjoy a well-earned pause."}
          </p>
          <Link href="#today">
            Find your next step <ArrowRight size={15} />
          </Link>
        </div>
        <div className="banner-art" aria-hidden="true">
          <div className="art-orbit" />
          <div className="art-card back-card" />
          <div className="art-card front-card">
            <span className="art-check">
              <Check size={22} />
            </span>
            <span className="art-line" />
            <span className="art-line short" />
            <span className="art-progress" />
          </div>
          <Sparkles className="art-spark" size={25} />
        </div>
      </section>
      <div className="overview-stats">
        {[
          {
            Icon: Clock3,
            label: "Due today",
            value: due.length,
            note: overdue.length
              ? `${overdue.length} overdue to revisit`
              : "One day at a time",
            tone: "purple",
          },
          {
            Icon: CheckCheck,
            label: "Completed",
            value: completed,
            note: completed
              ? "Look at that progress"
              : "Your next win is waiting",
            tone: "green",
          },
          {
            Icon: BookOpen,
            label: "Active classes",
            value: classes.length,
            note: "Everything in its place",
            tone: "amber",
          },
          {
            Icon: Target,
            label: "Still to do",
            value: pending.length,
            note: "Small steps count",
            tone: "blue",
          },
        ].map(({ Icon, label, value, note, tone }) => (
          <article className={"overview-stat " + tone} key={label}>
            <div>
              <span>{label}</span>
              <Icon size={17} />
            </div>
            <strong>{String(value).padStart(2, "0")}</strong>
            <small>{note}</small>
          </article>
        ))}
      </div>
      <div className="dashboard-columns">
        <div>
          <section className="dashboard-card" id="today">
            <div className="section-heading">
              <div>
                <span className="card-eyebrow">ONE THING AT A TIME</span>
                <h2>
                  Today’s focus{" "}
                  <span className="count-badge">
                    {due.length + overdue.length}
                  </span>
                </h2>
              </div>
              <details className="planning-picker">
                <summary>
                  <CalendarDays size={14} /> Change day
                </summary>
                <form>
                  <label>
                    Planning date (UTC)
                    <input
                      type="date"
                      name="date"
                      defaultValue={today}
                      required
                    />
                  </label>
                  <button className="button small">Show day</button>
                </form>
              </details>
            </div>
            <div className="week-strip">
              {dates.map((d, i) => {
                const key = d.toISOString().slice(0, 10);
                const count = pending.filter((a) => a.due_date === key).length;
                return (
                  <Link
                    key={key}
                    href={"/dashboard?date=" + key}
                    className={i === 0 ? "selected" : ""}
                    aria-label={"Plan " + key}
                  >
                    <span>
                      {d.toLocaleDateString("en-US", {
                        weekday: "short",
                        timeZone: "UTC",
                      })}
                    </span>
                    <strong>{d.getUTCDate()}</strong>
                    <i className={count ? "has-tasks" : ""} />
                  </Link>
                );
              })}
            </div>
            {overdue.length > 0 && (
              <p className="overdue-note">
                Includes {overdue.length} overdue{" "}
                {overdue.length === 1 ? "assignment" : "assignments"}.
              </p>
            )}
            <AssignmentList
              assignments={[...overdue, ...due]}
              classes={classes}
            />
            {!due.length && !overdue.length && (
              <Link href="/assignments" className="empty-action">
                <Plus size={14} /> Plan your next assignment
              </Link>
            )}
          </section>
          <section className="dashboard-card">
            <div className="section-heading">
              <div>
                <span className="card-eyebrow">A LITTLE LOOK AHEAD</span>
                <h2>On the horizon</h2>
              </div>
              <Link href="/assignments" className="text-link">
                View all <ArrowUpRight size={15} />
              </Link>
            </div>
            <AssignmentList
              assignments={upcoming.slice(0, 4)}
              classes={classes}
            />
          </section>
        </div>
        <div className="dashboard-right">
          <section className="dashboard-card progress-card">
            <span className="card-eyebrow">YOUR SMALL WINS ADD UP</span>
            <h2>Making progress</h2>
            <div
              className="completion-ring"
              style={{
                background: `conic-gradient(#7065F0 ${percentage}%, #eeedf6 0)`,
              }}
            >
              <div>
                <strong>
                  {percentage}
                  <small>%</small>
                </strong>
                <span>completed</span>
              </div>
            </div>
            <p>
              <strong>{completed}</strong> of {assignments.length} assignments
              complete
            </p>
            <div className="progress-caption">
              <Sparkles size={15} />
              {completed
                ? "Keep that momentum going."
                : "Every big thing starts small."}
            </div>
          </section>
          <section className="dashboard-card class-overview">
            <div className="section-heading">
              <h2>Your classes</h2>
              <Link
                href="/classes"
                aria-label="Manage classes"
                className="round-link"
              >
                <Plus size={16} />
              </Link>
            </div>
            {classes.length ? (
              classes.slice(0, 6).map((c) => (
                <Link href="/classes" className="course-tile" key={c.id}>
                  <span
                    className="course-icon"
                    style={{ color: c.color, background: c.color + "14" }}
                  >
                    <BookOpen size={17} />
                  </span>
                  <div>
                    <strong>{c.name}</strong>
                    <small>
                      {pending.filter((a) => a.class_id === c.id).length}{" "}
                      assignments remaining
                    </small>
                  </div>
                  <ArrowUpRight size={14} />
                </Link>
              ))
            ) : (
              <div className="class-empty">
                <BookOpen size={24} />
                <h3>Give your semester a home.</h3>
                <p>
                  Add a class, pick a color, and get a little more organized.
                </p>
                <Link href="/classes" className="text-link">
                  Add your first class <ArrowRight size={14} />
                </Link>
              </div>
            )}
          </section>
          <div className="quiet-note">
            <span>✳</span>
            <p>
              Progress isn’t always a straight line.
              <br />
              <strong>You’re doing better than you think.</strong>
            </p>
          </div>
        </div>
      </div>
      <footer className="dashboard-footer">
        <span>A little more organized. A little less overwhelmed.</span>
        <Link href="/privacy">Privacy & children’s privacy</Link>
      </footer>
    </div>
  );
}
