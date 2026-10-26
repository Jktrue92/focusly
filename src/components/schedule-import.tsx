"use client";
import { AI_CONSENT_VERSION, type AIProvider } from "@/lib/ai-contract";
import Link from "next/link";
import { useActionState, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  FileUp,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { analyzeSchedule, saveReviewedSchedule } from "@/app/schedule-actions";
import {
  weekdays,
  type ScheduleState,
  type ScheduleDraft,
  type DraftScheduleClass,
} from "@/lib/schedule";
import type { ClassRecord } from "@/lib/data";
import { ActionButton } from "./action-button";
import { TimezoneInput } from "./timezone-input";
function ClassReview({
  course,
  index,
  classes,
}: {
  course: DraftScheduleClass;
  index: number;
  classes: ClassRecord[];
}) {
  const match = classes.find(
    (c) => c.name.trim().toLowerCase() === course.name.trim().toLowerCase(),
  );
  const [existing, setExisting] = useState(match?.id ?? "");
  return (
    <article className="schedule-review-card">
      <label className="checkbox-label">
        <input name={"include_class_" + index} type="checkbox" defaultChecked />
        <strong>Include this class</strong>
      </label>
      <label>
        Match to an existing class
        <select
          name={"existing_class_" + index}
          value={existing}
          onChange={(e) => setExisting(e.target.value)}
        >
          <option value="">Create a new class</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>
      {!existing ? (
        <div className="form-columns">
          <label>
            New class name
            <input
              name={"class_name_" + index}
              defaultValue={course.name}
              required
              maxLength={80}
            />
          </label>
          <label>
            Color
            <input
              name={"class_color_" + index}
              type="color"
              defaultValue={course.color}
            />
          </label>
        </div>
      ) : (
        <>
          <input
            type="hidden"
            name={"class_name_" + index}
            value={course.name}
          />
          <input
            type="hidden"
            name={"class_color_" + index}
            value={course.color}
          />
          <p className="session-hint">
            The existing class keeps its saved name and color. Only reviewed
            meetings will be added.
          </p>
        </>
      )}
      <input
        type="hidden"
        name={"meeting_count_" + index}
        value={course.meetings.length}
      />
      {course.meetings.length ? (
        course.meetings.map((meeting, j) => (
          <div key={j} className="review-meeting">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name={`include_meeting_${index}_${j}`}
                defaultChecked
              />{" "}
              Include meeting
            </label>
            <div className="form-columns">
              <label>
                Day
                <select
                  name={`weekday_${index}_${j}`}
                  defaultValue={meeting.weekday}
                >
                  {weekdays.map((d, n) => (
                    <option value={n} key={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Start time
                <input
                  name={`start_${index}_${j}`}
                  type="time"
                  defaultValue={meeting.start_time}
                  required
                />
              </label>
              <label>
                End time
                <input
                  name={`end_${index}_${j}`}
                  type="time"
                  defaultValue={meeting.end_time}
                  required
                />
              </label>
            </div>
            <details className="source-note">
              <summary>Review source excerpt</summary>
              <blockquote>{meeting.source_excerpt}</blockquote>
            </details>
          </div>
        ))
      ) : (
        <p className="session-hint">
          No recurring meeting times were identified for this class.
        </p>
      )}
    </article>
  );
}
function ScheduleReview({
  draft,
  token,
  start,
  end,
  timezone,
  classes,
}: {
  draft: ScheduleDraft;
  token: string;
  start: string;
  end: string;
  timezone: string;
  classes: ClassRecord[];
}) {
  const [state, action] = useActionState(saveReviewedSchedule, { message: "" });
  return (
    <section className="panel schedule-review">
      <span className="eyebrow">NOTHING SAVES UNTIL YOU APPROVE</span>
      <h2>Make this schedule yours.</h2>
      <p className="session-hint">
        AI can misread a document. Check each date, time, class match, and
        source excerpt. Deselect entries you don’t want. Imported files
        themselves are not stored by Daylane.
      </p>
      {draft.warnings.length > 0 && (
        <div className="notice">
          <strong>Items to check</strong>
          <ul>
            {draft.warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}
      <form action={action} className="editor-form">
        <input type="hidden" name="import_token" value={token} />
        <input type="hidden" name="class_count" value={draft.classes.length} />
        <input
          type="hidden"
          name="assignment_count"
          value={draft.assignments.length}
        />
        <div className="form-columns">
          <label>
            Term starts
            <input
              type="date"
              name="term_start"
              defaultValue={start}
              required
            />
          </label>
          <label>
            Term ends
            <input type="date" name="term_end" defaultValue={end} required />
          </label>
          <TimezoneInput initial={timezone} />
        </div>
        <h3>Classes & recurring meetings</h3>
        {draft.classes.map((course, i) => (
          <ClassReview key={i} course={course} index={i} classes={classes} />
        ))}
        {!draft.classes.length && (
          <p className="session-hint">
            No classes were identified. Deadlines may still be imported as
            personal assignments.
          </p>
        )}
        <h3>Assignment deadlines</h3>
        {draft.assignments.map((assignment, i) => (
          <article key={i} className="schedule-review-card">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name={"include_assignment_" + i}
                defaultChecked
              />
              <strong>Include assignment</strong>
            </label>
            <label>
              Title
              <input
                name={"assignment_title_" + i}
                defaultValue={assignment.title}
                maxLength={160}
                required
              />
            </label>
            <div className="form-columns">
              <label>
                Class
                <select
                  name={"assignment_class_" + i}
                  defaultValue={assignment.class_index ?? ""}
                >
                  <option value="">Personal / no class</option>
                  {draft.classes.map((c, n) => (
                    <option value={n} key={n}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Due date
                <input
                  type="date"
                  name={"assignment_date_" + i}
                  defaultValue={assignment.due_date}
                  required
                />
              </label>
              <label>
                Priority
                <select
                  name={"assignment_priority_" + i}
                  defaultValue={assignment.priority}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </label>
            </div>
            <details className="source-note">
              <summary>Review source excerpt</summary>
              <blockquote>{assignment.source_excerpt}</blockquote>
            </details>
          </article>
        ))}
        {!draft.assignments.length && (
          <p className="session-hint">
            No supported deadlines were identified. Meeting times won’t be
            turned into assignments.
          </p>
        )}
        <label className="checkbox-label">
          <input name="review_confirmed" type="checkbox" required />
          <span>
            I have checked the selected entries, dates, times, and time zone and
            want to save them to my account.
          </span>
        </label>
        {state.message && (
          <p className="notice" role="alert">
            {state.message}
          </p>
        )}
        <ActionButton pendingLabel="Importing reviewed schedule…">
          Save reviewed schedule <ArrowRight size={15} />
        </ActionButton>
      </form>
    </section>
  );
}
export function ScheduleImport({
  classes,
  enabled,
  providerLabel = "OpenAI",
  providerId = "openai",
}: {
  classes: ClassRecord[];
  enabled: boolean;
  providerLabel?: string;
  providerId?: AIProvider;
}) {
  const [state, action, pending] = useActionState(analyzeSchedule, {
    message: "",
  } as ScheduleState);
  return (
    <div className="management-page schedule-import">
      <Link className="study-back" href="/schedule">
        <ArrowLeft size={14} /> Back to schedule
      </Link>
      <header className="management-heading">
        <div>
          <span className="eyebrow">LESS COPYING. MORE CLARITY.</span>
          <h1>
            Your schedule, sorted<span>.</span>
          </h1>
          <p>Upload. Review. Make room for your semester.</p>
        </div>
        <span className="management-emblem">
          <FileUp size={28} />
        </span>
      </header>
      <section className="ai-privacy-callout">
        <ShieldCheck size={21} />
        <div>
          <strong>Your document. Your choice. Your final say.</strong>
          <p>
            {providerLabel} receives the entire file you choose—not your other
            account data. Redact names, student IDs, contact details, grades,
            and sensitive information before uploading. Daylane does not save
            the original file. {providerLabel} may process or retain it under
            its API policies. Extracted entries can be wrong; review is
            required.
          </p>
          <Link href="/privacy">
            Privacy details <ArrowRight size={12} />
          </Link>
        </div>
      </section>
      {providerId === "cloudflare" && (
        <p className="provider-free-note">
          Cloudflare’s free tier has a shared daily allocation. Requests may
          stop once it is used; there is no automatic fallback to a paid
          provider.
        </p>
      )}
      {!enabled && (
        <p className="notice">
          AI import is not enabled on this deployment. No file will be sent. You
          can add your class meetings manually from the schedule page.
        </p>
      )}
      <section className="panel">
        <form action={action} className="editor-form">
          <input type="hidden" name="ai_provider" value={providerId} />
          <input
            type="hidden"
            name="ai_consent_version"
            value={AI_CONSENT_VERSION}
          />
          <label className="schedule-file-label">
            <FileUp size={27} />
            <strong>Choose your timetable or syllabus</strong>
            <span>
              PDF up to 10 pages, PNG/JPEG/WebP, or UTF-8 TXT/CSV. Maximum 4 MB.
              Text: 40–12,000 characters.
            </span>
            <input
              type="file"
              name="schedule_file"
              accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.csv"
              required
              disabled={!enabled || pending}
            />
          </label>
          <div className="form-columns">
            <label>
              Term starts
              <input
                name="term_start"
                type="date"
                required
                disabled={!enabled || pending}
              />
            </label>
            <label>
              Term ends
              <input
                name="term_end"
                type="date"
                required
                disabled={!enabled || pending}
              />
            </label>
            <TimezoneInput />
          </div>
          <p className="session-hint">
            Confirm the term dates and timezone. Ambiguous or unreadable entries
            should be omitted, not guessed. Overnight meetings must be entered
            manually as separate days.
          </p>
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="ai_consent"
              required
              disabled={!enabled || pending}
            />
            <span>
              I am 13+ and choose to send this redacted document to{" "}
              {providerLabel} to draft my schedule. I will review every proposed
              entry.
            </span>
          </label>
          <button
            className="button"
            disabled={!enabled || pending}
            aria-busy={pending}
          >
            <Sparkles size={16} />
            {pending ? "Reading your schedule…" : "Create schedule preview"}
          </button>
          <p className="session-hint">
            Uses the same AI beta limits: 1 attempt per minute, 5 per hour, 20
            per UTC day. No automatic calendar connections or account changes.
          </p>
        </form>
      </section>
      {state.message && (
        <p className="notice" role="status">
          {state.message}
        </p>
      )}
      {state.draft &&
        state.token &&
        state.termStart &&
        state.termEnd &&
        state.timezone && (
          <ScheduleReview
            key={state.token}
            draft={state.draft}
            token={state.token}
            start={state.termStart}
            end={state.termEnd}
            timezone={state.timezone}
            classes={classes}
          />
        )}
    </div>
  );
}
