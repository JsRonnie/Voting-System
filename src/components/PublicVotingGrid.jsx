import dayjs from 'dayjs'

export default function PublicVotingGrid({ elections = [], onJoin, onPreview }) {
  if (!elections.length) {
    return (
      <section className="glass-panel p-6 text-center">
        <p className="text-sm text-white/70">No public elections yet. Toggle visibility to "public" when creating one.</p>
      </section>
    )
  }

  return (
    <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {elections.map((election) => (
        <article key={election.id} className="glass-panel flex flex-col overflow-hidden">
          {election.banner_url ? (
            <img src={election.banner_url} alt={election.title} className="h-40 w-full object-cover" />
          ) : (
            <div className="h-40 w-full bg-gradient-to-br from-brand-700/40 to-brand-900/20" />
          )}
          <div className="flex flex-1 flex-col space-y-3 p-5">
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.4em] text-white/60">
              <span>{election.status}</span>
              <span>Code {String(election.share_code ?? '').padStart(6, '0')}</span>
            </div>
            <h3 className="font-display text-2xl text-white">{election.title}</h3>
            <p className="text-sm text-white/70">{election.description ?? 'No description yet.'}</p>
            <p className="text-xs uppercase tracking-[0.4em] text-white/50">
              Deadline {election.deadline ? dayjs(election.deadline).format('MMM D • h:mm A') : 'TBD'}
            </p>
            <div className="mt-auto flex gap-3">
              <button
                className="flex-1 rounded-2xl bg-brand-500 px-4 py-3 text-sm font-semibold text-white"
                onClick={() => onJoin?.(election)}
              >
                Join & Vote
              </button>
              <button
                className={`rounded-2xl border border-white/20 px-4 py-3 text-sm font-semibold ${
                  election.results_visible ? 'text-white/80' : 'text-white/40'
                } ${!election.results_visible ? 'cursor-not-allowed' : ''}`}
                onClick={() => election.results_visible && onPreview?.(election)}
                disabled={!election.results_visible}
              >
                {election.results_visible ? 'Leaderboard' : 'Hidden until publish'}
              </button>
            </div>
          </div>
        </article>
      ))}
    </section>
  )
}
