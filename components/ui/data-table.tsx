"use client"

import * as React from "react"
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export type { ColumnDef }

export interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  title?: React.ReactNode
  searchPlaceholder?: string
  searchable?: boolean
  showColumnToggle?: boolean
  showPagination?: boolean
  defaultPageSize?: number
  emptyMessage?: string
  loading?: boolean
  toolbarRight?: React.ReactNode
  getRowClassName?: (row: TData) => string
}

export function DataTable<TData, TValue>({
  columns,
  data,
  title,
  searchPlaceholder = "Search records...",
  searchable = true,
  showColumnToggle = true,
  showPagination = true,
  defaultPageSize = 10,
  emptyMessage = "No matching records found.",
  loading = false,
  toolbarRight,
  getRowClassName,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})

  const table = useReactTable({
    data,
    columns,
    initialState: {
      pagination: {
        pageSize: defaultPageSize,
      },
    },
    state: {
      sorting,
      columnFilters,
      globalFilter,
      columnVisibility,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  const filteredCount = table.getFilteredRowModel().rows.length
  const pageIndex = table.getState().pagination.pageIndex
  const pageSize = table.getState().pagination.pageSize
  const startRow = filteredCount === 0 ? 0 : pageIndex * pageSize + 1
  const endRow = Math.min((pageIndex + 1) * pageSize, filteredCount)

  const hideableColumns = table
    .getAllColumns()
    .filter((col) => typeof col.accessorFn !== "undefined" && col.getCanHide())

  const showToolbar =
    Boolean(title) ||
    searchable ||
    (showColumnToggle && hideableColumns.length > 1) ||
    Boolean(toolbarRight)

  return (
    <div className="w-full min-w-0 max-w-full">
      {showToolbar && (
        <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-border px-4 py-3">
          <div className="flex min-w-0 flex-wrap items-center gap-2.5">
            {title && (
              <div className="text-sm font-semibold text-foreground">
                {title}
              </div>
            )}
            {searchable && (
              <div className="relative w-full sm:w-60">
                <Input
                  value={globalFilter ?? ""}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="h-8 pr-7 pl-8 text-xs"
                />
                <i className="ri-search-line pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-xs text-muted-foreground" />
                {globalFilter && (
                  <button
                    type="button"
                    onClick={() => setGlobalFilter("")}
                    className="absolute top-1/2 right-2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label="Clear search"
                  >
                    <i className="ri-close-line text-sm" />
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {showColumnToggle && hideableColumns.length > 1 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5 text-xs"
                  >
                    <i className="ri-layout-column-line text-muted-foreground" />
                    Columns
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 text-xs">
                  <DropdownMenuLabel className="text-xs">
                    Toggle Columns
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {hideableColumns.map((column) => {
                    const label =
                      typeof column.columnDef.header === "string"
                        ? column.columnDef.header
                        : column.id.replace(/_/g, " ")
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="cursor-pointer text-xs capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) =>
                          column.toggleVisibility(Boolean(value))
                        }
                      >
                        {label}
                      </DropdownMenuCheckboxItem>
                    )
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            {toolbarRight}
          </div>
        </div>
      )}

      <Table className="text-xs">
        <TableHeader className="bg-muted/60">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const canSort = header.column.getCanSort()
                const sorted = header.column.getIsSorted()
                const isStringHeader =
                  typeof header.column.columnDef.header === "string"

                return (
                  <TableHead key={header.id} className="px-3">
                    {header.isPlaceholder ? null : canSort && isStringHeader ? (
                      <button
                        type="button"
                        onClick={header.column.getToggleSortingHandler()}
                        className="inline-flex items-center gap-1 font-semibold text-left hover:text-[#405189] dark:hover:text-white"
                      >
                        <span>
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                        </span>
                        <i
                          className={
                            sorted === "asc"
                              ? "ri-arrow-up-line text-[11px] text-[#405189]"
                              : sorted === "desc"
                                ? "ri-arrow-down-line text-[11px] text-[#405189]"
                                : "ri-arrow-up-down-line text-[11px] opacity-45"
                          }
                        />
                      </button>
                    ) : (
                      flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )
                    )}
                  </TableHead>
                )
              })}
            </TableRow>
          ))}
        </TableHeader>

        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="py-10 text-center text-muted-foreground"
              >
                Loading records...
              </TableCell>
            </TableRow>
          ) : table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
                className={getRowClassName ? getRowClassName(row.original) : ""}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className="px-3">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="py-10 text-center text-muted-foreground"
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {showPagination && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-2.5 text-xs text-muted-foreground">
          <div className="flex flex-wrap items-center gap-3">
            <span>
              Showing <strong className="text-foreground">{startRow}</strong> to{" "}
              <strong className="text-foreground">{endRow}</strong> of{" "}
              <strong className="text-foreground">{filteredCount}</strong>{" "}
              entries
            </span>
            <div className="flex items-center gap-1.5">
              <span>Rows:</span>
              <select
                value={pageSize}
                onChange={(e) => table.setPageSize(Number(e.target.value))}
                className="h-7 rounded-md border border-input bg-background px-2 text-xs text-foreground"
              >
                {[10, 25, 50, 100].map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              «
            </Button>
            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Prev
            </Button>
            <span className="px-2 font-medium text-foreground">
              Page {pageIndex + 1} of {Math.max(1, table.getPageCount())}
            </span>
            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={() =>
                table.setPageIndex(Math.max(0, table.getPageCount() - 1))
              }
              disabled={!table.getCanNextPage()}
            >
              »
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
