"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  type ColumnDef,
  type PaginationState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { toast } from "sonner"
import { formatDateShort, formatDateTime } from "@/lib/serialize"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

const ALL_COLUMN_DEFS = [
  { key: "name", label: "Name" },
  { key: "mobile", label: "Phone" },
  { key: "alternate_mobile", label: "Alt Phone" },
  { key: "email", label: "Email" },
  { key: "city", label: "City" },
  { key: "state", label: "State" },
  { key: "country", label: "Country" },
  { key: "organization_id", label: "Organization" },
  { key: "institute_id", label: "Institute" },
  { key: "programme_id", label: "Program" },
  { key: "faculty_id", label: "Course" },
  { key: "application_form_id", label: "Application Form" },
  { key: "lead_source_id", label: "Source" },
  { key: "lead_campaign_id", label: "Campaign" },
  { key: "type_id", label: "Type" },
  { key: "lead_status_id", label: "Status" },
  { key: "lead_sub_status_id", label: "Sub Status" },
  { key: "pipeline_id", label: "Pipeline" },
  { key: "stage_id", label: "Stage" },
  { key: "lead_score", label: "Score" },
  { key: "lead_weight_count", label: "Weight" },
  { key: "lead_assign_to", label: "Assign To" },
  { key: "created_by", label: "Created By" },
  { key: "next_followup_at", label: "Next Followup" },
  { key: "lead_registration_date", label: "Registration Date" },
  { key: "created_at", label: "Created" },
  { key: "updated_at", label: "Updated" },
]

export interface LeadRow {
  id: number
  name: string
  mobile: string
  alternate_mobile?: string | null
  email?: string | null
  city_name: string
  state_name: string
  country_name: string
  organization_name: string
  institute_name: string
  programme_name: string
  faculty_name: string
  application_form_id?: number | null
  lead_source_name: string
  lead_campaign_name: string
  lead_type_name: string
  lead_status_id?: number | null
  lead_status_name: string
  lead_status_color: string
  lead_sub_status_id?: number | null
  lead_sub_status_name: string
  pipeline_name: string
  stage_name: string
  lead_score: number
  lead_weight_count: number
  lead_assign_to?: number | null
  assigned_user_name: string
  created_by_name: string
  next_followup_at?: string | null
  lead_registration_date?: string | null
  created_at?: string | null
  updated_at?: string | null
  duplicate_count: number
  duplicate_badge: "P" | "S" | "T"
  duplicates: Array<{
    id: number
    name: string
    email: string
    campaign_name: string
    stage_name: string
    created_at: string | null
  }>
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function LeadsManagerClient({ initialMaster, roleSlug, userEmail, userName }: { initialMaster: any; roleSlug: string; userEmail: string; userName: string }) {
  const router = useRouter()

  const [leads, setLeads] = React.useState<LeadRow[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState("")
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 12,
  })

  // Selected checkboxes
  const [selectedIds, setSelectedIds] = React.useState<number[]>([])

  // Dynamic columns + Saved filters
  const [selectedColumns, setSelectedColumns] = React.useState<string[]>([
    "name",
    "mobile",
    "email",
    "city",
    "institute_id",
    "programme_id",
    "faculty_id",
    "lead_source_id",
    "lead_status_id",
    "stage_id",
    "lead_score",
    "lead_assign_to",
    "next_followup_at",
    "created_at",
  ])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [savedFilters, setSavedFilters] = React.useState<any[]>([])
  const [activeSavedFilterId, setActiveSavedFilterId] = React.useState("")

  // Filter Drawer state
  const [filters, setFilters] = React.useState({
    date_from: "",
    date_to: "",
    name: "",
    mobile: "",
    email: "",
    country: "",
    state: "",
    city: "",
    institute_id: "",
    programme_id: "",
    faculty_id: "",
    lead_source_id: "",
    lead_status_id: "",
    lead_sub_status_id: "",
    pipeline_id: "",
    lead_assign_to: "",
    unassigned: "",
  })
  const [newFilterName, setNewFilterName] = React.useState("")

  // Active modals / drawers
  const [gearOpen, setGearOpen] = React.useState(false)
  const [quickLeadOpen, setQuickLeadOpen] = React.useState(false)
  const [quickLeadMode, setQuickLeadMode] = React.useState<"email" | "whatsapp">("email")
  const [filterDrawerOpen, setFilterDrawerOpen] = React.useState(false)
  const [uploadTypeModalOpen, setUploadTypeModalOpen] = React.useState(false)
  const [uploadPrimaryKey, setUploadPrimaryKey] = React.useState<"email" | "mobile">("mobile")
  const [apiDocModalOpen, setApiDocModalOpen] = React.useState(false)
  const [columnModalOpen, setColumnModalOpen] = React.useState(false)
  const [dupModalLead, setDupModalLead] = React.useState<LeadRow | null>(null)

  // Single / Bulk target modal states
  const [targetLeadIds, setTargetLeadIds] = React.useState<number[]>([])
  const [commDrawerOpen, setCommDrawerOpen] = React.useState(false)
  const [commTab, setCommTab] = React.useState<"email" | "sms" | "whatsapp">("email")
  const [commSubject, setCommSubject] = React.useState("")
  const [commMessage, setCommMessage] = React.useState("")

  const [stageDrawerOpen, setStageDrawerOpen] = React.useState(false)
  const [stageStatusId, setStageStatusId] = React.useState("")
  const [stageSubStatusId, setStageSubStatusId] = React.useState("")
  const [stageFollowup, setStageFollowup] = React.useState("")
  const [stageNote, setStageNote] = React.useState("")

  const [eventDrawerOpen, setEventDrawerOpen] = React.useState(false)
  const [eventForm, setEventForm] = React.useState({
    subject: "Follow up",
    start_at: "",
    end_at: "",
    event_type: "phone_call",
    owner_id: "",
    organiser: userName,
    description: "",
  })

  const [noteModalOpen, setNoteModalOpen] = React.useState(false)
  const [noteText, setNoteText] = React.useState("")

  const [reassignModalOpen, setReassignModalOpen] = React.useState(false)
  const [reassignUserId, setReassignUserId] = React.useState("")

  const [pipelineModalOpen, setPipelineModalOpen] = React.useState(false)
  const [movePipelineId, setMovePipelineId] = React.useState("")

  const [dataUpdateModalOpen, setDataUpdateModalOpen] = React.useState(false)
  const [bulkDataForm, setBulkDataForm] = React.useState({
    institute_id: "",
    programme_id: "",
    course_id: "",
    state_id: "",
    city_id: "",
  })

  const [audienceModal, setAudienceModal] = React.useState<null | "facebook" | "google">(null)
  const [audienceName, setAudienceName] = React.useState("")

  const [deleteModalOpen, setDeleteModalOpen] = React.useState(false)

  // Quick Lead form state
  const [qlForm, setQlForm] = React.useState({
    name: "",
    mobile: "",
    email: "",
    state: "",
    city: "",
    institute_id: "",
    programme_id: "",
    faculty_id: "",
    application_form_id: "",
    source: "",
    medium: "",
    campaign: "",
    lead_marketing_event: "",
  })

  // API tester state inside API Docs modal
  const [apiTestName, setApiTestName] = React.useState("Karan Oberoi")
  const [apiTestMobile, setApiTestMobile] = React.useState("9899887766")

