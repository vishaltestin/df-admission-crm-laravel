"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"

type RichTextEditorProps = {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  minHeight?: number
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Compose rich HTML email content...",
  minHeight = 220,
}: RichTextEditorProps) {
  const editorRef = React.useRef<HTMLDivElement>(null)
  const [sourceMode, setSourceMode] = React.useState(false)
  const lastHtmlRef = React.useRef<string>("")

  React.useEffect(() => {
    if (!sourceMode && editorRef.current && value !== lastHtmlRef.current) {
      editorRef.current.innerHTML = value || ""
      lastHtmlRef.current = value || ""
    }
  }, [value, sourceMode])

  function syncFromDom() {
    if (!editorRef.current) return
    const html = editorRef.current.innerHTML
    lastHtmlRef.current = html
    onChange(html)
  }

  function exec(cmd: string, arg?: string) {
    if (sourceMode) return
    editorRef.current?.focus()
    document.execCommand(cmd, false, arg)
    syncFromDom()
  }

  return (
    <div className="overflow-hidden rounded-md border border-input bg-background">
      {/* Formatting Toolbar */}
      <div className="flex flex-wrap items-center gap-1 border-b border-border bg-muted/40 px-2 py-1.5 text-xs">
        <select
          onChange={(e) => {
            if (e.target.value) exec("formatBlock", e.target.value)
          }}
          defaultValue="P"
          disabled={sourceMode}
          className="h-7 rounded border border-input bg-background px-1.5 text-[11px]"
        >
          <option value="P">Paragraph</option>
          <option value="H1">Heading 1</option>
          <option value="H2">Heading 2</option>
          <option value="H3">Heading 3</option>
          <option value="BLOCKQUOTE">Quote</option>
        </select>

        <Button
          type="button"
          size="xs"
          variant="outline"
          disabled={sourceMode}
          onClick={() => exec("bold")}
          title="Bold"
          className="h-7 px-2 font-bold"
        >
          B
        </Button>
        <Button
          type="button"
          size="xs"
          variant="outline"
          disabled={sourceMode}
          onClick={() => exec("italic")}
          title="Italic"
          className="h-7 px-2 italic"
        >
          I
        </Button>
        <Button
          type="button"
          size="xs"
          variant="outline"
          disabled={sourceMode}
          onClick={() => exec("underline")}
          title="Underline"
          className="h-7 px-2 underline"
        >
          U
        </Button>
        <Button
          type="button"
          size="xs"
          variant="outline"
          disabled={sourceMode}
          onClick={() => exec("strikeThrough")}
          title="Strikethrough"
          className="h-7 px-2 line-through"
        >
          S
        </Button>

        <span className="mx-0.5 h-4 w-px bg-border" />

        <Button
          type="button"
          size="xs"
          variant="outline"
          disabled={sourceMode}
          onClick={() => exec("justifyLeft")}
          title="Align Left"
          className="h-7 px-2"
        >
          <i className="ri-align-left" />
        </Button>
        <Button
          type="button"
          size="xs"
          variant="outline"
          disabled={sourceMode}
          onClick={() => exec("justifyCenter")}
          title="Align Center"
          className="h-7 px-2"
        >
          <i className="ri-align-center" />
        </Button>
        <Button
          type="button"
          size="xs"
          variant="outline"
          disabled={sourceMode}
          onClick={() => exec("insertUnorderedList")}
          title="Bullet List"
          className="h-7 px-2"
        >
          <i className="ri-list-unordered" />
        </Button>
        <Button
          type="button"
          size="xs"
          variant="outline"
          disabled={sourceMode}
          onClick={() => exec("insertOrderedList")}
          title="Numbered List"
          className="h-7 px-2"
        >
          <i className="ri-list-ordered" />
        </Button>

        <label
          title="Text Color"
          className="flex h-7 cursor-pointer items-center gap-1 rounded border border-input bg-background px-1.5 text-[11px]"
        >
          <span>A</span>
          <input
            type="color"
            defaultValue="#405189"
            disabled={sourceMode}
            onChange={(e) => exec("foreColor", e.target.value)}
            className="h-4 w-4 cursor-pointer border-0 bg-transparent p-0"
          />
        </label>

        <Button
          type="button"
          size="xs"
          variant="outline"
          disabled={sourceMode}
          onClick={() => {
            const url = window.prompt(
              "Enter URL:",
              "https://adtu.in/admissions"
            )
            if (url) exec("createLink", url)
          }}
          title="Insert Link"
          className="h-7 px-2"
        >
          <i className="ri-link" />
        </Button>

        <Button
          type="button"
          size="xs"
          variant="outline"
          disabled={sourceMode}
          onClick={() =>
            exec(
              "insertHTML",
              '<a href="{application_link}" style="display:inline-block;padding:8px 16px;background:#405189;color:#ffffff;border-radius:4px;text-decoration:none;font-weight:600;">Complete Application</a>'
            )
          }
          title="Insert CTA Button"
          className="h-7 px-2 text-[11px]"
        >
          + CTA Button
        </Button>

        <Button
          type="button"
          size="xs"
          variant="outline"
          disabled={sourceMode}
          onClick={() => exec("removeFormat")}
          title="Clear Formatting"
          className="h-7 px-2"
        >
          <i className="ri-format-clear" />
        </Button>

        <div className="ml-auto">
          <Button
            type="button"
            size="xs"
            variant={sourceMode ? "default" : "outline"}
            onClick={() => setSourceMode((s) => !s)}
            className="h-7 font-mono text-[11px]"
          >
            {sourceMode ? "Visual Editor" : "</> HTML"}
          </Button>
        </div>
      </div>

      {/* Editor Surface */}
      {sourceMode ? (
        <textarea
          value={value}
          onChange={(e) => {
            lastHtmlRef.current = e.target.value
            onChange(e.target.value)
          }}
          style={{ minHeight }}
          className="w-full bg-slate-950 p-3 font-mono text-xs text-emerald-300 focus:outline-none"
        />
      ) : (
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          data-placeholder={placeholder}
          onInput={syncFromDom}
          onBlur={syncFromDom}
          style={{ minHeight }}
          className="prose prose-sm max-w-none p-3 text-xs leading-relaxed text-foreground focus:outline-none [&_a]:text-[#405189] [&_a]:underline [&_h1]:text-lg [&_h1]:font-bold [&_h2]:text-base [&_h2]:font-bold [&_h3]:text-sm [&_h3]:font-semibold [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5"
        />
      )}
    </div>
  )
}
