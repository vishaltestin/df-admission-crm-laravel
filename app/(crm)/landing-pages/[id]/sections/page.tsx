"use client"

import * as React from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { toast } from "sonner"
import { BreadcrumbBar } from "@/components/crm/breadcrumb-bar"
import { useConfirmDelete } from "@/components/ui/confirm-delete-dialog"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { DataTable, type ColumnDef } from "@/components/ui/data-table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { FormSelect } from "@/components/ui/form-select"

const VELZON_PRESETS: Record<string, object> = {
  hero: {
    title: "The better way to manage your admissions with Velzon",
    subtitle:
      "Fully responsive, multipurpose admissions & student engagement landing portal.",
    primary_btn: { text: "Get Started", url: "#contact" },
    secondary_btn: { text: "View Plans", url: "#plans" },
  },
  trusted: {
    heading: "Trusted by leading universities & employers",
    logos: ["Amazon", "Walmart", "Lenovo", "PayPal", "Shopify", "Verizon"],
  },
  services: {
    title: "Modern Campus & Digital Learning Services",
    subtitle: "Industry-aligned curriculum and student support ecosystem.",
    items: [
      {
        icon: "ri-pencil-ruler-2-line",
        title: "Creative Curriculum",
        description: "Outcome-driven academic syllabus.",
      },
      {
        icon: "ri-lightbulb-flash-line",
        title: "Innovation Labs",
        description: "Hands-on AI, Robotics & Cloud labs.",
      },
      {
        icon: "ri-customer-service-line",
        title: "24/7 Student Desk",
        description: "Dedicated academic & career mentorship.",
      },
    ],
  },
  features_top: {
    title: "Comprehensive Academic Ecosystem",
    description: "Everything students need from admission to placement.",
    stats: [
      { value: "4+", label: "Faculties" },
      { value: "50+", label: "Programs" },
      { value: "96%", label: "Placements" },
    ],
  },
  cta: {
    title: "Start Your Admission Application Today",
    cta_text: "Apply Now",
    cta_url: "#contact",
  },
  features_bottom: {
    eyebrow: "Structure",
    title: "NAAC Accredited & Well Documented",
    description: "Seamless credit transfer and global immersion tracks.",
    bullets: [
      "Merit Scholarships up to 50%",
      "Industry Capstone Internships",
      "Dedicated Placement Cell",
    ],
  },
  plans: {
    title: "Choose the Scholarship / Fee Plan",
    subtitle: "Transparent semester and annual fee options.",
    plans: [
      {
        name: "Standard Track",
        tag: "Semester Wise",
        icon: "ri-book-mark-line",
        currency_symbol: "₹",
        monthly: 45000,
        annual: 85000,
        features: ["Core Coursework", "Digital Library", "Campus Wi-Fi"],
      },
      {
        name: "Honors + Internship",
        tag: "Most Popular",
        icon: "ri-medal-fill",
        currency_symbol: "₹",
        monthly: 65000,
        annual: 120000,
        features: [
          "Dual Specialization",
          "Guaranteed Internship",
          "1-on-1 Career Coach",
        ],
      },
    ],
  },
  faqs: {
    title: "Frequently Asked Questions",
    subtitle: "Find answers to common admission queries",
    left: [
      {
        q: "What is the eligibility criteria?",
        a: "Minimum 50% aggregate in 10+2 or graduation depending on program.",
      },
      {
        q: "How can I apply for merit scholarships?",
        a: "Apply online and enter your scholarship coupon code during checkout.",
      },
    ],
    right: [
      {
        q: "Is hostel accommodation available?",
        a: "Yes, AC and Non-AC campus hostels are available for boys and girls.",
      },
      {
        q: "Are education loans supported?",
        a: "Yes, our finance desk provides complete loan documentation support.",
      },
    ],
  },
  reviews: {
    headline: "19k+ Satisfied Alumni & Students",
    slides: [
      {
        text: "Outstanding faculty and placement preparation!",
        author: "Aarav Sharma",
        meta: "MBA Batch",
      },
      {
        text: "Labs and industry projects helped me land my dream offer.",
        author: "Riya Das",
        meta: "B.Tech CSE",
      },
    ],
  },
  counter: {
    counters: [
      { target: 100, suffix: "+", label: "Recruiters" },
      { target: 24, suffix: "", label: "Awards Won" },
      { target: 20.3, suffix: "k", label: "Alumni Network" },
      { target: 50, suffix: "+", label: "Programs" },
    ],
  },
  work_process: {
    title: "Simple 3-Step Admission Process",
    subtitle: "Fast-track online verification & seat allotment",
    steps: [
      {
        icon: "ri-quill-pen-line",
        title: "1. Submit Online Inquiry",
        desc: "Register your profile & preferred course",
      },
      {
        icon: "ri-user-follow-line",
        title: "2. Counselling & Eligibility",
        desc: "1-on-1 session with admissions advisor",
      },
      {
        icon: "ri-book-mark-line",
        title: "3. Seat Confirmation",
        desc: "Complete fee payment & document verification",
      },
    ],
  },
  team: {
    title: "Academic Leadership",
    subtitle: "Meet our deans & admissions heads",
    members: [
      { name: "Dr. Nancy Martino", role: "Dean of Academics" },
      { name: "Prof. Henry Baird", role: "Head of Engineering" },
      { name: "Dr. Frank Hook", role: "Director of Placements" },
      { name: "Donald Palmer", role: "Chief Admissions Officer" },
    ],
  },
  contact: {
    title: "Get In Touch",
    subtitle: "Our admissions counsellors respond within 30 minutes",
    addresses: ["Panikhaiti, Chandrapur, Guwahati, Assam 781026"],
    submit_text: "Send Inquiry",
  },
  footer: {
    desc: "Premier NAAC Accredited University & Admissions CRM Portal",
    links_column: [
      {
        title: "University",
        items: [
          { label: "About Us", url: "#" },
          { label: "Programs", url: "#services" },
          { label: "Placements", url: "#reviews" },
        ],
      },
    ],
  },
}

