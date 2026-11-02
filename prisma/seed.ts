import "dotenv/config"
import bcrypt from "bcryptjs"
import { prisma } from "../lib/prisma"

async function main() {
  console.log("Seeding DF Next.js CRM (MariaDB + Prisma 7)...")

  const existingUsers = await prisma.users.count()
  if (existingUsers > 0) {
    console.log("Database already seeded (users count:", existingUsers, "). Skipping duplicate seed.")
    return
  }

  const now = new Date()
  const hashAdmin = await bcrypt.hash("Admin@123", 10)
  const hashManager = await bcrypt.hash("Manager@123", 10)
  const hashUser = await bcrypt.hash("User@123", 10)

  // 1. Organizations
  const org1 = await prisma.organizations.create({
    data: {
      name: "Digital Fueled Education Group",
      email: "admissions@dfeducation.in",
      mobile: "9810012345",
      address: "Plot 42, Knowledge Park III",
      city: "New Delhi",
      state: "Delhi",
      zipcode: "110001",
      country: "India",
      status: 1,
      gst: "07AAACD1234F1Z5",
      created_at: now,
    },
  })

  const org2 = await prisma.organizations.create({
    data: {
      name: "Apex Global University Network",
      email: "info@apexglobal.edu.in",
      mobile: "9820098765",
      address: "BKC Tower B, Bandra East",
      city: "Mumbai",
      state: "Maharashtra",
      zipcode: "400051",
      country: "India",
      status: 1,
      gst: "27AABCA9876K1Z2",
      created_at: now,
    },
  })

  // 2. Roles
  const allPerms = JSON.stringify({
    "dashboard.view": true,
    "leads.view": true,
    "leads.create": true,
    "leads.edit": true,
    "leads.delete": true,
    "leads.bulk": true,
    "leads.export": true,
    "leads.reassign": true,
    "users.manage": true,
    "roles.manage": true,
    "settings.manage": true,
    "reports.view": true,
    "automation.manage": true,
    "templates.manage": true,
    "institutes.manage": true,
    "coupons.manage": true,
  })

  const roleRoot = await prisma.roles.create({
    data: { slug: "root", name: "Root Admin", permissions: allPerms, created_at: now, updated_at: now },
  })
  const roleSadmin = await prisma.roles.create({
    data: { slug: "sadmin", name: "Super Admin", permissions: allPerms, created_at: now, updated_at: now },
  })
  const roleAdmin = await prisma.roles.create({
    data: { slug: "admin", name: "Organization Admin", permissions: allPerms, created_at: now, updated_at: now },
  })
  const roleManager = await prisma.roles.create({
    data: {
      slug: "manager",
      name: "Admissions Manager",
      permissions: JSON.stringify({
        "dashboard.view": true,
        "leads.view": true,
        "leads.create": true,
        "leads.edit": true,
        "leads.delete": true,
        "leads.bulk": true,
        "leads.export": true,
        "leads.reassign": true,
        "reports.view": true,
        "institutes.manage": true,
        "coupons.manage": true,
      }),
      created_at: now,
      updated_at: now,
    },
  })
  const roleOperater = await prisma.roles.create({
    data: {
      slug: "operater",
      name: "Senior Counsellor",
      permissions: JSON.stringify({
        "dashboard.view": true,
        "leads.view": true,
        "leads.create": true,
        "leads.edit": true,
      }),
      created_at: now,
      updated_at: now,
    },
  })

  // 3. Designations
  const desigDirector = await prisma.designation.create({
    data: { name: "Director of Admissions", status: 1, organization_id: org1.id, created_at: now },
  })
  const desigManager = await prisma.designation.create({
    data: { name: "Team Lead - Counselling", status: 1, organization_id: org1.id, created_at: now },
  })
  const desigCounsellor = await prisma.designation.create({
    data: { name: "Academic Counsellor", status: 1, organization_id: org1.id, created_at: now },
  })

  // 4. Users + Registers + RoleUsers + Activations
  const usersToCreate = [
    {
      email: "admin@dfcrm.com",
      password: hashAdmin,
      first_name: "Vikram",
      last_name: "Sharma",
      mobile: "9811001100",
      location: "New Delhi",
      role: roleSadmin,
      desig: desigDirector,
      otherOrg: `${org2.id}`,
    },
    {
      email: "root@dfcrm.com",
      password: hashAdmin,
      first_name: "Vishal",
      last_name: "Verma",
      mobile: "9811002200",
      location: "New Delhi",
      role: roleRoot,
      desig: desigDirector,
      otherOrg: `${org2.id}`,
    },
    {
      email: "orgadmin@dfcrm.com",
      password: hashAdmin,
      first_name: "Neha",
      last_name: "Kapoor",
      mobile: "9811003300",
      location: "Noida",
      role: roleAdmin,
      desig: desigDirector,
      otherOrg: "",
    },
    {
      email: "manager@dfcrm.com",
      password: hashManager,
      first_name: "Rajesh",
      last_name: "Mehta",
      mobile: "9811004400",
      location: "Gurugram",
      role: roleManager,
      desig: desigManager,
      otherOrg: "",
    },
    {
      email: "priya@dfcrm.com",
      password: hashUser,
      first_name: "Priya",
      last_name: "Nair",
      mobile: "9811005500",
      location: "New Delhi",
      role: roleOperater,
      desig: desigCounsellor,
      otherOrg: "",
    },
    {
      email: "rahul@dfcrm.com",
      password: hashUser,
      first_name: "Rahul",
      last_name: "Gupta",
      mobile: "9811006600",
      location: "Mumbai",
      role: roleOperater,
      desig: desigCounsellor,
      otherOrg: "",
    },
  ]

  const createdUsers = []
  for (const u of usersToCreate) {
    const user = await prisma.users.create({
      data: {
        email: u.email,
        password: u.password,
        first_name: u.first_name,
        last_name: u.last_name,
        location: u.location,
        permissions: u.role.permissions,
        status: 1,
        last_login: now,
        created_at: now,
        updated_at: now,
      },
    })
    await prisma.role_users.create({
      data: { user_id: user.id, role_id: u.role.id, created_at: now, updated_at: now },
    })
    await prisma.activations.create({
      data: {
        user_id: user.id,
        code: `ACT_${user.id}_2026`,
        completed: true,
        completed_at: now,
        created_at: now,
        updated_at: now,
      },
    })
    await prisma.registers.create({
      data: {
        user_id: user.id,
        user_type: u.role.slug,
        first_name: u.first_name,
        last_name: u.last_name,
        email: u.email,
        mobile: u.mobile,
        user_name: `${u.first_name.toLowerCase()}.${u.last_name.toLowerCase()}`,
        address: u.location,
        organization: String(org1.id),
        designation: String(u.desig.id),
        status: 1,
        is_available_for_leads: 1,
        role: String(u.role.id),
        other_org: u.otherOrg || null,
        created_at: now,
        updated_at: now,
      },
    })
    createdUsers.push(user)
  }

  const [sadminUser, , , managerUser, priyaUser, rahulUser] = createdUsers

  // 5. Teams
  await prisma.teams.create({
    data: {
      name: "North India Engineering Desk",
      organization_id: org1.id,
      status: 1,
      created_by: sadminUser.id,
      head: managerUser.id,
      team_member: `${priyaUser.id},${rahulUser.id}`,
      created_at: now,
      updated_at: now,
    },
  })
  await prisma.teams.create({
    data: {
      name: "Management & MBA Admissions",
      organization_id: org1.id,
      status: 1,
      created_by: sadminUser.id,
      head: sadminUser.id,
      team_member: `${managerUser.id},${priyaUser.id}`,
      created_at: now,
      updated_at: now,
    },
  })

  // 6. Countries, States, Cities
  const india = await prisma.countries.create({
    data: { name: "India", code: 91, created_at: now },
  })
  const stateMap: Record<string, number> = {}
  const cityMap: Record<string, number> = {}

  const stateCities: Record<string, string[]> = {
    Delhi: ["New Delhi", "Dwarka", "Rohini"],
    "Uttar Pradesh": ["Noida", "Lucknow", "Varanasi"],
    Haryana: ["Gurugram", "Faridabad"],
    Maharashtra: ["Mumbai", "Pune", "Nagpur"],
    Karnataka: ["Bengaluru", "Mysuru"],
    Rajasthan: ["Jaipur", "Udaipur"],
    "Tamil Nadu": ["Chennai", "Coimbatore"],
  }

  for (const [stateName, cities] of Object.entries(stateCities)) {
    const st = await prisma.states.create({
      data: { country_id: india.id, name: stateName, created_at: Math.floor(Date.now() / 1000) },
    })
    stateMap[stateName] = st.id
    for (const cName of cities) {
      const ct = await prisma.cities.create({
        data: { state_id: st.id, name: cName },
      })
      cityMap[cName] = ct.id
    }
  }

  // 7. Institutes, Programs, Courses (Products)
  const inst1 = await prisma.institutes.create({
    data: {
      organization_id: BigInt(org1.id),
      name: "DF Institute of Technology",
      description: "AICTE Approved Engineering & Computing Campus",
      status: 1,
      created_at: now,
      updated_at: now,
    },
  })
  const inst2 = await prisma.institutes.create({
    data: {
      organization_id: BigInt(org1.id),
      name: "Apex School of Business",
      description: "Postgraduate Management & Executive Business School",
      status: 1,
      created_at: now,
      updated_at: now,
    },
  })
  const inst3 = await prisma.institutes.create({
    data: {
      organization_id: BigInt(org1.id),
      name: "Global Academy of Allied Sciences",
      description: "Healthcare, Pharmacy & Clinical Sciences Campus",
      status: 1,
      created_at: now,
      updated_at: now,
    },
  })

  const progBtech = await prisma.programs.create({
    data: { institute_id: inst1.id, name: "B.Tech", description: "4-Year Undergraduate Engineering", status: 1, created_at: now, updated_at: now },
  })
  const progBca = await prisma.programs.create({
    data: { institute_id: inst1.id, name: "BCA", description: "3-Year Computer Applications", status: 1, created_at: now, updated_at: now },
  })
  const progMba = await prisma.programs.create({
    data: { institute_id: inst2.id, name: "MBA", description: "2-Year Master of Business Administration", status: 1, created_at: now, updated_at: now },
  })
  const progBba = await prisma.programs.create({
    data: { institute_id: inst2.id, name: "BBA", description: "3-Year Bachelor of Business Administration", status: 1, created_at: now, updated_at: now },
  })
  const progBsc = await prisma.programs.create({
    data: { institute_id: inst3.id, name: "B.Sc Healthcare", description: "4-Year Clinical Sciences", status: 1, created_at: now, updated_at: now },
  })

  const courseCs = await prisma.products.create({
    data: { sku: "CRS-BTECH-CSE", name: "Computer Science & AI", description: "B.Tech CSE with AI/ML Specialization", quantity: 120, price: 145000, organization_id: org1.id, program_id: progBtech.id, status: 1, created_at: now, updated_at: now },
  })
  const courseDs = await prisma.products.create({
    data: { sku: "CRS-BTECH-DS", name: "Data Science & Analytics", description: "B.Tech Data Science", quantity: 60, price: 140000, organization_id: org1.id, program_id: progBtech.id, status: 1, created_at: now, updated_at: now },
  })
  const courseCloud = await prisma.products.create({
    data: { sku: "CRS-BCA-CLD", name: "Cloud & Cybersecurity", description: "BCA Cloud Computing", quantity: 90, price: 85000, organization_id: org1.id, program_id: progBca.id, status: 1, created_at: now, updated_at: now },
  })
  const courseMbaFin = await prisma.products.create({
    data: { sku: "CRS-MBA-FIN", name: "Finance & Fintech", description: "MBA Dual Specialization", quantity: 80, price: 225000, organization_id: org1.id, program_id: progMba.id, status: 1, created_at: now, updated_at: now },
  })
  const courseBba = await prisma.products.create({
    data: { sku: "CRS-BBA-IB", name: "International Business", description: "BBA Global Track", quantity: 100, price: 95000, organization_id: org1.id, program_id: progBba.id, status: 1, created_at: now, updated_at: now },
  })
  const courseNursing = await prisma.products.create({
    data: { sku: "CRS-BSC-NRS", name: "Clinical Diagnostics", description: "B.Sc Allied Health", quantity: 60, price: 110000, organization_id: org1.id, program_id: progBsc.id, status: 1, created_at: now, updated_at: now },
  })

  // 8. Pipelines & Stages
  const mainPipeline = await prisma.pipelines.create({
    data: { name: "Admission Pipeline 2026", is_default: true, rotten_days: 15, organization_id: org1.id, created_at: now, updated_at: now },
  })
  const execPipeline = await prisma.pipelines.create({
    data: { name: "MBA Fast-Track Pipeline", is_default: false, rotten_days: 10, organization_id: org1.id, created_at: now, updated_at: now },
  })

  const stageDefs = [
    { code: "new_inquiry", name: "New Inquiry", probability: 10, sort_order: 1, is_final: 0 },
    { code: "counselling_done", name: "Counselling Done", probability: 30, sort_order: 2, is_final: 0 },
    { code: "application_started", name: "Application Started", probability: 55, sort_order: 3, is_final: 0 },
    { code: "doc_verification", name: "Doc Verification", probability: 75, sort_order: 4, is_final: 0 },
    { code: "fee_paid", name: "Fee Paid", probability: 90, sort_order: 5, is_final: 0 },
    { code: "enrolled", name: "Enrolled", probability: 100, sort_order: 6, is_final: 1 },
  ]
  const stages = []
  for (const sd of stageDefs) {
    const st = await prisma.pipeline_stages.create({
      data: { ...sd, lead_pipeline_id: mainPipeline.id, created_at: now, updated_at: now },
    })
    stages.push(st)
  }
  await prisma.pipeline_stages.createMany({
    data: [
      { code: "exec_new", name: "Profile Received", probability: 20, sort_order: 1, is_final: 0, lead_pipeline_id: execPipeline.id },
      { code: "exec_interview", name: "GD / PI Scheduled", probability: 60, sort_order: 2, is_final: 0, lead_pipeline_id: execPipeline.id },
      { code: "exec_offer", name: "Offer Accepted", probability: 100, sort_order: 3, is_final: 1, lead_pipeline_id: execPipeline.id },
    ],
  })

  // 9. Lead Statuses & Sub-Statuses
  const statusDefs = [
    { name: "Untouched", color: "#f7b84b", subs: ["Fresh Inquiry", "Auto Routed"] },
    { name: "Interested", color: "#0ab39c", subs: ["Hot Lead - Ready to Apply", "Warm Lead - Brochure Sent", "Campus Visit Scheduled"] },
    { name: "Follow Up", color: "#299cdb", subs: ["Call Back Requested", "Discussing With Parents", "Awaiting 12th Results"] },
    { name: "Not Answered", color: "#405189", subs: ["Ringing No Response", "Switched Off", "Number Busy"] },
    { name: "Application Submitted", color: "#8b5cf6", subs: ["Fee Pending", "Document Review Pending"] },
    { name: "Converted", color: "#10b981", subs: ["Registration Fee Paid", "Semester Fee Paid"] },
    { name: "Not Interested", color: "#f06548", subs: ["Joined Another Institute", "Budget Constraint", "Invalid Inquiry"] },
  ]

  const statuses: Array<{ id: bigint; name: string; subs: Array<{ id: bigint; name: string }> }> = []
  let sOrder = 1
  for (const sd of statusDefs) {
    const ls = await prisma.lead_statuses.create({
      data: {
        organization_id: BigInt(org1.id),
        name: sd.name,
        color: sd.color,
        sort_order: sOrder++,
        is_active: true,
        created_at: now,
        updated_at: now,
      },
    })
    const createdSubs = []
    let subOrder = 1
    for (const subName of sd.subs) {
      const lss = await prisma.lead_sub_statuses.create({
        data: {
          lead_status_id: ls.id,
          organization_id: BigInt(org1.id),
          name: subName,
          color: sd.color,
          sort_order: subOrder++,
          is_active: true,
          created_at: now,
          updated_at: now,
        },
      })
      createdSubs.push({ id: lss.id, name: lss.name })
    }
    statuses.push({ id: ls.id, name: ls.name, subs: createdSubs })
  }

  // 10. Lead Sources & Lead Types (Mediums)
  const sourceNames = ["Website Direct", "Facebook Lead Ads", "Google Search Ads", "Instagram Reels", "Shiksha Portal", "Campus Walk-in", "Student Referral"]
  const sources = []
  for (const sn of sourceNames) {
    const s = await prisma.lead_sources.create({
      data: { organization_id: BigInt(org1.id), name: sn, status: true, lead_count: 4, billing_setup_amount: 1500, created_at: now, updated_at: now },
    })
    sources.push(s)
  }

  const typeNames = ["Organic Search", "CPC Paid", "Paid Social", "Direct Traffic", "Portal Aggregator", "Offline Walk-in"]
  const leadTypes = []
  for (const tn of typeNames) {
    const lt = await prisma.lead_types.create({
      data: { organization_id: BigInt(org1.id), name: tn, status: 1, created_at: now, updated_at: now },
    })
    leadTypes.push(lt)
  }

  // 11. Templates (Email, SMS, WhatsApp) + Marketing Events + Campaigns
  const emailTpl1 = await prisma.email_templates.create({
    data: {
      organization_id: BigInt(org1.id),
      created_by: BigInt(sadminUser.id),
      send_by: "admissions@dfeducation.in",
      title: "Welcome & Brochure 2026",
      category: "Admissions",
      subject: "Welcome to DF Education Group - Download Your 2026 Prospectus",
      message: "Dear {{name}},\n\nThank you for your interest in {{program}} at {{institute}}. Your application link is ready. Reach out to your counsellor for scholarship guidance.\n\nWarm regards,\nAdmissions Desk",
      status: "active",
    },
  })
  await prisma.email_templates.create({
    data: {
      organization_id: BigInt(org1.id),
      created_by: BigInt(sadminUser.id),
      send_by: "admissions@dfeducation.in",
      title: "Application Fee Reminder",
      category: "Payment",
      subject: "Complete Your Application & Unlock Merit Scholarship",
      message: "Hello {{name}},\n\nYour application is 80% complete! Use code EARLY2026 before Friday to get Rs. 500 off your application processing fee.\n\nTeam Admissions",
      status: "active",
    },
  })

  await prisma.message_templates.createMany({
    data: [
      {
        organization_id: BigInt(org1.id),
        created_by: BigInt(sadminUser.id),
        send_by: "DFEDUC",
        title: "Inquiry Confirmation SMS",
        category: "Transactional",
        message: "Hi {{name}}, thank you for inquiring at DF Institute. Our counsellor will call you shortly. Helpline: 1800-102-2026.",
        status: "active",
      },
      {
        organization_id: BigInt(org1.id),
        created_by: BigInt(sadminUser.id),
        send_by: "DFEDUC",
        title: "Counselling Slot Reminder",
        category: "Followup",
        message: "Dear {{name}}, your 1-on-1 counselling call for 2026 Admissions is scheduled today. Reply YES to confirm.",
        status: "active",
      },
    ],
  })

  await prisma.whatsapp_templates.createMany({
    data: [
      {
        organization_id: BigInt(org1.id),
        created_by: BigInt(sadminUser.id),
        send_by: "WhatsApp Business",
        title: "Instant Brochure & Fee Structure",
        category: "Marketing",
        message: "Hello {{name}}! Welcome to DF Education Group. Here is the 2026 Fee Structure & Placement Report. Reply 1 to speak with an Admission Expert.",
        status: "active",
      },
      {
        organization_id: BigInt(org1.id),
        created_by: BigInt(sadminUser.id),
        send_by: "WhatsApp Business",
        title: "Scholarship Test Invite",
        category: "Scholarship",
        message: "Hi {{name}}, you are eligible for DFSET 2026 Scholarship up to 50%! Complete your form today.",
        status: "active",
      },
    ],
  })

  const event1 = await prisma.marketing_events.create({
    data: {
      name: "National Engineering Open House 2026",
      description: "Live campus tour and scholarship counselling session",
      date: new Date("2026-11-10"),
      organization_id: org1.id,
      created_at: now,
      updated_at: now,
    },
  })
  const event2 = await prisma.marketing_events.create({
    data: {
      name: "MBA Leadership Conclave",
      description: "Industry panel & on-spot profile evaluation",
      date: new Date("2026-11-22"),
      organization_id: org1.id,
      created_at: now,
      updated_at: now,
    },
  })

  const camp1 = await prisma.campaigns.create({
    data: {
      name: "B.Tech 2026 Early Bird Intake",
      subject: "Apply Now for B.Tech CSE & AI 2026",
      status: "active",
      type: "Omni-channel",
      mail_to: "all_engineering_leads",
      marketing_template_id: emailTpl1.id,
      marketing_event_id: event1.id,
      organization_id: org1.id,
      created_at: now,
      updated_at: now,
    },
  })
  const camp2 = await prisma.campaigns.create({
    data: {
      name: "MBA CAT/MAT Merit Scholarship",
      subject: "Up to 40% Tuition Waiver on MBA 2026",
      status: "active",
      type: "Paid Search + Social",
      mail_to: "mba_aspirants",
      marketing_template_id: emailTpl1.id,
      marketing_event_id: event2.id,
      organization_id: org1.id,
      created_at: now,
      updated_at: now,
    },
  })

  // 12. Attributes & Webhooks & Coupons & Application Forms
  await prisma.attributes.createMany({
    data: [
      { code: "entrance_exam", name: "Entrance Exam", type: "select", entity_type: "leads", sort_order: 1, is_required: false, is_unique: false, quick_add: true, is_user_defined: true, organization_id: org1.id, created_at: now, updated_at: now },
      { code: "twelfth_percentage", name: "12th Percentage", type: "number", entity_type: "leads", sort_order: 2, is_required: false, is_unique: false, quick_add: true, is_user_defined: true, organization_id: org1.id, created_at: now, updated_at: now },
      { code: "hostel_required", name: "Hostel Required", type: "boolean", entity_type: "leads", sort_order: 3, is_required: false, is_unique: false, quick_add: false, is_user_defined: true, organization_id: org1.id, created_at: now, updated_at: now },
    ],
  })

  await prisma.webhooks.create({
    data: {
      name: "ERP Student Sync Webhook",
      entity_type: "lead.converted",
      description: "Pushes enrolled student payload to Campus ERP",
      method: "POST",
      end_point: "https://erp.dfeducation.in/api/v1/admissions/sync",
      payload_type: "json",
      raw_payload_type: "application/json",
      payload: JSON.stringify({ event: "lead.converted", source: "df-crm" }),
      organization_id: org1.id,
      created_at: now,
      updated_at: now,
    },
  })

  await prisma.coupons.createMany({
    data: [
      { organization_id: BigInt(org1.id), code: "EARLY2026", name: "Early Bird Rs. 500 Off", type: "flat", value: 500, min_amount: 1000, usage_type: "multiple", usage_limit: 500, used_count: 14, status: 1, created_by: BigInt(sadminUser.id), created_at: now, updated_at: now },
      { organization_id: BigInt(org1.id), code: "MERIT25", name: "Merit 25% Application Waiver", type: "percent", value: 25, min_amount: 1000, max_discount: 750, usage_type: "multiple", usage_limit: 200, used_count: 8, status: 1, created_by: BigInt(sadminUser.id), created_at: now, updated_at: now },
      { organization_id: BigInt(org1.id), code: "FREEAPP", name: "100% Scholarship Waiver", type: "percent", value: 100, min_amount: 0, max_discount: 2500, usage_type: "single", usage_limit: 50, used_count: 2, status: 1, created_by: BigInt(sadminUser.id), created_at: now, updated_at: now },
    ],
  })

  const appForm1 = await prisma.application_forms.create({
    data: {
      unique_code: "APP-BTECH-2026",
      title: "B.Tech & Computing Common Application 2026",
      form_name: "UG Engineering Form",
      description: "Official admission application for B.Tech & BCA programmes",
      status: "active",
      fees: 1200,
      tax: 216,
      total_amount: 1416,
      gateway: "razorpay",
      organization_id: org1.id,
      created_by: BigInt(sadminUser.id),
      created_at: now,
      updated_at: now,
    },
  })
  const appForm2 = await prisma.application_forms.create({
    data: {
      unique_code: "APP-MBA-2026",
      title: "MBA & PGDM Admission Application 2026",
      form_name: "PG Management Form",
      description: "Official admission application for MBA & Executive tracks",
      status: "active",
      fees: 1500,
      tax: 270,
      total_amount: 1770,
      gateway: "razorpay",
      organization_id: org1.id,
      created_by: BigInt(sadminUser.id),
      created_at: now,
      updated_at: now,
    },
  })

  // 13. Seed 24 Realistic Student Leads (with P, S, T duplicates + untouched leads + followups + payments)
  const leadSeedRows = [
    { name: "Aarav Malhotra", mobile: "9810112233", email: "aarav.malhotra@gmail.com", state: "Delhi", city: "New Delhi", inst: inst1, prog: progBtech, course: courseCs, form: appForm1, src: sources[0], med: leadTypes[0], camp: camp1, stIdx: 5, stageIdx: 5, owner: priyaUser.id, score: 92, weight: 18, verified: true, paidMethod: "online", paidAmt: 1416, appStatus: "approved" },
    { name: "Aarav M. (Portal)", mobile: "9810112233", email: "aarav.m26@yahoo.com", state: "Delhi", city: "New Delhi", inst: inst1, prog: progBtech, course: courseDs, form: appForm1, src: sources[4], med: leadTypes[4], camp: camp1, stIdx: 1, stageIdx: 1, owner: priyaUser.id, score: 65, weight: 9, verified: true, paidMethod: null, paidAmt: 0, appStatus: null },
    { name: "Ishita Deshmukh", mobile: "9820445566", email: "ishita.deshmukh@gmail.com", state: "Maharashtra", city: "Mumbai", inst: inst2, prog: progMba, course: courseMbaFin, form: appForm2, src: sources[2], med: leadTypes[1], camp: camp2, stIdx: 5, stageIdx: 5, owner: rahulUser.id, score: 96, weight: 22, verified: true, paidMethod: "online", paidAmt: 1770, appStatus: "approved" },
    { name: "Ishita D.", mobile: "9820445566", email: "ishita.d@outlook.com", state: "Maharashtra", city: "Pune", inst: inst2, prog: progMba, course: courseMbaFin, form: appForm2, src: sources[1], med: leadTypes[2], camp: camp2, stIdx: 2, stageIdx: 2, owner: rahulUser.id, score: 54, weight: 7, verified: false, paidMethod: null, paidAmt: 0, appStatus: null },
    { name: "Ishita Deshmukh (Walk-in)", mobile: "9820445566", email: "ishita.walkin@gmail.com", state: "Maharashtra", city: "Mumbai", inst: inst2, prog: progBba, course: courseBba, form: appForm2, src: sources[5], med: leadTypes[5], camp: camp2, stIdx: 1, stageIdx: 1, owner: rahulUser.id, score: 48, weight: 5, verified: false, paidMethod: null, paidAmt: 0, appStatus: null },
    { name: "Rohan Krishnamurthy", mobile: "9845011229", email: "rohan.k@gmail.com", state: "Karnataka", city: "Bengaluru", inst: inst1, prog: progBtech, course: courseCs, form: appForm1, src: sources[2], med: leadTypes[1], camp: camp1, stIdx: 4, stageIdx: 4, owner: priyaUser.id, score: 88, weight: 16, verified: true, paidMethod: "online", paidAmt: 1416, appStatus: "submitted" },
    { name: "Ananya Chatterjee", mobile: "9818776655", email: "ananya.c@gmail.com", state: "Uttar Pradesh", city: "Noida", inst: inst1, prog: progBca, course: courseCloud, form: appForm1, src: sources[1], med: leadTypes[2], camp: camp1, stIdx: 0, stageIdx: 0, owner: 0, score: 35, weight: 3, verified: false, paidMethod: null, paidAmt: 0, appStatus: null },
    { name: "Kabir Singhania", mobile: "9871234509", email: "kabir.singhania@gmail.com", state: "Haryana", city: "Gurugram", inst: inst2, prog: progMba, course: courseMbaFin, form: appForm2, src: sources[0], med: leadTypes[0], camp: camp2, stIdx: 5, stageIdx: 4, owner: managerUser.id, score: 91, weight: 19, verified: true, paidMethod: "offline", paidAmt: 1770, appStatus: "approved" },
    { name: "Meera Rajagopalan", mobile: "9840998877", email: "meera.raja@gmail.com", state: "Tamil Nadu", city: "Chennai", inst: inst3, prog: progBsc, course: courseNursing, form: appForm1, src: sources[3], med: leadTypes[2], camp: camp1, stIdx: 1, stageIdx: 2, owner: priyaUser.id, score: 78, weight: 13, verified: true, paidMethod: null, paidAmt: 0, appStatus: "draft", overdueFollowup: true },
    { name: "Devansh Rathore", mobile: "9829112244", email: "devansh.rathore@gmail.com", state: "Rajasthan", city: "Jaipur", inst: inst1, prog: progBtech, course: courseDs, form: appForm1, src: sources[5], med: leadTypes[5], camp: camp1, stIdx: 5, stageIdx: 5, owner: rahulUser.id, score: 85, weight: 15, verified: true, paidMethod: "cash", paidAmt: 1416, appStatus: "approved" },
    { name: "Sanya Bansal", mobile: "9811334455", email: "sanya.bansal@gmail.com", state: "Delhi", city: "Dwarka", inst: inst2, prog: progBba, course: courseBba, form: appForm2, src: sources[0], med: leadTypes[3], camp: camp2, stIdx: 0, stageIdx: 0, owner: 0, score: 40, weight: 4, verified: false, paidMethod: null, paidAmt: 0, appStatus: null },
    { name: "Aditya Kulkarni", mobile: "9822556677", email: "aditya.kulkarni@gmail.com", state: "Maharashtra", city: "Pune", inst: inst1, prog: progBtech, course: courseCs, form: appForm1, src: sources[4], med: leadTypes[4], camp: camp1, stIdx: 2, stageIdx: 2, owner: priyaUser.id, score: 72, weight: 11, verified: true, paidMethod: null, paidAmt: 0, appStatus: "draft", overdueFollowup: true },
    { name: "Nandini Tiwari", mobile: "9935667788", email: "nandini.tiwari@gmail.com", state: "Uttar Pradesh", city: "Lucknow", inst: inst3, prog: progBsc, course: courseNursing, form: appForm1, src: sources[1], med: leadTypes[2], camp: camp1, stIdx: 5, stageIdx: 4, owner: rahulUser.id, score: 89, weight: 17, verified: true, paidMethod: "dd", paidAmt: 1416, appStatus: "submitted" },
    { name: "Harshvardhan Joshi", mobile: "9899001122", email: "harsh.joshi@gmail.com", state: "Delhi", city: "Rohini", inst: inst1, prog: progBtech, course: courseCs, form: appForm1, src: sources[6], med: leadTypes[3], camp: camp1, stIdx: 5, stageIdx: 5, owner: managerUser.id, score: 94, weight: 20, verified: true, paidMethod: "free", paidAmt: 0, appStatus: "approved" },
    { name: "Tanvi Saxena", mobile: "9810990011", email: "tanvi.saxena@gmail.com", state: "Uttar Pradesh", city: "Noida", inst: inst2, prog: progMba, course: courseMbaFin, form: appForm2, src: sources[2], med: leadTypes[1], camp: camp2, stIdx: 0, stageIdx: 0, owner: 0, score: 30, weight: 2, verified: false, paidMethod: null, paidAmt: 0, appStatus: null },
    { name: "Yashvardhan Reddy", mobile: "9845778899", email: "yash.reddy@gmail.com", state: "Karnataka", city: "Bengaluru", inst: inst1, prog: progBca, course: courseCloud, form: appForm1, src: sources[3], med: leadTypes[2], camp: camp1, stIdx: 3, stageIdx: 1, owner: priyaUser.id, score: 52, weight: 6, verified: false, paidMethod: null, paidAmt: 0, appStatus: null, overdueFollowup: true },
    { name: "Ritika Choudhary", mobile: "9828334466", email: "ritika.c@gmail.com", state: "Rajasthan", city: "Udaipur", inst: inst2, prog: progBba, course: courseBba, form: appForm2, src: sources[1], med: leadTypes[2], camp: camp2, stIdx: 4, stageIdx: 3, owner: rahulUser.id, score: 80, weight: 14, verified: true, paidMethod: null, paidAmt: 0, appStatus: "draft", overdueFollowup: true },
    { name: "Pranav Iyer", mobile: "9841223344", email: "pranav.iyer@gmail.com", state: "Tamil Nadu", city: "Coimbatore", inst: inst1, prog: progBtech, course: courseDs, form: appForm1, src: sources[0], med: leadTypes[0], camp: camp1, stIdx: 1, stageIdx: 2, owner: managerUser.id, score: 74, weight: 12, verified: true, paidMethod: null, paidAmt: 0, appStatus: "draft" },
    { name: "Kriti Aggarwal", mobile: "9812445577", email: "kriti.aggarwal@gmail.com", state: "Haryana", city: "Faridabad", inst: inst2, prog: progMba, course: courseMbaFin, form: appForm2, src: sources[2], med: leadTypes[1], camp: camp2, stIdx: 0, stageIdx: 0, owner: 0, score: 42, weight: 4, verified: false, paidMethod: null, paidAmt: 0, appStatus: null },
    { name: "Siddharth Mishra", mobile: "9936112200", email: "siddharth.m@gmail.com", state: "Uttar Pradesh", city: "Varanasi", inst: inst1, prog: progBtech, course: courseCs, form: appForm1, src: sources[4], med: leadTypes[4], camp: camp1, stIdx: 6, stageIdx: 1, owner: rahulUser.id, score: 25, weight: 5, verified: true, paidMethod: null, paidAmt: 0, appStatus: null },
  ]

  const pastHour = new Date(now.getTime() - 2 * 3600 * 1000)
  const tomorrow = new Date(now.getTime() + 24 * 3600 * 1000)
  const createdLeads = []

  for (let i = 0; i < leadSeedRows.length; i++) {
    const row = leadSeedRows[i]
    const stObj = statuses[row.stIdx]
    const subObj = stObj.subs[0]
    const stageObj = stages[row.stageIdx]

    const lead = await prisma.leads.create({
      data: {
        name: row.name,
        mobile: row.mobile,
        alternate_mobile: i % 3 === 0 ? `97110099${10 + i}` : null,
        email: row.email,
        city: String(cityMap[row.city] || row.city),
        state: String(stateMap[row.state] || row.state),
        country: String(india.id),
        organization_id: BigInt(org1.id),
        institute_id: row.inst.id,
        programme_id: row.prog.id,
        faculty_id: BigInt(row.course.id),
        application_form_id: Number(row.form.id),
        lead_source_id: row.src.id,
        lead_campaign_id: BigInt(row.camp.id),
        lead_marketing_event: event1.id,
        pipeline_id: BigInt(mainPipeline.id),
        stage_id: BigInt(stageObj.id),
        type_id: row.med.id,
        lead_status_id: stObj.id,
        lead_sub_status_id: subObj.id,
        lead_score: row.score,
        lead_weight_count: row.weight,
        lead_assign_to: BigInt(row.owner),
        created_by: BigInt(sadminUser.id),
        next_followup_at: row.overdueFollowup ? pastHour : row.owner > 0 ? tomorrow : null,
        lead_registration_date: now,
        extra_fields_json: JSON.stringify({
          entrance_exam: i % 2 === 0 ? "JEE Main 2026" : "CAT / MAT",
          twelfth_percentage: 78 + (i % 18),
          hostel_required: i % 2 === 0 ? "Yes" : "No",
          city_name: row.city,
          state_name: row.state,
        }),
        created_at: new Date(now.getTime() - i * 6 * 3600 * 1000),
        updated_at: now,
      },
    })
    createdLeads.push(lead)

    if (row.verified) {
      await prisma.lead_verifications.create({
        data: { lead_id: lead.id, sms_verified: 1, email_verified: 1, verified_at: now },
      })
    }

    // Activity timeline entry
    await prisma.lead_activity_logs.create({
      data: {
        organization_id: BigInt(org1.id),
        lead_id: lead.id,
        user_id: BigInt(row.owner || sadminUser.id),
        action: "lead_created",
        description: `Lead captured via ${row.src.name} for ${row.prog.name} (${row.course.name})`,
        meta_data: JSON.stringify({ stage: stageObj.name, status: stObj.name }),
        created_at: lead.created_at || now,
        updated_at: now,
      },
    })

    // Application + Response if started or paid
    if (row.paidMethod || row.appStatus) {
      const isPaid = Boolean(row.paidMethod)
      await prisma.lead_applications.create({
        data: {
          lead_id: lead.id,
          application_form: 1,
          application_score: isPaid ? 95 : 65,
          payment_status: isPaid ? "paid" : "pending",
          payment_method: row.paidMethod || null,
          created_at: now,
        },
      })
      await prisma.application_form_responses.create({
        data: {
          lead_form_id: row.form.id,
          response_json: JSON.stringify({ applicant: row.name, mobile: row.mobile, programme: row.prog.name }),
          fill_percentage: isPaid ? 100 : 65,
          email_verified: row.verified ? 1 : 0,
          otp_verified: row.verified ? 1 : 0,
          lead_id: Number(lead.id),
          payment_amount: row.paidAmt,
          payment_method: row.paidMethod,
          payment_status: isPaid ? 1 : 0,
          organization_id: org1.id,
          assigned_to: row.owner || sadminUser.id,
          current_step: isPaid ? 4 : 2,
          status: row.appStatus || "pending",
          created_at: now,
          updated_at: now,
        },
      })
    }

    // Notes, Events, Communications for top leads
    if (i < 8) {
      await prisma.lead_notes.create({
        data: {
          lead_id: lead.id,
          note: `Spoke with ${row.name} regarding ${row.prog.name} (${row.course.name}) eligibility, hostel facilities, and scholarship slabs. Very positive interest.`,
          created_by: BigInt(row.owner || priyaUser.id),
          created_at: now,
          updated_at: now,
        },
      })
      await prisma.lead_events.create({
        data: {
          lead_id: lead.id,
          subject: `1-on-1 Admission Counselling - ${row.name}`,
          description: `Follow-up call on application documents & scholarship code.`,
          start_at: tomorrow,
          end_at: new Date(tomorrow.getTime() + 1800 * 1000),
          owner_id: BigInt(row.owner || priyaUser.id),
          event_type: i % 2 === 0 ? "phone_call" : "video_call",
          created_at: now,
          updated_at: now,
        },
      })
      await prisma.communication_logs.create({
        data: {
          organization_id: org1.id,
          lead_id: lead.id,
          channel: i % 3 === 0 ? "whatsapp" : i % 2 === 0 ? "email" : "sms",
          sent_by: BigInt(row.owner || sadminUser.id),
          to: i % 2 === 0 ? row.email : row.mobile,
          subject: "DF Education Group - 2026 Admission Prospectus & Link",
          content: `Hello ${row.name}, thank you for choosing ${row.inst.name}. Here is your personalized admission portal link.`,
          status: "sent",
          sent_at: now,
          created_at: now,
          updated_at: now,
        },
      })
      await prisma.call_logs.create({
        data: {
          lead_id: lead.id,
          agent_id: BigInt(row.owner || priyaUser.id),
          direction: "outbound",
          duration: 145 + i * 22,
          summary: "Connected - Counsellor explained fee structure & placement highlights",
          notes: "Candidate asked for scholarship details.",
          created_at: now,
          updated_at: now,
        },
      })
    }
  }

  // 14. Lead Tickets / Queries + Messages
  const q1 = await prisma.lead_queries.create({
    data: {
      lead_id: Number(createdLeads[0].id),
      query_code: "TKT-2026-1001",
      subject: "Need Scholarship Coupon Verification on B.Tech Form",
      category: "payment",
      priority: "high",
      status: "open",
      assigned_to: priyaUser.id,
      created_by: "student",
      created_at: now,
      updated_at: now,
    },
  })
  await prisma.lead_query_messages.createMany({
    data: [
      { query_id: q1.id, sender_type: "student", sender_id: Number(createdLeads[0].id), message: "Hi team, I scored 91% in 12th PCM. Can I apply MERIT25 on my B.Tech CSE application fee?", created_at: now },
      { query_id: q1.id, sender_type: "admin", sender_id: priyaUser.id, message: "Hello Aarav! Yes, MERIT25 is active on your profile. Let us know if you face any issue.", created_at: now },
    ],
  })
  await prisma.lead_queries.create({
    data: {
      lead_id: Number(createdLeads[5].id),
      query_code: "TKT-2026-1002",
      subject: "12th Marksheet Upload Format Query",
      category: "academic",
      priority: "medium",
      status: "in_progress",
      assigned_to: priyaUser.id,
      created_by: "student",
      created_at: now,
      updated_at: now,
    },
  })
  await prisma.lead_queries.create({
    data: {
      lead_id: Number(createdLeads[2].id),
      query_code: "TKT-2026-1003",
      subject: "MBA Fee Receipt Download Request",
      category: "payment",
      priority: "low",
      status: "closed",
      assigned_to: rahulUser.id,
      created_by: "student",
      created_at: now,
      updated_at: now,
      closed_at: now,
    },
  })

  // 15. Saved Filters
  await prisma.lead_saved_filters.createMany({
    data: [
      {
        organization_id: org1.id,
        user_id: BigInt(sadminUser.id),
        name: "Untouched Fresh Leads",
        filters_json: JSON.stringify({ unassigned: "1" }),
        is_default: false,
        created_at: now,
        updated_at: now,
      },
      {
        organization_id: org1.id,
        user_id: BigInt(sadminUser.id),
        name: "Converted Leads 2026",
        filters_json: JSON.stringify({ lead_status_id: String(statuses[5].id) }),
        is_default: false,
        created_at: now,
        updated_at: now,
      },
    ],
  })

  // 16. Notifications (All / Messages / Alerts)
  await prisma.notifications.createMany({
    data: [
      {
        organization_id: BigInt(org1.id),
        user_id: BigInt(sadminUser.id),
        type: "alert",
        title: "4 Untouched High-Intent Leads Waiting",
        body: "New B.Tech & MBA inquiries arrived from Website & Google Search Ads.",
        url: "/leads",
        is_read: 0,
        created_at: now,
        updated_at: now,
      },
      {
        organization_id: BigInt(org1.id),
        user_id: BigInt(sadminUser.id),
        type: "message",
        title: "Ticket TKT-2026-1001: Aarav Malhotra",
        body: "Student asked about MERIT25 scholarship waiver on B.Tech CSE.",
        url: `/leads/${createdLeads[0].id}`,
        is_read: 0,
        created_at: now,
        updated_at: now,
      },
      {
        organization_id: BigInt(org1.id),
        user_id: BigInt(sadminUser.id),
        type: "alert",
        title: "Application Fee Paid: Ishita Deshmukh",
        body: "Rs. 1,770 received via Online gateway for MBA Finance & Fintech.",
        url: `/leads/${createdLeads[2].id}`,
        is_read: 0,
        created_at: now,
        updated_at: now,
      },
    ],
  })

  // 17. Upload Logs + Raw Leads + Distribution Rules + WebForms + Landing Pages + General Settings
  await prisma.lead_uploads.create({
    data: {
      organization_id: BigInt(org1.id),
      user_id: BigInt(sadminUser.id),
      file_name: "jee_aspirants_oct_2026.csv",
      file_path: "/uploads/leads/jee_aspirants_oct_2026.csv",
      total_rows: 150,
      valid_rows: 142,
      duplicate_rows: 6,
      failed_rows: 2,
      status: "completed",
      upload_type: "mobile",
      institute: inst1.name,
      program: progBtech.name,
      course: courseCs.name,
      started_at: now,
      completed_at: now,
      created_at: now,
      updated_at: now,
    },
  })

  const rawUpload = await prisma.automation_raw_lead_uploads.create({
    data: {
      organization_id: BigInt(org1.id),
      user_id: BigInt(sadminUser.id),
      file_name: "shiksha_raw_leads_batch1.csv",
      file_path: "/uploads/raw/shiksha_raw_leads_batch1.csv",
      total_rows: 5,
      valid_rows: 5,
      duplicate_rows: 0,
      failed_rows: 0,
      status: "completed",
      started_at: now,
      completed_at: now,
      created_at: now,
      updated_at: now,
    },
  })

  await prisma.automation_raw_leads.createMany({
    data: [
      { upload_id: rawUpload.id, name: "Vihaan Kapoor", mobile: "9811550011", course: "B.Tech CSE", city: "New Delhi", campaign: "B.Tech 2026", source: "Shiksha", status: "confirmed", ivr_response: "1", confirm_time: now, lead_created_status: true, organization_id: org1.id },
      { upload_id: rawUpload.id, name: "Riya Menon", mobile: "9820550022", course: "MBA Finance", city: "Mumbai", campaign: "MBA 2026", source: "Facebook", status: "whatsapp_sent", organization_id: org1.id },
      { upload_id: rawUpload.id, name: "Kunal Verma", mobile: "9830550033", course: "BCA Cloud", city: "Noida", campaign: "BCA 2026", source: "Google Ads", status: "pending", organization_id: org1.id },
      { upload_id: rawUpload.id, name: "Pooja Saini", mobile: "9840550044", course: "BBA IB", city: "Jaipur", campaign: "BBA 2026", source: "Instagram", status: "rejected", ivr_response: "2", organization_id: org1.id },
    ],
  })

  const distRule = await prisma.lead_distribution_rules.create({
    data: {
      organization_id: BigInt(org1.id),
      rule_name: "Round-Robin Website & Search Leads",
      distribution_type: "source",
      is_active: true,
      created_at: now,
      updated_at: now,
    },
  })
  await prisma.lead_distribution_rule_items.createMany({
    data: [
      { rule_id: distRule.id, source_id: sources[0].id, assign_type: "user", user_id: BigInt(priyaUser.id), percentage: 50, created_at: now, updated_at: now },
      { rule_id: distRule.id, source_id: sources[2].id, assign_type: "user", user_id: BigInt(rahulUser.id), percentage: 50, created_at: now, updated_at: now },
    ],
  })

  await prisma.web_forms.create({
    data: {
      form_id: "WF-2026-ADMISSIONS",
      title: "2026 Quick Admission Enquiry Widget",
      description: "Embeddable enquiry form for institute websites",
      submit_button_label: "Apply Now",
      submit_success_action: "message",
      submit_success_content: "Thank you! Our counsellor will reach out within 15 minutes.",
      create_lead: true,
      background_color: "#f3f3f9",
      form_background_color: "#ffffff",
      form_title_color: "#405189",
      form_submit_button_color: "#0ab39c",
      attribute_label_color: "#495057",
      organization_id: org1.id,
      view_count: 428,
      submit_count: 64,
      lead_source_id: Number(sources[0].id),
      lead_campaign_id: camp1.id,
      pipeline_id: mainPipeline.id,
      type_id: Number(leadTypes[0].id),
      application_form_id: Number(appForm1.id),
      created_by: sadminUser.id,
      created_at: now,
      updated_at: now,
    },
  })

  await prisma.landing_pages.create({
    data: {
      organization_id: BigInt(org1.id),
      campaign_id: BigInt(camp1.id),
      slug: "btech-admissions-2026",
      title: "B.Tech 2026 Admissions Open - DF Institute of Technology",
      layout_name: "velzon",
      status: 1,
      meta: JSON.stringify({ hero_heading: "Shape the Future with AI & Computer Science", cta: "Apply for 2026 Intake" }),
      created_at: now,
      updated_at: now,
    },
  })

  await prisma.general_settings.create({
    data: {
      organization_id: BigInt(org1.id),
      app_name: "LMS - DF Education CRM",
      currency: "INR",
      timezone: "Asia/Kolkata",
      default_payment_gateway: "razorpay",
      date_format: "d M, Y",
      status: 1,
      created_at: now,
      updated_at: now,
    },
  })

  console.log("Seed completed! Demo login: admin@dfcrm.com / Admin@123")
}

main()
  .catch((e) => {
    console.error("Seed error:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
