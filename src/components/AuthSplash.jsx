import { useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const gallery = [
  {
    src: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=900&q=80',
    caption: 'Student councils launch pop-up polls across campus greens.',
  },
  {
    src: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=900&q=80',
    caption: 'Organizers monitor live turnout from mobile dashboards.',
  },
  {
    src: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=900&q=80',
    caption: 'Public voting walls beam codes to every passerby.',
  },
]

export default function AuthSplash() {
  const [mode, setMode] = useState('login')
  const [status, setStatus] = useState('idle')
  const [message, setMessage] = useState('')
  const [form, setForm] = useState({
    fullName: '',
    campusUnit: '',
    role: 'voter',
    email: '',
    password: '',
  })

  const currentImage = useMemo(() => gallery[Math.floor(Math.random() * gallery.length)], [])

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setStatus('loading')
    setMessage('')

    if (mode === 'register') {
      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            full_name: form.fullName,
            campus_unit: form.campusUnit,
            role: form.role,
          },
        },
      })

      if (error) {
        setStatus('error')
        setMessage(error.message)
        return
      }

      setStatus('success')
      setMessage('Registration complete! Check your inbox if email confirmation is required.')
      setMode('login')
      setForm((prev) => ({ ...prev, password: '' }))
      return
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    })

    if (error) {
      setStatus('error')
      setMessage(error.message)
    } else {
      setStatus('success')
      setMessage('Welcome back! Redirecting…')
    }
  }

  return (
    <section className="grid min-h-screen grid-cols-1 gap-0 overflow-hidden bg-surface text-white md:grid-cols-2">
      <article className="relative hidden h-full w-full md:block">
        <img src={currentImage.src} alt="Campus activation" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 space-y-4 p-12">
          <p className="text-xs uppercase tracking-[0.45em] text-brand-200">Campus Voting System</p>
          <h2 className="font-display text-4xl">Secure ballots live in one place.</h2>
          <p className="text-sm text-white/80">{currentImage.caption}</p>
        </div>
      </article>

      <article className="flex flex-col items-center justify-center px-8 py-12">
        <div className="w-full max-w-md space-y-8">
          <div className="space-y-3 text-center">
            <p className="inline-flex rounded-full bg-white/10 px-4 py-1 text-xs uppercase tracking-[0.35em] text-brand-200">
              Campus Voting
            </p>
            <h1 className="font-display text-4xl">
              {mode === 'login' ? 'Welcome back' : 'Create your organizer kit'}
            </h1>
            <p className="text-sm text-white/70">
              {mode === 'login'
                ? 'Log in to manage ballots, enter access codes, and revisit your voting history.'
                : 'Register with a strong password, then instantly spin up private or public elections.'}
            </p>
          </div>

          <div className="flex items-center justify-center gap-4 text-xs uppercase tracking-[0.4em]">
            <button
              className={`rounded-full px-4 py-2 ${mode === 'login' ? 'bg-brand-400 text-surface' : 'text-white/50'}`}
              onClick={() => setMode('login')}
            >
              Login
            </button>
            <button
              className={`rounded-full px-4 py-2 ${mode === 'register' ? 'bg-brand-400 text-surface' : 'text-white/50'}`}
              onClick={() => setMode('register')}
            >
              Register
            </button>
          </div>

          <form className="glass-panel space-y-4 p-8" onSubmit={handleSubmit}>
            {mode === 'register' ? (
              <>
                <label className="text-left text-xs uppercase tracking-widest text-white/70">
                  Full name
                  <input
                    type="text"
                    value={form.fullName}
                    onChange={(event) => handleChange('fullName', event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-brand-400"
                    required
                  />
                </label>
                <label className="text-left text-xs uppercase tracking-widest text-white/70">
                  Campus / unit
                  <input
                    type="text"
                    value={form.campusUnit}
                    onChange={(event) => handleChange('campusUnit', event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-brand-400"
                    placeholder="Student affairs, media club…"
                  />
                </label>
                <label className="text-left text-xs uppercase tracking-widest text-white/70">
                  Role
                  <select
                    value={form.role}
                    onChange={(event) => handleChange('role', event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-brand-400"
                  >
                    <option value="voter" className="bg-surface">
                      Voter
                    </option>
                    <option value="organizer" className="bg-surface">
                      Organizer
                    </option>
                  </select>
                </label>
              </>
            ) : null}

            <label className="text-left text-xs uppercase tracking-widest text-white/70">
              Email
              <input
                type="email"
                value={form.email}
                autoComplete="email"
                onChange={(event) => handleChange('email', event.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-brand-400"
                required
              />
            </label>
            <label className="text-left text-xs uppercase tracking-widest text-white/70">
              Password
              <input
                type="password"
                value={form.password}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                onChange={(event) => handleChange('password', event.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-brand-400"
                required
              />
            </label>

            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full rounded-2xl bg-brand-500 px-4 py-3 font-semibold text-white transition hover:bg-brand-400 disabled:cursor-not-allowed disabled:bg-white/10"
            >
              {status === 'loading' ? 'Please wait…' : mode === 'login' ? 'Login' : 'Create account'}
            </button>

            {message ? (
              <p className={`text-sm ${status === 'error' ? 'text-danger' : 'text-brand-200'}`}>{message}</p>
            ) : null}
          </form>
        </div>
      </article>
    </section>
  )
}
