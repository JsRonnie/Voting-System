# Voting-System

## Environment Variables
- **Required (client build-time)**:
	- `VITE_SUPABASE_URL`
	- `VITE_SUPABASE_ANON_KEY`

Create a local `.env` using `.env.example` and ensure values are valid. Vite only injects variables prefixed with `VITE_` into the client bundle.

Do not use the Supabase service role key in client-side code.

## Local Development
- Install: `npm install`
- Run: `npm run dev`

## Deploying to Vercel
1. In Vercel Dashboard → Project → Settings → Environment Variables, add:
	 - `VITE_SUPABASE_URL` (Production, Preview, Development as needed)
	 - `VITE_SUPABASE_ANON_KEY` (same environments)
2. Redeploy the project so the build picks up the variables.
3. If you change these variables, trigger another redeploy; Vite replaces them at build time.

This project uses Vite (output directory `dist`). Vercel’s Vite preset should auto-detect the build command (`npm run build`).