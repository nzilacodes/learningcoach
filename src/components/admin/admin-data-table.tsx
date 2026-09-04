import { useEffect, useMemo, useState, type ReactNode } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
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

// Windowed page-number list: always shows first/last page plus up to 2
// neighbours of the current page, with `null` gaps rendered as "…" — keeps
// the pager usable when there are dozens of pages instead of a wall of
// buttons.
function pageWindow(current: number, count: number): (number | null)[] {
  const pages = new Set([0, count - 1, current, current - 1, current + 1]);
  const sorted = [...pages].filter((p) => p >= 0 && p < count).sort((a, b) => a - b);
  const out: (number | null)[] = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i]! - sorted[i - 1]! > 1) out.push(null);
    out.push(sorted[i]!);
  }
  return out;
}

/**
 * Generic sortable/searchable/paginated table built on the shadcn `Table`
 * primitives — replaces the plain HTML tables previously duplicated across
 * admin.tsx/sections.tsx. Sizes here (limit=100-500 per admin query) are
 * small enough that sort/filter/paginate can stay entirely client-side.
 *
 * `selectable` adds a checkbox column (header = select-all); selection is
 * held internally and mirrored out via `onSelectionChange` for callers that
 * want to act on it (bulk actions aren't built into the table itself).
 */
export function AdminDataTable<T>({
  columns,
  data,
  getRowId,
  getSearchText,
  searchPlaceholder = "Pesquisar…",
  emptyLabel = "Sem resultados",
  pageSize: initialPageSize = 20,
  pageSizeOptions,
  selectable = false,
  onSelectionChange,
}: {
  columns: AdminDataTableColumn<T>[];
  data: T[];
  getRowId: (row: T) => string;
  getSearchText?: (row: T) => string;
  searchPlaceholder?: string;
  emptyLabel?: string;
  pageSize?: number;
  /** Offers a "N por página" selector when set; omit to keep a fixed pageSize. */
  pageSizeOptions?: number[];
  selectable?: boolean;
  onSelectionChange?: (ids: string[]) => void;
}) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [selected, setSelected] = useState<Set<string>>(new Set());

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

  useEffect(() => {
    onSelectionChange?.([...selected]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

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

  const pageIds = paged.map(getRowId);
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selected.has(id));
  const toggleSelectAll = (checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const id of pageIds) {
        if (checked) next.add(id);
        else next.delete(id);
      }
      return next;
    });
  };
  const toggleRow = (id: string, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
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
              {selectable && (
                <TableHead className="w-10">
                  <Checkbox
                    checked={allPageSelected}
                    onCheckedChange={(c) => toggleSelectAll(!!c)}
                    aria-label="Selecionar tudo"
                  />
                </TableHead>
              )}
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
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className="py-10 text-center text-sm text-muted-foreground"
                >
                  {emptyLabel}
                </TableCell>
              </TableRow>
            )}
            {paged.map((row) => {
              const id = getRowId(row);
              return (
                <TableRow key={id}>
                  {selectable && (
                    <TableCell className="w-10">
                      <Checkbox
                        checked={selected.has(id)}
                        onCheckedChange={(c) => toggleRow(id, !!c)}
                        aria-label="Selecionar linha"
                      />
                    </TableCell>
                  )}
                  {columns.map((col) => (
                    <TableCell key={col.key} className={col.className}>
                      {col.render
                        ? col.render(row)
                        : String((row as Record<string, unknown>)[col.key] ?? "—")}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      {(sorted.length > pageSize || (pageSizeOptions && sorted.length > 0)) && (
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>
            A mostrar {clampedPage * pageSize + 1}–
            {Math.min(sorted.length, (clampedPage + 1) * pageSize)} de {sorted.length}
          </span>
          <div className="flex items-center gap-3">
            {pageCount > 1 && (
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 w-7 p-0"
                  disabled={clampedPage === 0}
                  onClick={() => setPage((p) => p - 1)}
                  aria-label="Página anterior"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                {pageWindow(clampedPage, pageCount).map((p, i) =>
                  p === null ? (
                    <span key={`gap-${i}`} className="px-1">
                      …
                    </span>
                  ) : (
                    <Button
                      key={p}
                      size="sm"
                      variant={p === clampedPage ? "default" : "outline"}
                      className={`h-7 w-7 p-0 ${p === clampedPage ? "bg-sunset hover:bg-sunset/90" : ""}`}
                      onClick={() => setPage(p)}
                    >
                      {p + 1}
                    </Button>
                  ),
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 w-7 p-0"
                  disabled={clampedPage >= pageCount - 1}
                  onClick={() => setPage((p) => p + 1)}
                  aria-label="Próxima página"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
            {pageSizeOptions && pageSizeOptions.length > 0 && (
              <Select
                value={String(pageSize)}
                onValueChange={(v) => {
                  setPageSize(Number(v));
                  setPage(0);
                }}
              >
                <SelectTrigger className="h-7 w-[7.5rem]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {pageSizeOptions.map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n} por página
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
