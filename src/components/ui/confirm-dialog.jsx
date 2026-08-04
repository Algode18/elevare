import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";

// On-brand replacement for window.confirm()/alert() — uses the app's
// theme tokens (popover/border/foreground) instead of the browser's
// native dialog, so it matches both the Frosted Ivory light theme and
// the Midnight Nebula dark theme. Used for destructive confirmations
// (e.g. withdraw application) and for surfacing errors that would
// otherwise be a plain alert().
const ConfirmDialog = ({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  hideCancel = false,
  onConfirm,
  onCancel,
}) => (
  <AnimatePresence>
    {open && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
        onClick={onCancel}
      >
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 6, scale: 0.97 }}
          transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
          onClick={(e) => e.stopPropagation()}
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="confirm-dialog-title"
          className="w-full max-w-sm rounded-[var(--radius-modal)] border border-border bg-popover p-5 shadow-[var(--shadow-3)]"
        >
          <div className="flex items-start gap-3">
            {destructive && (
              <div className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-destructive-bg text-destructive">
                <AlertTriangle className="h-4.5 w-4.5" />
              </div>
            )}
            <div className="min-w-0">
              <h3 id="confirm-dialog-title" className="text-[15px] font-semibold text-heading">
                {title}
              </h3>
              {description && <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{description}</p>}
            </div>
          </div>

          <div className="mt-5 flex justify-end gap-2">
            {!hideCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="rounded-[var(--radius-btn)] px-3.5 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                {cancelLabel}
              </button>
            )}
            <button
              type="button"
              onClick={onConfirm}
              autoFocus
              className={`rounded-[var(--radius-btn)] px-3.5 py-2 text-sm font-medium text-white transition-all hover:opacity-90 ${
                destructive ? "bg-destructive" : "bg-primary shadow-[var(--shadow-glow-primary)]"
              }`}
            >
              {confirmLabel}
            </button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

export default ConfirmDialog;