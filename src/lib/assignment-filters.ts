import type { Assignment, ClassRecord } from "./data";
export type AssignmentFilters = {
  q: string;
  status: "all" | "active" | "completed" | "overdue";
  priority: "all" | "low" | "medium" | "high";
  class_id: string;
  sort: "due" | "priority" | "title";
};
export function normalizeFilters(
  params: Record<string, string | string[] | undefined>,
): AssignmentFilters {
  const one = (name: string) =>
    typeof params[name] === "string" ? (params[name] as string) : "";
  const status = one("status");
  const priority = one("priority");
  const sort = one("sort");
  return {
    q: one("q").trim().slice(0, 120),
    status: ["active", "completed", "overdue"].includes(status)
      ? (status as AssignmentFilters["status"])
      : "all",
    priority: ["low", "medium", "high"].includes(priority)
      ? (priority as AssignmentFilters["priority"])
      : "all",
    class_id: one("class_id").slice(0, 100),
    sort: ["priority", "title"].includes(sort)
      ? (sort as AssignmentFilters["sort"])
      : "due",
  };
}
export function filterAssignments(
  assignments: Assignment[],
  classes: ClassRecord[],
  filters: AssignmentFilters,
  today: string,
) {
  const names = new Map(classes.map((c) => [c.id, c.name]));
  const query = filters.q.toLowerCase();
  const priority = { high: 0, medium: 1, low: 2 };
  return assignments
    .filter(
      (a) =>
        (!query ||
          (a.title + " " + (names.get(a.class_id ?? "") ?? "Personal"))
            .toLowerCase()
            .includes(query)) &&
        (filters.status === "all" ||
          (filters.status === "active" && !a.completed) ||
          (filters.status === "completed" && a.completed) ||
          (filters.status === "overdue" &&
            !a.completed &&
            a.due_date < today)) &&
        (filters.priority === "all" || a.priority === filters.priority) &&
        (!filters.class_id || a.class_id === filters.class_id),
    )
    .sort((a, b) => {
      if (filters.sort === "priority") {
        const difference =
          (priority[a.priority as keyof typeof priority] ?? 1) -
          (priority[b.priority as keyof typeof priority] ?? 1);
        if (difference) return difference;
      }
      if (filters.sort === "title")
        return a.title.localeCompare(b.title) || a.id.localeCompare(b.id);
      return (
        a.due_date.localeCompare(b.due_date) ||
        a.title.localeCompare(b.title) ||
        a.id.localeCompare(b.id)
      );
    });
}
export function filterLink(
  filters: AssignmentFilters,
  status: AssignmentFilters["status"],
) {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (status !== "all") params.set("status", status);
  if (filters.priority !== "all") params.set("priority", filters.priority);
  if (filters.class_id) params.set("class_id", filters.class_id);
  if (filters.sort !== "due") params.set("sort", filters.sort);
  return "/assignments" + (params.size ? "?" + params.toString() : "");
}
