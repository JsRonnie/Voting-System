import { supabase } from '../lib/supabaseClient'

export default function UserBadge({ profile }) {
  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  if (!profile) return null

  return (
    <div className="glass-panel flex items-center justify-between gap-4 rounded-2xl px-5 py-3">
      <div>
        <p className="text-sm font-medium text-white">{profile.full_name ?? 'Welcome'}</p>
        <p className="text-xs uppercase tracking-widest text-white/60">{profile.role === 'organizer' ? 'Organizer' : 'Voter'}</p>
      </div>
      <button
        onClick={handleSignOut}
        className="rounded-full border border-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white/80 hover:border-white/40"
      >
        Log out
      </button>
    </div>
  )
}
