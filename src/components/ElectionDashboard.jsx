import { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import { supabase } from '../lib/supabaseClient'

export default function ElectionDashboard({ election, onPublish }) {
  const [candidates, setCandidates] = useState([])
  const [liveCounts, setLiveCounts] = useState([])
  const [isPublishing, setIsPublishing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const [deadlineInput, setDeadlineInput] = useState('')

  useEffect(() => {
    if (!election) return

    const loadCandidates = async () => {
      const { data } = await supabase
        .from('candidates')
        .select('id, name, slate, vision')
        .eq('election_id', election.id)
        .order('name')
      setCandidates(data ?? [])
    }

    loadCandidates()
  }, [election])

  useEffect(() => {
    if (!election) {
      setDeadlineInput('')
      return
    }
    setDeadlineInput(election.deadline ? dayjs(election.deadline).format('YYYY-MM-DDTHH:mm') : '')
  }, [election])

  useEffect(() => {
    if (!election) return

    let isMounted = true
    const fetchCounts = async () => {
      const { data } = await supabase.rpc('fetch_live_counts', {
        election_id_input: election.id,
      })
      if (isMounted) setLiveCounts(data ?? [])
    }

    fetchCounts()
    const interval = setInterval(fetchCounts, 4500)
    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [election])

  const handlePublish = async () => {
    if (!election) return
    setIsPublishing(true)
    setError('')
    const { error: updateError } = await supabase
      .from('elections')
      .update({ results_visible: true })
      .eq('id', election.id)
    setIsPublishing(false)

    if (updateError) {
      setError(updateError.message)
      return
    }

    onPublish?.()
  }

  const handleDelete = async () => {
    if (!election) return
    const userConfirmed = window.confirm('Delete this election? This cannot be undone.')
    if (!userConfirmed) return
    setIsDeleting(true)
    setError('')
    setStatusMessage('')
    const { error: deleteError } = await supabase.from('elections').delete().eq('id', election.id)
    setIsDeleting(false)
    if (deleteError) {
      setError(deleteError.message)
      return
    }
    setStatusMessage('Election deleted')
    onPublish?.()
  }

  const voteMap = liveCounts.reduce((map, entry) => {
    map[entry.candidate_id] = entry.vote_total
    return map
  }, {})

  const updateElection = async (fields) => {
    if (!election) return
    setError('')
    setStatusMessage('')
    const { error: updateError } = await supabase.from('elections').update(fields).eq('id', election.id)
    if (updateError) {
      setError(updateError.message)
    } else {
      setStatusMessage('Election updated')
      onPublish?.()
    }
  }

  const handleDeadlineUpdate = async () => {
    await updateElection({ deadline: deadlineInput ? new Date(deadlineInput).toISOString() : null })
  }

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-xs uppercase tracking-[0.3em] text-accent">Organizer dashboard</p>
          <span className="status-pill bg-white/10 text-white/70">
            {election?.results_visible ? 'Results published' : 'Private'}
          </span>
        </div>
        <h2 className="font-display text-3xl text-white">{election?.title ?? 'Select an election'}</h2>
        <p className="text-sm text-white/70">
          Share code {String(election?.share_code ?? '').padStart(6, '0')} · {election?.visibility ?? 'private'}
        </p>
        {election?.deadline ? (
          <p className="text-xs uppercase tracking-[0.4em] text-white/50">
            Deadline {dayjs(election.deadline).format('MMM D • h:mm A')}
          </p>
        ) : null}
      </header>

      <div className="glass-panel space-y-6 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-brand-200">Live vote count</p>
            <p className="text-sm text-white/70">SECURITY DEFINER view hides voter identities.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleDelete}
              disabled={!election || isDeleting}
              className="rounded-full border border-danger/60 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-danger/80 transition hover:border-danger hover:bg-danger/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isDeleting ? 'Deleting…' : 'Delete election'}
            </button>
            <button
              onClick={handlePublish}
              disabled={election?.results_visible || isPublishing}
              className="rounded-full bg-success/90 px-5 py-2 text-sm font-semibold text-surface transition hover:bg-success disabled:cursor-not-allowed disabled:bg-white/10"
            >
              {election?.results_visible ? 'Leaderboard live' : isPublishing ? 'Publishing…' : 'Publish results'}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            className="rounded-2xl border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white/80"
            onClick={() => updateElection({ status: 'live' })}
            disabled={election?.status === 'live'}
          >
            Start
          </button>
          <button
            className="rounded-2xl border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white/80"
            onClick={() => updateElection({ status: 'paused' })}
            disabled={election?.status === 'paused'}
          >
            Pause
          </button>
          <button
            className="rounded-2xl border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white/80"
            onClick={() => updateElection({ status: 'closed' })}
            disabled={election?.status === 'closed'}
          >
            End
          </button>
          <button
            className="rounded-2xl border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white/80"
            onClick={() =>
              updateElection({ visibility: election?.visibility === 'public' ? 'private' : 'public' })
            }
          >
            {election?.visibility === 'public' ? 'Make private' : 'Make public'}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="text-xs uppercase tracking-[0.3em] text-white/60">
            Deadline
            <input
              type="datetime-local"
              value={deadlineInput}
              onChange={(event) => setDeadlineInput(event.target.value)}
              className="mt-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-white"
            />
          </label>
          <button
            className="rounded-2xl bg-brand-500 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white"
            onClick={handleDeadlineUpdate}
          >
            Save deadline
          </button>
        </div>

        <div className="space-y-4">
          {candidates.length === 0 ? (
            <p className="text-sm text-white/60">Add candidates in Supabase to start tracking votes.</p>
          ) : (
            candidates.map((candidate) => (
              <article
                key={candidate.id}
                className="rounded-2xl border border-white/5 bg-white/10 px-4 py-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-semibold text-white">{candidate.name}</p>
                    <p className="text-xs uppercase tracking-widest text-white/60">{candidate.slate}</p>
                  </div>
                  <p className="font-display text-3xl text-brand-200">{voteMap[candidate.id] ?? 0}</p>
                </div>
                {candidate.vision ? (
                  <p className="mt-3 text-sm text-white/70">{candidate.vision}</p>
                ) : null}
              </article>
            ))
          )}
        </div>

        {error ? <p className="text-sm text-danger">{error}</p> : null}
        {statusMessage ? <p className="text-sm text-success">{statusMessage}</p> : null}
      </div>
    </section>
  )
}
