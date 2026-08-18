import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@shadcn/ui/dialog'
import { Button } from '@shadcn/ui/button'
import { Loader2, Workflow } from 'lucide-react'

type ToggleActiveDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  workflowName: string
  isActive: boolean
  onConfirm: () => void
  isLoading?: boolean
}

const ToggleActiveDialog = ({
  open,
  onOpenChange,
  workflowName,
  isActive,
  onConfirm,
  isLoading = false,
}: ToggleActiveDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-t-primary max-w-lg border-t-4">
        <DialogHeader className="flex flex-col items-center">
          <div
            className="bg-primary -mt-16 flex h-16 w-16 items-center justify-center rounded-full
              p-3">
            <Workflow size={32} className="text-primary-foreground" />
          </div>
          <DialogTitle className="hidden"></DialogTitle>
        </DialogHeader>
        <DialogDescription className="px-3" asChild>
          <div className="flex flex-col items-center max-w-md wrap-break-word">
            <h1
              className="dark:text-secondary-foreground text-center text-3xl font-semibold
                text-black">
              {isActive ? 'Disable' : 'Enable'} &quot;{workflowName}&quot;?
            </h1>
            <p
              className="dark:text-secondary-foreground mt-3 text-center text-base text-black
                max-w-sm wrap-break-word overflow-hidden text-ellipsis">
              {isActive
                ? "Once disabled, this workflow will be paused and won't run until you enable it again."
                : 'Once enabled, this workflow will be able to run normally.'}
            </p>
          </div>
        </DialogDescription>

        <DialogFooter className="mt-3">
          <div className="flex w-full justify-center gap-2">
            <Button
              variant="outline"
              className="w-1/2"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              aria-label="Cancel">
              Cancel
            </Button>

            <Button
              className="w-1/2"
              onClick={onConfirm}
              disabled={isLoading}
              aria-label={isActive ? 'Disable workflow' : 'Enable workflow'}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isActive ? 'Disabling...' : 'Enabling...'}
                </>
              ) : (
                <>Confirm</>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ToggleActiveDialog
