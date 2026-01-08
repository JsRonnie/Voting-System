import dayjs from 'dayjs'

const heroImage = 'https://images.unsplash.com/photo-1460518451285-97b6aa326961?auto=format&fit=crop&w=1600&q=80'

export default function HomePortal({
  profile,
  stats,
  publicElections = [],
  onNavigate,
  onJoinElection,
  organizerMode = false,
}) {
  const upcoming = publicElections.slice(0, 3)

  return (
    <section className="space-y-8">
      <article className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-brand-900/80 via-surface to-surface p-8 shadow-glass">
        <img
          src={heroImage}
          alt="Campus gathering"
          className="absolute inset-0 h-full w-full object-cover opacity-20"
        />
        <div className="relative z-10 space-y-4">
          <p className="text-xs uppercase tracking-[0.4em] text-accent">Vote Now!</p>
          <h2 className="font-display text-4xl text-white">Hey {profile?.full_name ?? 'there'}, elections are live.</h2>
          <p className="text-sm text-white/80">
            Keep public referendums transparent, drop instant flyers with six-digit access codes, and archive a permanent
            history for every voter.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <button
              className="rounded-3xl bg-brand-500 px-6 py-3 text-sm font-semibold uppercase tracking-widest text-white"
              onClick={() => onNavigate?.('public')}
            >
              Public voting wall
            </button>
            {organizerMode ? (
              <button
                className="rounded-3xl border border-white/30 px-6 py-3 text-sm font-semibold uppercase tracking-widest text-white/80"
                onClick={() => onNavigate?.('create')}
              >
                Launch election
              </button>
            ) : (
              <p className="text-xs uppercase tracking-[0.35em] text-white/70">
                Organizer role required to launch elections
              </p>
            )}
          </div>
        </div>
      </article>

      <article className="grid gap-4 md:grid-cols-3">
        {[{ label: 'My elections', value: stats?.owned ?? 0, tab: 'dashboard' }, { label: 'Ballots cast', value: stats?.votes ?? 0, tab: 'history' }, { label: 'Public votes live', value: stats?.publicLive ?? 0, tab: 'public' }].map((metric) => (
          <button
            key={metric.label}
            className="glass-panel space-y-2 p-6 text-left transition hover:-translate-y-1"
            onClick={() => onNavigate?.(metric.tab)}
          >
            <p className="text-xs uppercase tracking-[0.4em] text-white/50">{metric.label}</p>
            <p className="font-display text-4xl">{metric.value}</p>
          </button>
        ))}
      </article>

      <article className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-accent">Public spotlight</p>
            <h3 className="font-display text-2xl text-white">Featured ballots</h3>
          </div>
          <button className="text-xs uppercase tracking-[0.4em] text-white/60" onClick={() => onNavigate?.('public')}>
            See all
          </button>
        </div>
        {upcoming.length === 0 ? (
          <p className="text-sm text-white/60">No public elections yet — flip the visibility toggle when you create one.</p>
        ) : (
          <div className="grid gap-4 lg:grid-cols-3">
            {upcoming.map((election) => (
              <article key={election.id} className="glass-panel flex flex-col overflow-hidden">
                {election.banner_url ? (
                  <img src={election.banner_url} alt={election.title} className="h-36 w-full object-cover" />
                ) : null}
                <div className="space-y-3 p-5">
                  <div className="flex items-center justify-between">
                    <span className="status-pill bg-white/10 text-white/70">{election.status}</span>
                    <span className="text-xs uppercase tracking-[0.4em] text-white/50">Code {String(election.share_code ?? '').padStart(6, '0')}</span>
                  </div>
                  <h4 className="font-display text-xl">{election.title}</h4>
                  <p className="text-sm text-white/70">{election.description ?? 'No description yet.'}</p>
                  <p className="text-xs uppercase tracking-[0.4em] text-white/50">
                    Deadline {election.deadline ? dayjs(election.deadline).format('MMM D • h:mm A') : 'TBD'}
                  </p>
                  <button
                    className="w-full rounded-2xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white"
                    onClick={() => {
                      onJoinElection?.(election)
                      onNavigate?.('join')
                    }}
                  >
                    Join now
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </article>
    </section>
  )
}