  const filtersRef = React.useRef(filters)
  filtersRef.current = filters
  const searchRef = React.useRef(search)
  searchRef.current = search
  const searchTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null
  )
  const abortRef = React.useRef<AbortController | null>(null)

  const fetchPreferences = React.useCallback(async () => {
    const res = await fetch("/api/leads/preferences")
    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data.columns) && data.columns.length > 0) {
        setSelectedColumns(data.columns)
      }
      if (Array.isArray(data.savedFilters)) {
        setSavedFilters(data.savedFilters)
      }
    }
  }, [])

  const fetchLeads = React.useCallback(
    async (overrideFilters?: typeof filters, overrideSearch?: string) => {
      if (abortRef.current) {
        abortRef.current.abort()
      }
      const controller = new AbortController()
      abortRef.current = controller

      setLoading(true)
      try {
        const activeF = overrideFilters ?? filtersRef.current
        const q = new URLSearchParams()
        const sVal =
          overrideSearch !== undefined ? overrideSearch : searchRef.current
        if (sVal.trim()) q.set("search", sVal.trim())
        for (const [k, v] of Object.entries(activeF)) {
          if (v) q.set(k, v)
        }
        const res = await fetch(`/api/leads?${q.toString()}`, {
          signal: controller.signal,
        })
        if (res.ok) {
          const data = await res.json()
          setLeads(Array.isArray(data.items) ? data.items : [])
          setPagination((prev) => ({ ...prev, pageIndex: 0 }))
        }
      } catch (err) {
        if ((err as Error)?.name === "AbortError") return
      } finally {
        if (abortRef.current === controller) {
          setLoading(false)
        }
      }
    },
    []
  )

  React.useEffect(() => {
    fetchPreferences()
    fetchLeads()
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
      if (abortRef.current) abortRef.current.abort()
    }
  }, [fetchPreferences, fetchLeads])

  // Cascading lists from initialMaster
  const qlCities = React.useMemo(
    () =>
      qlForm.state
        ? initialMaster.cities.filter(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (c: any) => String(c.state_id) === String(qlForm.state)
          )
        : [],
    [qlForm.state, initialMaster.cities]
  )
  const qlPrograms = React.useMemo(
    () =>
      qlForm.institute_id
        ? initialMaster.programs.filter(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (p: any) => String(p.institute_id) === String(qlForm.institute_id)
          )
        : [],
    [qlForm.institute_id, initialMaster.programs]
  )
  const qlCourses = React.useMemo(
    () =>
      qlForm.programme_id
        ? initialMaster.courses.filter(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (c: any) => String(c.program_id) === String(qlForm.programme_id)
          )
        : [],
    [qlForm.programme_id, initialMaster.courses]
  )
  const stageSubStatuses = React.useMemo(
    () =>
      stageStatusId
        ? initialMaster.subStatuses.filter(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (s: any) => String(s.lead_status_id) === String(stageStatusId)
          )
        : [],
    [stageStatusId, initialMaster.subStatuses]
  )
  const filterCities = React.useMemo(
    () =>
      filters.state
        ? initialMaster.cities.filter(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (c: any) => String(c.state_id) === String(filters.state)
          )
        : initialMaster.cities,
    [filters.state, initialMaster.cities]
  )

  const openSingleRowActionRef = React.useRef<(lead: LeadRow, action: string) => void>(() => {})

  // TanStack Column Visibility synced with saved CRM column preferences
  const columnVisibility = React.useMemo<VisibilityState>(() => {
    const vis: VisibilityState = {
      select: true,
      duplicate_badge: true,
      actions: true,
    }
    for (const col of ALL_COLUMN_DEFS) {
      if (col.key === "organization_id" && !["root", "sadmin"].includes(roleSlug)) {
        vis[col.key] = false
      } else {
        vis[col.key] = selectedColumns.includes(col.key)
      }
    }
    return vis
  }, [selectedColumns, roleSlug])

  const columns = React.useMemo<ColumnDef<LeadRow>[]>(
    () => [
      {
        id: "select",
        enableSorting: false,
        enableHiding: false,
        header: ({ table }) => {
          const pageRows = table.getRowModel().rows
          const allPageSelected =
            pageRows.length > 0 &&
            pageRows.every((r) => selectedIds.includes(r.original.id))
          return (
            <Checkbox
              checked={allPageSelected}
              onCheckedChange={(checked) => {
                if (checked) {
                  setSelectedIds(
                    Array.from(
                      new Set([
                        ...selectedIds,
                        ...pageRows.map((r) => r.original.id),
                      ])
                    )
                  )
                } else {
                  const pageIdSet = new Set(pageRows.map((r) => r.original.id))
                  setSelectedIds(selectedIds.filter((id) => !pageIdSet.has(id)))
                }
              }}
            />
          )
        },
        cell: ({ row }) => (
          <Checkbox
            checked={selectedIds.includes(row.original.id)}
            onCheckedChange={(checked) => {
              setSelectedIds((prev) =>
                checked
                  ? [...prev, row.original.id]
                  : prev.filter((x) => x !== row.original.id)
              )
            }}
          />
        ),
      },
      {
        id: "duplicate_badge",
        header: "Type",
        accessorFn: (row) => row.duplicate_count,
        enableHiding: false,
        cell: ({ row }) => {
          const lead = row.original
          const dupColor =
            lead.duplicate_badge === "P"
              ? "bg-[#f7b84b] text-slate-900"
              : lead.duplicate_badge === "S"
                ? "bg-[#299cdb] text-white"
                : "bg-[#f06548] text-white"
          const dupTooltip =
            lead.duplicate_badge === "P"
              ? "Primary lead (first unique entry)"
              : lead.duplicate_badge === "S"
                ? "Secondary lead (duplicate 1 time)"
                : "Tertiary lead (duplicate 2 or more times)"
          return (
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <span
                title={dupTooltip}
                className={`inline-flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${dupColor}`}
              >
                {lead.duplicate_badge}
              </span>
              {lead.duplicate_count > 0 && (
                <button
                  type="button"
                  onClick={() => setDupModalLead(lead)}
                  className="font-semibold text-[#405189] underline"
                >
                  {lead.duplicate_count}
                </button>
              )}
            </div>
          )
        },
      },
      {
        id: "name",
        header: "Name",
        accessorFn: (row) => row.name,
        cell: ({ row }) => (
          <Link
            href={`/leads/${row.original.id}`}
            title={row.original.name}
            className="inline-flex items-center font-semibold whitespace-nowrap text-[#405189] hover:underline dark:text-indigo-300"
          >
            <span className="text-truncate-10">{row.original.name}</span>
            <i className="ri-arrow-right-s-line ml-0.5" />
          </Link>
        ),
      },
      {
        id: "mobile",
        header: "Phone",
        accessorFn: (row) => row.mobile,
        cell: ({ row }) => (
          <span className="font-mono whitespace-nowrap">
            {row.original.mobile}
          </span>
        ),
      },
      {
        id: "alternate_mobile",
        header: "Alt Phone",
        accessorFn: (row) => row.alternate_mobile || "",
        cell: ({ row }) => (
          <span className="font-mono whitespace-nowrap">
            {row.original.alternate_mobile || "-"}
          </span>
        ),
      },
      {
        id: "email",
        header: "Email",
        accessorFn: (row) => row.email || "",
        cell: ({ row }) => (
          <span className="max-w-[180px] truncate block" title={row.original.email || ""}>
            {row.original.email || "-"}
          </span>
        ),
      },
      {
        id: "city",
        header: "City",
        accessorFn: (row) => row.city_name || "",
        cell: ({ row }) => (
          <span className="whitespace-nowrap">{row.original.city_name}</span>
        ),
      },
      {
        id: "state",
        header: "State",
        accessorFn: (row) => row.state_name || "",
        cell: ({ row }) => (
          <span className="whitespace-nowrap">{row.original.state_name}</span>
        ),
      },
      {
        id: "country",
        header: "Country",
        accessorFn: (row) => row.country_name || "",
        cell: ({ row }) => (
          <span className="whitespace-nowrap">{row.original.country_name}</span>
        ),
      },
      {
        id: "organization_id",
        header: "Organization",
        accessorFn: (row) => row.organization_name || "",
        cell: ({ row }) => (
          <span className="whitespace-nowrap">
            {row.original.organization_name}
          </span>
        ),
      },
      {
        id: "institute_id",
        header: "Institute",
        accessorFn: (row) => row.institute_name || "",
        cell: ({ row }) => (
          <span className="max-w-[160px] truncate block" title={row.original.institute_name}>
            {row.original.institute_name}
          </span>
        ),
      },
      {
        id: "programme_id",
        header: "Program",
        accessorFn: (row) => row.programme_name || "",
        cell: ({ row }) => (
          <span className="whitespace-nowrap">{row.original.programme_name}</span>
        ),
      },
      {
        id: "faculty_id",
        header: "Course",
        accessorFn: (row) => row.faculty_name || "",
        cell: ({ row }) => (
          <span className="max-w-[170px] truncate block" title={row.original.faculty_name}>
            {row.original.faculty_name}
          </span>
        ),
      },
      {
        id: "application_form_id",
        header: "Application Form",
        accessorFn: (row) => row.application_form_id ?? "",
        cell: ({ row }) => row.original.application_form_id || "-",
      },
      {
        id: "lead_source_id",
        header: "Source",
        accessorFn: (row) => row.lead_source_name || "",
        cell: ({ row }) => (
          <span className="whitespace-nowrap">
            {row.original.lead_source_name}
          </span>
        ),
      },
      {
        id: "lead_campaign_id",
        header: "Campaign",
        accessorFn: (row) => row.lead_campaign_name || "",
        cell: ({ row }) => (
          <span className="whitespace-nowrap">
            {row.original.lead_campaign_name}
          </span>
        ),
      },
      {
        id: "type_id",
        header: "Type",
        accessorFn: (row) => row.lead_type_name || "",
        cell: ({ row }) => (
          <span className="whitespace-nowrap">
            {row.original.lead_type_name}
          </span>
        ),
      },
      {
        id: "lead_status_id",
        header: "Status",
        accessorFn: (row) => row.lead_status_name || "",
        cell: ({ row }) => (
          <Badge
            variant="secondary"
            style={{
              backgroundColor: `${row.original.lead_status_color}20`,
              color: row.original.lead_status_color,
            }}
            className="border-0 text-[11px] font-semibold whitespace-nowrap"
          >
            {row.original.lead_status_name}
          </Badge>
        ),
      },
      {
        id: "lead_sub_status_id",
        header: "Sub Status",
        accessorFn: (row) => row.lead_sub_status_name || "",
        cell: ({ row }) => (
          <span className="whitespace-nowrap">
            {row.original.lead_sub_status_name}
          </span>
        ),
      },
      {
        id: "pipeline_id",
        header: "Pipeline",
        accessorFn: (row) => row.pipeline_name || "",
        cell: ({ row }) => (
          <span className="whitespace-nowrap">{row.original.pipeline_name}</span>
        ),
      },
      {
        id: "stage_id",
        header: "Stage",
        accessorFn: (row) => row.stage_name || "",
        cell: ({ row }) => (
          <Badge variant="secondary" className="text-[11px] whitespace-nowrap">
            {row.original.stage_name}
          </Badge>
        ),
      },
      {
        id: "lead_score",
        header: "Score",
        accessorFn: (row) => row.lead_score,
        cell: ({ row }) => (
          <span className="font-semibold text-[#0ab39c]">
            {row.original.lead_score}
          </span>
        ),
      },
      {
        id: "lead_weight_count",
        header: "Weight",
        accessorFn: (row) => row.lead_weight_count,
        cell: ({ row }) => row.original.lead_weight_count,
      },
      {
        id: "lead_assign_to",
        header: "Assign To",
        accessorFn: (row) => row.assigned_user_name || "",
        cell: ({ row }) => {
          const isUntouched =
            !row.original.lead_assign_to ||
            Number(row.original.lead_assign_to) === 0
          return isUntouched ? (
            <Badge className="border-0 bg-[#f7b84b] text-[11px] font-semibold text-slate-900">
              Unassigned
            </Badge>
          ) : (
            <span className="whitespace-nowrap">
              {row.original.assigned_user_name}
            </span>
          )
        },
      },
      {
        id: "created_by",
        header: "Created By",
        accessorFn: (row) => row.created_by_name || "",
        cell: ({ row }) => (
          <span className="whitespace-nowrap">
            {row.original.created_by_name}
          </span>
        ),
      },
      {
        id: "next_followup_at",
        header: "Next Followup",
        accessorFn: (row) => row.next_followup_at || "",
        cell: ({ row }) => (
          <span className="whitespace-nowrap">
            {formatDateTime(row.original.next_followup_at)}
          </span>
        ),
      },
      {
        id: "lead_registration_date",
        header: "Registration Date",
        accessorFn: (row) => row.lead_registration_date || "",
        cell: ({ row }) => (
          <span className="whitespace-nowrap">
            {formatDateShort(row.original.lead_registration_date)}
          </span>
        ),
      },
      {
        id: "created_at",
        header: "Created",
        accessorFn: (row) => row.created_at || "",
        cell: ({ row }) => (
          <span className="whitespace-nowrap">
            {formatDateShort(row.original.created_at)}
          </span>
        ),
      },
      {
        id: "updated_at",
        header: "Updated",
        accessorFn: (row) => row.updated_at || "",
        cell: ({ row }) => (
          <span className="whitespace-nowrap">
            {formatDateShort(row.original.updated_at)}
          </span>
        ),
      },
      {
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => {
          const lead = row.original
          return (
            <div className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon-sm">
                    <i className="ri-more-fill text-base" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 text-xs">
                  <DropdownMenuItem
                    onClick={() =>
                      openSingleRowActionRef.current(lead, "communicate")
                    }
                    className="cursor-pointer gap-2 text-xs"
                  >
                    <i className="ri-chat-1-line" /> Communicate
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      openSingleRowActionRef.current(lead, "stage")
                    }
                    className="cursor-pointer gap-2 text-xs"
                  >
                    <i className="ri-exchange-dollar-line" /> Change Lead Stage
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      openSingleRowActionRef.current(lead, "reassign")
                    }
                    className="cursor-pointer gap-2 text-xs"
                  >
                    <i className="ri-user-shared-line" /> Re-assign Lead
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      openSingleRowActionRef.current(lead, "event")
                    }
                    className="cursor-pointer gap-2 text-xs"
                  >
                    <i className="ri-calendar-event-line" /> Add Event
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => openSingleRowActionRef.current(lead, "note")}
                    className="cursor-pointer gap-2 text-xs"
                  >
                    <i className="ri-sticky-note-line" /> Add Note
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    asChild
                    className="cursor-pointer gap-2 text-xs"
                  >
                    <Link href={`/leads/${lead.id}`}>
                      <i className="ri-user-line" /> View Lead (Quick)
                    </Link>
                  </DropdownMenuItem>
                  {["root", "sadmin", "admin", "manager"].includes(
                    roleSlug
                  ) && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() =>
                          openSingleRowActionRef.current(lead, "delete")
                        }
                        className="cursor-pointer gap-2 text-xs text-[#f06548] focus:text-[#f06548]"
                      >
                        <i className="ri-delete-bin-6-line" /> Delete
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )
        },
      },
    ],
    [selectedIds, roleSlug]
  )

  const table = useReactTable({
    data: leads,
    columns,
    state: {
      sorting,
      pagination,
      columnVisibility,
    },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  function requireBulkSelection(cb: (ids: number[]) => void) {
    setGearOpen(false)
    if (selectedIds.length === 0) {
      toast.warning("Please select at least one lead first.")
      return
    }
    setTargetLeadIds(selectedIds)
    cb(selectedIds)
  }

  function openSingleRowAction(lead: LeadRow, action: string) {
    setTargetLeadIds([lead.id])
    if (action === "communicate") {
      setCommSubject("")
      setCommMessage("")
      setCommDrawerOpen(true)
    } else if (action === "stage") {
      setStageStatusId(lead.lead_status_id ? String(lead.lead_status_id) : "")
      setStageSubStatusId(lead.lead_sub_status_id ? String(lead.lead_sub_status_id) : "")
      setStageNote("")
      setStageDrawerOpen(true)
    } else if (action === "reassign") {
      setReassignUserId(lead.lead_assign_to ? String(lead.lead_assign_to) : "")
      setReassignModalOpen(true)
    } else if (action === "event") {
      setEventDrawerOpen(true)
    } else if (action === "note") {
      setNoteText("")
      setNoteModalOpen(true)
    } else if (action === "delete") {
      setDeleteModalOpen(true)
    }
  }
  openSingleRowActionRef.current = openSingleRowAction

  async function handleQuickLeadSubmit(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...qlForm,
        upload_via: quickLeadMode,
      }),
    })
    if (res.ok) {
      toast.success("Quick Lead created successfully!")
      setQuickLeadOpen(false)
      setQlForm({
        name: "",
        mobile: "",
        email: "",
        state: "",
        city: "",
        institute_id: "",
        programme_id: "",
        faculty_id: "",
        application_form_id: "",
        source: "",
        medium: "",
        campaign: "",
        lead_marketing_event: "",
      })
      fetchLeads()
    } else {
      toast.error("Failed to create lead")
    }
  }

  async function runBulkOrSingleApi(payload: Record<string, unknown>, onDone: () => void) {
    const res = await fetch("/api/leads/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: targetLeadIds, ...payload }),
    })
    const data = await res.json()
    if (res.ok) {
      toast.success(data.message || "Updated successfully")
      setSelectedIds([])
      onDone()
      fetchLeads()
    } else {
      toast.error(data.error || "Action failed")
    }
  }

  async function handleAddSingleNote(e: React.FormEvent) {
    e.preventDefault()
    if (!targetLeadIds[0] || !noteText.trim()) return
    const res = await fetch(`/api/leads/${targetLeadIds[0]}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "add_note", note: noteText }),
    })
    if (res.ok) {
      toast.success("Note added to lead")
      setNoteModalOpen(false)
      setNoteText("")
    }
  }

  async function handleSaveColumns() {
    await fetch("/api/leads/preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "save_columns", columns: selectedColumns }),
    })
    toast.success("Column preferences saved!")
    setColumnModalOpen(false)
  }

  async function handleSaveCurrentFilter() {
    if (!newFilterName.trim()) {
      toast.warning("Enter a filter name first")
      return
    }
    const res = await fetch("/api/leads/preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "save_filter",
        name: newFilterName,
        filters,
      }),
    })
    if (res.ok) {
      toast.success(`Saved filter "${newFilterName}"`)
      setNewFilterName("")
      fetchPreferences()
    }
  }

  function handleSelectSavedFilter(sfId: string) {
    setActiveSavedFilterId(sfId)
    if (!sfId) {
      const cleared = {
        date_from: "",
        date_to: "",
        name: "",
        mobile: "",
        email: "",
        country: "",
        state: "",
        city: "",
        institute_id: "",
        programme_id: "",
        faculty_id: "",
        lead_source_id: "",
        lead_status_id: "",
        lead_sub_status_id: "",
        pipeline_id: "",
        lead_assign_to: "",
        unassigned: "",
      }
      setFilters(cleared)
      fetchLeads(cleared)
      return
    }
    const found = savedFilters.find((x) => String(x.id) === sfId)
    if (found?.filters_json) {
      try {
        const parsed = JSON.parse(found.filters_json)
        const nextF = { ...filters, ...parsed }
        setFilters(nextF)
        fetchLeads(nextF)
      } catch {
        // ignore
      }
    }
  }

  function handleDownloadCsv() {
    setGearOpen(false)
    const q = new URLSearchParams()
    q.set("export", "csv")
    if (selectedIds.length > 0) {
      q.set("ids", selectedIds.join(","))
    } else if (search.trim()) {
      q.set("search", search.trim())
    }
    window.open(`/api/leads?${q.toString()}`, "_blank")
    toast.success("Downloading CSV export...")
  }

  async function handleTestPublicApi(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch("/api/leads/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: apiTestName,
        mobile: apiTestMobile,
        email: `${apiTestName.toLowerCase().replace(/\s+/g, ".")}@gmail.com`,
      }),
    })
    const data = await res.json()
    if (res.ok) {
      toast.success(`API Lead Captured! Lead ID #${data.lead_id}`)
      setApiDocModalOpen(false)
      fetchLeads()
    }
  }

  return (
    <Card className="gap-0 py-0 shadow-xs">
      {/* ==================== CARD HEADER ==================== */}
      <div className="border-b border-border p-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Input
              type="text"
              value={search}
              onChange={(e) => {
                const nextVal = e.target.value
                setSearch(nextVal)
                if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
                searchTimerRef.current = setTimeout(() => {
                  fetchLeads(filtersRef.current, nextVal)
                }, 250)
              }}
              placeholder="Search for..."
              className="h-9 pr-3 pl-9 text-xs"
            />
            <i className="ri-search-line absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground" />
          </div>

          {/* Saved Filters Dropdown */}
          <div className="flex items-center gap-1.5">
            <select
              value={activeSavedFilterId}
              onChange={(e) => handleSelectSavedFilter(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-xs outline-none focus:border-[#405189]"
            >
              <option value="">-- Saved Filters --</option>
              {savedFilters.map((sf) => (
                <option key={sf.id} value={String(sf.id)}>
                  {sf.name} {sf.is_default ? "(Default)" : ""}
                </option>
              ))}
            </select>
            {activeSavedFilterId && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                title="Delete saved filter"
                onClick={async () => {
                  await fetch("/api/leads/preferences", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      action: "delete_filter",
                      id: activeSavedFilterId,
                    }),
                  })
                  setActiveSavedFilterId("")
                  fetchPreferences()
                  toast.success("Saved filter deleted")
                }}
                className="size-9 text-[#f06548] hover:bg-[#f06548]/10 hover:text-[#f06548]"
              >
                <i className="ri-delete-bin-line" />
              </Button>
            )}
          </div>

          {/* Right Action Toolbar */}
          <div className="ml-auto flex flex-wrap items-center gap-2">
            {selectedIds.length > 0 && (
              <Badge
                variant="outline"
                className="border-[#299cdb]/30 bg-[#299cdb]/10 px-2.5 py-1 text-xs text-[#299cdb]"
              >
                Selected: <strong className="ml-1">{selectedIds.length}</strong>
              </Badge>
            )}

            <Button
              type="button"
              size="sm"
              onClick={() => setApiDocModalOpen(true)}
              className="h-9 bg-[#299cdb] text-xs text-white hover:bg-[#2389c2]"
            >
              <i className="ri-file-text-line" /> API Docs
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={() => setFilterDrawerOpen(true)}
              className="h-9 bg-[#299cdb] text-xs text-white hover:bg-[#2389c2]"
            >
              <i className="ri-filter-3-line" /> Filters
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={() => setQuickLeadOpen(true)}
              className="h-9 bg-[#0ab39c] text-xs text-white hover:bg-[#099885]"
            >
              <i className="ri-add-line" /> Add Leads
            </Button>

            {/* Gear Bulk Actions shadcn DropdownMenu */}
            <DropdownMenu open={gearOpen} onOpenChange={setGearOpen}>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-9 bg-[#299cdb]/15 text-[#299cdb] hover:bg-[#299cdb]/25 hover:text-[#299cdb]"
                  title="Bulk Actions & Columns"
                >
                  <i className="ri-settings-4-line text-base" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 text-xs">
                <DropdownMenuItem
                  onClick={handleDownloadCsv}
                  className="cursor-pointer gap-2 text-xs"
                >
                  <i className="ri-download-2-line text-muted-foreground" />
                  Download Leads
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    requireBulkSelection(() => setCommDrawerOpen(true))
                  }
                  className="cursor-pointer gap-2 text-xs"
                >
                  <i className="ri-mail-send-line text-muted-foreground" />
                  Communicate
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    requireBulkSelection(() => setEventDrawerOpen(true))
                  }
                  className="cursor-pointer gap-2 text-xs"
                >
                  <i className="ri-calendar-event-line text-muted-foreground" />
                  Event
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    requireBulkSelection(() => {
                      setAudienceName("")
                      setAudienceModal("facebook")
                    })
                  }
                  className="cursor-pointer gap-2 text-xs"
                >
                  <i className="ri-facebook-circle-line text-muted-foreground" />
                  Send to Facebook
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    requireBulkSelection(() => {
                      setAudienceName("")
                      setAudienceModal("google")
                    })
                  }
                  className="cursor-pointer gap-2 text-xs"
                >
                  <i className="ri-google-line text-muted-foreground" />
                  Send to Google Ads
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    requireBulkSelection(() => setReassignModalOpen(true))
                  }
                  className="cursor-pointer gap-2 text-xs"
                >
                  <i className="ri-user-shared-line text-muted-foreground" />
                  Re-assign Leads
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    requireBulkSelection(() => setStageDrawerOpen(true))
                  }
                  className="cursor-pointer gap-2 text-xs"
                >
                  <i className="ri-shuffle-line text-muted-foreground" />
                  Change Lead Stage
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    requireBulkSelection(() => setDataUpdateModalOpen(true))
                  }
                  className="cursor-pointer gap-2 text-xs"
                >
                  <i className="ri-edit-box-line text-muted-foreground" />
                  Data Update
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    requireBulkSelection(() => setPipelineModalOpen(true))
                  }
                  className="cursor-pointer gap-2 text-xs"
                >
                  <i className="ri-ancient-gate-line text-muted-foreground" />
                  Move to Pipeline
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setColumnModalOpen(true)}
                  className="cursor-pointer gap-2 text-xs"
                >
                  <i className="ri-layout-column-line text-muted-foreground" />
                  Choose Columns
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() =>
                    requireBulkSelection(() => setDeleteModalOpen(true))
                  }
                  className="cursor-pointer gap-2 text-xs text-[#f06548] focus:text-[#f06548]"
                >
                  <i className="ri-delete-bin-6-line" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* ==================== TANSTACK REACT-TABLE BODY ==================== */}
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
                        className="inline-flex items-center gap-1 font-semibold hover:text-[#405189] dark:hover:text-white"
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
                                : "ri-arrow-up-down-line text-[11px] opacity-50"
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
                colSpan={table.getVisibleLeafColumns().length}
                className="py-12 text-center text-muted-foreground"
              >
                Loading leads...
              </TableCell>
            </TableRow>
          ) : table.getRowModel().rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={table.getVisibleLeafColumns().length}
                className="py-12 text-center"
              >
                <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-muted text-2xl text-muted-foreground">
                  <i className="ri-search-eye-line" />
                </div>
                <h5 className="font-semibold">Sorry! No Result Found</h5>
                <p className="mt-1 text-xs text-muted-foreground">
                  We did not find any leads matching your current search or filters.
                </p>
              </TableCell>
            </TableRow>
          ) : (
            table.getRowModel().rows.map((row) => {
              const lead = row.original
              const isUntouched =
                !lead.lead_assign_to || Number(lead.lead_assign_to) === 0
              return (
                <TableRow
                  key={row.id}
                  data-state={selectedIds.includes(lead.id) && "selected"}
                  className={isUntouched ? "lead-border-left" : ""}
                  title={
                    isUntouched
                      ? "Untouched Lead"
                      : `${lead.assigned_user_name} Lead`
                  }
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="px-3">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>

      {/* ==================== TANSTACK PAGINATION FOOTER ==================== */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-3 text-xs">
        <div className="flex flex-wrap items-center gap-3 text-muted-foreground">
          <span>
            Showing{" "}
            <strong className="text-foreground">
              {leads.length === 0
                ? 0
                : pagination.pageIndex * pagination.pageSize + 1}
            </strong>{" "}
            to{" "}
            <strong className="text-foreground">
              {Math.min(
                (pagination.pageIndex + 1) * pagination.pageSize,
                leads.length
              )}
            </strong>{" "}
            of <strong className="text-foreground">{leads.length}</strong> leads
          </span>
          <div className="flex items-center gap-1.5">
            <span>Rows:</span>
            <select
              value={pagination.pageSize}
              onChange={(e) => table.setPageSize(Number(e.target.value))}
              className="h-7 rounded-md border border-input bg-background px-2 text-xs text-foreground"
            >
              {[12, 25, 50, 100].map((sz) => (
                <option key={sz} value={sz}>
                  {sz}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="xs"
            disabled={!table.getCanPreviousPage()}
            onClick={() => table.setPageIndex(0)}
          >
            «
          </Button>
          <Button
            type="button"
            variant="outline"
            size="xs"
            disabled={!table.getCanPreviousPage()}
            onClick={() => table.previousPage()}
          >
            Previous
          </Button>
          <span className="px-2 font-medium">
            Page {pagination.pageIndex + 1} of{" "}
            {Math.max(1, table.getPageCount())}
          </span>
          <Button
            type="button"
            variant="outline"
            size="xs"
            disabled={!table.getCanNextPage()}
            onClick={() => table.nextPage()}
          >
            Next
          </Button>
          <Button
            type="button"
            variant="outline"
            size="xs"
            disabled={!table.getCanNextPage()}
            onClick={() =>
              table.setPageIndex(Math.max(0, table.getPageCount() - 1))
            }
          >
            »
          </Button>
        </div>
      </div>

      {/* ==================== 1. SHADCN SHEET: QUICK LEAD ==================== */}
      <Sheet open={quickLeadOpen} onOpenChange={setQuickLeadOpen}>
        <SheetContent side="right" className="flex w-full max-w-md flex-col p-0">
          <form onSubmit={handleQuickLeadSubmit} className="flex h-full flex-col">
            <SheetHeader className="border-b border-border px-4 py-3.5">
              <SheetTitle className="text-sm font-semibold">
                Add Quick Lead
              </SheetTitle>
              <SheetDescription className="text-xs">
                Capture a walk-in, phone, or WhatsApp student inquiry instantly.
              </SheetDescription>
            </SheetHeader>

            <div className="flex-1 space-y-3 overflow-y-auto p-4 text-xs">
              <div className="flex items-center justify-between gap-2">
                <Tabs
                  value={quickLeadMode}
                  onValueChange={(v) => setQuickLeadMode(v as "email" | "whatsapp")}
                >
                  <TabsList className="h-8">
                    <TabsTrigger value="email" className="text-xs">
                      Email
                    </TabsTrigger>
                    <TabsTrigger value="whatsapp" className="text-xs">
                      WhatsApp
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
                <Button
                  type="button"
                  variant="link"
                  size="xs"
                  onClick={() => {
                    setQuickLeadOpen(false)
                    setUploadTypeModalOpen(true)
                  }}
                  className="text-[#299cdb]"
                >
                  <i className="ri-upload-2-line mr-1" />
                  Upload Leads
                </Button>
              </div>

              <Input
                type="text"
                required
                placeholder="Enter Name *"
                value={qlForm.name}
                onChange={(e) => setQlForm({ ...qlForm, name: e.target.value })}
                className="h-9 text-xs"
              />

              <Input
                type="text"
                required
                placeholder="Enter Mobile Number *"
                value={qlForm.mobile}
                onChange={(e) =>
                  setQlForm({ ...qlForm, mobile: e.target.value })
                }
                className="h-9 text-xs"
              />

              {quickLeadMode === "email" && (
                <Input
                  type="email"
                  required
                  placeholder="Enter Email *"
                  value={qlForm.email}
                  onChange={(e) =>
                    setQlForm({ ...qlForm, email: e.target.value })
                  }
                  className="h-9 text-xs"
                />
              )}

              <select
                value={qlForm.state}
                onChange={(e) =>
                  setQlForm({ ...qlForm, state: e.target.value, city: "" })
                }
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
              >
                <option value="">Select State *</option>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {initialMaster.states.map((s: any) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>

              <select
                value={qlForm.city}
                onChange={(e) => setQlForm({ ...qlForm, city: e.target.value })}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
              >
                <option value="">Select City *</option>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {qlCities.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              <select
                value={qlForm.institute_id}
                onChange={(e) =>
                  setQlForm({
                    ...qlForm,
                    institute_id: e.target.value,
                    programme_id: "",
                    faculty_id: "",
                  })
                }
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
              >
                <option value="">Select Institute *</option>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {initialMaster.institutes.map((i: any) => (
                  <option key={i.id} value={i.id}>
                    {i.name}
                  </option>
                ))}
              </select>

              <select
                value={qlForm.programme_id}
                onChange={(e) =>
                  setQlForm({
                    ...qlForm,
                    programme_id: e.target.value,
                    faculty_id: "",
                  })
                }
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
              >
                <option value="">Select Program *</option>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {qlPrograms.map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>

              <select
                value={qlForm.faculty_id}
                onChange={(e) =>
                  setQlForm({ ...qlForm, faculty_id: e.target.value })
                }
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
              >
                <option value="">Select Course *</option>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {qlCourses.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              <select
                value={qlForm.application_form_id}
                onChange={(e) =>
                  setQlForm({ ...qlForm, application_form_id: e.target.value })
                }
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
              >
                <option value="">Select Application Form</option>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {initialMaster.applicationForms.map((f: any) => (
                  <option key={f.id} value={f.id}>
                    {f.title} (₹{f.total_amount})
                  </option>
                ))}
              </select>

              <div className="grid grid-cols-2 gap-2">
                <select
                  value={qlForm.source}
                  onChange={(e) =>
                    setQlForm({ ...qlForm, source: e.target.value })
                  }
                  className="h-9 rounded-md border border-input bg-background px-2 text-xs"
                >
                  <option value="">Select Source *</option>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {initialMaster.sources.map((s: any) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>

                <select
                  value={qlForm.medium}
                  onChange={(e) =>
                    setQlForm({ ...qlForm, medium: e.target.value })
                  }
                  className="h-9 rounded-md border border-input bg-background px-2 text-xs"
                >
                  <option value="">Select Medium *</option>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {initialMaster.leadTypes.map((m: any) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <select
                  value={qlForm.campaign}
                  onChange={(e) =>
                    setQlForm({ ...qlForm, campaign: e.target.value })
                  }
                  className="h-9 rounded-md border border-input bg-background px-2 text-xs"
                >
                  <option value="">Select Campaign</option>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {initialMaster.campaigns.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>

                <select
                  value={qlForm.lead_marketing_event}
                  onChange={(e) =>
                    setQlForm({
                      ...qlForm,
                      lead_marketing_event: e.target.value,
                    })
                  }
                  className="h-9 rounded-md border border-input bg-background px-2 text-xs"
                >
                  <option value="">Select Event</option>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {initialMaster.events.map((ev: any) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label className="mb-1 block text-xs">Assign To Owner</Label>
                <Input
                  type="text"
                  disabled
                  value={userName}
                  className="h-9 bg-muted text-xs"
                />
              </div>
            </div>

            <SheetFooter className="flex-row gap-2 border-t border-border p-3.5">
              <Button
                type="button"
                variant="outline"
                onClick={() => setQuickLeadOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-[#0ab39c] text-white hover:bg-[#099885]"
              >
                Save Lead
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      {/* ==================== 2. SHADCN SHEET: FILTERS ==================== */}
      <Sheet open={filterDrawerOpen} onOpenChange={setFilterDrawerOpen}>
        <SheetContent side="right" className="flex w-full max-w-md flex-col p-0">
          <SheetHeader className="border-b border-border bg-muted/50 px-4 py-3.5">
            <SheetTitle className="text-sm font-semibold">
              Lead Filters
            </SheetTitle>
            <SheetDescription className="text-xs">
              Filter leads by date, location, academic program, source, or stage.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 space-y-4 overflow-y-auto p-4 text-xs">
            <div className="rounded-md border border-border p-3">
              <Label className="mb-1.5 block text-xs font-semibold">
                Save this filter
              </Label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={newFilterName}
                  onChange={(e) => setNewFilterName(e.target.value)}
                  placeholder="Filter Name (e.g. Today Leads)"
                  className="h-8 flex-1 text-xs"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={handleSaveCurrentFilter}
                  className="bg-[#405189] text-white hover:bg-[#364574]"
                >
                  Save
                </Button>
              </div>
            </div>

            <div>
              <Label className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                Date Range
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="date"
                  value={filters.date_from}
                  onChange={(e) =>
                    setFilters({ ...filters, date_from: e.target.value })
                  }
                  className="h-9 text-xs"
                />
                <Input
                  type="date"
                  value={filters.date_to}
                  onChange={(e) =>
                    setFilters({ ...filters, date_to: e.target.value })
                  }
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="block text-xs font-semibold text-muted-foreground">
                Basic Info
              </Label>
              <Input
                type="text"
                placeholder="Name"
                value={filters.name}
                onChange={(e) =>
                  setFilters({ ...filters, name: e.target.value })
                }
                className="h-9 text-xs"
              />
              <Input
                type="text"
                placeholder="Mobile"
                value={filters.mobile}
                onChange={(e) =>
                  setFilters({ ...filters, mobile: e.target.value })
                }
                className="h-9 text-xs"
              />
              <Input
                type="text"
                placeholder="Email"
                value={filters.email}
                onChange={(e) =>
                  setFilters({ ...filters, email: e.target.value })
                }
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-2">
              <Label className="block text-xs font-semibold text-muted-foreground">
                Location
              </Label>
              <select
                value={filters.state}
                onChange={(e) =>
                  setFilters({ ...filters, state: e.target.value, city: "" })
                }
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
              >
                <option value="">Select State</option>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {initialMaster.states.map((s: any) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <select
                value={filters.city}
                onChange={(e) =>
                  setFilters({ ...filters, city: e.target.value })
                }
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
              >
                <option value="">Select City</option>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {filterCities.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label className="block text-xs font-semibold text-muted-foreground">
                Academic & CRM Status
              </Label>
              <select
                value={filters.institute_id}
                onChange={(e) =>
                  setFilters({ ...filters, institute_id: e.target.value })
                }
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
              >
                <option value="">All Institutes</option>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {initialMaster.institutes.map((i: any) => (
                  <option key={i.id} value={i.id}>
                    {i.name}
                  </option>
                ))}
              </select>
              <select
                value={filters.lead_source_id}
                onChange={(e) =>
                  setFilters({ ...filters, lead_source_id: e.target.value })
                }
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
              >
                <option value="">All Lead Sources</option>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {initialMaster.sources.map((s: any) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <select
                value={filters.lead_status_id}
                onChange={(e) =>
                  setFilters({ ...filters, lead_status_id: e.target.value })
                }
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
              >
                <option value="">All Lead Statuses</option>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {initialMaster.statuses.map((st: any) => (
                  <option key={st.id} value={st.id}>
                    {st.name}
                  </option>
                ))}
              </select>
              <label className="flex items-center gap-2 pt-1 cursor-pointer">
                <Checkbox
                  checked={filters.unassigned === "1"}
                  onCheckedChange={(checked) =>
                    setFilters({
                      ...filters,
                      unassigned: checked ? "1" : "",
                    })
                  }
                />
                <span>Untouched / Unassigned Leads Only</span>
              </label>
            </div>
          </div>

          <SheetFooter className="flex-row gap-2 border-t border-border p-3.5">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => {
                const empty = {
                  date_from: "",
                  date_to: "",
                  name: "",
                  mobile: "",
                  email: "",
                  country: "",
                  state: "",
                  city: "",
                  institute_id: "",
                  programme_id: "",
                  faculty_id: "",
                  lead_source_id: "",
                  lead_status_id: "",
                  lead_sub_status_id: "",
                  pipeline_id: "",
                  lead_assign_to: "",
                  unassigned: "",
                }
                setFilters(empty)
                fetchLeads(empty)
                setFilterDrawerOpen(false)
              }}
            >
              Clear Filters
            </Button>
            <Button
              type="button"
              className="flex-1 bg-[#405189] text-white hover:bg-[#364574]"
              onClick={() => {
                fetchLeads(filters)
                setFilterDrawerOpen(false)
              }}
            >
              Apply Filters
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* ==================== 3. SHADCN SHEET: COMMUNICATION ==================== */}
      <Sheet open={commDrawerOpen} onOpenChange={setCommDrawerOpen}>
        <SheetContent side="right" className="flex w-full sm:max-w-xl flex-col p-0">
          <SheetHeader className="border-b border-border px-4 py-3.5">
            <SheetTitle className="text-sm font-semibold">
              Communication ({targetLeadIds.length} lead
              {targetLeadIds.length > 1 ? "s" : ""})
            </SheetTitle>
            <SheetDescription className="text-xs">
              Send Email, SMS, or WhatsApp messages using CRM templates.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 space-y-4 overflow-y-auto p-4 text-xs">
            <Tabs
              value={commTab}
              onValueChange={(v) => setCommTab(v as "email" | "sms" | "whatsapp")}
            >
              <TabsList className="h-8">
                {(["email", "sms", "whatsapp"] as const).map((ch) => (
                  <TabsTrigger key={ch} value={ch} className="text-xs uppercase">
                    {ch}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            <div>
              <Label className="mb-1 block text-xs">Template</Label>
              <select
                onChange={(e) => {
                  const tplId = e.target.value
                  const pool =
                    commTab === "email"
                      ? initialMaster.emailTemplates
                      : commTab === "sms"
                        ? initialMaster.smsTemplates
                        : initialMaster.whatsappTemplates
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const found = pool.find((t: any) => String(t.id) === tplId)
                  if (found) {
                    if (found.subject) setCommSubject(found.subject)
                    setCommMessage(found.message || "")
                  }
                }}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
              >
                <option value="">Select Template</option>
                {(commTab === "email"
                  ? initialMaster.emailTemplates
                  : commTab === "sms"
                    ? initialMaster.smsTemplates
                    : initialMaster.whatsappTemplates
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                ).map((t: any) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
            </div>

            {commTab === "email" && (
              <>
                <div>
                  <Label className="mb-1 block text-xs">From Email</Label>
                  <Input
                    type="text"
                    readOnly
                    value={userEmail}
                    className="h-9 bg-muted text-xs"
                  />
                </div>
                <div>
                  <Label className="mb-1 block text-xs">Subject</Label>
                  <Input
                    type="text"
                    value={commSubject}
                    onChange={(e) => setCommSubject(e.target.value)}
                    placeholder="Enter email subject"
                    className="h-9 text-xs"
                  />
                </div>
              </>
            )}

            <div>
              <Label className="mb-1 block text-xs">Message Text</Label>
              <Textarea
                rows={6}
                value={commMessage}
                onChange={(e) => setCommMessage(e.target.value)}
                placeholder={`Enter ${commTab.toUpperCase()} message...`}
                className="text-xs"
              />
            </div>
          </div>

          <SheetFooter className="flex-row justify-end gap-2 border-t border-border p-3.5">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCommDrawerOpen(false)}
            >
              Close
            </Button>
            <Button
              type="button"
              onClick={() =>
                runBulkOrSingleApi(
                  {
                    action: commTab,
                    subject: commSubject,
                    message: commMessage,
                  },
                  () => setCommDrawerOpen(false)
                )
              }
              className={`text-white ${
                commTab === "whatsapp"
                  ? "bg-[#0ab39c] hover:bg-[#099885]"
                  : "bg-[#405189] hover:bg-[#364574]"
              }`}
            >
              Send {commTab === "email" ? "Now" : commTab.toUpperCase()}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* ==================== 4. SHADCN SHEET: CHANGE STAGE ==================== */}
      <Sheet open={stageDrawerOpen} onOpenChange={setStageDrawerOpen}>
        <SheetContent side="right" className="flex w-full max-w-md flex-col p-0">
          <SheetHeader className="border-b border-border px-4 py-3.5">
            <SheetTitle className="text-sm font-semibold">
              Change Lead Stage ({targetLeadIds.length} lead
              {targetLeadIds.length > 1 ? "s" : ""})
            </SheetTitle>
            <SheetDescription className="text-xs">
              Update lead status, sub-stage, follow-up date, and stage note.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 space-y-3.5 overflow-y-auto p-4 text-xs">
            <div>
              <Label className="mb-1 block text-xs">Lead Status</Label>
              <select
                value={stageStatusId}
                onChange={(e) => {
                  setStageStatusId(e.target.value)
                  setStageSubStatusId("")
                }}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
              >
                <option value="">Select Status</option>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {initialMaster.statuses.map((s: any) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label className="mb-1 block text-xs">Lead Sub Stage</Label>
              <select
                value={stageSubStatusId}
                onChange={(e) => setStageSubStatusId(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
              >
                <option value="">Select Sub Stage</option>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {stageSubStatuses.map((ss: any) => (
                  <option key={ss.id} value={ss.id}>
                    {ss.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label className="mb-1 block text-xs">Followup Date</Label>
              <Input
                type="datetime-local"
                value={stageFollowup}
                onChange={(e) => setStageFollowup(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div>
              <Label className="mb-1 block text-xs">Note</Label>
              <Textarea
                rows={3}
                maxLength={1024}
                value={stageNote}
                onChange={(e) => setStageNote(e.target.value)}
                className="text-xs"
              />
              <span className="text-[11px] text-muted-foreground">
                Only 1024 characters allowed.
              </span>
            </div>
          </div>

          <SheetFooter className="flex-row justify-end gap-2 border-t border-border p-3.5">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStageDrawerOpen(false)}
            >
              Close
            </Button>
            <Button
              type="button"
              onClick={() =>
                runBulkOrSingleApi(
                  {
                    action: "stage",
                    lead_status_id: stageStatusId,
                    lead_sub_status_id: stageSubStatusId,
                    followup_date: stageFollowup,
                    stage_note: stageNote,
                  },
                  () => setStageDrawerOpen(false)
                )
              }
              className="bg-[#405189] text-white hover:bg-[#364574]"
            >
              Save Stage
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* ==================== 5. SHADCN SHEET: ADD EVENT ==================== */}
      <Sheet open={eventDrawerOpen} onOpenChange={setEventDrawerOpen}>
        <SheetContent side="right" className="flex w-full max-w-md flex-col p-0">
          <SheetHeader className="border-b border-border px-4 py-3.5">
            <SheetTitle className="text-sm font-semibold">
              Events - Follow-up
            </SheetTitle>
            <SheetDescription className="text-xs">
              Schedule a phone call, video session, or campus visit.
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 space-y-3 overflow-y-auto p-4 text-xs">
            <div>
              <Label className="mb-1 block text-xs">Subject *</Label>
              <Input
                type="text"
                value={eventForm.subject}
                onChange={(e) =>
                  setEventForm({ ...eventForm, subject: e.target.value })
                }
                className="h-9 text-xs"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="mb-1 block text-xs">From *</Label>
                <Input
                  type="datetime-local"
                  value={eventForm.start_at}
                  onChange={(e) =>
                    setEventForm({ ...eventForm, start_at: e.target.value })
                  }
                  className="h-9 text-xs"
                />
              </div>
              <div>
                <Label className="mb-1 block text-xs">To</Label>
                <Input
                  type="datetime-local"
                  value={eventForm.end_at}
                  onChange={(e) =>
                    setEventForm({ ...eventForm, end_at: e.target.value })
                  }
                  className="h-9 text-xs"
                />
              </div>
            </div>
            <div>
              <Label className="mb-1 block text-xs">Event Type *</Label>
              <select
                value={eventForm.event_type}
                onChange={(e) =>
                  setEventForm({ ...eventForm, event_type: e.target.value })
                }
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
              >
                <option value="phone_call">Phone Call</option>
                <option value="video_call">Video Call</option>
                <option value="meeting">Meeting</option>
                <option value="lunch">Lunch</option>
              </select>
            </div>
            <div>
              <Label className="mb-1 block text-xs">Owner</Label>
              <select
                value={eventForm.owner_id}
                onChange={(e) =>
                  setEventForm({ ...eventForm, owner_id: e.target.value })
                }
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
              >
                <option value="">Current User</option>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {initialMaster.users.map((u: any) => (
                  <option key={u.id} value={u.id}>
                    {u.first_name} {u.last_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label className="mb-1 block text-xs">Description</Label>
              <Textarea
                rows={4}
                value={eventForm.description}
                onChange={(e) =>
                  setEventForm({ ...eventForm, description: e.target.value })
                }
                className="text-xs"
              />
            </div>
          </div>
          <SheetFooter className="flex-row justify-end gap-2 border-t border-border p-3.5">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEventDrawerOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() =>
                runBulkOrSingleApi(
                  { action: "event", ...eventForm },
                  () => setEventDrawerOpen(false)
                )
              }
              className="bg-[#405189] text-white hover:bg-[#364574]"
            >
              Submit
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* ==================== 6. SHADCN DIALOG: REASSIGN ==================== */}
      <Dialog open={reassignModalOpen} onOpenChange={setReassignModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">
              Re-assign Leads ({targetLeadIds.length})
            </DialogTitle>
            <DialogDescription className="text-xs">
              Transfer ownership of selected leads to an admissions counsellor.
            </DialogDescription>
          </DialogHeader>
          <div className="text-xs">
            <Label className="mb-1.5 block text-xs">Re-assigned to *</Label>
            <select
              value={reassignUserId}
              onChange={(e) => setReassignUserId(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
            >
              <option value="">Select counsellor</option>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {initialMaster.users.map((u: any) => (
                <option key={u.id} value={u.id}>
                  {u.first_name} {u.last_name} ({u.email})
                </option>
              ))}
            </select>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setReassignModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() =>
                runBulkOrSingleApi(
                  { action: "reassign", reassign_to: reassignUserId },
                  () => setReassignModalOpen(false)
                )
              }
              className="bg-[#405189] text-white hover:bg-[#364574]"
            >
              Reassign Leads
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==================== 7. SHADCN DIALOG: ADD NOTE ==================== */}
      <Dialog open={noteModalOpen} onOpenChange={setNoteModalOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleAddSingleNote} className="space-y-4">
            <DialogHeader>
              <DialogTitle className="text-sm font-semibold">
                Add Lead Note
              </DialogTitle>
              <DialogDescription className="text-xs">
                Log internal counselling remarks on this student&apos;s timeline.
              </DialogDescription>
            </DialogHeader>
            <Textarea
              rows={4}
              required
              placeholder="Write counselling notes..."
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              className="text-xs"
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setNoteModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-[#405189] text-white hover:bg-[#364574]"
              >
                Save Note
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ==================== 8. SHADCN DIALOG: MOVE TO PIPELINE ==================== */}
      <Dialog open={pipelineModalOpen} onOpenChange={setPipelineModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">
              Move {targetLeadIds.length} Lead(s) to Pipeline
            </DialogTitle>
            <DialogDescription className="text-xs">
              Leads will be placed into the initial stage of the target pipeline.
            </DialogDescription>
          </DialogHeader>
          <select
            value={movePipelineId}
            onChange={(e) => setMovePipelineId(e.target.value)}
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
          >
            <option value="">Select Pipeline</option>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {initialMaster.pipelines.map((p: any) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setPipelineModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() =>
                runBulkOrSingleApi(
                  { action: "pipeline", pipeline_id: movePipelineId },
                  () => setPipelineModalOpen(false)
                )
              }
              className="bg-[#405189] text-white hover:bg-[#364574]"
            >
              Move Leads
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==================== 9. SHADCN DIALOG: BULK DATA UPDATE ==================== */}
      <Dialog open={dataUpdateModalOpen} onOpenChange={setDataUpdateModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">
              Bulk Data Update ({targetLeadIds.length} leads)
            </DialogTitle>
            <DialogDescription className="text-xs">
              Batch-update academic institute, program, course, or state.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2.5 text-xs">
            <select
              value={bulkDataForm.institute_id}
              onChange={(e) =>
                setBulkDataForm({
                  ...bulkDataForm,
                  institute_id: e.target.value,
                })
              }
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
            >
              <option value="">Select Institute</option>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {initialMaster.institutes.map((i: any) => (
                <option key={i.id} value={i.id}>
                  {i.name}
                </option>
              ))}
            </select>
            <select
              value={bulkDataForm.programme_id}
              onChange={(e) =>
                setBulkDataForm({
                  ...bulkDataForm,
                  programme_id: e.target.value,
                })
              }
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
            >
              <option value="">Select Program</option>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {initialMaster.programs.map((p: any) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <select
              value={bulkDataForm.course_id}
              onChange={(e) =>
                setBulkDataForm({
                  ...bulkDataForm,
                  course_id: e.target.value,
                })
              }
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
            >
              <option value="">Select Course</option>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {initialMaster.courses.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <select
              value={bulkDataForm.state_id}
              onChange={(e) =>
                setBulkDataForm({ ...bulkDataForm, state_id: e.target.value })
              }
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
            >
              <option value="">Select State</option>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {initialMaster.states.map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDataUpdateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() =>
                runBulkOrSingleApi(
                  { action: "data_update", ...bulkDataForm },
                  () => setDataUpdateModalOpen(false)
                )
              }
              className="bg-[#405189] text-white hover:bg-[#364574]"
            >
              Update Leads
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==================== 10. SHADCN DIALOG: FACEBOOK / GOOGLE AUDIENCE ==================== */}
      <Dialog
        open={Boolean(audienceModal)}
        onOpenChange={(open) => !open && setAudienceModal(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">
              Send {targetLeadIds.length} Leads to{" "}
              {audienceModal === "facebook"
                ? "Facebook Audience"
                : "Google Ads Audience"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Selected leads will be synced as hashed Customer Match audience.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 text-xs">
            <Label className="block text-xs">Audience Name</Label>
            <Input
              type="text"
              value={audienceName}
              onChange={(e) => setAudienceName(e.target.value)}
              placeholder="e.g. CRM Remarketing Oct 2026"
              className="h-9 text-xs"
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setAudienceModal(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() =>
                audienceModal &&
                runBulkOrSingleApi(
                  { action: audienceModal, audience_name: audienceName },
                  () => setAudienceModal(null)
                )
              }
              className="bg-[#0ab39c] text-white hover:bg-[#099885]"
            >
              Sync Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==================== 11. SHADCN ALERT DIALOG: DELETE CONFIRMATION ==================== */}
      <AlertDialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {targetLeadIds.length} lead(s)?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Deleting leads will permanently remove them and their associated
              history from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                runBulkOrSingleApi({ action: "delete" }, () =>
                  setDeleteModalOpen(false)
                )
              }
              className="bg-[#f06548] text-white hover:bg-[#f06548]/90"
            >
              Yes, Delete It!
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ==================== 12. SHADCN DIALOG: CHOOSE COLUMNS ==================== */}
      <Dialog open={columnModalOpen} onOpenChange={setColumnModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">
              Choose Table Columns
            </DialogTitle>
            <DialogDescription className="text-xs">
              Select which columns appear in your Leads Manager table.
            </DialogDescription>
          </DialogHeader>
          <div className="grid max-h-[340px] grid-cols-2 gap-2.5 overflow-y-auto text-xs sm:grid-cols-3">
            {ALL_COLUMN_DEFS.map((col) => (
              <label
                key={col.key}
                className="flex cursor-pointer items-center gap-2 rounded-md border border-border p-2 hover:bg-muted/40"
              >
                <Checkbox
                  checked={selectedColumns.includes(col.key)}
                  onCheckedChange={(checked) => {
                    setSelectedColumns((prev) =>
                      checked
                        ? [...prev, col.key]
                        : prev.filter((k) => k !== col.key)
                    )
                  }}
                />
                <span>{col.label}</span>
              </label>
            ))}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setColumnModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSaveColumns}
              className="bg-[#405189] text-white hover:bg-[#364574]"
            >
              Save Columns
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==================== 13. SHADCN DIALOG: DUPLICATE LEADS ==================== */}
      <Dialog
        open={Boolean(dupModalLead)}
        onOpenChange={(open) => !open && setDupModalLead(null)}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">
              Duplicates for {dupModalLead?.mobile}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Other lead inquiries sharing the same student contact number.
            </DialogDescription>
          </DialogHeader>
          <Table className="text-xs">
            <TableHeader className="bg-muted/60">
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Campaign</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dupModalLead?.duplicates.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-semibold">
                    <Link
                      href={`/leads/${d.id}`}
                      onClick={() => setDupModalLead(null)}
                      className="text-[#405189] hover:underline"
                    >
                      {d.name}
                    </Link>
                  </TableCell>
                  <TableCell>{d.email}</TableCell>
                  <TableCell>{d.campaign_name}</TableCell>
                  <TableCell>{d.stage_name}</TableCell>
                  <TableCell>{formatDateTime(d.created_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>

      {/* ==================== 14. SHADCN DIALOG: UPLOAD PRIMARY KEY ==================== */}
      <Dialog open={uploadTypeModalOpen} onOpenChange={setUploadTypeModalOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">
              Select Primary Upload Type
            </DialogTitle>
            <DialogDescription className="text-xs">
              Choose the unique key used to detect duplicate rows during CSV upload.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2.5 text-xs">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                checked={uploadPrimaryKey === "email"}
                onChange={() => setUploadPrimaryKey("email")}
                className="accent-[#405189]"
              />
              <span>Email (Unique)</span>
            </label>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                checked={uploadPrimaryKey === "mobile"}
                onChange={() => setUploadPrimaryKey("mobile")}
                className="accent-[#405189]"
              />
              <span>Mobile (Unique)</span>
            </label>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setUploadTypeModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                setUploadTypeModalOpen(false)
                router.push(`/leads/upload?primary_key=${uploadPrimaryKey}`)
              }}
              className="bg-[#405189] text-white hover:bg-[#364574]"
            >
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==================== 15. SHADCN DIALOG: API DOCS & LIVE TESTER ==================== */}
      <Dialog open={apiDocModalOpen} onOpenChange={setApiDocModalOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">
              Lead Capture API Documentation & Live Sandbox
            </DialogTitle>
            <DialogDescription className="text-xs">
              Push real-time leads into LMS CRM from websites, portals, or webhooks.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-xs">
            <div className="rounded-md bg-slate-900 p-3 font-mono text-[11px] text-emerald-400">
              <div>POST /api/leads/add</div>
              <div className="mt-1 text-slate-300">
                {`{ "name": "Student Name", "mobile": "9810012345", "email": "student@mail.com", "organization_id": 1 }`}
              </div>
            </div>
            <form
              onSubmit={handleTestPublicApi}
              className="rounded-md border border-border p-3 space-y-2.5"
            >
              <div className="font-semibold text-[#405189]">
                Quick Test Live Endpoint
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="text"
                  required
                  value={apiTestName}
                  onChange={(e) => setApiTestName(e.target.value)}
                  placeholder="Test Name"
                  className="h-8 text-xs"
                />
                <Input
                  type="text"
                  required
                  value={apiTestMobile}
                  onChange={(e) => setApiTestMobile(e.target.value)}
                  placeholder="Test Mobile"
                  className="h-8 text-xs"
                />
              </div>
              <Button
                type="submit"
                size="sm"
                className="bg-[#0ab39c] text-white hover:bg-[#099885]"
              >
                Send Test API Lead
              </Button>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
