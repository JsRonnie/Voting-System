export default function VotingHistory({ history, onViewLeaderboard }) {
  if (!history?.length) {
    return (
      <section className="glass-panel p-6 text-center">
        <p className="text-sm text-white/70">No votes yet. Join an election to build your archive.</p>
      </section>
    )
  }

  return (
    <section className="space-y-4">
      {history.map((record) => (
        <article key={record.vote_id} className="glass-panel flex flex-col gap-3 overflow-hidden p-0">
          {record.banner_url ? (
            <img src={record.banner_url} alt={record.election_title} className="h-32 w-full object-cover" />
          ) : null}
          <div className="space-y-3 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/50">
                Code {String(record.election_code ?? '').padStart(6, '0')}
              </p>
              <h3 className="font-display text-2xl text-white">{record.election_title}</h3>
              <p className="text-sm text-white/70">You voted for {record.candidate_name}</p>
              <p className="text-xs uppercase tracking-[0.4em] text-white/40">
                {record.election_visibility ?? 'private'} · {record.election_status ?? 'draft'}
              </p>
            </div>
            <span
              className={`status-pill ${
                record.results_visible ? 'bg-success/20 text-success' : record.is_live ? 'bg-warning/20 text-warning' : 'bg-white/10 text-white/60'
              }`}
            >
              {record.results_visible ? 'Result out' : record.is_live ? 'Live' : 'Waiting'}
            </span>
          </div>

          {record.results_visible ? (
            <button
              className="self-end rounded-full border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white/80 hover:border-white/40"
              onClick={() => onViewLeaderboard?.(record.election_id)}
            >
              View leaderboard
            </button>
          ) : (
            <p className="self-end text-xs uppercase tracking-[0.4em] text-white/50">Waiting for organizer</p>
          )}
          </div>
        </article>
      ))}
    </section>
  )
}
