import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { getOptionalSessionContext } from "@/lib/session"
import { serializeData } from "@/lib/serialize"

export async function GET(req: NextRequest) {
  const ctx = await getOptionalSessionContext()
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const entity = req.nextUrl.searchParams.get("entity") || "users"
  const orgId = ctx.orgId

  if (entity === "users") {
    const [
      users,
      registers,
      roles,
      roleUsers,
      designations,
      organizations,
      teams,
    ] = await Promise.all([
      prisma.users.findMany({ orderBy: { id: "desc" } }),
      prisma.registers.findMany(),
      prisma.roles.findMany({ orderBy: { id: "asc" } }),
      prisma.role_users.findMany(),
      prisma.designation.findMany({ orderBy: { id: "asc" } }),
      prisma.organizations.findMany({ orderBy: { id: "asc" } }),
      prisma.teams.findMany({ orderBy: { id: "asc" } }),
    ])

    const items = users.map((u) => {
      const reg = registers.find((r) => r.user_id === u.id)
      const ru = roleUsers.find((r) => r.user_id === u.id)
      const role = roles.find(
        (r) => r.id === (ru?.role_id ?? (reg?.role ? Number(reg.role) : 0))
      )
      const desig = designations.find(
        (d) => String(d.id) === String(reg?.designation || "")
      )
      const org = organizations.find(
        (o) => String(o.id) === String(reg?.organization || orgId)
      )
      const teamFromReg = teams.find(
        (t) => String(t.id) === String(reg?.team || "")
      )
      const teamFromCsv =
        teamFromReg ||
        teams.find((t) =>
          (t.team_member || "")
            .split(",")
            .map((s) => s.trim())
            .includes(String(u.id))
        )

      return {
        id: u.id,
        name: u.first_name || reg?.first_name || "",
        lname: u.last_name || reg?.last_name || "",
        email: u.email,
        mobile: reg?.mobile || "",
        status: u.status ?? reg?.status ?? 1,
        last_login: u.last_login,
        created_at: u.created_at,
        avatar: reg?.avatar || null,
        role_id: role?.id || null,
        role_name: role?.name || "Operator",
        role_slug: role?.slug || "operater",
        designation_id: reg?.designation || "",
        designation_name: desig?.name || "-",
        organization_id: reg?.organization || String(orgId),
        organization_name: org?.name || "-",
        other_org: reg?.other_org || "",
        team_id: teamFromCsv ? String(teamFromCsv.id) : reg?.team || "",
        team_name: teamFromCsv?.name || "-",
        is_available_for_leads: reg?.is_available_for_leads ?? 1,
      }
    })

    // Normalize designations & teams with `.organization` alias for frontend filtering
    const normalizedDesignations = designations.map((d) => ({
      ...d,
      organization: String(d.organization_id || ""),
    }))
    const normalizedTeams = teams.map((t) => ({
      ...t,
      organization: String(t.organization_id || ""),
      team_head: t.head,
    }))

    return NextResponse.json(
      serializeData({
        items,
        roles,
        designations: normalizedDesignations,
        organizations,
        teams: normalizedTeams,
        currentUserId: ctx.userId,
        currentUserRole: ctx.roleSlug,
      })
    )
  }

  if (entity === "user_detail") {
    const targetId = Number(req.nextUrl.searchParams.get("id") || ctx.userId)
    const user = await prisma.users.findUnique({ where: { id: targetId } })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const [
      reg,
      roles,
      roleUsers,
      designations,
      organizations,
      teams,
      userLogs,
      assignedLeadsCount,
    ] = await Promise.all([
      prisma.registers.findFirst({ where: { user_id: targetId } }),
      prisma.roles.findMany(),
      prisma.role_users.findMany({ where: { user_id: targetId } }),
      prisma.designation.findMany(),
      prisma.organizations.findMany(),
      prisma.teams.findMany(),
      prisma.user_activity_logs.findMany({
        where: { user_id: BigInt(targetId) },
        orderBy: { id: "desc" },
        take: 100,
      }),
      prisma.leads.count({ where: { lead_assign_to: BigInt(targetId) } }),
    ])

    const ru = roleUsers[0]
    const role = roles.find(
      (r) => r.id === (ru?.role_id ?? (reg?.role ? Number(reg.role) : 0))
    )
    const desig = designations.find(
      (d) => String(d.id) === String(reg?.designation || "")
    )
    const userOrgId = Number(reg?.organization || orgId)
    const org = organizations.find((o) => o.id === userOrgId)
    const team =
      teams.find((t) => String(t.id) === String(reg?.team || "")) ||
      teams.find((t) =>
        (t.team_member || "")
          .split(",")
          .map((s) => s.trim())
          .includes(String(targetId))
      )

    const otherOrgIds = (reg?.other_org || "")
      .split(",")
      .map((s) => Number(s.trim()))
      .filter(Boolean)
    const otherOrganizations = organizations.filter((o) =>
      otherOrgIds.includes(o.id)
    )

    const [orgLogs, rawLeadLogs] = await Promise.all([
      prisma.org_activity_logs.findMany({
        where: {
          OR: [
            { user_id: BigInt(targetId) },
            ...(userOrgId ? [{ organization_id: BigInt(userOrgId) }] : []),
          ],
        },
        orderBy: { id: "desc" },
        take: 100,
      }),
      prisma.lead_activity_logs.findMany({
        where: { user_id: BigInt(targetId) },
        orderBy: { id: "desc" },
        take: 100,
      }),
    ])

    const leadIds = Array.from(
      new Set(
        rawLeadLogs
          .map((l) => l.lead_id)
          .filter((n): n is bigint => n !== null && n > BigInt(0))
      )
    )
    const relatedLeads =
      leadIds.length > 0
        ? await prisma.leads.findMany({
            where: { id: { in: leadIds } },
            select: { id: true, name: true, mobile: true, email: true },
          })
        : []

    const leadLogs = rawLeadLogs.map((l) => {
      const ld = relatedLeads.find((r) => Number(r.id) === Number(l.lead_id))
      return {
        ...l,
        lead_name: ld?.name || `Lead #${l.lead_id}`,
        lead_phone: ld?.mobile || null,
      }
    })

    return NextResponse.json(
      serializeData({
        user: {
          id: user.id,
          name: user.first_name || reg?.first_name || "",
          lname: user.last_name || reg?.last_name || "",
          email: user.email,
          mobile: reg?.mobile || "",
          status: user.status ?? reg?.status ?? 1,
          last_login: user.last_login,
          created_at: user.created_at,
          updated_at: user.updated_at,
          avatar: reg?.avatar || null,
          role_id: role?.id || null,
          role_name: role?.name || "Operator",
          role_slug: role?.slug || "operater",
          designation_id: reg?.designation || "",
          designation_name: desig?.name || "-",
          organization_id: String(userOrgId),
          organization_name: org?.name || "-",
          other_org: reg?.other_org || "",
          other_organizations: otherOrganizations,
          team_id: team ? String(team.id) : "",
          team_name: team?.name || "-",
          is_available_for_leads: reg?.is_available_for_leads ?? 1,
        },
        stats: {
          assignedLeads: assignedLeadsCount,
          userLogsCount: userLogs.length,
          orgLogsCount: orgLogs.length,
          leadLogsCount: leadLogs.length,
        },
        userLogs,
        orgLogs,
        leadLogs,
      })
    )
  }

  if (entity === "roles") {
    const rawRoles = await prisma.roles.findMany({ orderBy: { id: "asc" } })
    const items = rawRoles.map((r) => {
      let permissionType = "custom"
      if (["root", "sadmin"].includes(r.slug)) permissionType = "all"
      return {
        ...r,
        permission_type: permissionType,
      }
    })
    return NextResponse.json(serializeData({ items }))
  }

  if (entity === "teams") {
    const [teams, rawUsers, registers, designations, organizations] =
      await Promise.all([
        prisma.teams.findMany({ orderBy: { id: "desc" } }),
        prisma.users.findMany({
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            status: true,
          },
        }),
        prisma.registers.findMany(),
        prisma.designation.findMany(),
        prisma.organizations.findMany({ orderBy: { id: "asc" } }),
      ])

    const users = rawUsers.map((u) => {
      const r = registers.find((x) => x.user_id === u.id)
      return {
        id: u.id,
        name: u.first_name || r?.first_name || "",
        lname: u.last_name || r?.last_name || "",
        email: u.email,
        mobile: r?.mobile || "",
        status: u.status ?? r?.status ?? 1,
      }
    })

    const items = teams.map((t) => {
      const head = users.find((u) => u.id === t.head)
      const headReg = registers.find((r) => r.user_id === t.head)
      const org = organizations.find(
        (o) => o.id === (t.organization_id || orgId)
      )
      const csvIds = (t.team_member || "")
        .split(",")
        .map((s) => Number(s.trim()))
        .filter(Boolean)
      const regIds = registers
        .filter((r) => String(r.team || "") === String(t.id))
        .map((r) => r.user_id)
      const memberIds = Array.from(new Set([...csvIds, ...regIds]))

      const memberDetails = memberIds
        .map((uid) => {
          const u = users.find((x) => x.id === uid)
          if (!u) return null
          const r = registers.find((x) => x.user_id === uid)
          const d = designations.find(
            (x) => String(x.id) === String(r?.designation || "")
          )
          return {
            id: u.id,
            name: `${u.name || ""} ${u.lname || ""}`.trim() || u.email,
            email: u.email,
            mobile: u.mobile,
            status: u.status,
            avatar: r?.avatar || null,
            designation_name: d?.name || "-",
          }
        })
        .filter(Boolean)

      return {
        ...t,
        team_head: t.head,
        organization: String(t.organization_id || orgId),
        organization_id: String(t.organization_id || orgId),
        organization_name: org?.name || "-",
        head_name: head
          ? `${head.name || ""} ${head.lname || ""}`.trim() || head.email
          : "-",
        head_email: head?.email || null,
        head_avatar: headReg?.avatar || null,
        member_ids: memberIds,
        member_count: memberDetails.length,
        member_details: memberDetails,
      }
    })
    return NextResponse.json(serializeData({ items, users, organizations }))
  }

  if (entity === "designations") {
    const [designations, organizations, registers, rawUsers] =
      await Promise.all([
        prisma.designation.findMany({ orderBy: { id: "desc" } }),
        prisma.organizations.findMany({ orderBy: { id: "asc" } }),
        prisma.registers.findMany(),
        prisma.users.findMany({
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            status: true,
          },
        }),
      ])

    const items = designations.map((d) => {
      const org = organizations.find((o) => o.id === d.organization_id)
      const assignedRegs = registers.filter(
        (r) => String(r.designation || "") === String(d.id)
      )
      const assignedUsers = assignedRegs
        .map((r) => {
          const u = rawUsers.find((x) => x.id === r.user_id)
          if (!u) return null
          const fn = u.first_name || r.first_name || ""
          const ln = u.last_name || r.last_name || ""
          return {
            id: u.id,
            name: `${fn} ${ln}`.trim() || u.email,
            email: u.email,
            mobile: r.mobile || "",
            status: u.status ?? r.status ?? 1,
            avatar: r.avatar || null,
          }
        })
        .filter(Boolean)

      return {
        ...d,
        organization: String(d.organization_id || orgId),
        organization_name: org?.name || "Global",
        users_count: assignedUsers.length,
        assigned_users: assignedUsers,
      }
    })
    return NextResponse.json(serializeData({ items, organizations }))
  }

  if (entity === "organizations") {
    const [organizations, registers] = await Promise.all([
      prisma.organizations.findMany({ orderBy: { id: "desc" } }),
      prisma.registers.findMany(),
    ])
    const items = organizations.map((o) => ({
      ...o,
      users_count: registers.filter((r) => {
        const primary = String(r.organization || "") === String(o.id)
        const extra = (r.other_org || "")
          .split(",")
          .map((s) => s.trim())
          .includes(String(o.id))
        return primary || extra
      }).length,
    }))
    return NextResponse.json(serializeData({ items }))
  }

  if (entity === "organization_detail") {
    const id = Number(req.nextUrl.searchParams.get("id") || orgId)
    const org = await prisma.organizations.findUnique({ where: { id } })
    if (!org) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      )
    }

    const [
      teams,
      designations,
      registers,
      users,
      roles,
      roleUsers,
      institutes,
      orgLeads,
      rawOrgLogs,
      userLogsByUser,
    ] = await Promise.all([
      prisma.teams.findMany({
        where: { organization_id: id },
        orderBy: { id: "asc" },
      }),
      prisma.designation.findMany({
        where: { organization_id: id },
        orderBy: { id: "asc" },
      }),
      prisma.registers.findMany(),
      prisma.users.findMany(),
      prisma.roles.findMany(),
      prisma.role_users.findMany(),
      prisma.institutes.findMany({
        where: { organization_id: BigInt(id) },
        orderBy: { id: "asc" },
      }),
      prisma.leads.findMany({
        where: { organization_id: BigInt(id) },
        select: { id: true, lead_assign_to: true },
      }),
      prisma.org_activity_logs.findMany({
        where: { organization_id: BigInt(id) },
        orderBy: { id: "desc" },
        take: 60,
      }),
      prisma.user_activity_logs.groupBy({
        by: ["user_id"],
        _count: { id: true },
      }),
    ])

    const leadsCount = orgLeads.length

    const orgRegs = registers.filter((r) => {
      const primary = String(r.organization || "") === String(id)
      const extra = (r.other_org || "")
        .split(",")
        .map((s) => s.trim())
        .includes(String(id))
      return primary || extra
    })

    const orgUsers = orgRegs
      .map((r) => {
        const u = users.find((x) => x.id === r.user_id)
        if (!u) return null
        const desig = designations.find(
          (d) => String(d.id) === String(r.designation || "")
        )
        const ru = roleUsers.find((x) => x.user_id === u.id)
        const role = roles.find(
          (rl) => rl.id === (ru?.role_id ?? (r.role ? Number(r.role) : 0))
        )
        const tm =
          teams.find((t) => String(t.id) === String(r.team || "")) ||
          teams.find((t) =>
            (t.team_member || "")
              .split(",")
              .map((s) => s.trim())
              .includes(String(u.id))
          )
        const userLeadsCount = orgLeads.filter(
          (ld) => Number(ld.lead_assign_to) === u.id
        ).length
        const actGroup = userLogsByUser.find(
          (ag) => Number(ag.user_id) === u.id
        )

        const fn = u.first_name || r.first_name || ""
        const ln = u.last_name || r.last_name || ""

        return {
          id: u.id,
          name: fn,
          lname: ln,
          full_name: `${fn} ${ln}`.trim() || u.email || `User #${u.id}`,
          email: u.email,
          mobile: r.mobile || "",
          status: u.status ?? r.status ?? 1,
          last_login: u.last_login,
          created_at: u.created_at,
          avatar: r.avatar || null,
          designation_id: r.designation || "",
          designation_name: desig?.name || "Unassigned",
          team_id: tm ? String(tm.id) : "",
          team_name: tm?.name || "-",
          role_name: role?.name || "Operator",
          leads_count: userLeadsCount,
          activities_count: actGroup?._count?.id ?? 0,
        }
      })
      .filter((x): x is NonNullable<typeof x> => Boolean(x))

    const teamData = teams.map((t) => {
      const csvIds = (t.team_member || "")
        .split(",")
        .map((s) => Number(s.trim()))
        .filter(Boolean)
      const teamUsers = orgUsers.filter(
        (u) => csvIds.includes(u.id) || String(u.team_id) === String(t.id)
      )
      const head = users.find((u) => u.id === t.head)
      return {
        id: t.id,
        name: t.name || `Team #${t.id}`,
        status: t.status ?? 1,
        created_at: t.created_at,
        head_id: t.head,
        head_name: head
          ? `${head.first_name || ""} ${head.last_name || ""}`.trim() ||
            head.email
          : "-",
        total_users: teamUsers.length,
        users: teamUsers.slice(0, 3),
        all_users: teamUsers,
        extra_count: Math.max(0, teamUsers.length - 3),
      }
    })

    const designationData = designations.map((d) => {
      const activeUsers = orgUsers.filter(
        (u) =>
          String(u.designation_id) === String(d.id) && Number(u.status) === 1
      )
      const allDesigUsers = orgUsers.filter(
        (u) => String(u.designation_id) === String(d.id)
      )
      return {
        id: d.id,
        name: d.name || `Designation #${d.id}`,
        status: d.status ?? 1,
        created_at: d.created_at,
        total_users: allDesigUsers.length,
        active_users_count: activeUsers.length,
        users: activeUsers.slice(0, 4),
        all_users: allDesigUsers,
        extra_count: Math.max(0, activeUsers.length - 4),
      }
    })

    const designationWiseUsers: Record<string, typeof orgUsers> = {}
    for (const d of designations) {
      const key = d.name || `Designation #${d.id}`
      designationWiseUsers[key] = orgUsers.filter(
        (u) => String(u.designation_id) === String(d.id)
      )
    }
    const unassignedUsers = orgUsers.filter(
      (u) =>
        !u.designation_id ||
        !designations.some((d) => String(d.id) === String(u.designation_id))
    )
    if (unassignedUsers.length > 0) {
      designationWiseUsers["Unassigned"] = unassignedUsers
    }

    const creator = org.created_by
      ? users.find((u) => u.id === org.created_by)
      : undefined

    const latestLoginUser = [...orgUsers]
      .filter((u) => Boolean(u.last_login))
      .sort(
        (a, b) =>
          new Date(b.last_login!).getTime() - new Date(a.last_login!).getTime()
      )[0]

    const activities = rawOrgLogs.map((log) => {
      const actor = users.find((u) => u.id === Number(log.user_id))
      return {
        ...log,
        actor_name: actor
          ? `${actor.first_name || ""} ${actor.last_name || ""}`.trim() ||
            actor.email
          : Number(log.user_id) === 0
            ? "System / Automation"
            : `User #${log.user_id}`,
      }
    })

    return NextResponse.json(
      serializeData({
        organization: {
          ...org,
          creator_name: creator
            ? `${creator.first_name || ""} ${creator.last_name || ""}`.trim() ||
              creator.email
            : orgUsers[0]?.full_name || "-",
          last_login: latestLoginUser?.last_login || creator?.last_login || null,
        },
        teams,
        teamData,
        designations,
        designationData,
        designationWiseUsers,
        institutes,
        leadsCount,
        users: orgUsers,
        activities,
      })
    )
  }

  return NextResponse.json({ error: "Invalid entity" }, { status: 400 })
}

