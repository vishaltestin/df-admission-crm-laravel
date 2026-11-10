"use client"

import * as React from "react"
import { AlertDialog as AlertDialogPrimitive } from "radix-ui"
import { Button } from "@/components/ui/button"

interface ConfirmDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description?: string
  confirmLabel?: string
  onConfirm: () => Promise<void> | void
}

export function ConfirmDeleteDialog({
  open,
  onOpenChange,
  title = "Are you sure?",
  description = "You won't be able to revert this! This record will be permanently deleted.",
  confirmLabel = "Yes, Delete It!",
  onConfirm,
}: ConfirmDeleteDialogProps) {
  const [deleting, setDeleting] = React.useState(false)

  async function handleConfirm(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault()
    e.stopPropagation()
    if (deleting) return
    setDeleting(true)
    try {
      await onConfirm()
      onOpenChange(false)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <AlertDialogPrimitive.Root
      open={open}
      onOpenChange={(next) => {
        if (!deleting) onOpenChange(next)
      }}
    >
      <AlertDialogPrimitive.Portal>
        <AlertDialogPrimitive.Overlay className="fixed inset-0 z-[100] bg-black/45 backdrop-blur-[2px] data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
        <AlertDialogPrimitive.Content
          onEscapeKeyDown={(e) => {
            if (deleting) e.preventDefault()
          }}
          className="fixed top-1/2 left-1/2 z-[105] grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 rounded-xl border border-border bg-popover p-6 text-popover-foreground shadow-2xl outline-none sm:max-w-md data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95"
        >
          <div className="flex flex-col items-center text-center">
            <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-full bg-rose-100 text-rose-600 ring-4 ring-rose-50 dark:bg-rose-950/50 dark:text-rose-400 dark:ring-rose-950/30">
              <i className="ri-error-warning-line text-3xl" />
            </div>
            <AlertDialogPrimitive.Title className="text-base font-bold text-foreground">
              {title}
            </AlertDialogPrimitive.Title>
            <AlertDialogPrimitive.Description className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
              {description}
            </AlertDialogPrimitive.Description>
          </div>

          <div className="mt-2 flex flex-row items-center justify-center gap-2.5">
            <AlertDialogPrimitive.Cancel asChild>
              <Button
                type="button"
                variant="outline"
                disabled={deleting}
                onClick={() => onOpenChange(false)}
                className="h-9 min-w-24 px-4 text-xs font-medium"
              >
                Cancel
              </Button>
            </AlertDialogPrimitive.Cancel>
            <Button
              type="button"
              variant="destructive"
              disabled={deleting}
              onClick={handleConfirm}
              className="h-9 min-w-28 bg-[#f06548] px-4 text-xs font-semibold text-white hover:bg-[#d95338]"
            >
              {deleting ? (
                <>
                  <i className="ri-loader-4-line mr-1.5 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <i className="ri-delete-bin-line mr-1.5" />
                  {confirmLabel}
                </>
              )}
            </Button>
          </div>
        </AlertDialogPrimitive.Content>
      </AlertDialogPrimitive.Portal>
    </AlertDialogPrimitive.Root>
  )
}

interface PendingDelete {
  title?: string
  description: string
  confirmLabel?: string
  onConfirm: () => Promise<void> | void
}

export function useConfirmDelete() {
  const [pending, setPending] = React.useState<PendingDelete | null>(null)

  const confirmDelete = React.useCallback((opts: PendingDelete) => {
    setPending(opts)
  }, [])

  const DeleteDialog = (
    <ConfirmDeleteDialog
      open={Boolean(pending)}
      onOpenChange={(o) => {
        if (!o) setPending(null)
      }}
      title={pending?.title || "Are you sure?"}
      description={
        pending?.description ||
        "Are you sure you want to delete this item? This action cannot be undone."
      }
      confirmLabel={pending?.confirmLabel || "Yes, Delete It!"}
      onConfirm={async () => {
        if (pending?.onConfirm) {
          await pending.onConfirm()
        }
      }}
    />
  )

  return { confirmDelete, DeleteDialog }
}
