import Link from "next/link";
import { CalendarDays, FileUp, Plus, Trash2 } from "lucide-react";
import type { ClassRecord } from "@/lib/data";
import { weekdays, type ClassMeeting } from "@/lib/schedule";
import { saveMeeting, deleteMeeting } from "@/app/schedule-actions";
import { ActionButton } from "./action-button";
import { TimezoneInput } from "./timezone-input";
export function MeetingForm({
  classes,
  meeting,
}: {
  classes: ClassRecord[];
  meeting?: ClassMeeting;
}) {
  return (
    <form action={saveMeeting} className="editor-form">
      {meeting && <input name="meeting_id" type="hidden" value={meeting.id} />}
      <div className="form-columns">
        <label>
          Class
          <select name="class_id" defaultValue={meeting?.class_id} required>
            {classes.map((c) => (
              <option value={c.id} key={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Weekday
          <select name="weekday" defaultValue={meeting?.weekday ?? 1}>
            {weekdays.map((d, n) => (
              <option key={d} value={n}>
                {d}
              </option>
            ))}
          </select>
        </label>
        <TimezoneInput initial={meeting?.timezone} />
      </div>
      <div className="form-columns">
        <label>
          Start time
          <input
            type="time"
            name="start_time"
            defaultValue={meeting?.start_time.slice(0, 5)}
            required
          />
        </label>
        <label>
          End time
          <input
            type="time"
            name="end_time"
            defaultValue={meeting?.end_time.slice(0, 5)}
            required
          />
        </label>
      </div>
      <div className="form-columns">
        <label>
          Term starts
          <input
            type="date"
            name="term_start"
            defaultValue={meeting?.term_start}
            required
          />
        </label>
        <label>
          Term ends
          <input
            type="date"
            name="term_end"
            defaultValue={meeting?.term_end}
            required
          />
        </label>
      </div>
      <ActionButton>
        {meeting ? "Save meeting" : "Add class meeting"}
      </ActionButton>
    </form>
  );
}
export function ScheduleView({
  classes,
  meetings,
  available,
  imported = false,
}: {
  classes: ClassRecord[];
  meetings: ClassMeeting[];
  available: boolean;
  imported?: boolean;
}) {
  return (
    <div className="management-page schedule-page">
      <header className="management-heading">
        <div>
          <span className="eyebrow">A LITTLE RHYTHM FOR YOUR WEEK</span>
          <h1>
            Your class schedule<span>.</span>
          </h1>
          <p>Recurring meeting times, separate from assignment deadlines.</p>
        </div>
        <span className="management-emblem">
          <CalendarDays size={28} />
        </span>
      </header>
      {imported && (
        <p className="notice" role="status">
          Your reviewed schedule was imported. Check your classes and
          assignments to see the saved entries.
        </p>
      )}
      <Link href="/schedule/import" className="study-agent-banner">
        <span className="study-agent-icon">
          <FileUp size={22} />
        </span>
        <div>
          <strong>
            Bring your timetable into Daylane <span>AI BETA</span>
          </strong>
          <p>
            Upload a document, review the draft, and approve what gets saved.
          </p>
        </div>
        <FileUp size={20} />
      </Link>
      {!available ? (
        <section className="panel polished-empty">
          <span>
            <CalendarDays size={26} />
          </span>
          <h2>Your timetable is being prepared.</h2>
          <p>
            Schedule tools aren’t available yet. Your existing classes and
            assignments are still available.
          </p>
        </section>
      ) : (
        <>
          {classes.length ? (
            <details className="panel composer" open={!meetings.length}>
              <summary>
                <span className="composer-icon">
                  <Plus size={17} />
                </span>
                <div>
                  <strong>Add a class meeting</strong>
                  <small>Manual entry works without AI.</small>
                </div>
                <Plus size={17} className="composer-expand" />
              </summary>
              <MeetingForm classes={classes} />
            </details>
          ) : (
            <p className="notice">
              <Link href="/classes">Add a class</Link> to enter meetings
              manually, or import classes from your schedule.
            </p>
          )}
          <div className="weekly-schedule">
            {[1, 2, 3, 4, 5, 6, 0].map((day) => {
              const items = meetings
                .filter((m) => m.weekday === day)
                .sort((a, b) => a.start_time.localeCompare(b.start_time));
              return (
                <section key={day} className="schedule-day panel">
                  <div className="section-heading">
                    <h2>{weekdays[day]}</h2>
                    <span className="pill">{items.length}</span>
                  </div>
                  {items.length ? (
                    items.map((meeting) => {
                      const course = classes.find(
                        (c) => c.id === meeting.class_id,
                      );
                      return (
                        <article
                          key={meeting.id}
                          className="meeting-card"
                          style={{
                            borderLeftColor: course?.color ?? "#7065f0",
                          }}
                        >
                          <strong>{course?.name ?? "Class"}</strong>
                          <span>
                            {meeting.start_time.slice(0, 5)} –{" "}
                            {meeting.end_time.slice(0, 5)}
                          </span>
                          <small>{meeting.timezone}</small>
                          <small>
                            {meeting.term_start} → {meeting.term_end}
                          </small>
                          <details>
                            <summary>Edit meeting</summary>
                            <MeetingForm classes={classes} meeting={meeting} />
                          </details>
                          <details className="delete-details">
                            <summary>
                              <Trash2 size={11} /> Remove meeting
                            </summary>
                            <form action={deleteMeeting}>
                              <input
                                type="hidden"
                                name="meeting_id"
                                value={meeting.id}
                              />
                              <ActionButton
                                className="danger-button"
                                pendingLabel="Removing…"
                              >
                                Confirm removal
                              </ActionButton>
                            </form>
                          </details>
                        </article>
                      );
                    })
                  ) : (
                    <p className="schedule-day-empty">
                      A little breathing room.
                    </p>
                  )}
                </section>
              );
            })}
          </div>
          <p className="management-footnote">
            This is a recurring timetable for the displayed term dates. Times
            are shown in each meeting’s saved timezone, not converted to your
            browser timezone. Assignment deadlines remain in Assignments.
          </p>
        </>
      )}
    </div>
  );
}
