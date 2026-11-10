"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const EMPTY_SENTINEL = "__SHADCN_EMPTY__"

export interface FormSelectOption {
  value: string
  label: React.ReactNode
  disabled?: boolean
}

export interface FormSelectProps {
  value?: string | number | null
  defaultValue?: string | number
  onValueChange?: (value: string) => void
  onChange?: (e: { target: { value: string; name?: string } }) => void
  options?: FormSelectOption[]
  children?: React.ReactNode
  placeholder?: string
  disabled?: boolean
  required?: boolean
  name?: string
  id?: string
  className?: string
  contentClassName?: string
  size?: "sm" | "default"
  title?: string
  "aria-label"?: string
}

function extractText(node: React.ReactNode): string {
  if (node === null || node === undefined || typeof node === "boolean") {
    return ""
  }
  if (typeof node === "string" || typeof node === "number") {
    return String(node)
  }
  if (Array.isArray(node)) {
    return node.map(extractText).join("")
  }
  if (React.isValidElement<{ children?: React.ReactNode }>(node)) {
    return extractText(node.props.children)
  }
  return ""
}

function parseOptionChildren(children: React.ReactNode): FormSelectOption[] {
  const result: FormSelectOption[] = []

  const walk = (nodes: React.ReactNode) => {
    React.Children.forEach(nodes, (child) => {
      if (!React.isValidElement(child)) return
      const el = child as React.ReactElement<{
        value?: string | number
        disabled?: boolean
        label?: string
        children?: React.ReactNode
      }>

      if (el.type === "option") {
        const labelText = extractText(el.props.children) || el.props.label || ""
        const rawVal =
          el.props.value !== undefined ? String(el.props.value) : labelText
        result.push({
          value: rawVal,
          label: el.props.children ?? labelText,
          disabled: Boolean(el.props.disabled),
        })
      } else if (el.type === "optgroup") {
        walk(el.props.children)
      } else if (el.type === React.Fragment) {
        walk(el.props.children)
      }
    })
  }

  walk(children)
  return result
}

export function FormSelect({
  value,
  defaultValue,
  onValueChange,
  onChange,
  options,
  children,
  placeholder,
  disabled,
  name,
  id,
  className,
  contentClassName,
  size = "default",
  title,
  "aria-label": ariaLabel,
}: FormSelectProps) {
  const parsedOptions = React.useMemo(() => {
    if (options && options.length > 0) return options
    return parseOptionChildren(children)
  }, [options, children])

  // Deduplicate values so Radix Select never encounters duplicate keys
  const uniqueOptions = React.useMemo(() => {
    const seen = new Set<string>()
    return parsedOptions.filter((opt) => {
      const k = opt.value === "" ? EMPTY_SENTINEL : opt.value
      if (seen.has(k)) return false
      seen.add(k)
      return true
    })
  }, [parsedOptions])

  const emptyOption = uniqueOptions.find((o) => o.value === "")
  const resolvedPlaceholder =
    placeholder ||
    (emptyOption ? extractText(emptyOption.label).trim() : "Select...")

  const normalizedValue =
    value !== undefined && value !== null
      ? String(value) === ""
        ? emptyOption
          ? EMPTY_SENTINEL
          : ""
        : String(value)
      : undefined

  const normalizedDefault =
    defaultValue !== undefined
      ? String(defaultValue) === ""
        ? emptyOption
          ? EMPTY_SENTINEL
          : undefined
        : String(defaultValue)
      : undefined

  function handleSelect(raw: string) {
    const actual = raw === EMPTY_SENTINEL ? "" : raw
    onValueChange?.(actual)
    onChange?.({ target: { value: actual, name } })
  }

  return (
    <Select
      value={normalizedValue}
      defaultValue={normalizedDefault}
      onValueChange={handleSelect}
      disabled={disabled}
      name={name}
    >
      <SelectTrigger
        id={id}
        size={size}
        title={title}
        aria-label={ariaLabel}
        className={cn(
          "h-9 w-full bg-background text-xs font-normal",
          className
        )}
      >
        <SelectValue placeholder={resolvedPlaceholder} />
      </SelectTrigger>
      <SelectContent
        position="popper"
        className={cn("z-[85] max-h-72 text-xs", contentClassName)}
      >
        {uniqueOptions.map((opt) => {
          const itemVal = opt.value === "" ? EMPTY_SENTINEL : opt.value
          return (
            <SelectItem
              key={itemVal}
              value={itemVal}
              disabled={opt.disabled}
              className="text-xs"
            >
              {opt.label}
            </SelectItem>
          )
        })}
      </SelectContent>
    </Select>
  )
}