export async function POST(req: NextRequest) {
  const ctx = await getOptionalSessionContext()
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const { entity, action } = body
  const now = new Date()

  // 1. Users + Registers + Role assignment + Team sync + Activity Logs
  if (entity === "users") {
    if (action === "create") {
      const email = String(body.email || "")
        .trim()
        .toLowerCase()
      if (!email) {
        return NextResponse.json(
          { error: "Email is required" },
          { status: 400 }
        )
      }
      const existing = await prisma.users.findFirst({ where: { email } })
      if (existing) {
        return NextResponse.json(
          { error: "A user with this email already exists" },
          { status: 400 }
        )
      }

      const hash = await bcrypt.hash(String(body.password || "User@123"), 10)
      const statusNum = Number(body.status ?? 1)
      const firstName = String(body.name || "").trim()
      const lastName = body.lname ? String(body.lname).trim() : null
      const mobileStr = body.mobile ? String(body.mobile).trim().slice(0, 12) : null
      const primaryOrg = String(body.organization_id || ctx.orgId)
      const otherOrgStr = Array.isArray(body.other_org)
        ? body.other_org.map(String).join(",")
        : body.other_org
          ? String(body.other_org)
          : null

      const selectedRole = body.role_id
        ? await prisma.roles.findUnique({ where: { id: Number(body.role_id) } })
        : null

      const u = await prisma.users.create({
        data: {
          first_name: firstName,
          last_name: lastName,
          email,
          password: hash,
          status: statusNum,
          created_at: now,
          updated_at: now,
        },
      })

      await prisma.registers.create({
        data: {
          user_id: u.id,
          user_type: selectedRole?.slug || "operater",
          first_name: firstName,
          last_name: lastName,
          email: email.slice(0, 50),
          mobile: mobileStr,
          organization: primaryOrg,
          other_org: otherOrgStr,
          designation: body.designation_id ? String(body.designation_id) : null,
          team: body.team_id ? String(body.team_id) : null,
          role: String(body.role_id || 5),
          status: statusNum,
          is_available_for_leads: Number(body.is_available_for_leads ?? 1),
          created_at: now,
          updated_at: now,
        },
      })

      if (body.role_id) {
        await prisma.role_users.create({
          data: {
            user_id: u.id,
            role_id: Number(body.role_id),
            created_at: now,
            updated_at: now,
          },
        })
      }

      if (body.team_id) {
        const team = await prisma.teams.findUnique({
          where: { id: Number(body.team_id) },
        })
        if (team) {
          const members = new Set(
            (team.team_member || "")
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          )
          members.add(String(u.id))
          await prisma.teams.update({
            where: { id: team.id },
            data: { team_member: Array.from(members).join(",") },
          })
        }
      }

      await Promise.all([
        prisma.user_activity_logs.create({
          data: {
            organization_id: BigInt(Number(primaryOrg) || ctx.orgId),
            user_id: BigInt(ctx.userId),
            entity_type: "user",
            entity_id: BigInt(u.id),
            action: "create_user",
            description: `Created user ${firstName} (${email})`,
            created_at: now,
          },
        }),
        prisma.org_activity_logs.create({
          data: {
            organization_id: BigInt(Number(primaryOrg) || ctx.orgId),
            user_id: BigInt(ctx.userId),
            entity_type: "user",
            entity_id: BigInt(u.id),
            action: "create_user",
            description: `User '${email}' created`,
            created_at: now,
          },
        }),
      ])

      return NextResponse.json(serializeData({ ok: true, item: u }))
    }

    if (action === "update" && body.id) {
      const uid = Number(body.id)
      const statusNum = Number(body.status ?? 1)
      const firstName = String(body.name || "").trim()
      const lastName = body.lname ? String(body.lname).trim() : null
      const email = String(body.email || "")
        .trim()
        .toLowerCase()
      const mobileStr = body.mobile ? String(body.mobile).trim().slice(0, 12) : null

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updateData: any = {
        first_name: firstName,
        last_name: lastName,
        email,
        status: statusNum,
        updated_at: now,
      }
      if (body.password && String(body.password).trim().length >= 4) {
        updateData.password = await bcrypt.hash(String(body.password), 10)
      }
      await prisma.users.update({ where: { id: uid }, data: updateData })

      const primaryOrg = String(body.organization_id || ctx.orgId)
      const otherOrgStr =
        body.other_org !== undefined
          ? Array.isArray(body.other_org)
            ? body.other_org.map(String).join(",")
            : body.other_org
              ? String(body.other_org)
              : null
          : undefined

      const reg = await prisma.registers.findFirst({ where: { user_id: uid } })
      const prevTeamId = reg?.team || ""
      const nextTeamId = body.team_id ? String(body.team_id) : ""

      if (reg) {
        await prisma.registers.update({
          where: { id: reg.id },
          data: {
            first_name: firstName,
            last_name: lastName,
            email: email.slice(0, 50),
            mobile: mobileStr,
            organization: primaryOrg,
            ...(otherOrgStr !== undefined ? { other_org: otherOrgStr } : {}),
            designation: body.designation_id
              ? String(body.designation_id)
              : null,
            team: nextTeamId || null,
            role: body.role_id ? String(body.role_id) : reg.role,
            status: statusNum,
            is_available_for_leads: Number(body.is_available_for_leads ?? 1),
            updated_at: now,
          },
        })
      } else {
        await prisma.registers.create({
          data: {
            user_id: uid,
            user_type: "operater",
            first_name: firstName,
            last_name: lastName,
            email: email.slice(0, 50),
            mobile: mobileStr,
            organization: primaryOrg,
            other_org: otherOrgStr || null,
            designation: body.designation_id
              ? String(body.designation_id)
              : null,
            team: nextTeamId || null,
            role: body.role_id ? String(body.role_id) : "5",
            status: statusNum,
            is_available_for_leads: Number(body.is_available_for_leads ?? 1),
            created_at: now,
            updated_at: now,
          },
        })
      }

      if (body.role_id) {
        await prisma.role_users.deleteMany({ where: { user_id: uid } })
        await prisma.role_users.create({
          data: {
            user_id: uid,
            role_id: Number(body.role_id),
            created_at: now,
            updated_at: now,
          },
        })
      }

      if (prevTeamId && prevTeamId !== nextTeamId) {
        const oldTeam = await prisma.teams.findUnique({
          where: { id: Number(prevTeamId) },
        })
        if (oldTeam) {
          const filtered = (oldTeam.team_member || "")
            .split(",")
            .map((s) => s.trim())
            .filter((s) => Boolean(s) && s !== String(uid))
          await prisma.teams.update({
            where: { id: oldTeam.id },
            data: { team_member: filtered.join(",") },
          })
        }
      }
      if (nextTeamId) {
        const newTeam = await prisma.teams.findUnique({
          where: { id: Number(nextTeamId) },
        })
        if (newTeam) {
          const members = new Set(
            (newTeam.team_member || "")
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          )
          members.add(String(uid))
          await prisma.teams.update({
            where: { id: newTeam.id },
            data: { team_member: Array.from(members).join(",") },
          })
        }
      }

      await prisma.user_activity_logs.create({
        data: {
          organization_id: BigInt(Number(primaryOrg) || ctx.orgId),
          user_id: BigInt(ctx.userId),
          entity_type: "user",
          entity_id: BigInt(uid),
          action: "update_user",
          description: `Updated user profile (${email})`,
          created_at: now,
        },
      })

      return NextResponse.json({ ok: true })
    }

    if (action === "delete" && body.id) {
      const uid = Number(body.id)
      if (uid === ctx.userId) {
        return NextResponse.json(
          { error: "You cannot delete your own active account." },
          { status: 400 }
        )
      }
      await prisma.role_users.deleteMany({ where: { user_id: uid } })
      await prisma.registers.deleteMany({ where: { user_id: uid } })
      await prisma.users.delete({ where: { id: uid } })
      return NextResponse.json({ ok: true })
    }

    if (action === "bulk_delete" && Array.isArray(body.ids)) {
      const ids = body.ids
        .map(Number)
        .filter((id: number) => id > 0 && id !== ctx.userId)
      if (ids.length > 0) {
        await prisma.role_users.deleteMany({ where: { user_id: { in: ids } } })
        await prisma.registers.deleteMany({ where: { user_id: { in: ids } } })
        await prisma.users.deleteMany({ where: { id: { in: ids } } })
      }
      return NextResponse.json({ ok: true })
    }
  }

  // 2. Roles & Permissions JSON Editor
  if (entity === "roles") {
    if (action === "create") {
      const name = String(body.name || "").trim()
      const r = await prisma.roles.create({
        data: {
          name,
          slug: String(
            body.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, "_")
          ),
          permissions: body.permissions
            ? JSON.stringify(body.permissions)
            : "[]",
          created_at: now,
          updated_at: now,
        },
      })
      return NextResponse.json(serializeData({ ok: true, item: r }))
    }

    if (action === "update" && body.id) {
      await prisma.roles.update({
        where: { id: Number(body.id) },
        data: {
          name: body.name ? String(body.name) : undefined,
          slug: body.slug ? String(body.slug) : undefined,
          permissions: body.permissions
            ? JSON.stringify(body.permissions)
            : undefined,
          updated_at: now,
        },
      })
      return NextResponse.json({ ok: true })
    }

    if (action === "delete" && body.id) {
      await prisma.roles.delete({ where: { id: Number(body.id) } })
      return NextResponse.json({ ok: true })
    }
  }

  // 3. Teams
  if (entity === "teams") {
    if (action === "create") {
      const memberStr = Array.isArray(body.member_ids)
        ? body.member_ids.join(",")
        : String(body.team_member || "")
      const t = await prisma.teams.create({
        data: {
          name: String(body.name || "").trim(),
          head: body.team_head ? Number(body.team_head) : 0,
          team_member: memberStr,
          organization_id: Number(body.organization_id || ctx.orgId),
          created_by: ctx.userId,
          status: Number(body.status ?? 1),
          created_at: now,
          updated_at: now,
        },
      })
      return NextResponse.json(serializeData({ ok: true, item: t }))
    }
    if (action === "update" && body.id) {
      const memberStr = Array.isArray(body.member_ids)
        ? body.member_ids.join(",")
        : String(body.team_member || "")
      await prisma.teams.update({
        where: { id: Number(body.id) },
        data: {
          name: String(body.name || "").trim(),
          head: body.team_head ? Number(body.team_head) : 0,
          team_member: memberStr,
          organization_id: Number(body.organization_id || ctx.orgId),
          status: Number(body.status ?? 1),
          updated_at: now,
        },
      })
      return NextResponse.json({ ok: true })
    }
    if (action === "delete" && body.id) {
      await prisma.teams.delete({ where: { id: Number(body.id) } })
      return NextResponse.json({ ok: true })
    }
    if (action === "bulk_delete" && Array.isArray(body.ids)) {
      await prisma.teams.deleteMany({
        where: { id: { in: body.ids.map(Number) } },
      })
      return NextResponse.json({ ok: true })
    }
  }

  // 4. Designations
  if (entity === "designations") {
    if (action === "create") {
      const d = await prisma.designation.create({
        data: {
          name: String(body.name || "").trim(),
          organization_id: Number(body.organization_id || ctx.orgId),
          created_by: ctx.userId,
          status: Number(body.status ?? 1),
          created_at: now,
        },
      })
      return NextResponse.json(serializeData({ ok: true, item: d }))
    }
    if (action === "update" && body.id) {
      await prisma.designation.update({
        where: { id: Number(body.id) },
        data: {
          name: String(body.name || "").trim(),
          organization_id: body.organization_id
            ? Number(body.organization_id)
            : undefined,
          status: Number(body.status ?? 1),
        },
      })
      return NextResponse.json({ ok: true })
    }
    if (action === "delete" && body.id) {
      await prisma.designation.delete({ where: { id: Number(body.id) } })
      return NextResponse.json({ ok: true })
    }
    if (action === "bulk_delete" && Array.isArray(body.ids)) {
      await prisma.designation.deleteMany({
        where: { id: { in: body.ids.map(Number) } },
      })
      return NextResponse.json({ ok: true })
    }
  }

  // 5. Organizations (auto-seeds default Admin designation & Administration team on create)
  if (entity === "organizations") {
    if (action === "create") {
      const o = await prisma.organizations.create({
        data: {
          name: String(body.name || "").trim(),
          email: body.email ? String(body.email) : null,
          mobile: body.mobile ? String(body.mobile) : null,
          address: body.address ? String(body.address) : null,
          city: body.city ? String(body.city) : null,
          state: body.state ? String(body.state) : null,
          zipcode: body.zipcode ? String(body.zipcode) : null,
          country: body.country ? String(body.country) : "India",
          gst: body.gst ? String(body.gst) : null,
          status: Number(body.status ?? 1),
          created_by: ctx.userId,
          created_at: now,
        },
      })

      await Promise.all([
        prisma.designation.create({
          data: {
            name: "Admin",
            organization_id: o.id,
            created_by: ctx.userId,
            status: 1,
            created_at: now,
          },
        }),
        prisma.teams.create({
          data: {
            name: "Administration",
            organization_id: o.id,
            head: ctx.userId,
            team_member: String(ctx.userId),
            created_by: ctx.userId,
            status: 1,
            created_at: now,
            updated_at: now,
          },
        }),
        prisma.org_activity_logs.create({
          data: {
            organization_id: BigInt(o.id),
            user_id: BigInt(ctx.userId),
            entity_type: "organization",
            entity_id: BigInt(o.id),
            action: "create_organization",
            description: `Organization '${o.name}' created`,
            created_at: now,
          },
        }),
      ])

      return NextResponse.json(serializeData({ ok: true, item: o }))
    }

    if (action === "update" && body.id) {
      const oid = Number(body.id)
      await prisma.organizations.update({
        where: { id: oid },
        data: {
          name: String(body.name || "").trim(),
          email: body.email ? String(body.email) : null,
          mobile: body.mobile ? String(body.mobile) : null,
          address: body.address ? String(body.address) : null,
          city: body.city ? String(body.city) : null,
          state: body.state ? String(body.state) : null,
          zipcode: body.zipcode ? String(body.zipcode) : null,
          country: body.country ? String(body.country) : "India",
          gst: body.gst ? String(body.gst) : null,
          status: Number(body.status ?? 1),
        },
      })
      await prisma.org_activity_logs.create({
        data: {
          organization_id: BigInt(oid),
          user_id: BigInt(ctx.userId),
          entity_type: "organization",
          entity_id: BigInt(oid),
          action: "update_organization",
          description: "Organization details updated",
          created_at: now,
        },
      })
      return NextResponse.json({ ok: true })
    }

    if (action === "delete" && body.id) {
      await prisma.organizations.delete({ where: { id: Number(body.id) } })
      return NextResponse.json({ ok: true })
    }

    if (action === "bulk_delete" && Array.isArray(body.ids)) {
      await prisma.organizations.deleteMany({
        where: { id: { in: body.ids.map(Number) } },
      })
      return NextResponse.json({ ok: true })
    }
  }

  return NextResponse.json(
    { error: "Unsupported UAC action" },
    { status: 400 }
  )
}
