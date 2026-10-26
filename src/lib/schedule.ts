export type ClassMeeting = {
  id: string;
  class_id: string;
  weekday: number;
  start_time: string;
  end_time: string;
  term_start: string;
  term_end: string;
  timezone: string;
};
export type DraftMeeting = {
  weekday: number;
  start_time: string;
  end_time: string;
  source_excerpt: string;
};
export type DraftScheduleClass = {
  name: string;
  color: string;
  meetings: DraftMeeting[];
};
export type DraftScheduleAssignment = {
  title: string;
  class_index: number | null;
  due_date: string;
  priority: "low" | "medium" | "high";
  source_excerpt: string;
};
export type ScheduleDraft = {
  classes: DraftScheduleClass[];
  assignments: DraftScheduleAssignment[];
  warnings: string[];
};
export type ScheduleState = {
  message: string;
  draft?: ScheduleDraft;
  token?: string;
  termStart?: string;
  termEnd?: string;
  timezone?: string;
};
export const weekdays = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
export function validDate(value: string) {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString().slice(0, 10) === value
  );
}
export function validTimezone(value: string) {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value }).format();
    return !!value && value.length <= 80;
  } catch {
    return false;
  }
}
export function validTerm(start: string, end: string) {
  return (
    validDate(start) &&
    validDate(end) &&
    end >= start &&
    (Date.parse(end) - Date.parse(start)) / 86400000 <= 366
  );
}
export function validTime(value: string) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}
function bounded(value: unknown, max: number) {
  return (
    typeof value === "string" && value.trim().length > 0 && value.length <= max
  );
}
export function validateScheduleDraft(
  value: unknown,
  start: string,
  end: string,
  sourceText?: string,
): ScheduleDraft | null {
  if (!validTerm(start, end) || !value || typeof value !== "object")
    return null;
  const item = value as ScheduleDraft;
  if (
    !Array.isArray(item.classes) ||
    !Array.isArray(item.assignments) ||
    !Array.isArray(item.warnings) ||
    item.classes.length > 12 ||
    item.assignments.length > 30 ||
    item.warnings.length > 10 ||
    (!item.classes.length && !item.assignments.length)
  )
    return null;
  const source = sourceText?.replace(/\s+/g, " ").trim();
  const excerpt = (v: unknown) =>
    bounded(v, 800) &&
    (!source || source.includes((v as string).replace(/\s+/g, " ").trim()));
  for (const c of item.classes) {
    if (
      !c ||
      !bounded(c.name, 80) ||
      !/^#[0-9a-f]{6}$/i.test(c.color) ||
      !Array.isArray(c.meetings) ||
      c.meetings.length > 7
    )
      return null;
    for (const m of c.meetings)
      if (
        !m ||
        !Number.isInteger(m.weekday) ||
        m.weekday < 0 ||
        m.weekday > 6 ||
        !validTime(m.start_time) ||
        !validTime(m.end_time) ||
        m.end_time <= m.start_time ||
        !excerpt(m.source_excerpt)
      )
        return null;
  }
  for (const a of item.assignments)
    if (
      !a ||
      !bounded(a.title, 160) ||
      (a.class_index !== null &&
        (!Number.isInteger(a.class_index) ||
          a.class_index < 0 ||
          a.class_index >= item.classes.length)) ||
      !validDate(a.due_date) ||
      a.due_date < start ||
      a.due_date > end ||
      !["low", "medium", "high"].includes(a.priority) ||
      !excerpt(a.source_excerpt)
    )
      return null;
  if (item.warnings.some((w) => !bounded(w, 500))) return null;
  return item;
}
export type ReviewedSchedule = {
  classes: {
    name: string;
    color: string;
    existing_id: string | null;
    meetings: { weekday: number; start_time: string; end_time: string }[];
  }[];
  assignments: {
    title: string;
    class_index: number | null;
    due_date: string;
    priority: string;
  }[];
};
export function reviewedSchedule(form: FormData):
  | {
      draft: ReviewedSchedule;
      start: string;
      end: string;
      timezone: string;
      token: string;
    }
  | { error: string } {
  const value = (key: string) => String(form.get(key) ?? "").trim();
  const start = value("term_start"),
    end = value("term_end"),
    timezone = value("timezone"),
    token = value("import_token");
  if (
    !validTerm(start, end) ||
    !validTimezone(timezone) ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      token,
    )
  )
    return { error: "Check the term dates, timezone, and import preview." };
  if (form.get("review_confirmed") !== "on")
    return { error: "Review and confirm the entries before saving." };
  const classCount = Number(value("class_count")),
    assignmentCount = Number(value("assignment_count"));
  if (
    !Number.isInteger(classCount) ||
    classCount < 0 ||
    classCount > 12 ||
    !Number.isInteger(assignmentCount) ||
    assignmentCount < 0 ||
    assignmentCount > 30
  )
    return { error: "This preview is invalid. Generate it again." };
  const draft: ReviewedSchedule = { classes: [], assignments: [] };
  const mapping = new Map<number, number>();
  for (let i = 0; i < classCount; i++) {
    if (form.get("include_class_" + i) !== "on") continue;
    const name = value("class_name_" + i),
      color = value("class_color_" + i),
      existing_id = value("existing_class_" + i) || null;
    const meetingCount = Number(value("meeting_count_" + i));
    if (
      !name ||
      name.length > 80 ||
      !/^#[0-9a-f]{6}$/i.test(color) ||
      (existing_id &&
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          existing_id,
        )) ||
      !Number.isInteger(meetingCount) ||
      meetingCount < 0 ||
      meetingCount > 7
    )
      return { error: "Check the class details." };
    const meetings = [];
    for (let j = 0; j < meetingCount; j++) {
      if (form.get(`include_meeting_${i}_${j}`) !== "on") continue;
      const weekday = Number(value(`weekday_${i}_${j}`)),
        start_time = value(`start_${i}_${j}`),
        end_time = value(`end_${i}_${j}`);
      if (
        !Number.isInteger(weekday) ||
        weekday < 0 ||
        weekday > 6 ||
        !validTime(start_time) ||
        !validTime(end_time) ||
        end_time <= start_time
      )
        return {
          error:
            "Choose valid meeting days and times. Overnight meetings must be entered separately.",
        };
      meetings.push({ weekday, start_time, end_time });
    }
    mapping.set(i, draft.classes.length);
    draft.classes.push({ name, color, existing_id, meetings });
  }
  for (let i = 0; i < assignmentCount; i++) {
    if (form.get("include_assignment_" + i) !== "on") continue;
    const title = value("assignment_title_" + i),
      due_date = value("assignment_date_" + i),
      priority = value("assignment_priority_" + i);
    const original = value("assignment_class_" + i);
    let class_index: number | null = null;
    if (original !== "") {
      const index = Number(original);
      if (!Number.isInteger(index) || !mapping.has(index))
        return {
          error:
            "An assignment refers to an excluded class. Include that class or choose Personal for the assignment.",
        };
      class_index = mapping.get(index)!;
    }
    if (
      !title ||
      title.length > 160 ||
      !validDate(due_date) ||
      due_date < start ||
      due_date > end ||
      !["low", "medium", "high"].includes(priority)
    )
      return {
        error:
          "Check assignment titles, priorities, and dates within the confirmed term.",
      };
    draft.assignments.push({ title, due_date, priority, class_index });
  }
  if (!draft.classes.length && !draft.assignments.length)
    return { error: "Select at least one class or assignment to import." };
  return { draft, start, end, timezone, token };
}
