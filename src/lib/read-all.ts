type ReadError = { code: string; message?: string };
type Page<T> = { data: T[] | null; error: ReadError | null };
// Avoid silently truncating at a database API's per-request row limit.
export async function readAll<T>(
  read: (start: number, end: number) => PromiseLike<Page<T>>,
  maxRows = 20000,
): Promise<Page<T>> {
  const rows: T[] = [];
  const pageSize = 500;
  for (let start = 0; start <= maxRows;) {
    const result = await read(start, start + pageSize - 1);
    if (result.error) return { data: null, error: result.error };
    const page = result.data ?? [];
    rows.push(...page);
    if (rows.length > maxRows)
      return {
        data: null,
        error: {
          code: "ROW_LIMIT",
          message: "This dataset is too large for a single request.",
        },
      };
    if (page.length === 0) return { data: rows, error: null };
    start += page.length;
  }
  return { data: null, error: { code: "ROW_LIMIT" } };
}
