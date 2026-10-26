import { ActionButton } from "./action-button";
import { Check, Circle, Trash2 } from "lucide-react";
import {
  deleteAssignment,
  saveAssignment,
  toggleAssignment,
} from "@/app/actions";
import type { Assignment, ClassRecord } from "@/lib/data";
export function AssignmentForm({
  classes,
  assignment,
  defaultClassId,
}: {
  classes: ClassRecord[];
  assignment?: Assignment;
  defaultClassId?: string;
}) {
  return (
    <form action={saveAssignment} className="editor-form">
      {assignment && <input type="hidden" name="id" value={assignment.id} />}
      <label>
        Assignment title
        <input
          required
          name="title"
          maxLength={160}
          defaultValue={assignment?.title}
          placeholder="What’s your next step?"
        />
      </label>
      <div className="form-columns">
        <label>
          Class
          <select
            name="class_id"
            defaultValue={assignment?.class_id ?? defaultClassId ?? ""}
          >
            <option value="">No class</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Due date
          <input
            required
            type="date"
            name="due_date"
            defaultValue={assignment?.due_date}
          />
        </label>
        <label>
          Priority
          <select
            name="priority"
            defaultValue={assignment?.priority ?? "medium"}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </label>
      </div>
      <ActionButton>
        {assignment ? "Save changes" : "Add assignment"}
      </ActionButton>
    </form>
  );
}
export function AssignmentList({
  assignments,
  classes,
  editable = false,
  today,
}: {
  assignments: Assignment[];
  classes: ClassRecord[];
  editable?: boolean;
  today?: string;
}) {
  if (!assignments.length)
    return (
      <div className="empty">
        <Circle size={27} />
        <h3>A little breathing room.</h3>
        <p>No assignments here. Add your next step when you’re ready.</p>
      </div>
    );
  return (
    <div className="assignment-list">
      {assignments.map((a) => {
        const course = classes.find((c) => c.id === a.class_id);
        return (
          <article key={a.id} className="assignment-item">
            <div className="assignment-row">
              <form action={toggleAssignment}>
                <input type="hidden" name="id" value={a.id} />
                <input
                  type="hidden"
                  name="completed"
                  value={String(!a.completed)}
                />
                <ActionButton
                  pendingLabel="Updating…"
                  iconOnly
                  className={"check-button " + (a.completed ? "checked" : "")}
                  ariaLabel={`${a.completed ? "Mark incomplete:" : "Mark complete:"} ${a.title}`}
                >
                  {a.completed ? <Check size={17} /> : <Circle size={20} />}
                </ActionButton>
              </form>
              <div className="assignment-title">
                <span style={{ color: course?.color ?? "#7065F0" }}>
                  {course?.name ?? "Personal"}
                </span>
                <h3 className={a.completed ? "completed" : ""}>{a.title}</h3>
              </div>
              <span className={"priority " + a.priority}>{a.priority}</span>
              <time
                dateTime={a.due_date}
                title={
                  (today && !a.completed && a.due_date < today
                    ? "Overdue · "
                    : "Due ") + a.due_date
                }
                className={
                  today && !a.completed && a.due_date < today
                    ? "due-overdue"
                    : today === a.due_date && !a.completed
                      ? "due-today"
                      : ""
                }
              >
                {today === a.due_date && !a.completed
                  ? "Today"
                  : new Date(a.due_date + "T12:00:00Z").toLocaleDateString(
                      "en-US",
                      { month: "short", day: "numeric", timeZone: "UTC" },
                    )}
              </time>
              {editable && (
                <details className="assignment-delete">
                  <summary aria-label={"Delete " + a.title}>
                    <Trash2 size={16} />
                  </summary>
                  <div className="delete-popover">
                    <strong>Delete this assignment?</strong>
                    <p>This permanently removes “{a.title}”.</p>
                    <form action={deleteAssignment}>
                      <input name="id" type="hidden" value={a.id} />
                      <ActionButton
                        className="danger-button"
                        pendingLabel="Deleting…"
                      >
                        Delete permanently
                      </ActionButton>
                    </form>
                  </div>
                </details>
              )}
            </div>
            {editable && (
              <details>
                <summary>Edit assignment</summary>
                <AssignmentForm classes={classes} assignment={a} />
              </details>
            )}
          </article>
        );
      })}
    </div>
  );
}
