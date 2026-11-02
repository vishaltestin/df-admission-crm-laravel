"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"

export default function PublicLandingPage() {
  const params = useParams<{ slug: string }>()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [page, setPage] = React.useState<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [sections, setSections] = React.useState<any[]>([])
  const [annualBilling, setAnnualBilling] = React.useState(false)
  const [openFaq, setOpenFaq] = React.useState<string>("L-0")
  const [leadForm, setLeadForm] = React.useState({
    name: "",
    mobile: "",
    email: "",
    city: "",
    message: "",
  })
  const [submitted, setSubmitted] = React.useState(false)

  React.useEffect(() => {
    fetch(`/api/public-lp?slug=${encodeURIComponent(params.slug || "")}`)
      .then((r) => r.json())
      .then((d) => {
        setPage(d.page || null)
        setSections(d.sections || [])
      })
      .catch(() => {})
  }, [params.slug])

  async function submitLead(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch("/api/leads/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: leadForm.name,
        mobile: leadForm.mobile,
        email: leadForm.email,
        city: leadForm.city,
        description: leadForm.message,
      }),
    })
    if (res.ok) {
      setSubmitted(true)
      toast.success("Thank you! Our team will contact you shortly.")
    }
  }

  return (
    <div className="min-h-screen bg-white text-slate-800">
      {/* Velzon Sticky Top Navbar */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5">
          <div className="flex items-center gap-2 font-bold text-lg text-[#405189]">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-[#405189] text-xs font-extrabold text-white">
              DF
            </span>
            <span>{page?.title || "Velzon Admissions Portal"}</span>
          </div>
          <nav className="hidden items-center gap-6 text-xs font-semibold text-slate-600 md:flex">
            <a href="#hero" className="hover:text-[#0ab39c]">
              Home
            </a>
            <a href="#services" className="hover:text-[#0ab39c]">
              Services
            </a>
            <a href="#features" className="hover:text-[#0ab39c]">
              Features
            </a>
            <a href="#plans" className="hover:text-[#0ab39c]">
              Plans
            </a>
            <a href="#reviews" className="hover:text-[#0ab39c]">
              Reviews
            </a>
            <a href="#team" className="hover:text-[#0ab39c]">
              Team
            </a>
            <a href="#contact" className="hover:text-[#0ab39c]">
              Contact
            </a>
          </nav>
          <a
            href="#contact"
            className="rounded-md bg-[#0ab39c] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#099885]"
          >
            Apply Now
          </a>
        </div>
      </header>

      {/* Dynamic Ordered Velzon Sections */}
      {sections.map((sec) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let data: any = {}
        try {
          data = JSON.parse(sec.content_json || "{}")
        } catch {
          data = {}
        }

        switch (sec.section_key) {
          case "hero":
            return (
              <section
                id="hero"
                key={sec.id}
                className="relative overflow-hidden bg-gradient-to-br from-[#eef2ff] via-white to-[#ecfdf5] px-4 py-16 md:py-24"
              >
                <div className="mx-auto max-w-4xl text-center">
                  <span className="inline-block rounded-full bg-[#0ab39c]/10 px-3.5 py-1 text-xs font-semibold text-[#0ab39c]">
                    {page?.slug?.toUpperCase() || "VELZON LANDING"}
                  </span>
                  <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight text-slate-900 md:text-5xl">
                    {data.title ||
                      "The better way to manage your admissions with Velzon"}
                  </h1>
                  <p className="mx-auto mt-4 max-w-2xl text-sm text-slate-600 md:text-base">
                    {data.subtitle ||
                      "Velzon is a fully responsive, multipurpose admissions & CRM portal template."}
                  </p>
                  <div className="mt-7 flex flex-wrap justify-center gap-3">
                    <a
                      href={data.primary_btn?.url || "#contact"}
                      className="rounded-md bg-[#405189] px-6 py-3 text-xs font-semibold text-white shadow-md hover:bg-[#364574]"
                    >
                      {data.primary_btn?.text || "Get Started"} →
                    </a>
                    <a
                      href={data.secondary_btn?.url || "#plans"}
                      className="rounded-md bg-[#f06548] px-6 py-3 text-xs font-semibold text-white shadow-md hover:opacity-95"
                    >
                      {data.secondary_btn?.text || "View Plans"}
                    </a>
                  </div>
                </div>
              </section>
            )

          case "trusted":
            return (
              <section
                key={sec.id}
                className="border-y border-slate-100 bg-slate-50/70 px-4 py-8"
              >
                <div className="mx-auto max-w-6xl text-center">
                  <p className="mb-5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    {data.heading ||
                      "Trusted by top global recruiters & partner universities"}
                  </p>
                  <div className="grid grid-cols-2 items-center gap-4 sm:grid-cols-3 md:grid-cols-6">
                    {(
                      data.logos || [
                        "Amazon",
                        "Walmart",
                        "Lenovo",
                        "PayPal",
                        "Shopify",
                        "Verizon",
                      ]
                    ).map(
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      (logo: any, i: number) => {
                        const label =
                          typeof logo === "string" && !logo.includes("/")
                            ? logo
                            : ["Amazon", "Walmart", "Lenovo", "PayPal", "Shopify", "Verizon"][
                                i % 6
                              ]
                        return (
                          <div
                            key={i}
                            className="rounded-md border border-slate-200/70 bg-white px-4 py-2.5 text-sm font-bold tracking-wide text-slate-500 shadow-2xs"
                          >
                            {label}
                          </div>
                        )
                      }
                    )}
                  </div>
                </div>
              </section>
            )

          case "services":
            return (
              <section id="services" key={sec.id} className="px-4 py-16">
                <div className="mx-auto max-w-6xl">
                  <div className="mx-auto mb-10 max-w-2xl text-center">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#0ab39c]">
                      Our Services
                    </span>
                    <h2 className="mt-1 text-2xl font-bold text-slate-900">
                      {data.title}
                    </h2>
                    <p className="mt-2 text-xs text-slate-500">
                      {data.subtitle}
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {(data.items || []).map((item: any, idx: number) => (
                      <div
                        key={idx}
                        className="group rounded-xl border border-slate-200 bg-white p-5 transition hover:border-[#0ab39c]/50 hover:shadow-md"
                      >
                        <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-[#0ab39c]/10 text-xl text-[#0ab39c]">
                          <i className={item.icon || "ri-star-smile-line"} />
                        </div>
                        <h3 className="text-sm font-bold text-slate-900">
                          {item.title}
                        </h3>
                        <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
                          {item.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )

          case "features_top":
            return (
              <section
                id="features"
                key={sec.id}
                className="bg-slate-900 px-4 py-16 text-white"
              >
                <div className="mx-auto grid max-w-6xl items-center gap-8 md:grid-cols-2">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-[#0ab39c]">
                      Core Capabilities
                    </span>
                    <h2 className="mt-2 text-2xl font-bold">{data.title}</h2>
                    <p className="mt-3 text-xs leading-relaxed text-slate-300">
                      {data.description}
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {(data.stats || []).map((st: any, idx: number) => (
                      <div
                        key={idx}
                        className="rounded-xl border border-white/10 bg-white/5 p-5 text-center"
                      >
                        <div className="text-2xl font-extrabold text-[#0ab39c]">
                          {st.value}
                        </div>
                        <div className="mt-1 text-xs text-slate-300">
                          {st.label}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )

          case "cta":
            return (
              <section
                key={sec.id}
                className="bg-[#405189] px-4 py-10 text-white"
              >
                <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-center md:flex-row md:text-left">
                  <h3 className="text-xl font-bold">{data.title}</h3>
                  <a
                    href={data.cta_url || "#contact"}
                    className="rounded-md bg-[#0ab39c] px-6 py-2.5 text-xs font-semibold text-white shadow hover:bg-[#099885]"
                  >
                    {data.cta_text || "Get Started"} →
                  </a>
                </div>
              </section>
            )

          case "features_bottom":
            return (
              <section key={sec.id} className="bg-slate-50 px-4 py-16">
                <div className="mx-auto max-w-5xl text-center">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#405189]">
                    {data.eyebrow || "Highlights"}
                  </span>
                  <h2 className="mt-1 text-2xl font-bold text-slate-900">
                    {data.title}
                  </h2>
                  <p className="mx-auto mt-2 max-w-2xl text-xs text-slate-500">
                    {data.description}
                  </p>
                  <div className="mt-6 flex flex-wrap justify-center gap-3">
                    {(data.bullets || []).map((b: string, i: number) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 shadow-2xs"
                      >
                        <i className="ri-checkbox-circle-fill text-[#0ab39c]" />
                        {b}
                      </span>
                    ))}
                  </div>
                </div>
              </section>
            )

          case "plans":
            return (
              <section id="plans" key={sec.id} className="px-4 py-16">
                <div className="mx-auto max-w-6xl">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-slate-900">
                      {data.title}
                    </h2>
                    <p className="mt-1 text-xs text-slate-500">
                      {data.subtitle}
                    </p>
                    <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-slate-100 p-1 text-xs">
                      <button
                        type="button"
                        onClick={() => setAnnualBilling(false)}
                        className={`rounded-full px-4 py-1.5 font-semibold ${
                          !annualBilling
                            ? "bg-[#405189] text-white"
                            : "text-slate-600"
                        }`}
                      >
                        Monthly
                      </button>
                      <button
                        type="button"
                        onClick={() => setAnnualBilling(true)}
                        className={`rounded-full px-4 py-1.5 font-semibold ${
                          annualBilling
                            ? "bg-[#0ab39c] text-white"
                            : "text-slate-600"
                        }`}
                      >
                        Annual (Save 20%)
                      </button>
                    </div>
                  </div>
                  <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {(data.plans || []).map((pl: any, idx: number) => (
                      <div
                        key={idx}
                        className={`rounded-xl border p-6 shadow-xs ${
                          idx === 1
                            ? "border-[#0ab39c] ring-2 ring-[#0ab39c]/20"
                            : "border-slate-200"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-base font-bold text-slate-900">
                              {pl.name}
                            </h3>
                            <span className="text-[11px] text-slate-500">
                              {pl.tag}
                            </span>
                          </div>
                          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#405189]/10 text-lg text-[#405189]">
                            <i className={pl.icon || "ri-medal-line"} />
                          </span>
                        </div>
                        <div className="my-5 text-3xl font-extrabold text-slate-900">
                          {pl.currency_symbol || "$"}
                          {annualBilling ? pl.annual : pl.monthly}
                          <span className="text-xs font-normal text-slate-400">
                            /{annualBilling ? "yr" : "mo"}
                          </span>
                        </div>
                        <ul className="space-y-2 border-t border-slate-100 pt-4 text-xs">
                          {(pl.features || []).map((f: string, fi: number) => (
                            <li key={fi} className="flex items-center gap-2">
                              <i className="ri-check-line font-bold text-[#0ab39c]" />
                              <span>{f}</span>
                            </li>
                          ))}
                          {(pl.disabled || []).map((d: string, di: number) => (
                            <li
                              key={`d-${di}`}
                              className="flex items-center gap-2 text-slate-400 line-through"
                            >
                              <i className="ri-close-line text-rose-400" />
                              <span>{d}</span>
                            </li>
                          ))}
                        </ul>
                        <a
                          href="#contact"
                          className="mt-6 block w-full rounded-md bg-[#405189] py-2.5 text-center text-xs font-semibold text-white hover:bg-[#364574]"
                        >
                          Get Started
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )

          case "faqs":
            return (
              <section key={sec.id} className="bg-slate-50 px-4 py-16">
                <div className="mx-auto max-w-6xl">
                  <div className="mb-8 text-center">
                    <h2 className="text-2xl font-bold text-slate-900">
                      {data.title}
                    </h2>
                    <p className="mt-1 text-xs text-slate-500">
                      {data.subtitle}
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {["left", "right"].map((side) => (
                      <div key={side} className="space-y-2.5">
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        {(data[side] || []).map((faq: any, i: number) => {
                          const key = `${side}-${i}`
                          const isOpen = openFaq === key
                          return (
                            <div
                              key={key}
                              className="rounded-lg border border-slate-200 bg-white"
                            >
                              <button
                                type="button"
                                onClick={() => setOpenFaq(isOpen ? "" : key)}
                                className="flex w-full items-center justify-between px-4 py-3 text-left text-xs font-semibold text-slate-800"
                              >
                                <span>{faq.q}</span>
                                <span>{isOpen ? "−" : "+"}</span>
                              </button>
                              {isOpen && (
                                <div className="border-t border-slate-100 px-4 py-3 text-xs leading-relaxed text-slate-600">
                                  {faq.a}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )

          case "reviews":
            return (
              <section
                id="reviews"
                key={sec.id}
                className="bg-[#405189] px-4 py-16 text-white"
              >
                <div className="mx-auto max-w-5xl text-center">
                  <i className="ri-double-quotes-l text-3xl text-[#0ab39c]" />
                  <h2 className="mt-2 text-2xl font-bold">{data.headline}</h2>
                  <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {(data.slides || []).map((sl: any, i: number) => (
                      <div
                        key={i}
                        className="rounded-xl border border-white/15 bg-white/10 p-5 text-left"
                      >
                        <p className="text-xs italic leading-relaxed text-slate-100">
                          “{sl.text}”
                        </p>
                        <div className="mt-4 border-t border-white/10 pt-2.5">
                          <div className="text-xs font-bold">{sl.author}</div>
                          <div className="text-[11px] text-slate-300">
                            {sl.meta}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )

          case "counter":
            return (
              <section
                key={sec.id}
                className="border-b border-slate-100 px-4 py-12"
              >
                <div className="mx-auto grid max-w-5xl grid-cols-2 gap-6 text-center md:grid-cols-4">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {(data.counters || []).map((c: any, idx: number) => (
                    <div key={idx}>
                      <div className="text-3xl font-extrabold text-[#405189]">
                        {c.target}
                        {c.suffix || ""}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        {c.label}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )

          case "work_process":
            return (
              <section key={sec.id} className="px-4 py-16">
                <div className="mx-auto max-w-5xl text-center">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#0ab39c]">
                    Work Process
                  </span>
                  <h2 className="mt-1 text-2xl font-bold text-slate-900">
                    {data.title}
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">{data.subtitle}</p>
                  <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {(data.steps || []).map((st: any, idx: number) => (
                      <div
                        key={idx}
                        className="rounded-xl border border-slate-200 p-6"
                      >
                        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#405189]/10 text-xl text-[#405189]">
                          <i className={st.icon || "ri-check-double-line"} />
                        </div>
                        <h3 className="text-sm font-bold text-slate-900">
                          {st.title}
                        </h3>
                        <p className="mt-1 text-xs text-slate-500">{st.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )

          case "team":
            return (
              <section id="team" key={sec.id} className="bg-slate-50 px-4 py-16">
                <div className="mx-auto max-w-6xl text-center">
                  <h2 className="text-2xl font-bold text-slate-900">
                    {data.title}
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">{data.subtitle}</p>
                  <div className="mt-8 grid grid-cols-2 gap-5 md:grid-cols-4">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {(data.members || []).map((m: any, idx: number) => (
                      <div
                        key={idx}
                        className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs"
                      >
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#405189] text-lg font-bold text-white">
                          {(m.name || "U")
                            .split(" ")
                            .map((w: string) => w[0])
                            .join("")
                            .slice(0, 2)}
                        </div>
                        <h4 className="mt-3 text-sm font-bold text-slate-900">
                          {m.name}
                        </h4>
                        <p className="text-xs text-slate-500">{m.role}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )

          case "contact":
            return (
              <section id="contact" key={sec.id} className="px-4 py-16">
                <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-12">
                  <div className="space-y-4 md:col-span-5">
                    <h2 className="text-2xl font-bold text-slate-900">
                      {data.title || "Get In Touch"}
                    </h2>
                    <p className="text-xs leading-relaxed text-slate-500">
                      {data.subtitle}
                    </p>
                    <div className="space-y-2 pt-2 text-xs text-slate-600">
                      {(data.addresses || []).map((addr: string, i: number) => (
                        <div key={i} className="flex items-start gap-2">
                          <i className="ri-map-pin-line mt-0.5 text-[#0ab39c]" />
                          <span>{addr}</span>
                        </div>
                      ))}
                      {data.hours && (
                        <div className="flex items-center gap-2">
                          <i className="ri-time-line text-[#0ab39c]" />
                          <span>{data.hours}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm md:col-span-7">
                    {submitted ? (
                      <div className="py-8 text-center text-sm font-semibold text-[#0ab39c]">
                        ✓ Thank you! Your inquiry has been recorded in our Admissions CRM.
                      </div>
                    ) : (
                      <form onSubmit={submitLead} className="space-y-3 text-xs">
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <Input
                            required
                            placeholder="Your Full Name *"
                            value={leadForm.name}
                            onChange={(e) =>
                              setLeadForm({ ...leadForm, name: e.target.value })
                            }
                            className="h-9 border-slate-300 bg-white text-xs text-slate-900"
                          />
                          <Input
                            required
                            placeholder="Mobile Number *"
                            value={leadForm.mobile}
                            onChange={(e) =>
                              setLeadForm({
                                ...leadForm,
                                mobile: e.target.value,
                              })
                            }
                            className="h-9 border-slate-300 bg-white text-xs text-slate-900"
                          />
                          <Input
                            type="email"
                            placeholder="Email Address"
                            value={leadForm.email}
                            onChange={(e) =>
                              setLeadForm({
                                ...leadForm,
                                email: e.target.value,
                              })
                            }
                            className="h-9 border-slate-300 bg-white text-xs text-slate-900"
                          />
                          <Input
                            placeholder="City"
                            value={leadForm.city}
                            onChange={(e) =>
                              setLeadForm({ ...leadForm, city: e.target.value })
                            }
                            className="h-9 border-slate-300 bg-white text-xs text-slate-900"
                          />
                        </div>
                        <Textarea
                          rows={3}
                          placeholder="Your Message / Preferred Program..."
                          value={leadForm.message}
                          onChange={(e) =>
                            setLeadForm({
                              ...leadForm,
                              message: e.target.value,
                            })
                          }
                          className="border-slate-300 bg-white text-xs text-slate-900"
                        />
                        <Button
                          type="submit"
                          className="h-10 bg-[#0ab39c] px-6 font-semibold text-white hover:bg-[#099885]"
                        >
                          {data.submit_text || "Send Message"}
                        </Button>
                      </form>
                    )}
                  </div>
                </div>
              </section>
            )

          case "footer":
            return (
              <footer
                key={sec.id}
                className="bg-slate-900 px-4 py-12 text-xs text-slate-400"
              >
                <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-4">
                  <div>
                    <div className="text-base font-bold text-white">
                      {page?.title || "Velzon"}
                    </div>
                    <p className="mt-2 leading-relaxed">{data.desc}</p>
                  </div>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {(data.links_column || []).map((col: any, ci: number) => (
                    <div key={ci}>
                      <h5 className="mb-3 font-semibold text-white">
                        {col.title}
                      </h5>
                      <ul className="space-y-2">
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        {(col.items || []).map((it: any, ii: number) => (
                          <li key={ii}>
                            <a href={it.url || "#"} className="hover:text-white">
                              {it.label}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
                <div className="mx-auto mt-8 max-w-6xl border-t border-slate-800 pt-6 text-center text-[11px]">
                  © {new Date().getFullYear()} Digital Fueled LMS CRM. All rights reserved.
                </div>
              </footer>
            )

          default:
            return null
        }
      })}
    </div>
  )
}
