import { type TransactionStatus } from '@/lib/types'

const CONFIG: Record<TransactionStatus, { label: string; className: string }> = {
  pending:            { label: 'Pending',           className: 'bg-muted text-muted-foreground' },
  paid:               { label: 'Paid',              className: 'bg-muted text-muted-foreground' },
  awaiting_shipment:  { label: 'Awaiting shipment', className: 'bg-orange-100 text-orange-700' },
  shipped:            { label: 'Shipped',           className: 'bg-blue-100 text-blue-700' },
  delivered:          { label: 'Delivered',         className: 'bg-blue-100 text-blue-700' },
  releasing:          { label: 'Releasing',         className: 'bg-green-100 text-green-700' },
  completed:          { label: 'Completed',         className: 'bg-green-100 text-green-700' },
  disputed:           { label: 'Disputed',          className: 'bg-red-100 text-red-700' },
  refunded:           { label: 'Refunded',          className: 'bg-muted text-muted-foreground' },
  cancelled:          { label: 'Cancelled',         className: 'bg-muted text-muted-foreground' },
}

export default function TransactionStatusBadge({ status }: { status: TransactionStatus }) {
  const { label, className } = CONFIG[status] ?? { label: status, className: 'bg-muted text-muted-foreground' }
  return (
    <span className={`inline-block px-2.5 py-1 text-[10px] font-medium tracking-[0.15em] uppercase ${className}`}>
      {label}
    </span>
  )
}
