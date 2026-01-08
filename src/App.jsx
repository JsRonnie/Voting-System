import { useEffect, useMemo, useState } from 'react'
import JoinElection from './components/JoinElection.jsx'
import ElectionDashboard from './components/ElectionDashboard.jsx'
import VotingHistory from './components/VotingHistory.jsx'
import Leaderboard from './components/Leaderboard.jsx'
import AuthSplash from './components/AuthSplash.jsx'
import UserBadge from './components/UserBadge.jsx'
import ActiveElectionPane from './components/ActiveElectionPane.jsx'
import HomePortal from './components/HomePortal.jsx'
import PublicVotingGrid from './components/PublicVotingGrid.jsx'
import CreateElectionForm from './components/CreateElectionForm.jsx'
import { supabase } from './lib/supabaseClient.js'
import './App.css'

function App() {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [history, setHistory] = useState([])
  const [historyVersion, setHistoryVersion] = useState(0)
  const [ownedElections, setOwnedElections] = useState([])
  const [ownedVersion, setOwnedVersion] = useState(0)
  const [selectedOwnedId, setSelectedOwnedId] = useState(null)
  const [activeElection, setActiveElection] = useState(null)
  const [leaderboardElectionId, setLeaderboardElectionId] = useState(null)
  const [publicElections, setPublicElections] = useState([])
  const [publicVersion, setPublicVersion] = useState(0)
  const [tab, setTab] = useState('home')

  useEffect(() => {
    const initSession = async () => {
      const { data } = await supabase.auth.getSession()
      setSession(data.session ?? null)
    }
    initSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })
    return () => {
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!session?.user) {
      setProfile(null)
      return
    }
    const loadProfile = async () => {
      const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle()
      if (data) {
        setProfile(data)
        return
      }
      const fallbackProfile = {
        id: session.user.id,
        full_name: session.user.user_metadata?.full_name ?? session.user.email ?? 'Welcome',
        campus_unit: session.user.user_metadata?.campus_unit ?? '',
        role: session.user.user_metadata?.role ?? 'voter',
      }
      setProfile(fallbackProfile)
    }
    loadProfile()
  }, [session])

  const resolvedRole = (profile?.role ?? session?.user?.user_metadata?.role ?? session?.user?.app_metadata?.role ?? '')
    .toString()
    .toLowerCase()
  const organizerMode = resolvedRole === 'organizer'

  useEffect(() => {
    if (profile) {
      setTab('home')
    }
  }, [profile])

  useEffect(() => {
    if (!profile) {
      setHistory([])
      return
    }
    const loadHistory = async () => {
      const { data } = await supabase
        .from('votes')
        .select(
          `id, candidate_id, created_at, candidates(name), elections(id, title, share_code, results_visible, vote_window_end, status, visibility, banner_url)`
        )
        .eq('voter_id', profile.id)
        .order('created_at', { ascending: false })
      const records = (data ?? []).map((row) => ({
        vote_id: row.id,
        election_id: row.elections?.id,
        election_title: row.elections?.title,
        election_code: row.elections?.share_code,
        results_visible: row.elections?.results_visible,
        election_status: row.elections?.status,
        election_visibility: row.elections?.visibility,
        banner_url: row.elections?.banner_url,
        candidate_name: row.candidates?.name,
        is_live:
          !row.elections?.results_visible &&
          (row.elections?.vote_window_end ? Date.parse(row.elections.vote_window_end) > Date.now() : true),
      }))
      setHistory(records)
    }
    loadHistory()
  }, [profile, historyVersion])

  useEffect(() => {
    if (!organizerMode) {
      setOwnedElections([])
      return
    }
    const loadOwned = async () => {
      const { data } = await supabase
        .from('elections')
        .select('*')
        .eq('owner_id', profile.id)
        .order('created_at', { ascending: false })
      setOwnedElections(data ?? [])
      if (!selectedOwnedId && data?.length) {
        setSelectedOwnedId(data[0].id)
      }
    }
    loadOwned()
  }, [organizerMode, profile?.id, ownedVersion, selectedOwnedId])

  useEffect(() => {
    const loadPublic = async () => {
      const { data } = await supabase
        .from('elections')
        .select('*')
        .eq('visibility', 'public')
        .order('status', { ascending: true })
        .order('created_at', { ascending: false })
      setPublicElections(data ?? [])
    }
    loadPublic()
  }, [publicVersion])

  const selectedOwnedElection = useMemo(
    () => ownedElections.find((entry) => entry.id === selectedOwnedId) ?? null,
    [ownedElections, selectedOwnedId]
  )

  const stats = useMemo(
    () => ({
      owned: ownedElections.length,
      votes: history.length,
      publicLive: publicElections.filter((entry) => entry.status === 'live').length,
    }),
    [ownedElections.length, history.length, publicElections]
  )

  const refreshHistory = () => setHistoryVersion((value) => value + 1)
  const refreshOwned = () => setOwnedVersion((value) => value + 1)
  const refreshPublic = () => setPublicVersion((value) => value + 1)

  if (!session) {
    return <AuthSplash />
  }

  const tabs = [
    { id: 'home', label: 'Home' },
    { id: 'public', label: 'Public Voting' },
    { id: 'join', label: 'Join' },
    { id: 'history', label: 'History' },
  ]

  if (organizerMode) {
    tabs.push({ id: 'create', label: 'Create' }, { id: 'dashboard', label: 'Organizer' })
  }

  return (
    <div className="app-shell">
      <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-4 py-10 sm:px-8">
        <UserBadge profile={profile} />

        <nav className="flex gap-3">
          {tabs.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`flex-1 rounded-2xl border px-4 py-3 text-sm font-semibold uppercase tracking-widest transition ${
                tab === item.id
                  ? 'border-brand-400 bg-brand-400/20 text-white'
                  : 'border-white/10 bg-white/5 text-white/60'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {tab === 'home' && (
          <HomePortal
            profile={profile}
            stats={stats}
            publicElections={publicElections}
            onNavigate={setTab}
            onJoinElection={(election) => setActiveElection(election)}
            organizerMode={organizerMode}
          />
        )}

        {tab === 'public' && (
          <PublicVotingGrid
            elections={publicElections}
            onJoin={(election) => {
              setActiveElection(election)
              setTab('join')
            }}
            onPreview={(election) => election.results_visible && setLeaderboardElectionId(election.id)}
          />
        )}

        {tab === 'join' && (
          <div className="space-y-10">
            {activeElection ? (
              <ActiveElectionPane
                key={activeElection.id}
                election={activeElection}
                profile={profile}
                onBallotCast={() => {
                  refreshHistory()
                }}
              />
            ) : null}
            <JoinElection
              onElectionFound={(election) => {
                setActiveElection(election)
                setTab('join')
              }}
            />
          </div>
        )}

        {tab === 'history' && (
          <VotingHistory
            history={history}
            onViewLeaderboard={(electionId) => setLeaderboardElectionId(electionId)}
          />
        )}

        {tab === 'create' && organizerMode && (
          <CreateElectionForm
            profile={profile}
            onCreated={(election) => {
              refreshOwned()
              refreshPublic()
              setSelectedOwnedId(election.id)
              setTab('dashboard')
            }}
          />
        )}

        {tab === 'dashboard' && organizerMode && (
          <div className="space-y-6">
            <div className="glass-panel flex flex-col gap-3 p-6">
              <label className="text-xs uppercase tracking-[0.3em] text-white/60">
                Pick election
                <select
                  value={selectedOwnedId ?? ''}
                  onChange={(event) => setSelectedOwnedId(event.target.value)}
                  className="mt-3 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-brand-400"
                >
                  <option value="" disabled>
                    {ownedElections.length ? 'Pick an election' : 'No elections yet'}
                  </option>
                  {ownedElections.map((entry) => (
                    <option key={entry.id} value={entry.id} className="bg-surface text-white">
                      {entry.title}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <ElectionDashboard
              election={selectedOwnedElection}
              onPublish={() => {
                refreshOwned()
                refreshHistory()
                refreshPublic()
              }}
            />
          </div>
        )}
      </main>

      {leaderboardElectionId ? (
        <Leaderboard electionId={leaderboardElectionId} onClose={() => setLeaderboardElectionId(null)} />
      ) : null}
    </div>
  )
}

export default App
