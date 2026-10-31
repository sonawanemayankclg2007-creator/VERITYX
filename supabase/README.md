# VERITYX — Supabase Database Architecture & Setup

## 1. Connected Project
- **Project URL**: `https://cfdzutredjuweiszdias.supabase.co`
- **Publishable Key**: `sb_publishable_FuUlPeqUHsG6altp1qcdfg_E48T2Brp`

## 2. Running Migrations in Supabase
To initialize the full database schema:
1. Navigate to your Supabase Dashboard: [https://supabase.com/dashboard/project/cfdzutredjuweiszdias](https://supabase.com/dashboard/project/cfdzutredjuweiszdias)
2. In the left navigation, click on **SQL Editor**.
3. Click **New query**.
4. Open and copy the entire contents of [`migrations/20261030000000_initial_schema.sql`](./migrations/20261030000000_initial_schema.sql).
5. Paste into the SQL Editor and click **Run**.
6. All 16 tables, triggers, indexes, and RLS policies will be created instantly.

## 3. Storage Bucket Configuration
The migration automatically configures:
- Bucket ID: `verityx_pdfs` (Private by default)
- Storage RLS policies allowing authenticated users to upload and download their own generated PDF reports.

## 4. Google OAuth Setup in Supabase
1. In Supabase Dashboard, navigate to **Authentication** -> **Providers** -> **Google**.
2. Toggle Google to **Enabled**.
3. Enter your **Google Client ID** and **Google Client Secret** from Google Cloud Console.
4. Copy the **Callback URL (for OAuth)** provided by Supabase (e.g. `https://cfdzutredjuweiszdias.supabase.co/auth/v1/callback`) and paste it into your Google Cloud Console under **Authorized redirect URIs**.
5. Save changes.

