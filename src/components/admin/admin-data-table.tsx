import { useMemo, useState, type ReactNode } from "react";
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type AdminDataTableColumn<T> = {
  key: string;
  header: string;
  sortable?: boolean;
  sortValue?: (row: T) => string | number;
  render?: (row: T) => ReactNode;
  className?: string;
};

/**
 * Generic sortable/searchable/paginated table built on the shadcn `Table`
 * primitives — replaces the plain HTML tables previously duplicated across
 * admin.tsx/sections.tsx. Sizes here (limit=100-200 per admin query) are
 * small enough that sort/filter/paginate can stay entirely client-side.
 */
export function AdminDataTable<T>({
  columns,
  data,
  getRowId,
  getSearchText,
  searchPlaceholder = "Pesquisar…",
  emptyLabel = "Sem resultados",
  pageSize = 20,
}: {
  columns: AdminDataTableColumn<T>[];
  data: T[];
  getRowId: (row: T) => string;
  getSearchText?: (row: T) => string;
  searchPlaceholder?: string;
  emptyLabel?: string;
  pageSize?: number;
}) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    if (!query || !getSearchText) return data;
    const q = query.toLowerCase();
    return data.filter((row) => getSearchText(row).toLowerCase().includes(q));
  }, [data, query, getSearchText]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    const col = columns.find((c) => c.key === sortKey);
    if (!col?.sortValue) return filtered;
    const dir = sortDir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const av = col.sortValue!(a);
      const bv = col.sortValue!(b);
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });
  }, [filtered, sortKey, sortDir, columns]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const clampedPage = Math.min(page, pageCount - 1);
  const paged = sorted.slice(clampedPage * pageSize, clampedPage * pageSize + pageSize);

  const toggleSort = (col: AdminDataTableColumn<T>) => {
    if (!col.sortable) return;
    if (sortKey !== col.key) {
      setSortKey(col.key);
      setSortDir("asc");
    } else {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    }
    setPage(0);
  };

  return (
    <div className="space-y-3">
      {getSearchText && (
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
            }}
            placeholder={searchPlaceholder}
            className="pl-9"
          />
        </div>
      )}
      <div className="overflow-x-auto rounded-2xl border border-gray-100">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead
                  key={col.key}
                  className={col.sortable ? "cursor-pointer select-none" : undefined}
                  onClick={() => toggleSort(col)}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.header}
                    {col.sortable &&
                      (sortKey === col.key ? (
                        sortDir === "asc" ? (
                          <ChevronUp className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5" />
                        )
                      ) : (
                        <ChevronsUpDown className="h-3.5 w-3.5 opacity-30" />
                      ))}
                  </span>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="py-10 text-center text-sm text-muted-foreground"
                >
                  {emptyLabel}
                </TableCell>
              </TableRow>
            )}
            {paged.map((row) => (
              <TableRow key={getRowId(row)}>
                {columns.map((col) => (
                  <TableCell key={col.key} className={col.className}>
                    {col.render
                      ? col.render(row)
                      : String((row as Record<string, unknown>)[col.key] ?? "—")}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {sorted.length > pageSize && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {clampedPage * pageSize + 1}–{Math.min(sorted.length, (clampedPage + 1) * pageSize)} de{" "}
            {sorted.length}
          </span>
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="outline"
              disabled={clampedPage === 0}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={clampedPage >= pageCount - 1}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
