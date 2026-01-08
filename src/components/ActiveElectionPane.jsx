import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function ActiveElectionPane({ election, profile, onBallotCast }) {
  const [candidates, setCandidates] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!election) return
    const load = async () => {
      const { data } = await supabase
        .from('candidates')
        .select('id, name, slate, vision, photo_url, number, description, goals')
        .eq('election_id', election.id)
        .order('number', { ascending: true })
      setCandidates(data ?? [])
    }
    load()
  }, [election])

  const handleSubmit = async () => {
    if (!selectedId || !profile) return
    setIsSubmitting(true)
    setMessage('')
    const { error } = await supabase.from('votes').insert({
      election_id: election.id,
      candidate_id: selectedId,
      voter_id: profile.id,
    })
    setIsSubmitting(false)
    if (error) {
      setMessage(error.message)
      return
    }
    setMessage('Vote cast!')
    onBallotCast?.()
  }

  if (!election) return null

  return (
    <section className="space-y-5">
      <header>
        <p className="text-xs uppercase tracking-[0.3em] text-accent">Swipe cards</p>
        <h2 className="font-display text-3xl text-white">{election.title}</h2>
        <p className="text-sm text-white/70">Review visions and select your candidate.</p>
      </header>

      <div className="flex snap-x gap-4 overflow-x-auto pb-4">
        {candidates.map((candidate) => (
          <article
            key={candidate.id}
            className={`glass-panel min-w-[260px] snap-center p-5 transition hover:translate-y-[-4px] ${
              selectedId === candidate.id ? 'ring-2 ring-brand-400' : ''
            }`}
            onClick={() => setSelectedId(candidate.id)}
          >
            {candidate.photo_url ? (
              <img src={candidate.photo_url} alt={candidate.name} className="mb-4 h-40 w-full rounded-2xl object-cover" />
            ) : null}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.4em] text-white/50">
                <span>{candidate.slate ?? 'Independent'}</span>
                <span>#{candidate.number ?? '—'}</span>
              </div>
              <h3 className="font-display text-2xl text-white">{candidate.name}</h3>
              {candidate.description ? <p className="text-sm text-white/70">{candidate.description}</p> : null}
              {candidate.goals ? <p className="text-xs text-brand-200">{candidate.goals}</p> : null}
              {candidate.vision ? <p className="text-xs uppercase tracking-[0.4em] text-white/40">{candidate.vision}</p> : null}
            </div>
            <div className="mt-6 flex items-center justify-between">
              <span className="text-xs uppercase tracking-[0.4em] text-white/60">Tap to select</span>
              <span className="text-brand-200">{selectedId === candidate.id ? 'Selected' : 'Choose'}</span>
            </div>
          </article>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          onClick={handleSubmit}
          disabled={!selectedId || isSubmitting}
          className="flex-1 rounded-3xl bg-brand-500 px-6 py-4 font-semibold text-white transition hover:bg-brand-400 disabled:cursor-not-allowed disabled:bg-white/10"
        >
          {isSubmitting ? 'Submitting…' : selectedId ? 'Cast vote now' : 'Pick a card first'}
        </button>
        <button
          type="button"
          onClick={() => {
            setSelectedId(null)
            setMessage('')
          }}
          className="rounded-3xl border border-white/20 px-6 py-4 font-semibold text-white/80"
        >
          Clear
        </button>
      </div>
      {message ? <p className="text-sm text-success">{message}</p> : null}
    </section>
  )
}
