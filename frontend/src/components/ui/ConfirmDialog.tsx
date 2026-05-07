import { Dialog, DialogHeader, DialogTitle, DialogBody, DialogFooter } from './Dialog'
import { Button } from './Button'

interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'default' | 'destructive'
  loading?: boolean
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  loading = false,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
      </DialogHeader>
      <DialogBody>
        <p className="text-sm text-text-secondary">{description}</p>
      </DialogBody>
      <DialogFooter>
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button
          variant="default"
          onClick={onConfirm}
          disabled={loading}
          className={variant === 'destructive' ? 'bg-red-600 hover:bg-red-700' : ''}
        >
          {loading ? '...' : confirmLabel}
        </Button>
      </DialogFooter>
    </Dialog>
  )
}
