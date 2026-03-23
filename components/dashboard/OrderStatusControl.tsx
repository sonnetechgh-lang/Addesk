'use client'

import { useState, useTransition } from 'react'
import { updateOrderStatus } from '@/actions/orders'
import { Loader2, Play, CheckCircle2, XCircle, PartyPopper } from 'lucide-react'

interface OrderStatusControlProps {
  orderId: string
  currentStatus: string
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  new: { label: 'New Order', color: 'text-status-new', bg: 'bg-status-new-bg', dot: 'bg-status-new' },
  in_progress: { label: 'In Progress', color: 'text-status-in-progress', bg: 'bg-status-in-progress-bg', dot: 'bg-status-in-progress' },
  submitted: { label: 'Submitted', color: 'text-status-submitted', bg: 'bg-status-submitted-bg', dot: 'bg-status-submitted' },
  completed: { label: 'Completed', color: 'text-status-completed', bg: 'bg-status-completed-bg', dot: 'bg-status-completed' },
  cancelled: { label: 'Cancelled', color: 'text-error', bg: 'bg-error/10', dot: 'bg-error' },
}

const NEXT_ACTION: Record<string, { label: string; nextStatus: string; icon: React.ReactNode; style: string }> = {
  new: {
    label: 'Start Working',
    nextStatus: 'in_progress',
    icon: <Play className="h-4 w-4" />,
    style: 'bg-brand-success text-white hover:bg-brand-success-dark shadow-elevation-medium transition-all',
  },
  in_progress: {
    label: 'Mark as Completed',
    nextStatus: 'completed',
    icon: <CheckCircle2 className="h-4 w-4" />,
    style: 'bg-success text-white hover:bg-success-dark shadow-elevation-medium transition-all',
  },
  submitted: {
    label: 'Mark as Completed',
    nextStatus: 'completed',
    icon: <CheckCircle2 className="h-4 w-4" />,
    style: 'bg-success text-white hover:bg-success-dark shadow-elevation-medium transition-all',
  },
}

export default function OrderStatusControl({ orderId, currentStatus }: OrderStatusControlProps) {
  const [status, setStatus] = useState(currentStatus)
  const [isPending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)

  const statusConfig = STATUS_CONFIG[status] || STATUS_CONFIG.new
  const nextAction = NEXT_ACTION[status]

  const handleStatusUpdate = (newStatus: string) => {
    setFeedback(null)
    startTransition(async () => {
      const result = await updateOrderStatus(orderId, newStatus)
      if (result.error) {
        setFeedback({ type: 'error', message: result.error })
      } else {
        setStatus(newStatus)
        setFeedback({
          type: 'success',
          message: newStatus === 'completed'
            ? 'Order completed! A thank-you email has been sent to the client.'
            : `Status updated to "${newStatus.replace('_', ' ')}".`,
        })
      }
      setShowConfirm(false)
    })
  }

  return (
    <section className="bg-surface-card rounded-2xl border border-border p-6 shadow-elevation-low\">
      <h3 className="text-[11px] font-bold text-text-muted uppercase tracking-widest mb-5">Order Control</h3>

      <div className="space-y-6">
        {/* Current Status Badge */}
        <div>
          <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2 block">Current Status</label>
          <div className={`flex items-center gap-3 p-3.5 rounded-xl border border-transparent ${statusConfig.bg} ${statusConfig.color}`}>
            <div className={`h-2.5 w-2.5 rounded-full ${statusConfig.dot} ${status !== 'completed' && status !== 'cancelled' ? 'animate-pulse' : ''}`} />
            <span className="font-bold text-sm tracking-tight">{statusConfig.label}</span>
          </div>
        </div>

        {/* Action Button */}
        {nextAction && !showConfirm && (
          <div className="pt-2">
            <button
              onClick={() => {
                if (nextAction.nextStatus === 'completed') {
                  setShowConfirm(true)
                } else {
                  handleStatusUpdate(nextAction.nextStatus)
                }
              }}
              disabled={isPending}
              className={`w-full h-11 rounded-xl font-semibold text-[14px] transition-all flex items-center justify-center gap-2 ${nextAction.style} disabled:opacity-50`}
            >
              {isPending ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Updating...</>
              ) : (
                <>{nextAction.icon} {nextAction.label}</>
              )}
            </button>
            <p className="text-[11px] text-text-muted text-center mt-3 leading-tight">
              {nextAction.nextStatus === 'completed'
                ? 'This will mark the order as delivered and send a thank-you email to the client.'
                : 'Move this order to the next stage in your workflow.'}
            </p>
          </div>
        )}

        {/* Confirmation Dialog for Completion */}
        {showConfirm && (
          <div className="pt-2 space-y-3">
            <div className="p-4 bg-success/8 rounded-xl border border-success/15">
              <p className="text-[13px] font-bold text-success mb-1">Confirm Completion</p>
              <p className="text-[12px] text-success/80 leading-relaxed">
                Are you sure you've delivered everything? A thank-you email will be sent to the client automatically.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={isPending}
                className="h-11 rounded-xl border border-border text-text-secondary font-bold text-sm hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleStatusUpdate('completed')}
                disabled={isPending}
                className="h-11 rounded-xl bg-success text-white font-semibold text-[13px] hover:bg-success/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isPending ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Sending...</>
                ) : (
                  <><CheckCircle2 className="h-4 w-4" /> Confirm</>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Completed State */}
        {status === 'completed' && !feedback && (
          <div className="pt-2 p-3.5 bg-success/8 rounded-xl border border-success/15 flex items-start gap-2.5">
            <PartyPopper className="h-4 w-4 text-success mt-0.5 shrink-0" />
            <div>
              <p className="text-[13px] font-bold text-success">Delivery Complete</p>
              <p className="text-[11px] text-success/70 mt-0.5">This order has been fulfilled. Well done!</p>
            </div>
          </div>
        )}

        {/* Cancelled State */}
        {status === 'cancelled' && (
          <div className="pt-2 p-3.5 bg-error/8 rounded-xl border border-error/15 flex items-start gap-2.5">
            <XCircle className="h-4 w-4 text-error mt-0.5 shrink-0" />
            <div>
              <p className="text-[13px] font-bold text-error">Order Cancelled</p>
              <p className="text-[11px] text-error/70 mt-0.5">This order has been cancelled.</p>
            </div>
          </div>
        )}

        {/* Feedback Toast */}
        {feedback && (
          <div className={`p-3.5 rounded-xl border flex items-start gap-2.5 ${
            feedback.type === 'success'
              ? 'bg-success/8 border-success/15'
              : 'bg-error/8 border-error/15'
          }`}>
            {feedback.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-success mt-0.5 shrink-0" />
            ) : (
              <XCircle className="h-4 w-4 text-error mt-0.5 shrink-0" />
            )}
            <p className={`text-[12px] font-medium ${
              feedback.type === 'success' ? 'text-success' : 'text-error'
            }`}>
              {feedback.message}
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
