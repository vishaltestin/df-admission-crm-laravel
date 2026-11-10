"use client"

import * as React from "react"
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $getSelection,
  $insertNodes,
  $isElementNode,
  $isRangeSelection,
  $isTextNode,
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  COMMAND_PRIORITY_LOW,
  FORMAT_ELEMENT_COMMAND,
  FORMAT_TEXT_COMMAND,
  INDENT_CONTENT_COMMAND,
  OUTDENT_CONTENT_COMMAND,
  REDO_COMMAND,
  SELECTION_CHANGE_COMMAND,
  UNDO_COMMAND,
} from "lexical"
import { LexicalComposer } from "@lexical/react/LexicalComposer"
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin"
import { ContentEditable } from "@lexical/react/LexicalContentEditable"
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin"
import { ListPlugin } from "@lexical/react/LexicalListPlugin"
import { CheckListPlugin } from "@lexical/react/LexicalCheckListPlugin"
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin"
import { TablePlugin } from "@lexical/react/LexicalTablePlugin"
import {
  HorizontalRuleNode,
  INSERT_HORIZONTAL_RULE_COMMAND,
} from "@lexical/react/LexicalHorizontalRuleNode"
import { HorizontalRulePlugin } from "@lexical/react/LexicalHorizontalRulePlugin"
import { TabIndentationPlugin } from "@lexical/react/LexicalTabIndentationPlugin"
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import { $generateHtmlFromNodes, $generateNodesFromDOM } from "@lexical/html"
import {
  $createHeadingNode,
  $createQuoteNode,
  $isHeadingNode,
  HeadingNode,
  QuoteNode,
  type HeadingTagType,
} from "@lexical/rich-text"
import {
  $isListNode,
  INSERT_CHECK_LIST_COMMAND,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  ListItemNode,
  ListNode,
  REMOVE_LIST_COMMAND,
} from "@lexical/list"
import {
  $createLinkNode,
  $isLinkNode,
  AutoLinkNode,
  LinkNode,
  TOGGLE_LINK_COMMAND,
} from "@lexical/link"
import { $createCodeNode, $isCodeNode, CodeNode } from "@lexical/code"
import {
  INSERT_TABLE_COMMAND,
  TableCellNode,
  TableNode,
  TableRowNode,
} from "@lexical/table"
import {
  $getSelectionStyleValueForProperty,
  $patchStyleText,
  $setBlocksType,
} from "@lexical/selection"
import { $getNearestNodeOfType, mergeRegister } from "@lexical/utils"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

export type RichTextEditorProps = {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  minHeight?: number
  insertRef?: React.MutableRefObject<((text: string) => void) | null>
  variables?: { token: string; label?: string }[]
}

const DEFAULT_MERGE_TAGS = [
  { token: "{lead_name}", label: "Lead Name" },
  { token: "{lead_email}", label: "Lead Email" },
  { token: "{lead_mobile}", label: "Lead Mobile" },
  { token: "{lead_id}", label: "Lead ID" },
  { token: "{programme_name}", label: "Programme" },
  { token: "{institute_name}", label: "Institute" },
  { token: "{course_name}", label: "Course" },
  { token: "{application_link}", label: "Application URL" },
  { token: "{assigned_user_name}", label: "Counsellor" },
  { token: "{lead_city}", label: "City" },
  { token: "{lead_state}", label: "State" },
  { token: "{company_name}", label: "Organization" },
]

const TEXT_COLORS = [
  "#0f172a",
  "#475569",
  "#405189",
  "#0ab39c",
  "#2563eb",
  "#7c3aed",
  "#db2777",
  "#dc2626",
  "#ea580c",
  "#ca8a04",
  "#16a34a",
  "#ffffff",
]

const HIGHLIGHT_COLORS = [
  "transparent",
  "#fef08a",
  "#bbf7d0",
  "#bae6fd",
  "#e9d5ff",
  "#fbcfe8",
  "#fecaca",
  "#fed7aa",
  "#e2e8f0",
]

const FONT_FAMILIES = [
  { value: "Inter, Arial, sans-serif", label: "Sans Serif" },
  { value: "Arial, Helvetica, sans-serif", label: "Arial" },
  { value: "Georgia, serif", label: "Georgia" },
  { value: "'Times New Roman', Times, serif", label: "Times New Roman" },
  { value: "Verdana, Geneva, sans-serif", label: "Verdana" },
  { value: "'Courier New', Courier, monospace", label: "Monospace" },
]

const FONT_SIZES = [
  "12px",
  "13px",
  "14px",
  "16px",
  "18px",
  "20px",
  "24px",
  "30px",
]