export default function LandingPageSectionsBuilder() {
  const params = useParams<{ id: string }>()
  const { confirmDelete, DeleteDialog } = useConfirmDelete()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [page, setPage] = React.useState<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [sections, setSections] = React.useState<any[]>([])
  const [sectionKey, setSectionKey] = React.useState("hero")
  const [sortOrder, setSortOrder] = React.useState("1")
  const [contentJson, setContentJson] = React.useState(
    JSON.stringify(VELZON_PRESETS.hero, null, 2)
  )

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [editSec, setEditSec] = React.useState<any>(null)
  const [editJson, setEditJson] = React.useState("")
  const [editSort, setEditSort] = React.useState("1")

  const load = React.useCallback(() => {
    fetch(
      `/api/crm-resources?resource=landing_page_sections&page_id=${params.id}`
    )
      .then((r) => r.json())
      .then((d) => {
        setPage(d.page)
        setSections(d.sections || [])
        setSortOrder(String((d.sections || []).length + 1))
      })
  }, [params.id])

  React.useEffect(() => {
    load()
  }, [load])

  async function moveSection(idx: number, dir: -1 | 1) {
    const target = idx + dir
    if (target < 0 || target >= sections.length) return
    const copy = [...sections]
    const [moved] = copy.splice(idx, 1)
    copy.splice(target, 0, moved)
    setSections(copy)
    await fetch("/api/crm-resources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        resource: "landing_page_sections",
        action: "reorder",
        ordered_ids: copy.map((s) => s.id),
      }),
    })
    toast.success("Section order saved!")
    load()
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const columns = React.useMemo<ColumnDef<any>[]>(
    () => [
      {
        accessorFn: (s) => Number(s.sort_order ?? 0),
        id: "sort_order",
        header: "Order",
        cell: ({ row }) => {
          const idx = sections.findIndex((x) => x.id === row.original.id)
          return (
            <div className="flex items-center gap-1">
              <span className="w-5 font-mono font-bold">
                {row.original.sort_order}
              </span>
              <Button
                size="xs"
                variant="outline"
                onClick={() => moveSection(idx, -1)}
                disabled={idx <= 0}
              >
                ↑
              </Button>
              <Button
                size="xs"
                variant="outline"
                onClick={() => moveSection(idx, 1)}
                disabled={idx < 0 || idx >= sections.length - 1}
              >
                ↓
              </Button>
            </div>
          )
        },
      },
      {
        accessorKey: "section_key",
        header: "Section Key",
        cell: ({ row }) => (
          <span className="font-mono font-semibold uppercase text-[#405189]">
            {row.original.section_key}
          </span>
        ),
      },
      {
        accessorFn: (s) => s.content_json || "",
        id: "content_json",
        header: "JSON Content",
        cell: ({ row }) => (
          <pre className="max-h-24 max-w-md overflow-auto rounded bg-muted/60 p-2 font-mono text-[10px]">
            {row.original.content_json}
          </pre>
        ),
      },
      {
        id: "actions",
        header: () => <div className="text-right">Action</div>,
        enableSorting: false,
        cell: ({ row }) => {
          const s = row.original
          return (
            <div className="flex justify-end gap-1.5 whitespace-nowrap">
              <Button
                size="xs"
                onClick={() => {
                  setEditSec(s)
                  setEditSort(String(s.sort_order ?? 1))
                  try {
                    setEditJson(
                      JSON.stringify(JSON.parse(s.content_json || "{}"), null, 2)
                    )
                  } catch {
                    setEditJson(s.content_json || "{}")
                  }
                }}
                className="bg-amber-500 text-[11px] text-white hover:bg-amber-600"
              >
                Edit JSON
              </Button>
              <Button
                size="xs"
                variant="destructive"
                onClick={() =>
                  confirmDelete({
                    title: "Delete Landing Page Section?",
                    description: `Are you sure you want to delete the "${s.section_key || "section"}" block from this landing page?`,
                    onConfirm: async () => {
                      await fetch("/api/crm-resources", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          resource: "landing_page_sections",
                          action: "delete",
                          id: s.id,
                        }),
                      })
                      toast.success("Section removed")
                      load()
                    },
                  })
                }
                className="text-[11px]"
              >
                Delete
              </Button>
            </div>
          )
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sections, load, confirmDelete]
  )

  return (
    <div>
      <BreadcrumbBar
        parent="Landing Pages"
        title={`Manage Sections — ${page?.title || `Page #${params.id}`}`}
      />

      <div className="grid grid-cols-1 gap-5 text-xs lg:grid-cols-12">
        <Card className="h-fit space-y-3 p-5 shadow-xs lg:col-span-4">
          <h4 className="border-b border-border pb-2 text-sm font-bold">
            Add Velzon Section Block
          </h4>
          <div>
            <Label className="mb-1 block text-xs">
              Section Key (14 Velzon Blocks)
            </Label>
            <FormSelect
              value={sectionKey}
              onChange={(e) => {
                const k = e.target.value
                setSectionKey(k)
                setContentJson(
                  JSON.stringify(VELZON_PRESETS[k] || {}, null, 2)
                )
              }}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
            >
              {Object.keys(VELZON_PRESETS).map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </FormSelect>
          </div>
          <div>
            <Label className="mb-1 block text-xs">Sort Order</Label>
            <Input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="h-9 text-xs"
            />
          </div>
          <div>
            <Label className="mb-1 block text-xs">Section JSON</Label>
            <Textarea
              rows={9}
              value={contentJson}
              onChange={(e) => setContentJson(e.target.value)}
              className="font-mono text-[11px]"
            />
          </div>
          <Button
            onClick={async () => {
              try {
                JSON.parse(contentJson)
              } catch {
                toast.error("Invalid JSON format!")
                return
              }
              const res = await fetch("/api/crm-resources", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  resource: "landing_page_sections",
                  action: "create",
                  page_id: params.id,
                  section_key: sectionKey,
                  sort_order: sortOrder,
                  content_json: contentJson,
                }),
              })
              if (res.ok) {
                toast.success("Section added to landing page!")
                load()
              }
            }}
            className="w-full bg-[#0ab39c] font-semibold text-white hover:bg-[#099885]"
          >
            + Add Section
          </Button>
        </Card>

        <Card className="gap-0 py-0 shadow-xs lg:col-span-8">
          <DataTable
            title={`Ordered Sections (${sections.length})`}
            columns={columns}
            data={sections}
            searchPlaceholder="Search sections..."
            emptyMessage="No sections added yet."
            toolbarRight={
              <div className="flex gap-2">
                <Button asChild size="xs" variant="outline">
                  <Link href="/landing-pages">← All Pages</Link>
                </Button>
                {page?.slug && (
                  <Button
                    asChild
                    size="xs"
                    className="bg-[#405189] text-[11px] font-semibold text-white hover:bg-[#364574]"
                  >
                    <Link href={`/lp/${page.slug}`} target="_blank">
                      Preview Live Page ↗
                    </Link>
                  </Button>
                )}
              </div>
            }
          />
        </Card>
      </div>

      <Dialog open={Boolean(editSec)} onOpenChange={(o) => !o && setEditSec(null)}>
        <DialogContent className="text-xs sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold">
              Edit Section — {editSec?.section_key}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Modify JSON content and display order for this Velzon section block.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="mb-1 block text-xs">Sort Order</Label>
              <Input
                type="number"
                value={editSort}
                onChange={(e) => setEditSort(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
            <div>
              <Label className="mb-1 block text-xs">Content JSON</Label>
              <Textarea
                rows={12}
                value={editJson}
                onChange={(e) => setEditJson(e.target.value)}
                className="font-mono text-[11px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditSec(null)}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                try {
                  JSON.parse(editJson)
                } catch {
                  toast.error("Invalid JSON syntax")
                  return
                }
                const res = await fetch("/api/crm-resources", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    resource: "landing_page_sections",
                    action: "update",
                    id: editSec.id,
                    sort_order: editSort,
                    content_json: editJson,
                  }),
                })
                if (res.ok) {
                  toast.success("Section updated!")
                  setEditSec(null)
                  load()
                }
              }}
              className="bg-[#0ab39c] text-white hover:bg-[#099885]"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {DeleteDialog}
    </div>
  )
}
