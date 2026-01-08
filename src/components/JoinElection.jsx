import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const keypad = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'clr', '0']

const formatCode = (value) => value.replace(/(\d{3})(?=\d)/g, '$1 ').trim()

export default function JoinElection({ onElectionFound }) {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const isReady = code.length === 6

  const keypadButtons = useMemo(() => keypad, [])

  const handleKeypad = (symbol) => {
    setError('')
    if (symbol === 'clr') {
      setCode('')
      return
    }
    if (code.length >= 6) return
    setCode((prev) => (prev + symbol).slice(0, 6))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!isReady) return

    setIsLoading(true)
    setError('')
    const { data, error: queryError } = await supabase
      .from('elections')
      .select('*')
      .eq('share_code', Number(code))
      .maybeSingle()

    setIsLoading(false)

    if (queryError || !data) {
      setError('Code not found. Try another flyer code.')
      return
    }

    onElectionFound?.(data)
  }

  return (
    <section className="space-y-8">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-accent">Join with a code</p>
        <h2 className="font-display text-3xl text-white">Enter the 6-digit flyer code</h2>
        <p className="text-sm text-white/70">No links, just the code pinned across campus.</p>
      </header>

      <form onSubmit={handleSubmit} className="glass-panel space-y-6 p-8">
        <div className="flex flex-col items-center gap-2">
          <input
            ref={inputRef}
            type="tel"
            inputMode="numeric"
            value={formatCode(code)}
            onChange={(event) =>
              setCode(event.target.value.replace(/\D/g, '').slice(0, 6))
            }
            placeholder="000 000"
            className="w-full max-w-xs rounded-3xl border border-white/10 bg-white/5 px-6 py-5 text-center text-3xl tracking-[0.4em] text-white focus:border-brand-400 focus:outline-none"
          />
          <p className="text-xs uppercase tracking-[0.3em] text-white/40">Tap numbers below</p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {keypadButtons.map((symbol) => (
            <button
              key={symbol}
              type="button"
              onClick={() => handleKeypad(symbol)}
              className={`rounded-2xl border border-white/10 px-6 py-4 text-2xl font-semibold text-white transition ${
                symbol === 'clr'
                  ? 'bg-white/5 text-sm uppercase tracking-widest'
                  : 'bg-white/10 hover:bg-white/20'
              }`}
            >
              {symbol === 'clr' ? 'Clear' : symbol}
            </button>
          ))}
        </div>

        {error ? <p className="text-sm text-danger">{error}</p> : null}

        <button
          type="submit"
          disabled={!isReady || isLoading}
          className="w-full rounded-2xl bg-brand-500 py-4 text-lg font-semibold text-white transition hover:bg-brand-400 disabled:cursor-not-allowed disabled:bg-white/10"
        >
          {isLoading ? 'Searching…' : 'Jump into election'}
        </button>
      </form>
    </section>
  )
}
