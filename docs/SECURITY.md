# VERITYX — Security & Defense-in-Depth Specification

## 1. SSRF (Server-Side Request Forgery) Defense
The source scraping engine evaluates all user-supplied URLs via `is_safe_url()` in `app/core/security.py`:
- Blocks loopback IP ranges (`127.0.0.0/8`, `::1/128`)
- Blocks internal RFC 1918 networks (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`)
- Blocks AWS/GCP/Azure link-local cloud metadata endpoints (`169.254.169.254`, `metadata.google.internal`)
- Rejects non-HTTP/HTTPS schemes (e.g. `file://`, `gopher://`, `ftp://`)

## 2. Row Level Security (RLS)
Every table in Supabase PostgreSQL has Row Level Security active:
- Direct queries are constrained by `auth.uid() = user_id` or ownership joins.
- Anonymous users cannot read or write private research dossiers or tracked opportunities.

## 3. Storage Security
- PDF reports are generated into a private storage bucket (`verityx_pdfs`).
- Download links stream through authenticated endpoints verifying record ownership.

## 4. Secret Isolation
- Client-side code accesses ONLY `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (publishable key).
- No backend secrets (Gemini API key, JWT secret, database credentials) are exposed in frontend environment variables.

