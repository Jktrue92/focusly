import Link from "next/link";
import {
  ArrowRight,
  ListFilter,
  ListTodo,
  Plus,
  Search,
  X,
} from "lucide-react";
import { AssignmentForm, AssignmentList } from "./assignments";
import {
  filterAssignments,
  filterLink,
  type AssignmentFilters,
} from "@/lib/assignment-filters";
import type { Assignment, ClassRecord } from "@/lib/data";
export function AssignmentWorkspace({
  classes,
  assignments,
  filters,
  today,
}: {
  classes: ClassRecord[];
  assignments: Assignment[];
  filters: AssignmentFilters;
  today: string;
}) {
  const visible = filterAssignments(assignments, classes, filters, today);
  const remaining = assignments.filter((a) => !a.completed).length;
  const overdue = assignments.filter(
    (a) => !a.completed && a.due_date < today,
  ).length;
  const filtered =
    !!filters.q ||
    filters.status !== "all" ||
    filters.priority !== "all" ||
    !!filters.class_id ||
    filters.sort !== "due";
  return (
    <div className="management-page">
      <header className="management-heading">
        <div>
          <span className="eyebrow">MAKE SPACE FOR YOUR NEXT STEP</span>
          <h1>
            Your assignments<span>.</span>
          </h1>
          <p>A little structure for everything on your plate.</p>
        </div>
        <span className="management-emblem">
          <ListTodo size={28} />
        </span>
      </header>
      <div className="management-summary">
        <span>
          <i />
          {remaining} remaining
        </span>
        <span>{assignments.length - remaining} completed</span>
        {overdue > 0 && (
          <span className="summary-overdue">{overdue} overdue</span>
        )}
      </div>
      <details className="panel composer" open={assignments.length === 0}>
        <summary>
          <span className="composer-icon">
            <Plus size={18} />
          </span>
          <div>
            <strong>Add an assignment</strong>
            <small>Get it out of your head and into your plan.</small>
          </div>
          <Plus size={17} className="composer-expand" />
        </summary>
        <AssignmentForm
          key={filters.class_id}
          classes={classes}
          defaultClassId={
            classes.some((c) => c.id === filters.class_id)
              ? filters.class_id
              : undefined
          }
        />
      </details>
      <section className="panel assignment-board">
        <div className="assignment-tabs" aria-label="Assignment status">
          {(
            [
              {
                status: "all",
                label: "All assignments",
                count: assignments.length,
              },
              { status: "active", label: "To do", count: remaining },
              {
                status: "completed",
                label: "Completed",
                count: assignments.length - remaining,
              },
              { status: "overdue", label: "Overdue", count: overdue },
            ] as const
          ).map(({ status, label, count }) => (
            <Link
              key={status}
              href={filterLink(filters, status)}
              className={filters.status === status ? "selected" : ""}
              aria-current={filters.status === status ? "page" : undefined}
            >
              {label}
              <span>{count}</span>
            </Link>
          ))}
        </div>
        <form
          key={JSON.stringify(filters)}
          className="assignment-filters"
          method="get"
        >
          <label className="search-field">
            <span className="sr-only">Search assignments</span>
            <Search size={16} />
            <input
              name="q"
              placeholder="Search assignments or classes…"
              defaultValue={filters.q}
              maxLength={120}
            />
          </label>
          <div className="filter-selects">
            <input type="hidden" name="status" value={filters.status} />
            <label>
              <span className="sr-only">Filter by class</span>
              <select name="class_id" defaultValue={filters.class_id}>
                <option value="">All classes</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="sr-only">Filter by priority</span>
              <select name="priority" defaultValue={filters.priority}>
                <option value="all">All priorities</option>
                <option value="high">High priority</option>
                <option value="medium">Medium priority</option>
                <option value="low">Low priority</option>
              </select>
            </label>
            <label>
              <span className="sr-only">Sort assignments</span>
              <select name="sort" defaultValue={filters.sort}>
                <option value="due">Due date</option>
                <option value="priority">Priority first</option>
                <option value="title">Title A–Z</option>
              </select>
            </label>
            <button className="filter-button">
              <ListFilter size={14} /> Apply
            </button>
          </div>
        </form>
        <div
          className="results-heading"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          <span>
            {visible.length}{" "}
            {visible.length === 1 ? "assignment" : "assignments"}
            {filtered ? " found" : ""}
          </span>
          {filtered && (
            <Link href="/assignments">
              <X size={12} /> Clear filters
            </Link>
          )}
        </div>
        {visible.length ? (
          <AssignmentList
            assignments={visible}
            classes={classes}
            editable
            today={today}
          />
        ) : (
          <div className="polished-empty">
            <span>
              <Search size={25} />
            </span>
            <h2>
              {assignments.length
                ? "Nothing matches this view."
                : "A fresh start, a clearer head."}
            </h2>
            <p>
              {assignments.length
                ? "Try another search or clear the filters. Your assignments are still here."
                : "Your first assignment is the first step toward a calmer week. Add it above when you’re ready."}
            </p>
            {filtered && (
              <Link href="/assignments" className="text-link">
                Show all assignments <ArrowRight size={14} />
              </Link>
            )}
          </div>
        )}
      </section>
      <p className="management-footnote">
        Due dates use your selected calendar date. Overdue status is based on
        today in UTC.
      </p>
    </div>
  );
}
