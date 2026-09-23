import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { AlertTriangle, AlertCircle, Info } from 'lucide-react'

const TONE_CONFIGS = {
  danger: {
    icon: AlertTriangle,
    iconBg: 'bg-rose-100 text-rose-600',
    buttonVariant: 'danger',
  },
  warning: {
    icon: AlertCircle,
    iconBg: 'bg-amber-100 text-amber-600',
    buttonVariant: 'secondary',
  },
  primary: {
    icon: Info,
    iconBg: 'bg-indigo-100 text-indigo-600',
    buttonVariant: 'primary',
  },
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed with this action?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  tone = 'danger',
  isLoading = false,
}) {
  const config = TONE_CONFIGS[tone] || TONE_CONFIGS.danger
  const Icon = config.icon

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <div className="flex items-start gap-4">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${config.iconBg}`}
        >
          <Icon className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-slate-900 leading-snug">{title}</h3>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{message}</p>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
        <Button variant="ghost" size="sm" onClick={onClose} disabled={isLoading}>
          {cancelText}
        </Button>
        <Button
          variant={config.buttonVariant}
          size="sm"
          onClick={onConfirm}
          isLoading={isLoading}
        >
          {confirmText}
        </Button>
      </div>
    </Modal>
  )
}
