export function safeBigInt(
  value: unknown,
  fallback: bigint | null = null
): bigint | null {
  if (typeof value === "bigint") return value
  if (typeof value === "number") {
    return Number.isFinite(value) ? BigInt(Math.trunc(value)) : fallback
  }
  if (typeof value === "string") {
    const trimmed = value.trim()
    if (/^-?\d+$/.test(trimmed)) {
      return BigInt(trimmed)
    }
  }
  return fallback
}

export function serializeData<T>(value: T): T {
  if (value === null || value === undefined) {
    return value
  }
  if (typeof value === "bigint") {
    return Number(value) as unknown as T
  }
  if (value instanceof Date) {
    return value.toISOString() as unknown as T
  }
  if (typeof value === "object") {
    const maybeDecimal = value as { toNumber?: () => number; s?: number; e?: number; d?: number[] }
    if (typeof maybeDecimal.toNumber === "function") {
      return maybeDecimal.toNumber() as unknown as T
    }
    if (Array.isArray(value)) {
      return value.map((item) => serializeData(item)) as unknown as T
    }
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = serializeData(v)
    }
    return out as T
  }
  return value
}

export function formatDateShort(input?: string | Date | null): string {
  if (!input) return "-"
  const d = typeof input === "string" ? new Date(input) : input
  if (Number.isNaN(d.getTime())) return "-"
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

export function formatDateTime(input?: string | Date | null): string {
  if (!input) return "-"
  const d = typeof input === "string" ? new Date(input) : input
  if (Number.isNaN(d.getTime())) return "-"
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}