const LEXICAL_THEME = {
  paragraph: "mb-2 leading-relaxed",
  quote:
    "my-2 border-l-4 border-[#405189] bg-muted/40 py-1.5 pl-3 italic text-muted-foreground",
  heading: {
    h1: "mb-2.5 text-xl font-bold text-foreground",
    h2: "mb-2 text-lg font-bold text-foreground",
    h3: "mb-1.5 text-base font-semibold text-foreground",
  },
  list: {
    nested: {
      listitem: "list-none",
    },
    ol: "my-2 ml-5 list-decimal space-y-1",
    ul: "my-2 ml-5 list-disc space-y-1",
    listitem: "pl-1",
    listitemChecked:
      "relative my-1 list-none pl-5 line-through text-muted-foreground before:absolute before:left-0 before:content-['☑'] before:text-[#0ab39c]",
    listitemUnchecked:
      "relative my-1 list-none pl-5 before:absolute before:left-0 before:content-['☐'] before:text-muted-foreground",
  },
  link: "font-medium text-[#405189] underline underline-offset-2 cursor-pointer",
  text: {
    bold: "font-bold",
    italic: "italic",
    underline: "underline",
    strikethrough: "line-through",
    underlineStrikethrough: "underline line-through",
    code: "rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-rose-600 dark:text-rose-400",
    subscript: "sub text-[10px]",
    superscript: "sup text-[10px]",
  },
  code: "my-2 block overflow-x-auto rounded-md bg-slate-900 p-3 font-mono text-xs text-slate-100",
  table: "my-3 w-full border-collapse border border-border text-xs",
  tableCell: "border border-border px-2.5 py-1.5 align-top",
  tableCellHeader:
    "border border-border bg-muted/60 px-2.5 py-1.5 text-left font-semibold",
}

function HtmlSyncPlugin({
  value,
  onChange,
  lastEmittedHtmlRef,
  onStatsChange,
}: {
  value: string
  onChange: (html: string) => void
  lastEmittedHtmlRef: React.MutableRefObject<string>
  onStatsChange: (stats: { words: number; chars: number }) => void
}) {
  const [editor] = useLexicalComposerContext()
  const initializedRef = React.useRef(false)

  // Hydrate initial or externally updated HTML into Lexical
  React.useEffect(() => {
    const incoming = value ?? ""
    if (initializedRef.current && incoming === lastEmittedHtmlRef.current) {
      return
    }
    initializedRef.current = true
    lastEmittedHtmlRef.current = incoming

    editor.update(() => {
      const root = $getRoot()
      root.clear()

      if (!incoming.trim()) {
        root.append($createParagraphNode())
        return
      }

      const parser = new DOMParser()
      const dom = parser.parseFromString(incoming, "text/html")
      const generatedNodes = $generateNodesFromDOM(editor, dom)
      const validNodes = generatedNodes.filter(
        (n) => $isElementNode(n) || $isTextNode(n)
      )

      if (validNodes.length === 0) {
        const p = $createParagraphNode()
        p.append($createTextNode(dom.body.textContent || ""))
        root.append(p)
        return
      }

      // Lexical root only accepts element or decorator block nodes
      const blockNodes = []
      let inlineBuffer: typeof validNodes = []
      const flushInline = () => {
        if (inlineBuffer.length > 0) {
          const p = $createParagraphNode()
          for (const inl of inlineBuffer) p.append(inl)
          blockNodes.push(p)
          inlineBuffer = []
        }
      }

      for (const node of validNodes) {
        if ($isElementNode(node) && !node.isInline()) {
          flushInline()
          blockNodes.push(node)
        } else {
          inlineBuffer.push(node)
        }
      }
      flushInline()

      if (blockNodes.length > 0) {
        for (const bn of blockNodes) root.append(bn)
      } else {
        root.append($createParagraphNode())
      }
    })

    editor.getEditorState().read(() => {
      const txt = $getRoot().getTextContent()
      const words = txt.trim() ? txt.trim().split(/\s+/).length : 0
      onStatsChange({ words, chars: txt.length })
    })
  }, [editor, value, lastEmittedHtmlRef, onStatsChange])

  // Emit HTML on Lexical updates
  React.useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const html = $generateHtmlFromNodes(editor, null)
        const txt = $getRoot().getTextContent()
        const words = txt.trim() ? txt.trim().split(/\s+/).length : 0
        onStatsChange({ words, chars: txt.length })
        if (html !== lastEmittedHtmlRef.current) {
          lastEmittedHtmlRef.current = html
          onChange(html)
        }
      })
    })
  }, [editor, onChange, lastEmittedHtmlRef, onStatsChange])

  return null
}

