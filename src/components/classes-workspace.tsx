import { weekdays, type ClassMeeting } from "@/lib/schedule";
import Link from "next/link";
import { ArrowUpRight, BookOpen, CheckCheck, Plus, Trash2 } from "lucide-react";
import { saveClass, deleteClass } from "@/app/actions";
import { ActionButton } from "./action-button";
import type { Assignment, ClassRecord } from "@/lib/data";
export function ClassesWorkspace({
  classes,
  assignments,
  meetings = [],
}: {
  classes: ClassRecord[];
  assignments: Assignment[];
  meetings?: ClassMeeting[];
}) {
  return (
    <div className="management-page">
      <header className="management-heading">
        <div>
          <span className="eyebrow">EVERY SUBJECT HAS ITS PLACE</span>
          <h1>
            Your classes<span>.</span>
          </h1>
          <p>A color for every class. A little less to keep in your head.</p>
        </div>
        <span className="management-emblem">
          <BookOpen size={28} />
        </span>
      </header>
      <div className="management-summary">
        <span>
          <i />
          {classes.length} {classes.length === 1 ? "class" : "classes"}
        </span>
        <span>
          {assignments.filter((a) => !a.completed).length} assignments remaining
        </span>
      </div>
      <details className="panel composer" open={classes.length === 0}>
        <summary>
          <span className="composer-icon">
            <Plus size={18} />
          </span>
          <div>
            <strong>Add a class</strong>
            <small>Give your assignments a home.</small>
          </div>
          <Plus size={17} className="composer-expand" />
        </summary>
        <form action={saveClass} className="class-form">
          <label>
            Class name
            <input
              name="name"
              required
              maxLength={80}
              placeholder="e.g. Introduction to Psychology"
            />
          </label>
          <label>
            Color
            <input name="color" type="color" defaultValue="#7065f0" />
          </label>
          <ActionButton>Add class</ActionButton>
        </form>
      </details>
      <div className="classes-grid">
        {classes.map((c) => {
          const tasks = assignments.filter((a) => a.class_id === c.id);
          const complete = tasks.filter((a) => a.completed).length;
          const percentage = tasks.length
            ? Math.round((complete / tasks.length) * 100)
            : 0;
          return (
            <article
              className="course-card"
              key={c.id}
              style={{ borderTopColor: c.color }}
            >
              <div className="course-card-top">
                <span
                  className="course-icon"
                  style={{ color: c.color, background: c.color + "18" }}
                >
                  <BookOpen size={22} />
                </span>
                <Link
                  href={"/assignments?class_id=" + encodeURIComponent(c.id)}
                  className="round-link"
                  aria-label={"View assignments for " + c.name}
                >
                  <ArrowUpRight size={18} />
                </Link>
              </div>
              <h2>{c.name}</h2>
              <p>
                {tasks.length - complete}{" "}
                {tasks.length - complete === 1 ? "assignment" : "assignments"}{" "}
                to do
              </p>
              {meetings.some((m) => m.class_id === c.id) && (
                <div className="course-meetings">
                  {meetings
                    .filter((m) => m.class_id === c.id)
                    .slice(0, 2)
                    .map((m) => (
                      <span key={m.id}>
                        {weekdays[m.weekday].slice(0, 3)} ·{" "}
                        {m.start_time.slice(0, 5)}–{m.end_time.slice(0, 5)}
                      </span>
                    ))}
                  <Link href="/schedule">
                    View timetable <ArrowUpRight size={11} />
                  </Link>
                </div>
              )}
              <div className="course-progress">
                <div>
                  <span>
                    <CheckCheck size={13} />
                    {complete} of {tasks.length} complete
                  </span>
                  <strong>{percentage}%</strong>
                </div>
                <div className="course-progress-track">
                  <span
                    style={{ width: percentage + "%", background: c.color }}
                  />
                </div>
              </div>
              <div className="course-card-controls">
                <details>
                  <summary>Edit class</summary>
                  <form action={saveClass} className="editor-form">
                    <input type="hidden" name="id" value={c.id} />
                    <label>
                      Class name
                      <input
                        name="name"
                        required
                        maxLength={80}
                        defaultValue={c.name}
                      />
                    </label>
                    <label>
                      Color
                      <input type="color" name="color" defaultValue={c.color} />
                    </label>
                    <ActionButton>Save changes</ActionButton>
                  </form>
                </details>
                <details className="delete-details">
                  <summary>
                    <Trash2 size={12} /> Delete class
                  </summary>
                  <p className="tiny muted">
                    Your assignments will be kept and become unassigned. Class
                    meetings will be removed.
                  </p>
                  <form action={deleteClass}>
                    <input type="hidden" name="id" value={c.id} />
                    <ActionButton
                      className="danger-button"
                      pendingLabel="Deleting…"
                    >
                      Confirm deletion
                    </ActionButton>
                  </form>
                </details>
              </div>
            </article>
          );
        })}
      </div>
      {!classes.length && (
        <section className="panel polished-empty">
          <span>
            <BookOpen size={27} />
          </span>
          <h2>Your semester starts here.</h2>
          <p>
            Add your first class above. Pick a color, give it a name, and make a
            little room for progress.
          </p>
        </section>
      )}
    </div>
  );
}
