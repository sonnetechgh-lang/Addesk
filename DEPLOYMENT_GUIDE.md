# AdDesk — Vercel Deployment Guide

A step-by-step guide to deploy the AdDesk Next.js 16 application on Vercel.

---

## Prerequisites

Before you begin, make sure you have:

- A [Vercel account](https://vercel.com/signup) (free tier works)
- The AdDesk repository pushed to GitHub
- Active accounts / API keys for:
  - **Supabase** (database & auth)
  - **Paystack** (payments)
  - **Resend** (transactional emails)

---

## ⚠️ Pre-Deployment Fix: Middleware File

Next.js requires the middleware file to be named **`middleware.ts`** at the project root and export a function named `middleware`. The current file is named `proxy.ts` and exports `proxy` — **this will not work in production**.

**Rename and fix before deploying:**

1. Rename `proxy.ts` → `middleware.ts`
2. Rename the exported function from `proxy` to `middleware`

The corrected file should look like:

```ts
import { type NextRequest } from 'next/server'
import { updateSession } from './lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

Commit and push this change before deploying.

---

## Step 1 — Import Project on Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **"Import Git Repository"**
3. Select your GitHub account and find the **AdDesk** repository
4. Click **Import**

---

## Step 2 — Configure Build Settings

Vercel auto-detects Next.js. Verify these settings on the import screen:

| Setting            | Value              |
| ------------------ | ------------------ |
| **Framework**      | Next.js            |
| **Root Directory** | `./` (default)     |
| **Build Command**  | `npm run build`    |
| **Install Command**| `npm install --legacy-peer-deps` |
| **Output Directory** | `.next` (default) |

> **Important:** Set the Install Command to `npm install --legacy-peer-deps` because the project's `prebuild` script uses this flag to resolve peer dependency conflicts. Vercel runs install separately from build, so set it explicitly in the Install Command field.

---

## Step 3 — Set Environment Variables

On the same import screen (or later via **Project Settings → Environment Variables**), add every variable below. Select **All Environments** (Production, Preview, Development) unless noted otherwise.

### Required Variables

| Variable                          | Value                                      | Notes                              |
| --------------------------------- | ------------------------------------------ | ---------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`        | `https://<your-project>.supabase.co`       | Supabase → Settings → API → URL   |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`   | `eyJ...`                                   | Supabase → Settings → API → anon key |
| `SUPABASE_SERVICE_ROLE_KEY`       | `eyJ...`                                   | Supabase → Settings → API → service_role key. **Production only** — never expose client-side |
| `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` | `pk_live_...` or `pk_test_...`             | Paystack Dashboard → Settings → API Keys |
| `PAYSTACK_SECRET_KEY`             | `sk_live_...` or `sk_test_...`             | Paystack Dashboard → Settings → API Keys |
| `RESEND_API_KEY`                  | `re_...`                                   | Resend Dashboard → API Keys        |

### Optional Variables (have defaults)

| Variable                    | Default Value                                     | Notes                                 |
| --------------------------- | ------------------------------------------------- | ------------------------------------- |
| `NEXT_PUBLIC_APP_URL`       | `https://addesk.com`                              | Set to your Vercel production URL     |
| `EMAIL_FROM_ADDRESS`        | `AdDesk <bookings@updates.addesk.com>`          | Must match a verified Resend domain   |
| `PLATFORM_PERCENTAGE_CHARGE`| `6`                                               | Transaction fee % for the platform    |

> **Tip:** For Preview deployments (PR previews), use **test** API keys from Paystack and a separate Supabase project to avoid affecting production data.

---

## Step 4 — Deploy

1. Click **"Deploy"** on the import screen
2. Vercel will:
   - Install dependencies (`npm install --legacy-peer-deps`)
   - Run `npm run build` (which runs `next build`)
   - Deploy the output to its edge network
3. Wait for the build to complete — check the build logs for any errors

---

## Step 5 — Configure Supabase for Production

### 5a. Update Auth Redirect URLs

1. Go to **Supabase Dashboard → Authentication → URL Configuration**
2. Set **Site URL** to your Vercel production URL:
   ```
   https://your-app.vercel.app
   ```
3. Add these to **Redirect URLs**:
   ```
   https://your-app.vercel.app/**
   https://*-your-vercel-username.vercel.app/**
   ```
   The wildcard entry covers Vercel preview deployments.

### 5b. Run Database Migrations

If you haven't already run the SQL migrations on your production Supabase instance, execute them in order via the **Supabase SQL Editor**:

1. `supabase/schema.sql` — Base schema
2. `supabase/migration_clickwrap.sql` — Consent/terms tracking
3. `supabase/migration_notifications.sql` — Notification system
4. `supabase/migration_profile_views.sql` — Profile analytics
5. `supabase/migration_physical_delivery.sql` — Physical delivery support

---

## Step 6 — Configure Paystack Webhook

1. Go to **Paystack Dashboard → Settings → Webhooks**
2. Set the webhook URL to:
   ```
   https://your-app.vercel.app/api/webhooks/paystack
   ```
3. The app verifies webhook signatures using `PAYSTACK_SECRET_KEY` (HMAC SHA-512), so make sure the secret key matches

---

## Step 7 — Configure Resend Domain

1. Go to **Resend Dashboard → Domains**
2. Add and verify the domain used in `EMAIL_FROM_ADDRESS` (e.g., `updates.addesk.com`)
3. Add the required DNS records (MX, TXT/SPF, DKIM) to your domain provider
4. Wait for domain verification to complete

---

## Step 8 — Set Up Custom Domain (Optional)

1. Go to **Vercel Project → Settings → Domains**
2. Add your custom domain (e.g., `addesk.com`)
3. Vercel will provide DNS records — add them at your domain registrar:
   - **A Record:** `76.76.21.21`
   - **CNAME:** `cname.vercel-dns.com` (for `www` subdomain)
4. SSL is provisioned automatically
5. After the domain is active, update:
   - `NEXT_PUBLIC_APP_URL` environment variable to `https://addesk.com`
   - Supabase Site URL and Redirect URLs
   - Paystack webhook URL

---

## Step 9 — Verify the Deployment

Run through this checklist on your live deployment:

- [ ] Homepage loads correctly with proper fonts (DM Sans, Fraunces)
- [ ] Sign up / Login flow works (Supabase Auth)
- [ ] Unauthenticated users are redirected from `/dashboard` to `/login`
- [ ] Authenticated users are redirected from `/login` to `/dashboard`
- [ ] Onboarding flow completes (profile, packages, payout setup)
- [ ] Public booking page loads (`/book/[username]`)
- [ ] Paystack payment flow works end-to-end
- [ ] Webhook receives payment confirmation (check Paystack logs)
- [ ] Email notifications are sent (check Resend logs)
- [ ] Images load from Supabase Storage
- [ ] Security headers are present (check with browser DevTools → Network tab)

---

## Troubleshooting

### Build fails with peer dependency errors
Ensure the Install Command is set to `npm install --legacy-peer-deps` in Vercel project settings.

### Middleware not running (no auth redirects)
Confirm the middleware file is named `middleware.ts` (not `proxy.ts`) at the project root, and the exported function is named `middleware`.

### "Missing env" errors at runtime
Double-check all required environment variables are set in Vercel. Variables prefixed with `NEXT_PUBLIC_` are embedded at build time — if you change them, you must **redeploy**.

### Paystack webhooks failing
- Verify the webhook URL is exactly `https://your-domain/api/webhooks/paystack`
- Confirm `PAYSTACK_SECRET_KEY` on Vercel matches the key in your Paystack dashboard
- Check Vercel Function Logs for error details

### Emails not sending
- Verify `RESEND_API_KEY` is set
- Confirm your sending domain is verified in Resend
- Check Resend dashboard logs for delivery status

### Images not loading
The `next.config.ts` already allows images from `*.supabase.co`. Ensure your Supabase Storage bucket is set to **public** if images should be publicly accessible.

---

## Redeployments

- **Code changes:** Push to your GitHub branch — Vercel auto-deploys
- **Environment variable changes:** After updating env vars in Vercel, click **Redeploy** (Settings → Deployments → latest → ⋮ → Redeploy)
- **Preview deployments:** Every pull request gets an automatic preview URL
