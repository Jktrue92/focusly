import assert from "node:assert/strict";
import {
  normalizeFilters,
  filterAssignments,
  filterLink,
} from "../src/lib/assignment-filters.ts";
const classes = [{ id: "c1", name: "Biology", color: "#7065f0" }];
const rows = [
  {
    id: "1",
    title: "Lab report",
    class_id: "c1",
    due_date: "2026-10-25",
    priority: "high",
    completed: false,
  },
  {
    id: "2",
    title: "Essay",
    class_id: null,
    due_date: "2026-10-26",
    priority: "medium",
    completed: false,
  },
  {
    id: "3",
    title: "Past complete",
    class_id: "c1",
    due_date: "2026-10-20",
    priority: "low",
    completed: true,
  },
  {
    id: "4",
    title: "A future task",
    class_id: null,
    due_date: "2026-11-01",
    priority: "low",
    completed: false,
  },
];
const find = (params) =>
  filterAssignments(rows, classes, normalizeFilters(params), "2026-10-26").map(
    (a) => a.id,
  );
assert.deepEqual(find({ status: "overdue" }), ["1"]);
assert.deepEqual(find({ status: "completed" }), ["3"]);
assert.deepEqual(find({ status: "active" }), ["1", "2", "4"]);
assert.deepEqual(
  find({ q: "BIOLOGY", status: "active", priority: "high", class_id: "c1" }),
  ["1"],
);
assert.deepEqual(find({ q: "personal", sort: "title" }), ["4", "2"]);
assert.deepEqual(find({ sort: "priority" }), ["1", "2", "3", "4"]);
assert.deepEqual(find({ q: "<script>" }), []);
assert.deepEqual(find({ class_id: "another-users-class" }), []);
assert.equal(
  normalizeFilters({
    q: ["bad"],
    status: "bogus",
    priority: "urgent",
    sort: "random",
  }).status,
  "all",
);
assert.equal(normalizeFilters({ q: "a".repeat(200) }).q.length, 120);
assert.equal(normalizeFilters({ q: ["one", "two"] }).q, "");
assert.equal(rows[0].id, "1", "sorting must not mutate original data");
const url = new URL(
  filterLink(
    normalizeFilters({ q: "Lab & notes", class_id: "c1", sort: "priority" }),
    "active",
  ),
  "https://example.com",
);
assert.equal(url.searchParams.get("q"), "Lab & notes");
assert.equal(url.searchParams.get("class_id"), "c1");
assert.equal(url.searchParams.get("status"), "active");
console.log(
  "PASS: combined class/search/status/priority filters, due boundaries, sorting, query normalization, preserved filters, and no input mutation.",
);
