# VERITYX — Production Deployment Guide

## Deployment Targets
- **Frontend**: Vercel / Netlify / Cloudflare Pages
- **Backend**: Render / Railway / Fly.io / AWS ECS
- **Database & Auth**: Supabase Cloud (`https://cfdzutredjuweiszdias.supabase.co`)

---

## 1. Frontend Deployment (Vercel)
1. Push repository to GitHub.
2. In Vercel, click **Add New Project** and select `frontend/` as the Root Directory.
3. Framework Preset: **Vite**.
4. Set Environment Variables:
   ```env
   VITE_SUPABASE_URL=https://cfdzutredjuweiszdias.supabase.co
   VITE_SUPABASE_ANON_KEY=sb_publishable_FuUlPeqUHsG6altp1qcdfg_E48T2Brp
   VITE_API_BASE_URL=https://your-backend-domain.onrender.com/api/v1
   VITE_APP_URL=https://your-app-domain.vercel.app
   ```
5. Click **Deploy**.

---

## 2. Backend Deployment (Render / Docker)
1. Create a **Web Service** on Render pointing to the `backend/` directory or root `docker-compose.yml`.
2. Build Command: `pip install -r requirements.txt python-multipart`
3. Start Command: `uvicorn app.main:app --host 0.0.0.0 --port 8000`
4. Set Environment Variables:
   ```env
   SUPABASE_URL=https://cfdzutredjuweiszdias.supabase.co
   SUPABASE_ANON_KEY=sb_publishable_FuUlPeqUHsG6altp1qcdfg_E48T2Brp
   GEMINI_API_KEY=your_gemini_api_key_here
   FRONTEND_URL=https://your-app-domain.vercel.app
   CORS_ORIGINS=["https://your-app-domain.vercel.app","http://localhost:5173"]
   ```

---

## 3. Supabase Database Migrations
1. In Supabase Dashboard, open the **SQL Editor**.
2. Run the migration script in `supabase/migrations/20261030000000_initial_schema.sql`.
3. Verify that all 16 tables have RLS enabled.

