import { type SubscriptionTier } from '@/lib/types'

export default function PlanBadge({ tier }: { tier: SubscriptionTier }) {
  if (tier === 'elite') {
    return (
      <span className="text-[10px] font-medium tracking-[0.2em] uppercase border px-3 py-1"
        style={{ borderColor: 'var(--gold)', color: 'var(--gold)' }}>
        VELIOR ELITE
      </span>
    )
  }
  if (tier === 'pro') {
    return (
      <span className="text-[10px] font-medium tracking-[0.2em] uppercase border border-foreground px-3 py-1">
        PRO SELLER
      </span>
    )
  }
  return (
    <span className="text-[10px] font-medium tracking-[0.2em] uppercase border border-border text-muted-foreground px-3 py-1">
      COLLECTOR
    </span>
  )
}
