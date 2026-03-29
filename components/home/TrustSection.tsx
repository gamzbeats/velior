export default function TrustSection() {
  const pillars = [
    {
      number: '01',
      title: 'Verified Listings',
      description:
        'Every watch is reviewed against reference databases. Sellers provide detailed documentation, serial numbers, and high-resolution imagery.',
    },
    {
      number: '02',
      title: 'Secure Shipping',
      description:
        'All shipments handled exclusively by DHL Express, FedEx Priority, or UPS Secure — with full insurance coverage on every package.',
    },
    {
      number: '03',
      title: 'Trusted Sellers',
      description:
        'Profiles verified with identity checks. Seller ratings and transaction history visible on every listing. Accountability at every step.',
    },
  ]

  return (
    <section className="bg-background border-t border-border py-28 md:py-40" id="about">
      <div className="max-w-[1400px] mx-auto px-6 md:px-12">
        {/* Header */}
        <div className="mb-20 grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
          <h2 className="font-display font-light leading-tight" style={{ fontSize: 'clamp(2.5rem, 5vw, 5rem)' }}>
            Built on<br />
            <em>trust.</em>
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-md md:ml-auto">
            VELIOR exists to make the secondary luxury watch market trustworthy. We enforce
            strict standards on every side of every transaction.
          </p>
        </div>

        {/* Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border">
          {pillars.map((p) => (
            <div key={p.number} className="bg-background p-10 md:p-14">
              <span className="text-xs font-medium tracking-[0.3em] text-muted-foreground block mb-8">
                {p.number}
              </span>
              <h3 className="font-display text-2xl md:text-3xl font-semibold mb-5">
                {p.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {p.description}
              </p>
            </div>
          ))}
        </div>

        {/* Carriers */}
        <div className="mt-16 pt-16 border-t border-border flex flex-col md:flex-row items-center justify-between gap-8">
          <p className="text-xs font-medium tracking-[0.25em] uppercase text-muted-foreground">
            Shipping Partners
          </p>
          <div className="flex items-center gap-12">
            {['DHL Express', 'FedEx Priority', 'UPS Secure'].map((carrier) => (
              <span
                key={carrier}
                className="text-sm font-semibold tracking-[0.1em] text-foreground/30"
              >
                {carrier}
              </span>
            ))}
          </div>
          <p className="text-xs text-muted-foreground tracking-wide">
            All shipments fully insured
          </p>
        </div>
      </div>
    </section>
  )
}
