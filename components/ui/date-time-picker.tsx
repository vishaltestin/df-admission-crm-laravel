"use client"

import * as React from "react"
import {
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  XIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
]

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]

function pad2(n: number): string {
  return String(n).padStart(2, "0")
}

function parseDateValue(val?: string | null): Date | null {
  if (!val || !val.trim()) return null
  // Handle YYYY-MM-DD directly in local timezone
  if (/^\d{4}-\d{2}-\d{2}$/.test(val.trim())) {
    const [y, m, d] = val.trim().split("-").map(Number)
    const dt = new Date(y, m - 1, d, 0, 0, 0)
    return isNaN(dt.getTime()) ? null : dt
  }
  const dt = new Date(val)
  return isNaN(dt.getTime()) ? null : dt
}

function formatDateYMD(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

function formatDateTimeLocal(d: Date): string {
  return `${formatDateYMD(d)}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`
}

function formatDisplayDate(d: Date, withTime: boolean): string {
  const datePart = d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
  if (!withTime) return datePart
  const timePart = d.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })
  return `${datePart}, ${timePart}`
}

interface BasePickerProps {
  value?: string | null
  onChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
  clearable?: boolean
  className?: string
  id?: string
}

function CalendarGrid({
  selected,
  onSelectDate,
}: {
  selected: Date | null
  onSelectDate: (year: number, month: number, day: number) => void
}) {
  const today = React.useMemo(() => new Date(), [])
  const [viewYear, setViewYear] = React.useState(
    selected ? selected.getFullYear() : today.getFullYear()
  )
  const [viewMonth, setViewMonth] = React.useState(
    selected ? selected.getMonth() : today.getMonth()
  )

  React.useEffect(() => {
    if (selected) {
      setViewYear(selected.getFullYear())
      setViewMonth(selected.getMonth())
    }
  }, [selected])

  const years = React.useMemo(() => {
    const base = today.getFullYear()
    const list: number[] = []
    for (let y = base - 15; y <= base + 10; y++) list.push(y)
    if (!list.includes(viewYear)) list.push(viewYear)
    return list.sort((a, b) => a - b)
  }, [today, viewYear])

  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate()

  const cells: Array<{
    year: number
    month: number
    day: number
    outside: boolean
  }> = []

  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const pm = viewMonth === 0 ? 11 : viewMonth - 1
    const py = viewMonth === 0 ? viewYear - 1 : viewYear
    cells.push({
      year: py,
      month: pm,
      day: daysInPrevMonth - i,
      outside: true,
    })
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ year: viewYear, month: viewMonth, day: d, outside: false })
  }
  while (cells.length % 7 !== 0) {
    const nextDay = cells.length - (firstDayOfWeek + daysInMonth) + 1
    const nm = viewMonth === 11 ? 0 : viewMonth + 1
    const ny = viewMonth === 11 ? viewYear + 1 : viewYear
    cells.push({ year: ny, month: nm, day: nextDay, outside: true })
  }

  function prevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11)
      setViewYear((y) => y - 1)
    } else {
      setViewMonth((m) => m - 1)
    }
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0)
      setViewYear((y) => y + 1)
    } else {
      setViewMonth((m) => m + 1)
    }
  }

  return (
    <div className="w-[264px] select-none">
      {/* Header with Month & Year shadcn Selects */}
      <div className="mb-2 flex items-center justify-between gap-1">
        <Button
          type="button"
          variant="outline"
          size="icon-xs"
          onClick={prevMonth}
          aria-label="Previous month"
        >
          <ChevronLeftIcon className="size-3.5" />
        </Button>

        <div className="flex items-center gap-1">
          <Select
            value={String(viewMonth)}
            onValueChange={(v) => setViewMonth(Number(v))}
          >
            <SelectTrigger size="sm" className="h-7 w-[108px] px-2 text-xs font-medium">
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper" className="z-[95] max-h-64 text-xs">
              {MONTHS.map((m, idx) => (
                <SelectItem key={m} value={String(idx)} className="text-xs">
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={String(viewYear)}
            onValueChange={(v) => setViewYear(Number(v))}
          >
            <SelectTrigger size="sm" className="h-7 w-[74px] px-2 text-xs font-medium">
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper" className="z-[95] max-h-64 text-xs">
              {years.map((y) => (
                <SelectItem key={y} value={String(y)} className="text-xs">
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          type="button"
          variant="outline"
          size="icon-xs"
          onClick={nextMonth}
          aria-label="Next month"
        >
          <ChevronRightIcon className="size-3.5" />
        </Button>
      </div>

      {/* Weekday Labels */}
      <div className="mb-1 grid grid-cols-7 text-center text-[11px] font-medium text-muted-foreground">
        {WEEKDAYS.map((wd) => (
          <div key={wd} className="py-1">
            {wd}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((cell, idx) => {
          const isSelected =
            selected !== null &&
            selected.getFullYear() === cell.year &&
            selected.getMonth() === cell.month &&
            selected.getDate() === cell.day

          const isToday =
            today.getFullYear() === cell.year &&
            today.getMonth() === cell.month &&
            today.getDate() === cell.day

          return (
            <button
              key={`${cell.year}-${cell.month}-${cell.day}-${idx}`}
              type="button"
              onClick={() => onSelectDate(cell.year, cell.month, cell.day)}
              className={cn(
                "flex h-8 w-full items-center justify-center rounded-md text-xs transition-colors",
                cell.outside && !isSelected && "text-muted-foreground/45",
                !cell.outside &&
                  !isSelected &&
                  "text-foreground hover:bg-accent hover:text-accent-foreground",
                isToday &&
                  !isSelected &&
                  "border border-[#405189]/40 font-semibold text-[#405189]",
                isSelected &&
                  "bg-[#405189] font-semibold text-white shadow-xs hover:bg-[#364574]"
              )}
            >
              {cell.day}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  disabled,
  clearable = true,
  className,
  id,
}: BasePickerProps) {
  const [open, setOpen] = React.useState(false)
  const parsed = React.useMemo(() => parseDateValue(value), [value])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "h-9 w-full justify-between bg-background px-2.5 text-left text-xs font-normal",
            !parsed && "text-muted-foreground",
            className
          )}
        >
          <span className="flex items-center gap-2 truncate">
            <CalendarIcon className="size-3.5 shrink-0 text-muted-foreground" />
            <span className="truncate">
              {parsed ? formatDisplayDate(parsed, false) : placeholder}
            </span>
          </span>
          {clearable && parsed && !disabled && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation()
                onChange?.("")
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.stopPropagation()
                  onChange?.("")
                }
              }}
              className="ml-1 rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Clear date"
            >
              <XIcon className="size-3" />
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="z-[90] w-auto p-3">
        <CalendarGrid
          selected={parsed}
          onSelectDate={(y, m, d) => {
            const next = new Date(y, m, d)
            onChange?.(formatDateYMD(next))
            setOpen(false)
          }}
        />
        <div className="mt-2 flex items-center justify-between border-t border-border pt-2">
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => {
              onChange?.("")
              setOpen(false)
            }}
            className="text-xs text-muted-foreground"
          >
            Clear
          </Button>
          <Button
            type="button"
            size="xs"
            onClick={() => {
              onChange?.(formatDateYMD(new Date()))
              setOpen(false)
            }}
            className="bg-[#405189] text-xs text-white hover:bg-[#364574]"
          >
            Today
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export function DateTimePicker({
  value,
  onChange,
  placeholder = "Pick date & time",
  disabled,
  clearable = true,
  className,
  id,
}: BasePickerProps) {
  const [open, setOpen] = React.useState(false)
  const parsed = React.useMemo(() => parseDateValue(value), [value])

  const hours = parsed ? parsed.getHours() : 10
  const minutes = parsed ? parsed.getMinutes() : 0

  function emitDateTime(y: number, m: number, d: number, hh: number, mm: number) {
    const dt = new Date(y, m, d, hh, mm, 0)
    onChange?.(formatDateTimeLocal(dt))
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "h-9 w-full justify-between bg-background px-2.5 text-left text-xs font-normal",
            !parsed && "text-muted-foreground",
            className
          )}
        >
          <span className="flex items-center gap-2 truncate">
            <CalendarIcon className="size-3.5 shrink-0 text-muted-foreground" />
            <span className="truncate">
              {parsed ? formatDisplayDate(parsed, true) : placeholder}
            </span>
          </span>
          {clearable && parsed && !disabled && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation()
                onChange?.("")
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.stopPropagation()
                  onChange?.("")
                }
              }}
              className="ml-1 rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Clear date and time"
            >
              <XIcon className="size-3" />
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="z-[90] w-auto p-3">
        <CalendarGrid
          selected={parsed}
          onSelectDate={(y, m, d) => {
            emitDateTime(y, m, d, hours, minutes)
          }}
        />

        {/* Time Picker Bar */}
        <div className="mt-2.5 flex items-center justify-between gap-2 rounded-md border border-border bg-muted/40 px-2.5 py-2">
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <ClockIcon className="size-3.5 text-[#405189]" />
            <span>Time</span>
          </div>

          <div className="flex items-center gap-1">
            <Select
              value={pad2(hours)}
              onValueChange={(v) => {
                const base = parsed || new Date()
                emitDateTime(
                  base.getFullYear(),
                  base.getMonth(),
                  base.getDate(),
                  Number(v),
                  minutes
                )
              }}
            >
              <SelectTrigger size="sm" className="h-7 w-[62px] bg-background px-2 font-mono text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" className="z-[95] max-h-56 text-xs">
                {Array.from({ length: 24 }, (_, h) => (
                  <SelectItem key={h} value={pad2(h)} className="font-mono text-xs">
                    {pad2(h)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="font-mono text-xs font-bold">:</span>
            <Select
              value={pad2(minutes)}
              onValueChange={(v) => {
                const base = parsed || new Date()
                emitDateTime(
                  base.getFullYear(),
                  base.getMonth(),
                  base.getDate(),
                  hours,
                  Number(v)
                )
              }}
            >
              <SelectTrigger size="sm" className="h-7 w-[62px] bg-background px-2 font-mono text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" className="z-[95] max-h-56 text-xs">
                {Array.from({ length: 12 }, (_, idx) => idx * 5).map((m) => (
                  <SelectItem key={m} value={pad2(m)} className="font-mono text-xs">
                    {pad2(m)}
                  </SelectItem>
                ))}
                {![0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].includes(
                  minutes
                ) && (
                  <SelectItem value={pad2(minutes)} className="font-mono text-xs">
                    {pad2(minutes)}
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-2 flex items-center justify-between pt-1">
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => {
              onChange?.("")
              setOpen(false)
            }}
            className="text-xs text-muted-foreground"
          >
            Clear
          </Button>
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={() => {
                onChange?.(formatDateTimeLocal(new Date()))
              }}
              className="text-xs"
            >
              Now
            </Button>
            <Button
              type="button"
              size="xs"
              onClick={() => setOpen(false)}
              className="bg-[#405189] text-xs text-white hover:bg-[#364574]"
            >
              Done
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
