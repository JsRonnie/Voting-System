import { useEffect, useRef, useState } from 'react'
import dayjs from 'dayjs'
import { supabase } from '../lib/supabaseClient'

const emptyCandidate = () => ({
  name: '',
  number: '',
  photo_url: '',
  description: '',
  goals: '',
  vision: '',
})

const defaultAvatar =
  'https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png'
const defaultBanner =
  'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=1200&q=80'
const bannerPool = [
  'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1520975918311-049dfb950b6a?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1475724017904-b712052c192a?auto=format&fit=crop&w=1600&q=80',
]

const getRandomBanner = () => bannerPool[Math.floor(Math.random() * bannerPool.length)]

export default function CreateElectionForm({ profile, onCreated }) {
  const [form, setForm] = useState(() => ({
    title: '',
    description: '',
    banner_url: getRandomBanner(),
    visibility: 'private',
    deadline: '',
    status: 'draft',
  }))
  const [candidates, setCandidates] = useState([emptyCandidate(), emptyCandidate()])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [uploadingIndex, setUploadingIndex] = useState(null)
  const [bannerUploading, setBannerUploading] = useState(false)
  const [pendingScrollIndex, setPendingScrollIndex] = useState(null)

  const bucketName = import.meta.env.VITE_SUPABASE_STORAGE_BUCKET ?? 'candidateprofile'
  const candidateRefs = useRef([])

  const updateCandidate = (index, field, value) => {
    setCandidates((prev) => prev.map((candidate, candidateIndex) => (candidateIndex === index ? { ...candidate, [field]: value } : candidate)))
  }

  const addCandidate = () =>
    setCandidates((prev) => {
      const next = [...prev, emptyCandidate()]
      setPendingScrollIndex(next.length - 1)
      return next
    })
  const removeCandidate = (index) => {
    setCandidates((prev) => {
      if (prev.length === 1) return prev
      const next = prev.filter((_, candidateIndex) => candidateIndex !== index)
      candidateRefs.current.splice(index, 1)
      return next
    })
  }

  useEffect(() => {
    if (pendingScrollIndex === null) return
    const target = candidateRefs.current[pendingScrollIndex]
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setPendingScrollIndex(null)
    }
  }, [pendingScrollIndex, candidates.length])

  const uploadImageToBucket = async (file, folder) => {
    if (!file || !bucketName) {
      throw new Error('Storage bucket is not configured')
    }
    const fileExt = file.name.split('.').pop()
    const safeExt = fileExt ? fileExt.toLowerCase() : 'jpg'
    const uniquePath = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${safeExt}`
    const { error: uploadError } = await supabase.storage.from(bucketName).upload(uniquePath, file, { upsert: true })
    if (uploadError) {
      throw uploadError
    }
    const { data: publicUrlData } = supabase.storage.from(bucketName).getPublicUrl(uniquePath)
    return publicUrlData?.publicUrl ?? ''
  }

  const handlePhotoUpload = async (index, file) => {
    setUploadingIndex(index)
    setMessage('')
    try {
      const publicUrl = await uploadImageToBucket(file, `${profile?.id ?? 'anon'}/candidates`)
      updateCandidate(index, 'photo_url', publicUrl)
    } catch (error) {
      setMessage(`Photo upload failed: ${error.message}`)
    } finally {
      setUploadingIndex(null)
    }
  }

  const handleBannerUpload = async (file) => {
    setBannerUploading(true)
    setMessage('')
    try {
      const publicUrl = await uploadImageToBucket(file, `${profile?.id ?? 'anon'}/banners`)
      setForm((prev) => ({ ...prev, banner_url: publicUrl }))
    } catch (error) {
      setMessage(`Banner upload failed: ${error.message}`)
    } finally {
      setBannerUploading(false)
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!profile) return
    setIsSubmitting(true)
    setMessage('')

    const payload = {
      title: form.title,
      description: form.description,
      owner_id: profile.id,
      banner_url: form.banner_url,
      visibility: form.visibility,
      status: form.status,
      deadline: form.deadline ? new Date(form.deadline).toISOString() : null,
    }

    const { data: election, error } = await supabase
      .from('elections')
      .insert(payload)
      .select('*')
      .maybeSingle()

    if (error) {
      setIsSubmitting(false)
      setMessage(error.message)
      return
    }

    const preparedCandidates = candidates
      .filter((candidate) => candidate.name.trim().length)
      .map((candidate, index) => ({
        election_id: election.id,
        name: candidate.name,
        number: Number(candidate.number || index + 1),
        photo_url: candidate.photo_url,
        description: candidate.description,
        goals: candidate.goals,
        vision: candidate.vision,
      }))

    if (preparedCandidates.length) {
      const { error: candidateError } = await supabase.from('candidates').insert(preparedCandidates)
      if (candidateError) {
        setMessage(candidateError.message)
        setIsSubmitting(false)
        return
      }
    }

    setIsSubmitting(false)
    setMessage('Election published! Share the code or send voters to the public gallery.')
    setForm({ title: '', description: '', banner_url: getRandomBanner(), visibility: 'private', deadline: '', status: 'draft' })
    setCandidates([emptyCandidate(), emptyCandidate()])
    onCreated?.(election)
  }

  return (
    <section className="glass-panel space-y-8 p-6">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.4em] text-accent">Create election</p>
        <h2 className="font-display text-3xl text-white">Design the ballot</h2>
        <p className="text-sm text-white/70">Add imagery, goals, and decide whether the world can see it.</p>
      </header>

      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-xs uppercase tracking-[0.4em] text-white/60">
            Title
            <input
              type="text"
              value={form.title}
              onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white"
              required
            />
          </label>
          <label className="text-xs uppercase tracking-[0.4em] text-white/60">
            Banner image
            <div className="mt-2 flex flex-col gap-3 md:flex-row">
              <input
                type="url"
                value={form.banner_url}
                onChange={(event) => setForm((prev) => ({ ...prev, banner_url: event.target.value }))}
                placeholder="https://images.unsplash.com/..."
                className="w-full flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white"
              />
              <div className="md:w-48">
                <input
                  id="banner-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0]
                    if (file) {
                      handleBannerUpload(file)
                      event.target.value = ''
                    }
                  }}
                />
                <label
                  htmlFor="banner-upload"
                  className={`inline-flex w-full cursor-pointer items-center justify-center rounded-2xl border border-dashed border-white/20 px-4 py-3 text-xs transition ${
                    bannerUploading ? 'text-white/40' : 'text-brand-200 hover:border-brand-400 hover:bg-brand-400/10'
                  }`}
                >
                  {bannerUploading ? 'Uploading…' : 'Upload banner'}
                </label>
              </div>
            </div>
            <div className="mt-3 flex flex-col gap-2">
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/40">
                <img
                  src={form.banner_url || defaultBanner}
                  alt="Banner preview"
                  className="h-40 w-full object-contain"
                />
              </div>
              {form.banner_url ? (
                <button
                  type="button"
                  className="self-start rounded-full border border-danger/40 px-4 py-1 text-[10px] uppercase tracking-[0.4em] text-danger/80 transition hover:border-danger hover:bg-danger/10"
                  onClick={() => setForm((prev) => ({ ...prev, banner_url: '' }))}
                >
                  Remove photo
                </button>
              ) : (
                <p className="text-xs text-white/60">Shows a placeholder until you choose a banner.</p>
              )}
            </div>
          </label>
          <label className="text-xs uppercase tracking-[0.4em] text-white/60">
            Visibility
            <select
              value={form.visibility}
              onChange={(event) => setForm((prev) => ({ ...prev, visibility: event.target.value }))}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-black bg-surface"
            >
              <option value="private">Private — code only</option>
              <option value="public">Public — show in gallery</option>
            </select>
          </label>
          <label className="text-xs uppercase tracking-[0.4em] text-white/60">
            Status
            <select
              value={form.status}
              onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value }))}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-black bg-surface"
            >
              <option value="draft">Draft</option>
              <option value="scheduled">Scheduled</option>
              <option value="live">Live</option>
              <option value="paused">Paused</option>
              <option value="closed">Closed</option>
            </select>
          </label>
          <label className="md:col-span-2 text-xs uppercase tracking-[0.4em] text-white/60">
            Description
            <textarea
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
              rows={3}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white"
            />
          </label>
          <label className="text-xs uppercase tracking-[0.4em] text-white/60">
            Deadline
            <input
              type="datetime-local"
              value={form.deadline}
              min={dayjs().format('YYYY-MM-DDTHH:mm')}
              onChange={(event) => setForm((prev) => ({ ...prev, deadline: event.target.value }))}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white"
            />
          </label>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-2xl text-white">Candidates</h3>
          </div>
          <div className="space-y-6">
            {candidates.map((candidate, index) => (
              <div
                key={index}
                ref={(element) => {
                  candidateRefs.current[index] = element
                }}
                className={`rounded-3xl border border-white/10 p-5 ${index % 2 === 0 ? 'bg-white/5' : 'bg-white/10'}`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase tracking-[0.4em] text-white/50">Card {index + 1}</p>
                  <button
                    type="button"
                    className="rounded-full border border-danger/40 px-4 py-1 text-[10px] uppercase tracking-[0.4em] text-danger/80 transition hover:border-danger hover:bg-danger/10 disabled:opacity-40"
                    onClick={() => removeCandidate(index)}
                    disabled={candidates.length === 1}
                  >
                    Remove
                  </button>
                </div>
                <div className="mt-3 grid gap-4 md:grid-cols-2">
                  <label className="text-[10px] uppercase tracking-[0.4em] text-white/60">
                    Name
                    <input
                      type="text"
                      value={candidate.name}
                      onChange={(event) => updateCandidate(index, 'name', event.target.value)}
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white"
                      required={index < 2}
                    />
                  </label>
                  <label className="text-[10px] uppercase tracking-[0.4em] text-white/60">
                    Number
                    <input
                      type="number"
                      min="1"
                      value={candidate.number}
                      onChange={(event) => updateCandidate(index, 'number', event.target.value)}
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white"
                    />
                  </label>
                  <label className="text-[10px] uppercase tracking-[0.4em] text-white/60">
                    Photo URL
                    <input
                      type="url"
                      value={candidate.photo_url}
                      onChange={(event) => updateCandidate(index, 'photo_url', event.target.value)}
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white"
                      placeholder="https://..."
                    />
                  </label>
                  <div className="text-[10px] uppercase tracking-[0.4em] text-white/60">
                    Upload photo
                    <div className="mt-2">
                      <input
                        id={`candidate-upload-${index}`}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(event) => {
                          const file = event.target.files?.[0]
                          if (file) {
                            handlePhotoUpload(index, file)
                            event.target.value = ''
                          }
                        }}
                      />
                      <label
                        htmlFor={`candidate-upload-${index}`}
                        className={`inline-flex w-full cursor-pointer items-center justify-center rounded-2xl border border-dashed border-white/20 px-4 py-3 text-xs transition ${
                          uploadingIndex === index
                            ? 'text-white/40'
                            : 'text-brand-200 hover:border-brand-400 hover:bg-brand-400/10'
                        }`}
                      >
                        {uploadingIndex === index ? 'Uploading…' : 'Select image'}
                      </label>
                    </div>
                  </div>
                  <div className="md:col-span-2 flex flex-col gap-2">
                    <div className="flex items-center gap-4">
                      <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-black/40">
                        <img
                          src={candidate.photo_url || defaultAvatar}
                          alt={`${candidate.name || 'Candidate'} preview`}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <p className="text-xs text-white/60">
                        Preview uses a placeholder silhouette until you add a custom photo.
                      </p>
                    </div>
                    {candidate.photo_url ? (
                      <button
                        type="button"
                        className="self-start rounded-full border border-danger/40 px-4 py-1 text-[10px] uppercase tracking-[0.4em] text-danger/80 transition hover:border-danger hover:bg-danger/10"
                        onClick={() => updateCandidate(index, 'photo_url', '')}
                      >
                        Remove photo
                      </button>
                    ) : null}
                  </div>
                  <label className="text-[10px] uppercase tracking-[0.4em] text-white/60">
                    Goals
                    <input
                      type="text"
                      value={candidate.goals}
                      onChange={(event) => updateCandidate(index, 'goals', event.target.value)}
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white"
                      placeholder="Three bullet manifesto"
                    />
                  </label>
                  <label className="md:col-span-2 text-[10px] uppercase tracking-[0.4em] text-white/60">
                    Description / Vision
                    <textarea
                      value={candidate.description}
                      onChange={(event) => updateCandidate(index, 'description', event.target.value)}
                      rows={2}
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white"
                    />
                  </label>
                  <label className="md:col-span-2 text-[10px] uppercase tracking-[0.4em] text-white/60">
                    Vision tagline
                    <input
                      type="text"
                      value={candidate.vision}
                      onChange={(event) => updateCandidate(index, 'vision', event.target.value)}
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white"
                    />
                  </label>
                </div>
              </div>
            ))}
            <div className="flex justify-center">
              <button
                type="button"
                onClick={addCandidate}
                className="rounded-2xl border border-white/30 px-6 py-3 text-xs font-semibold uppercase tracking-[0.4em] text-white transition hover:border-brand-400 hover:bg-brand-400/10"
              >
                + Add candidate
              </button>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-3xl bg-brand-500 py-4 text-lg font-semibold text-white disabled:cursor-not-allowed disabled:bg-white/20"
        >
          {isSubmitting ? 'Publishing…' : 'Save election'}
        </button>

        {message ? <p className="text-sm text-brand-200">{message}</p> : null}
      </form>
    </section>
  )
}
