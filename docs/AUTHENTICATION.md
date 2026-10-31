# VERITYX — Authentication & Google OAuth Guide

VERITYX uses **Supabase Auth** as its single, persistent identity provider.

## Features
- **Email & Password Authentication**: Validated with Zod schemas, 8+ char complexity (uppercase, lowercase, number), password visibility toggles, and matching confirmation validation.
- **Google OAuth Integration**: Direct PKCE authorization flow redirecting to `/auth/callback`.
- **Automatic User Profile Generation**: A database trigger on `auth.users` creates and populates the `public.profiles` table with full name, avatar, and default notification preferences.
- **Session Persistence**: Automated token refresh and persistent storage via Supabase JS SDK.

## Setting Up Google OAuth in Supabase
1. Go to your **Google Cloud Console**: [https://console.cloud.google.com](https://console.cloud.google.com)
2. Create or select your Google Cloud project.
3. Configure the **OAuth Consent Screen** (User Type: External, App Name: `VERITYX`).
4. Under **Credentials**, click **Create Credentials** -> **OAuth client ID** (Application type: Web application).
5. In **Authorized redirect URIs**, add your Supabase project OAuth callback URI:
   ```
   https://cfdzutredjuweiszdias.supabase.co/auth/v1/callback
   ```
6. Copy your **Client ID** and **Client secret**.
7. Go to your **Supabase Dashboard**: [https://supabase.com/dashboard/project/cfdzutredjuweiszdias](https://supabase.com/dashboard/project/cfdzutredjuweiszdias)
8. Navigate to **Authentication** -> **Providers** -> **Google**.
9. Toggle Google provider to **Enabled**, paste your Client ID and Client Secret, and click **Save**.

