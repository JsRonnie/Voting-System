import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function Leaderboard({ electionId, onClose }) {
  const [rows, setRows] = useState([])
  const [meta, setMeta] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!electionId) return

    const load = async () => {
      setLoading(true)
      const [{ data: electionData }, { data: leaderboardData }] = await Promise.all([
        supabase.from('elections').select('title').eq('id', electionId).maybeSingle(),
        supabase.rpc('fetch_published_results', {
          election_id_input: electionId,
        }),
      ])
      setRows(leaderboardData ?? [])
      setMeta(electionData ?? null)
      setLoading(false)
    }

    load()
  }, [electionId])

  const maxVotes = useMemo(() => Math.max(1, ...rows.map((row) => row.vote_total ?? 0)), [rows])

  if (!electionId) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 px-4 pb-10 pt-12 sm:items-center">
      <div className="w-full max-w-2xl space-y-6 rounded-3xl bg-surface/95 p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-accent">Leaderboard</p>
            <h3 className="font-display text-2xl text-white">{meta?.title ?? 'Election'}</h3>
          </div>
          <button onClick={onClose} className="text-sm uppercase tracking-[0.3em] text-white/60 hover:text-white">
            Close
          </button>
        </div>
        {loading ? (
          <p className="text-center text-sm text-white/60">Loading results…</p>
        ) : (
          <div className="space-y-4">
            {rows.map((row) => (
              <div key={row.candidate_id} className="space-y-2 rounded-2xl bg-white/5 p-3">
                <div className="flex items-center gap-3">
                  {row.photo_url ? (
                    <img src={row.photo_url} alt={row.candidate_name} className="h-10 w-10 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-sm">
                      #{row.number ?? '—'}
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-sm text-white/70">
                      <span>
                        #{row.number ?? '—'} {row.candidate_name}
                      </span>
                      <span className="font-semibold text-white">{row.vote_total}</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-brand-400 transition-all"
                        style={{ width: `${(Math.max(row.vote_total, 0) / maxVotes) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
                {row.vision ? <p className="text-xs text-white/60">{row.vision}</p> : null}
                {row.goals ? <p className="text-[11px] text-brand-200">{row.goals}</p> : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
