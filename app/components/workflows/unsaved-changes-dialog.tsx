import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@shadcn/ui/dialog'
import { Button } from '@shadcn/ui/button'
import { AlertTriangle, Loader2 } from 'lucide-react'

type UnsavedChangesDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onLeaveWithoutSaving: () => void
  onSave: () => void
  isSaving?: boolean
}

const UnsavedChangesDialog = ({
  open,
  onOpenChange,
  onLeaveWithoutSaving,
  onSave,
  isSaving = false,
}: UnsavedChangesDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader className="space-y-2 text-left">
          <DialogTitle className="text-lg font-semibold">Save changes before leaving?</DialogTitle>
          <DialogDescription asChild>
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-500" />
              <span>If you don&apos;t save, you will lose your changes.</span>
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-6 flex w-full justify-end gap-2">
          <Button
            variant="outline"
            onClick={onLeaveWithoutSaving}
            aria-label="Leave without saving">
            Leave without saving
          </Button>
          <Button
            variant="destructive"
            onClick={onSave}
            className="flex items-center gap-2"
            disabled={isSaving}
            aria-label="Save changes">
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              'Save'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default UnsavedChangesDialog