function InsertBridgePlugin({
  insertRef,
}: {
  insertRef?: React.MutableRefObject<((text: string) => void) | null>
}) {
  const [editor] = useLexicalComposerContext()

  React.useEffect(() => {
    if (!insertRef) return
    insertRef.current = (token: string) => {
      editor.focus(() => {
        editor.update(() => {
          const selection = $getSelection()
          if ($isRangeSelection(selection)) {
            selection.insertText(token)
          } else {
            const root = $getRoot()
            const p = $createParagraphNode()
            p.append($createTextNode(token))
            root.append(p)
          }
        })
      })
    }
    return () => {
      insertRef.current = null
    }
  }, [editor, insertRef])

  return null
}

function LexicalToolbar({
  sourceMode,
  onToggleSource,
  previewMode,
  onTogglePreview,
  mergeTags,
}: {
  sourceMode: boolean
  onToggleSource: () => void
  previewMode: boolean
  onTogglePreview: () => void
  mergeTags: { token: string; label?: string }[]
}) {
  const [editor] = useLexicalComposerContext()

  const [canUndo, setCanUndo] = React.useState(false)
  const [canRedo, setCanRedo] = React.useState(false)
  const [blockType, setBlockType] = React.useState("paragraph")
  const [fontFamily, setFontFamily] = React.useState(
    "Inter, Arial, sans-serif"
  )
  const [fontSize, setFontSize] = React.useState("14px")
  const [fontColor, setFontColor] = React.useState("#0f172a")
  const [bgColor, setBgColor] = React.useState("transparent")

  const [isBold, setIsBold] = React.useState(false)
  const [isItalic, setIsItalic] = React.useState(false)
  const [isUnderline, setIsUnderline] = React.useState(false)
  const [isStrikethrough, setIsStrikethrough] = React.useState(false)
  const [isCode, setIsCode] = React.useState(false)
  const [isLink, setIsLink] = React.useState(false)
  const [linkUrl, setLinkUrl] = React.useState("https://")
  const [linkOpen, setLinkOpen] = React.useState(false)

  const [tableOpen, setTableOpen] = React.useState(false)
  const [tableRows, setTableRows] = React.useState("3")
  const [tableCols, setTableCols] = React.useState("3")

  const [ctaOpen, setCtaOpen] = React.useState(false)
  const [ctaLabel, setCtaLabel] = React.useState("Complete Application Now")
  const [ctaHref, setCtaHref] = React.useState("{application_link}")

  const [mergeOpen, setMergeOpen] = React.useState(false)

  const refreshToolbar = React.useCallback(() => {
    const selection = $getSelection()
    if (!$isRangeSelection(selection)) return

    setIsBold(selection.hasFormat("bold"))
    setIsItalic(selection.hasFormat("italic"))
    setIsUnderline(selection.hasFormat("underline"))
    setIsStrikethrough(selection.hasFormat("strikethrough"))
    setIsCode(selection.hasFormat("code"))

    setFontFamily(
      $getSelectionStyleValueForProperty(
        selection,
        "font-family",
        "Inter, Arial, sans-serif"
      )
    )
    setFontSize(
      $getSelectionStyleValueForProperty(selection, "font-size", "14px")
    )
    setFontColor(
      $getSelectionStyleValueForProperty(selection, "color", "#0f172a")
    )
    setBgColor(
      $getSelectionStyleValueForProperty(
        selection,
        "background-color",
        "transparent"
      )
    )

    const anchorNode = selection.anchor.getNode()
    const parent = anchorNode.getParent()
    if ($isLinkNode(parent)) {
      setIsLink(true)
      setLinkUrl(parent.getURL())
    } else if ($isLinkNode(anchorNode)) {
      setIsLink(true)
      setLinkUrl(anchorNode.getURL())
    } else {
      setIsLink(false)
    }

    const element =
      anchorNode.getKey() === "root"
        ? anchorNode
        : anchorNode.getTopLevelElementOrThrow()

    if ($isListNode(element)) {
      const parentList = $getNearestNodeOfType<ListNode>(anchorNode, ListNode)
      const listType = parentList
        ? parentList.getListType()
        : element.getListType()
      setBlockType(listType)
    } else if ($isHeadingNode(element)) {
      setBlockType(element.getTag())
    } else if ($isCodeNode(element)) {
      setBlockType("code")
    } else {
      setBlockType(element.getType())
    }
  }, [])

  React.useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          refreshToolbar()
        })
      }),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          refreshToolbar()
          return false
        },
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        CAN_UNDO_COMMAND,
        (payload) => {
          setCanUndo(payload)
          return false
        },
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        CAN_REDO_COMMAND,
        (payload) => {
          setCanRedo(payload)
          return false
        },
        COMMAND_PRIORITY_LOW
      )
    )
  }, [editor, refreshToolbar])

  function applyBlockType(nextType: string) {
    if (nextType === "bullet") {
      if (blockType !== "bullet") {
        editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)
      } else {
        editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined)
      }
      return
    }
    if (nextType === "number") {
      if (blockType !== "number") {
        editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)
      } else {
        editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined)
      }
      return
    }
    if (nextType === "check") {
      if (blockType !== "check") {
        editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined)
      } else {
        editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined)
      }
      return
    }

    editor.update(() => {
      const selection = $getSelection()
      if (!$isRangeSelection(selection)) return
      if (nextType === "paragraph") {
        $setBlocksType(selection, () => $createParagraphNode())
      } else if (nextType === "h1" || nextType === "h2" || nextType === "h3") {
        $setBlocksType(selection, () =>
          $createHeadingNode(nextType as HeadingTagType)
        )
      } else if (nextType === "quote") {
        $setBlocksType(selection, () => $createQuoteNode())
      } else if (nextType === "code") {
        $setBlocksType(selection, () => $createCodeNode())
      }
    })
  }

  function applyStyleText(styles: Record<string, string>) {
    editor.update(() => {
      const selection = $getSelection()
      if ($isRangeSelection(selection)) {
        $patchStyleText(selection, styles)
      }
    })
  }

  function clearFormatting() {
    editor.update(() => {
      const selection = $getSelection()
      if (!$isRangeSelection(selection)) return
      $patchStyleText(selection, {
        color: "",
        "background-color": "",
        "font-size": "",
        "font-family": "",
      })
      selection.getNodes().forEach((node) => {
        if ($isTextNode(node)) {
          node.setFormat(0)
          node.setStyle("")
        }
      })
    })
  }

  function insertToken(token: string) {
    editor.focus(() => {
      editor.update(() => {
        const selection = $getSelection()
        if ($isRangeSelection(selection)) {
          selection.insertText(token)
        } else {
          const p = $createParagraphNode()
          p.append($createTextNode(token))
          $getRoot().append(p)
        }
      })
    })
  }

  function insertCtaButton() {
    editor.focus(() => {
      editor.update(() => {
        const link = $createLinkNode(ctaHref || "https://")
        const txt = $createTextNode(ctaLabel || "Apply Now")
        txt.setStyle(
          "display:inline-block;background-color:#405189;color:#ffffff;padding:8px 18px;border-radius:6px;font-weight:600;text-decoration:none;"
        )
        link.append(txt)
        const p = $createParagraphNode()
        p.append(link)
        $insertNodes([p])
      })
    })
    setCtaOpen(false)
  }

  const disabled = sourceMode || previewMode

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-border bg-muted/40 px-2 py-1.5 text-xs">
      {/* Undo / Redo */}
      <Button
        type="button"
        size="xs"
        variant="ghost"
        disabled={disabled || !canUndo}
        onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}
        title="Undo (Ctrl+Z)"
        className="h-7 w-7 p-0"
      >
        <i className="ri-arrow-go-back-line text-sm" />
      </Button>
      <Button
        type="button"
        size="xs"
        variant="ghost"
        disabled={disabled || !canRedo}
        onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}
        title="Redo (Ctrl+Y)"
        className="h-7 w-7 p-0"
      >
        <i className="ri-arrow-go-forward-line text-sm" />
      </Button>

      <span className="mx-0.5 h-4 w-px bg-border" />

      {/* Block Type Select (shadcn/ui Select) */}
      <Select
        disabled={disabled}
        value={
          ["paragraph", "h1", "h2", "h3", "quote", "code", "bullet", "number", "check"].includes(
            blockType
          )
            ? blockType
            : "paragraph"
        }
        onValueChange={applyBlockType}
      >
        <SelectTrigger size="sm" className="h-7 w-[118px] px-2 text-[11px]">
          <SelectValue placeholder="Paragraph" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="paragraph">Paragraph</SelectItem>
          <SelectItem value="h1">Heading 1</SelectItem>
          <SelectItem value="h2">Heading 2</SelectItem>
          <SelectItem value="h3">Heading 3</SelectItem>
          <SelectItem value="quote">Blockquote</SelectItem>
          <SelectItem value="code">Code Block</SelectItem>
          <SelectItem value="bullet">Bullet List</SelectItem>
          <SelectItem value="number">Numbered List</SelectItem>
          <SelectItem value="check">Checklist</SelectItem>
        </SelectContent>
      </Select>

      {/* Font Family Select */}
      <Select
        disabled={disabled}
        value={fontFamily}
        onValueChange={(val) => {
          setFontFamily(val)
          applyStyleText({ "font-family": val })
        }}
      >
        <SelectTrigger size="sm" className="h-7 w-[112px] px-2 text-[11px]">
          <SelectValue placeholder="Font" />
        </SelectTrigger>
        <SelectContent>
          {FONT_FAMILIES.map((f) => (
            <SelectItem key={f.value} value={f.value}>
              {f.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Font Size Select */}
      <Select
        disabled={disabled}
        value={fontSize}
        onValueChange={(val) => {
          setFontSize(val)
          applyStyleText({ "font-size": val })
        }}
      >
        <SelectTrigger size="sm" className="h-7 w-[68px] px-2 text-[11px]">
          <SelectValue placeholder="14px" />
        </SelectTrigger>
        <SelectContent>
          {FONT_SIZES.map((sz) => (
            <SelectItem key={sz} value={sz}>
              {sz}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <span className="mx-0.5 h-4 w-px bg-border" />

      {/* Inline Text Styles */}
      <Button
        type="button"
        size="xs"
        variant={isBold ? "default" : "ghost"}
        disabled={disabled}
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold")}
        title="Bold (Ctrl+B)"
        className={cn(
          "h-7 w-7 p-0 font-bold",
          isBold && "bg-[#405189] text-white hover:bg-[#364574]"
        )}
      >
        <i className="ri-bold text-sm" />
      </Button>
      <Button
        type="button"
        size="xs"
        variant={isItalic ? "default" : "ghost"}
        disabled={disabled}
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic")}
        title="Italic (Ctrl+I)"
        className={cn(
          "h-7 w-7 p-0",
          isItalic && "bg-[#405189] text-white hover:bg-[#364574]"
        )}
      >
        <i className="ri-italic text-sm" />
      </Button>
      <Button
        type="button"
        size="xs"
        variant={isUnderline ? "default" : "ghost"}
        disabled={disabled}
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline")}
        title="Underline (Ctrl+U)"
        className={cn(
          "h-7 w-7 p-0",
          isUnderline && "bg-[#405189] text-white hover:bg-[#364574]"
        )}
      >
        <i className="ri-underline text-sm" />
      </Button>
      <Button
        type="button"
        size="xs"
        variant={isStrikethrough ? "default" : "ghost"}
        disabled={disabled}
        onClick={() =>
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough")
        }
        title="Strikethrough"
        className={cn(
          "h-7 w-7 p-0",
          isStrikethrough && "bg-[#405189] text-white hover:bg-[#364574]"
        )}
      >
        <i className="ri-strikethrough text-sm" />
      </Button>
      <Button
        type="button"
        size="xs"
        variant={isCode ? "default" : "ghost"}
        disabled={disabled}
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "code")}
        title="Inline Code"
        className={cn(
          "h-7 w-7 p-0",
          isCode && "bg-[#405189] text-white hover:bg-[#364574]"
        )}
      >
        <i className="ri-code-view text-sm" />
      </Button>

      {/* Text Color Picker */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            size="xs"
            variant="ghost"
            disabled={disabled}
            title="Text Color"
            className="h-7 gap-1 px-1.5"
          >
            <i className="ri-font-color text-sm" />
            <span
              className="h-2.5 w-2.5 rounded-full border border-border"
              style={{ backgroundColor: fontColor }}
            />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-48 p-2.5 text-xs" align="start">
          <div className="mb-1.5 font-semibold text-foreground">Text Color</div>
          <div className="grid grid-cols-6 gap-1.5">
            {TEXT_COLORS.map((col) => (
              <button
                key={col}
                type="button"
                onClick={() => {
                  setFontColor(col)
                  applyStyleText({ color: col })
                }}
                className="h-6 w-6 rounded border border-border transition-transform hover:scale-110"
                style={{ backgroundColor: col }}
                title={col}
              />
            ))}
          </div>
          <div className="mt-2 flex items-center gap-1.5">
            <input
              type="color"
              value={fontColor.startsWith("#") ? fontColor : "#0f172a"}
              onChange={(e) => {
                setFontColor(e.target.value)
                applyStyleText({ color: e.target.value })
              }}
              className="h-6 w-8 cursor-pointer rounded border border-border bg-transparent p-0"
            />
            <span className="font-mono text-[11px] text-muted-foreground">
              Custom Hex
            </span>
          </div>
        </PopoverContent>
      </Popover>

      {/* Highlight Color Picker */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            size="xs"
            variant="ghost"
            disabled={disabled}
            title="Highlight Color"
            className="h-7 gap-1 px-1.5"
          >
            <i className="ri-mark-pen-line text-sm" />
            <span
              className="h-2.5 w-2.5 rounded-full border border-border"
              style={{
                backgroundColor: bgColor === "transparent" ? "#ffffff" : bgColor,
              }}
            />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-44 p-2.5 text-xs" align="start">
          <div className="mb-1.5 font-semibold text-foreground">
            Highlight Background
          </div>
          <div className="grid grid-cols-5 gap-1.5">
            {HIGHLIGHT_COLORS.map((col) => (
              <button
                key={col}
                type="button"
                onClick={() => {
                  setBgColor(col)
                  applyStyleText({
                    "background-color": col === "transparent" ? "" : col,
                  })
                }}
                className="flex h-6 w-6 items-center justify-center rounded border border-border text-[10px] hover:scale-110"
                style={{
                  backgroundColor: col === "transparent" ? "#ffffff" : col,
                }}
                title={col === "transparent" ? "None" : col}
              >
                {col === "transparent" ? "✕" : ""}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      <Button
        type="button"
        size="xs"
        variant="ghost"
        disabled={disabled}
        onClick={clearFormatting}
        title="Clear Formatting"
        className="h-7 w-7 p-0"
      >
        <i className="ri-format-clear text-sm" />
      </Button>

      <span className="mx-0.5 h-4 w-px bg-border" />

      {/* Alignment & Lists */}
      <Button
        type="button"
        size="xs"
        variant="ghost"
        disabled={disabled}
        onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "left")}
        title="Align Left"
        className="h-7 w-7 p-0"
      >
        <i className="ri-align-left text-sm" />
      </Button>
      <Button
        type="button"
        size="xs"
        variant="ghost"
        disabled={disabled}
        onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "center")}
        title="Align Center"
        className="h-7 w-7 p-0"
      >
        <i className="ri-align-center text-sm" />
      </Button>
      <Button
        type="button"
        size="xs"
        variant="ghost"
        disabled={disabled}
        onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "right")}
        title="Align Right"
        className="h-7 w-7 p-0"
      >
        <i className="ri-align-right text-sm" />
      </Button>
      <Button
        type="button"
        size="xs"
        variant={blockType === "bullet" ? "default" : "ghost"}
        disabled={disabled}
        onClick={() => applyBlockType("bullet")}
        title="Bullet List"
        className={cn(
          "h-7 w-7 p-0",
          blockType === "bullet" && "bg-[#405189] text-white"
        )}
      >
        <i className="ri-list-unordered text-sm" />
      </Button>
      <Button
        type="button"
        size="xs"
        variant={blockType === "number" ? "default" : "ghost"}
        disabled={disabled}
        onClick={() => applyBlockType("number")}
        title="Numbered List"
        className={cn(
          "h-7 w-7 p-0",
          blockType === "number" && "bg-[#405189] text-white"
        )}
      >
        <i className="ri-list-ordered text-sm" />
      </Button>
      <Button
        type="button"
        size="xs"
        variant="ghost"
        disabled={disabled}
        onClick={() =>
          editor.dispatchCommand(OUTDENT_CONTENT_COMMAND, undefined)
        }
        title="Outdent"
        className="h-7 w-7 p-0"
      >
        <i className="ri-indent-decrease text-sm" />
      </Button>
      <Button
        type="button"
        size="xs"
        variant="ghost"
        disabled={disabled}
        onClick={() =>
          editor.dispatchCommand(INDENT_CONTENT_COMMAND, undefined)
        }
        title="Indent"
        className="h-7 w-7 p-0"
      >
        <i className="ri-indent-increase text-sm" />
      </Button>

      <span className="mx-0.5 h-4 w-px bg-border" />

      {/* Link Popover */}
      <Popover open={linkOpen} onOpenChange={setLinkOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            size="xs"
            variant={isLink ? "default" : "ghost"}
            disabled={disabled}
            title="Insert / Edit Link"
            className={cn(
              "h-7 w-7 p-0",
              isLink && "bg-[#405189] text-white hover:bg-[#364574]"
            )}
          >
            <i className="ri-link text-sm" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 space-y-2 p-3 text-xs" align="start">
          <div className="font-semibold text-foreground">
            {isLink ? "Edit Hyperlink" : "Insert Hyperlink"}
          </div>
          <Input
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://example.com or {application_link}"
            className="h-8 text-xs"
          />
          <div className="flex justify-end gap-1.5">
            {isLink && (
              <Button
                type="button"
                size="xs"
                variant="destructive"
                onClick={() => {
                  editor.dispatchCommand(TOGGLE_LINK_COMMAND, null)
                  setLinkOpen(false)
                }}
              >
                Unlink
              </Button>
            )}
            <Button
              type="button"
              size="xs"
              onClick={() => {
                if (linkUrl.trim()) {
                  editor.dispatchCommand(TOGGLE_LINK_COMMAND, linkUrl.trim())
                }
                setLinkOpen(false)
              }}
              className="bg-[#0ab39c] text-white hover:bg-[#099885]"
            >
              Apply Link
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {/* Table Insert Popover */}
      <Popover open={tableOpen} onOpenChange={setTableOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            size="xs"
            variant="ghost"
            disabled={disabled}
            title="Insert Table"
            className="h-7 w-7 p-0"
          >
            <i className="ri-table-2 text-sm" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 space-y-2 p-3 text-xs" align="start">
          <div className="font-semibold text-foreground">Insert Table</div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="mb-1 block text-[11px] text-muted-foreground">
                Rows
              </span>
              <Input
                type="number"
                min={1}
                max={12}
                value={tableRows}
                onChange={(e) => setTableRows(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div>
              <span className="mb-1 block text-[11px] text-muted-foreground">
                Columns
              </span>
              <Input
                type="number"
                min={1}
                max={8}
                value={tableCols}
                onChange={(e) => setTableCols(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>
          <Button
            type="button"
            size="xs"
            onClick={() => {
              editor.dispatchCommand(INSERT_TABLE_COMMAND, {
                rows: String(Math.max(1, Number(tableRows) || 3)),
                columns: String(Math.max(1, Number(tableCols) || 3)),
                includeHeaders: true,
              })
              setTableOpen(false)
            }}
            className="w-full bg-[#405189] text-white hover:bg-[#364574]"
          >
            Insert Table
          </Button>
        </PopoverContent>
      </Popover>

      {/* Horizontal Divider */}
      <Button
        type="button"
        size="xs"
        variant="ghost"
        disabled={disabled}
        onClick={() =>
          editor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined)
        }
        title="Insert Divider Line"
        className="h-7 w-7 p-0"
      >
        <i className="ri-separator text-sm" />
      </Button>

      {/* CTA Button Builder */}
      <Popover open={ctaOpen} onOpenChange={setCtaOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            size="xs"
            variant="outline"
            disabled={disabled}
            title="Insert Email CTA Button"
            className="h-7 px-2 text-[11px]"
          >
            <i className="ri-cursor-line mr-1" />
            CTA
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 space-y-2 p-3 text-xs" align="start">
          <div className="font-semibold text-foreground">
            Insert Email CTA Button
          </div>
          <Input
            value={ctaLabel}
            onChange={(e) => setCtaLabel(e.target.value)}
            placeholder="Button text (e.g. Apply Now)"
            className="h-8 text-xs"
          />
          <Input
            value={ctaHref}
            onChange={(e) => setCtaHref(e.target.value)}
            placeholder="URL or {application_link}"
            className="h-8 font-mono text-xs"
          />
          <Button
            type="button"
            size="xs"
            onClick={insertCtaButton}
            className="w-full bg-[#0ab39c] text-white hover:bg-[#099885]"
          >
            Insert Button
          </Button>
        </PopoverContent>
      </Popover>

      {/* Merge Tags Picker */}
      <Popover open={mergeOpen} onOpenChange={setMergeOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            size="xs"
            variant="outline"
            disabled={disabled}
            title="Insert Dynamic CRM Variable"
            className="h-7 border-[#405189]/30 bg-[#405189]/5 px-2 text-[11px] font-medium text-[#405189] hover:bg-[#405189] hover:text-white"
          >
            <i className="ri-braces-line mr-1" />
            Variables
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-2.5 text-xs" align="end">
          <div className="mb-1.5 font-semibold text-foreground">
            Insert Dynamic Variable
          </div>
          <div className="max-h-52 space-y-1 overflow-y-auto">
            {mergeTags.map((v) => (
              <button
                key={v.token}
                type="button"
                onClick={() => {
                  insertToken(v.token)
                  setMergeOpen(false)
                }}
                className="flex w-full items-center justify-between rounded px-2 py-1 text-left hover:bg-muted"
              >
                <code className="font-mono text-[11px] font-semibold text-[#405189]">
                  {v.token}
                </code>
                {v.label && (
                  <span className="text-[10px] text-muted-foreground">
                    {v.label}
                  </span>
                )}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      {/* Right Mode Toggles: Preview & HTML Source */}
      <div className="ml-auto flex items-center gap-1">
        <Button
          type="button"
          size="xs"
          variant={previewMode ? "default" : "outline"}
          onClick={onTogglePreview}
          className={cn(
            "h-7 px-2 text-[11px]",
            previewMode && "bg-[#0ab39c] text-white hover:bg-[#099885]"
          )}
        >
          <i className="ri-eye-line mr-1" />
          Preview
        </Button>
        <Button
          type="button"
          size="xs"
          variant={sourceMode ? "default" : "outline"}
          onClick={onToggleSource}
          className={cn(
            "h-7 px-2 font-mono text-[11px]",
            sourceMode && "bg-[#405189] text-white hover:bg-[#364574]"
          )}
        >
          &lt;/&gt; HTML
        </Button>
      </div>
    </div>
  )
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Compose rich HTML content using the Lexical toolbar or insert {lead_name} variables...",
  minHeight = 240,
  insertRef,
  variables,
}: RichTextEditorProps) {
  const [sourceMode, setSourceMode] = React.useState(false)
  const [previewMode, setPreviewMode] = React.useState(false)
  const [stats, setStats] = React.useState({ words: 0, chars: 0 })
  const lastEmittedHtmlRef = React.useRef<string>("")

  const initialConfig = React.useMemo(
    () => ({
      namespace: "DfCrmLexicalEditor",
      theme: LEXICAL_THEME,
      nodes: [
        HeadingNode,
        QuoteNode,
        ListNode,
        ListItemNode,
        LinkNode,
        AutoLinkNode,
        CodeNode,
        TableNode,
        TableRowNode,
        TableCellNode,
        HorizontalRuleNode,
      ],
      onError: (err: Error) => {
        console.error("Lexical editor error:", err)
      },
    }),
    []
  )

  return (
    <div className="overflow-hidden rounded-md border border-input bg-background shadow-2xs">
      <LexicalComposer initialConfig={initialConfig}>
        <LexicalToolbar
          sourceMode={sourceMode}
          onToggleSource={() => {
            setPreviewMode(false)
            setSourceMode((s) => !s)
          }}
          previewMode={previewMode}
          onTogglePreview={() => {
            setSourceMode(false)
            setPreviewMode((p) => !p)
          }}
          mergeTags={variables && variables.length > 0 ? variables : DEFAULT_MERGE_TAGS}
        />

        {sourceMode ? (
          <textarea
            value={value}
            onChange={(e) => {
              // Force Lexical to re-parse when leaving HTML source mode
              lastEmittedHtmlRef.current = "__SOURCE_EDITED__"
              onChange(e.target.value)
            }}
            style={{ minHeight }}
            placeholder="<p>Write raw HTML email markup here...</p>"
            className="w-full resize-y bg-slate-950 p-3 font-mono text-xs leading-relaxed text-emerald-300 outline-none"
          />
        ) : previewMode ? (
          <div
            style={{ minHeight }}
            className="prose prose-sm max-w-none bg-muted/15 p-4 text-xs leading-relaxed text-foreground"
            dangerouslySetInnerHTML={{
              __html:
                value ||
                '<p class="text-muted-foreground italic">Nothing to preview yet.</p>',
            }}
          />
        ) : (
          <div className="relative">
            <RichTextPlugin
              contentEditable={
                <ContentEditable
                  style={{ minHeight }}
                  className="w-full px-3.5 py-3 text-xs leading-relaxed text-foreground outline-none"
                />
              }
              placeholder={
                <div className="pointer-events-none absolute top-3 left-3.5 text-xs text-muted-foreground select-none">
                  {placeholder}
                </div>
              }
              ErrorBoundary={LexicalErrorBoundary}
            />
          </div>
        )}

        <HistoryPlugin />
        <ListPlugin />
        <CheckListPlugin />
        <LinkPlugin />
        <TablePlugin />
        <HorizontalRulePlugin />
        <TabIndentationPlugin />
        <HtmlSyncPlugin
          value={value}
          onChange={onChange}
          lastEmittedHtmlRef={lastEmittedHtmlRef}
          onStatsChange={setStats}
        />
        <InsertBridgePlugin insertRef={insertRef} />

        {/* Status Footer */}
        <div className="flex items-center justify-between border-t border-border bg-muted/25 px-3 py-1 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <i className="ri-quill-pen-line text-[#405189]" />
            <span>Lexical Rich Text Studio</span>
            {sourceMode && (
              <span className="rounded bg-[#405189]/10 px-1.5 py-0.5 font-mono text-[#405189]">
                HTML Source Mode
              </span>
            )}
            {previewMode && (
              <span className="rounded bg-[#0ab39c]/10 px-1.5 py-0.5 font-medium text-[#0ab39c]">
                Rendered Preview
              </span>
            )}
          </span>
          <span className="font-mono">
            {stats.words} words • {stats.chars} chars
          </span>
        </div>
      </LexicalComposer>
    </div>
  )
}
