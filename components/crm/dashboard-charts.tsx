"use client"

import * as React from "react"
import Link from "next/link"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DataTable, type ColumnDef } from "@/components/ui/data-table"

const COLORS = [
  "#405189",
  "#0ab39c",
  "#299cdb",
  "#f7b84b",
  "#f06548",
  "#8b5cf6",
  "#ec4899",
]

export interface DashboardChartProps {
  dealData: Array<{ name: string; value: number }>
  funnelData: Array<{ stage: string; count: number }>
  sourceData: Array<{ name: string; leads: number }>
  teamData: Array<{ name: string; leads: number; paid: number }>
  monthlyRevenue: number
}

export function DashboardCharts({
  dealData,
  funnelData,
  sourceData,
  teamData,
  monthlyRevenue,
}: DashboardChartProps) {
  const forecastSeries = [
    { month: "Jun", revenue: Math.round(monthlyRevenue * 0.55), target: Math.round(monthlyRevenue * 0.65) },
    { month: "Jul", revenue: Math.round(monthlyRevenue * 0.72), target: Math.round(monthlyRevenue * 0.75) },
    { month: "Aug", revenue: Math.round(monthlyRevenue * 0.84), target: Math.round(monthlyRevenue * 0.85) },
    { month: "Sep", revenue: Math.round(monthlyRevenue * 0.91), target: Math.round(monthlyRevenue * 0.95) },
    { month: "Oct", revenue: Math.max(monthlyRevenue, 12500), target: Math.max(Math.round(monthlyRevenue * 1.15), 15000) },
  ]

  return (
    <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-12">
      {/* Sales Forecast */}
      <Card className="gap-0 py-0 shadow-xs xl:col-span-6">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h4 className="text-[15px] font-semibold">Sales Forecast</h4>
          <Badge className="bg-[#0ab39c]/10 text-xs font-medium text-[#0ab39c] hover:bg-[#0ab39c]/20">
            2026 Intake
          </Badge>
        </div>
        <div className="h-[300px] p-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={forecastSeries}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
              <XAxis dataKey="month" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Legend />
              <Bar dataKey="revenue" name="Actual Revenue (₹)" fill="#405189" radius={[4, 4, 0, 0]} />
              <Bar dataKey="target" name="Forecast Target (₹)" fill="#0ab39c" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Deal Type Donut */}
      <Card className="gap-0 py-0 shadow-xs xl:col-span-3">
        <div className="border-b border-border px-4 py-3">
          <h4 className="text-[15px] font-semibold">Deal Type</h4>
        </div>
        <div className="h-[300px] p-4">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={dealData}
                dataKey="value"
                nameKey="name"
                innerRadius={55}
                outerRadius={88}
                paddingAngle={3}
              >
                {dealData.map((_, idx) => (
                  <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Admission Funnel */}
      <Card className="gap-0 py-0 shadow-xs xl:col-span-3">
        <div className="border-b border-border px-4 py-3">
          <h4 className="text-[15px] font-semibold">Admission Funnel</h4>
        </div>
        <div className="h-[300px] p-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={funnelData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
              <XAxis type="number" fontSize={12} />
              <YAxis dataKey="stage" type="category" width={85} fontSize={11} />
              <Tooltip />
              <Bar dataKey="count" name="Students" fill="#299cdb" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Team Performance */}
      <Card className="gap-0 py-0 shadow-xs xl:col-span-4">
        <div className="border-b border-border px-4 py-3">
          <h4 className="text-[15px] font-semibold">Team Performance</h4>
        </div>
        <div className="h-[300px] p-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={teamData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
              <XAxis dataKey="name" fontSize={11} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Legend />
              <Bar dataKey="leads" name="Assigned Leads" fill="#405189" radius={[4, 4, 0, 0]} />
              <Bar dataKey="paid" name="Paid Applications" fill="#0ab39c" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Lead Source Performance (Pie) */}
      <Card className="gap-0 py-0 shadow-xs xl:col-span-4">
        <div className="border-b border-border px-4 py-3">
          <h4 className="text-[15px] font-semibold">Lead Source Distribution</h4>
        </div>
        <div className="h-[300px] p-4">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={sourceData}
                dataKey="leads"
                nameKey="name"
                outerRadius={88}
              >
                {sourceData.map((_, idx) => (
                  <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Lead Source Performance (Bar) */}
      <Card className="gap-0 py-0 shadow-xs xl:col-span-4">
        <div className="border-b border-border px-4 py-3">
          <h4 className="text-[15px] font-semibold">Lead Source Performance</h4>
        </div>
        <div className="h-[300px] p-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sourceData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
              <XAxis dataKey="name" fontSize={10} interval={0} angle={-18} textAnchor="end" height={50} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Bar dataKey="leads" name="Total Leads" fill="#405189" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Balance Overview */}
      <Card className="gap-0 py-0 shadow-xs xl:col-span-12">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border px-4 py-3">
          <h4 className="text-[15px] font-semibold">Balance Overview</h4>
          <div className="flex flex-wrap items-center gap-6 text-sm">
            <div>
              <span className="font-bold text-[#405189]">
                ₹{monthlyRevenue.toLocaleString("en-IN")}
              </span>{" "}
              <span className="text-xs text-muted-foreground">
                Revenue (This Month)
              </span>
            </div>
            <div className="border-l border-border pl-6">
              <span className="font-bold">₹0</span>{" "}
              <span className="text-xs text-muted-foreground">Expenses</span>
            </div>
            <div className="border-l border-border pl-6">
              <span className="font-bold text-[#0ab39c]">
                {monthlyRevenue > 0 ? "100%" : "0%"}
              </span>{" "}
              <span className="text-xs text-muted-foreground">
                Profit Ratio
              </span>
            </div>
          </div>
        </div>
        <div className="h-[260px] p-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={forecastSeries}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
              <XAxis dataKey="month" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="revenue"
                name="Revenue (₹)"
                stroke="#0ab39c"
                fill="#0ab39c"
                fillOpacity={0.2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  )
}

export interface RecentLeadItem {
  id: string
  name: string
  mobile: string
  email: string
  lead_score: number
  owner: string | null
}

export function DashboardRecentLeadsTable({
  leads,
}: {
  leads: RecentLeadItem[]
}) {
  const columns = React.useMemo<ColumnDef<RecentLeadItem>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => (
          <Link
            href={`/leads/${row.original.id}`}
            className="font-semibold text-[#405189] hover:underline"
          >
            {row.original.name}
          </Link>
        ),
      },
      {
        accessorKey: "mobile",
        header: "Mobile",
        cell: ({ row }) => (
          <span className="font-mono">{row.original.mobile}</span>
        ),
      },
      {
        accessorKey: "email",
        header: "Email",
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.email}</span>
        ),
      },
      {
        accessorKey: "lead_score",
        header: "Lead Score",
        cell: ({ row }) => (
          <Badge className="bg-[#0ab39c]/15 font-semibold text-[#0ab39c] hover:bg-[#0ab39c]/20">
            {row.original.lead_score}
          </Badge>
        ),
      },
      {
        accessorFn: (l) => l.owner || "Unassigned",
        id: "owner",
        header: "Owner",
        cell: ({ row }) =>
          row.original.owner ? (
            <span>{row.original.owner}</span>
          ) : (
            <Badge className="bg-[#f7b84b]/20 text-[11px] font-medium text-amber-700 hover:bg-[#f7b84b]/30">
              Unassigned
            </Badge>
          ),
      },
      {
        id: "action",
        header: "Action",
        enableSorting: false,
        cell: ({ row }) => (
          <Link
            href={`/leads/${row.original.id}`}
            className="font-medium text-[#299cdb] hover:underline whitespace-nowrap"
          >
            Open Profile
          </Link>
        ),
      },
    ],
    []
  )

  return (
    <Card className="mt-5 gap-0 py-0 shadow-xs">
      <DataTable
        title="Recent Student Inquiries"
        columns={columns}
        data={leads}
        defaultPageSize={10}
        searchPlaceholder="Search recent inquiries..."
        toolbarRight={
          <Button
            asChild
            variant="secondary"
            size="xs"
            className="bg-[#405189]/10 text-xs font-semibold text-[#405189] hover:bg-[#405189]/20"
          >
            <Link href="/leads">
              View All Leads <i className="ri-arrow-right-line ml-1" />
            </Link>
          </Button>
        }
      />
    </Card>
  )
}

