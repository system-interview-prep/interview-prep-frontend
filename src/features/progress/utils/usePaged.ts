import { useState } from "react";

/** One page of a long list. The page steps back by itself when the list gets shorter. */
export function usePaged<T>(items: T[], pageSize: number) {
  const [wanted, setPage] = useState(1);
  const pages = Math.max(1, Math.ceil(items.length / pageSize));
  const page = Math.min(wanted, pages);
  return { rows: items.slice((page - 1) * pageSize, page * pageSize), page, pageSize, total: items.length, setPage };
}
