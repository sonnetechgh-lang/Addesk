# AdDesk — Vercel Deployment Guide

Step-by-step guide to deploy AdDesk (Next.js 16 + Supabase + Paystack + Resend) on Vercel.

---

## Prerequisites

- [Vercel account](https://vercel.com/signup) (free tier works)
- AdDesk repository pushed to GitHub
- Active accounts and API keys for:
  - **Supabase** — database, auth, and file storage
  - **Paystack** — payment processing
  - **Resend** — transactional emails

---

## Step 1 — Prepare the Supabase Database

Before deploying the app, your production Supabase project must have the schema in place.

1. Open the **Supabase Dashboard → SQL Editor** for your production project
2. Run these migration files **in order** (copy-paste each from the `supabase/` folder):

   | Order | File                                | Purpose                    |
   | ----- | ----------------------------------- | -------------------------- |
   | 1     | `supabase/schema.sql`               | Base tables, RLS policies  |
   | 2     | `supabase/migration_clickwrap.sql`  | Terms/consent tracking     |
   | 3     | `supabase/migration_notifications.sql` | Notification system     |
   | 4     | `supabase/migration_profile_views.sql` | Profile view analytics  |
   | 5     | `supabase/migration_physical_delivery.sql` | Physical delivery support |

3. Confirm all tables were created under **Table Editor**

---

## Step 2 — Configure Supabase Auth

1. Go to **Supabase Dashboard → Authentication → URL Configuration**
2. Set **Site URL** to your intended production URL:
   ```
   https://your-app.vercel.app
   ```
   (You'll update this later if you add a custom domain)
3. Add these **Redirect URLs** to support Vercel preview deployments:
   ```
   https://your-app.vercel.app/**
   https://*-your-vercel-username.vercel.app/**
   ```

---

## Step 3 — Import Project on Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **"Import Git Repository"**
3. Select your GitHub account and find the **AdDesk** repository
4. Click **Import**

---

## Step 4 — Configure Build Settings

Vercel auto-detects Next.js. Verify these settings on the import screen:

| Setting              | Value                              |
| -------------------- | ---------------------------------- |
| **Framework Preset** | Next.js                            |
| **Root Directory**   | `./` (leave default)               |
| **Build Command**    | `npm run build`                    |
| **Install Command**  | `npm install --legacy-peer-deps`   |
| **Output Directory** | `.next` (leave default)            |

> **Why `--legacy-peer-deps`?** The project has a `prebuild` script using this flag to resolve peer dependency conflicts between React 19 and some packages. Without it, the install step will fail.

---

## Step 5 — Set Environment Variables

Still on the import screen, expand **Environment Variables** and add the following. Select all environments (Production, Preview, Development) unless noted.

### Required

| Variable                          | Where to Find                              |
| --------------------------------- | ------------------------------------------ |
| `NEXT_PUBLIC_SUPABASE_URL`        | Supabase → Settings → API → Project URL    |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`   | Supabase → Settings → API → `anon` `public` key |
| `SUPABASE_SERVICE_ROLE_KEY`       | Supabase → Settings → API → `service_role` key (**Production only** — never expose client-side) |
| `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` | Paystack Dashboard → Settings → API Keys & Webhooks → Public Key |
| `PAYSTACK_SECRET_KEY`             | Paystack Dashboard → Settings → API Keys & Webhooks → Secret Key |
| `RESEND_API_KEY`                  | Resend Dashboard → API Keys                |

### Optional (have sensible defaults)

| Variable                     | Default                                          | Purpose                          |
| ---------------------------- | ------------------------------------------------ | -------------------------------- |
| `NEXT_PUBLIC_APP_URL`        | `https://addesk.com`                             | Base URL used in email links     |
| `EMAIL_FROM_ADDRESS`         | `AdDesk <bookings@updates.addesk.com>`         | Sender address for emails        |
| `PLATFORM_PERCENTAGE_CHARGE` | `6`                                              | Platform fee % on transactions   |

> **Tip:** For Preview deployments use Paystack **test** keys and a separate Supabase project to isolate staging from production.

---

## Step 6 — Deploy

1. Click **"Deploy"**
2. Vercel will install dependencies, build the app, and deploy to its edge network
3. Monitor the **Build Logs** — a successful build ends with:
   ```
   ✓ Compiled successfully
   ```
4. Once complete, Vercel provides a production URL like `https://addesk-xxxx.vercel.app`

---

## Step 7 — Configure Paystack Webhook

Paystack needs to notify your app when payments are completed.

1. Go to **Paystack Dashboard → Settings → API Keys & Webhooks**
2. Set the **Webhook URL** to:
   ```
   https://your-app.vercel.app/api/webhooks/paystack
   ```
3. Save the webhook
4. The app verifies incoming webhooks using HMAC SHA-512 with your `PAYSTACK_SECRET_KEY` — ensure the key on Vercel matches the one in Paystack

---

## Step 8 — Configure Resend Email Domain

For transactional emails (booking confirmations, completion notices) to send successfully:

1. Go to **Resend Dashboard → Domains**
2. Add the domain from your `EMAIL_FROM_ADDRESS` (e.g., `updates.addesk.com`)
3. Resend will display DNS records to add — configure these at your domain registrar:
   - **MX record** — for receiving bounces
   - **TXT record** — SPF verification
   - **CNAME records** — DKIM signing
4. Wait for verification to show green in the Resend dashboard
5. Send a test email from the Resend dashboard to confirm delivery

---

## Step 9 — Set Up Custom Domain (Optional)

1. Go to **Vercel Project → Settings → Domains**
2. Add your custom domain (e.g., `addesk.com`)
3. Add the DNS records Vercel provides at your domain registrar:
   - **A record:** `76.76.21.21` (for apex domain)
   - **CNAME:** `cname.vercel-dns.com` (for `www` subdomain)
4. SSL is provisioned automatically by Vercel
5. After the domain is active, update these to use the new domain:
   - `NEXT_PUBLIC_APP_URL` env var → `https://addesk.com`
   - Supabase Site URL and Redirect URLs (Step 2)
   - Paystack Webhook URL (Step 7)
6. **Redeploy** the app from Vercel so `NEXT_PUBLIC_*` changes take effect

---

## Step 10 — Post-Deployment Verification

Test the full application flow on the live deployment:

### Auth & Routing
- [ ] Homepage loads with correct fonts and styling
- [ ] Visiting `/dashboard` while logged out redirects to `/login`
- [ ] Visiting `/login` while logged in redirects to `/dashboard`
- [ ] Sign up creates account and redirects to onboarding

### Onboarding
- [ ] Profile step saves display name, bio, and avatar
- [ ] Package step creates at least one ad package
- [ ] Payout step creates a Paystack subaccount successfully

### Booking & Payments
- [ ] Public booking page loads at `/book/[username]`
- [ ] Paystack checkout opens and processes a test payment
- [ ] Webhook creates the order (check Vercel Function Logs + Paystack Webhook Logs)
- [ ] Booking confirmation email is received

### Dashboard
- [ ] Orders page lists completed bookings
- [ ] Order status can be updated (accepted → in progress → completed)
- [ ] Completion email sends when an order is marked done
- [ ] Settings page saves changes
- [ ] Share link copies the correct booking URL

### Infrastructure
- [ ] Supabase Storage images load (avatars, etc.)
- [ ] Security headers present — check in DevTools → Network → Response Headers:
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`

---

## Troubleshooting

### Build fails with dependency errors
Set the **Install Command** to `npm install --legacy-peer-deps` in Vercel → Project Settings → General → Build & Development Settings.

### Auth redirects not working
Confirm `proxy.ts` exists at the project root and exports a function named `proxy`. Next.js 16 uses the `proxy` convention instead of the older `middleware` convention.

### `NEXT_PUBLIC_*` env vars are undefined in the browser
These variables are inlined at **build time**. If you add or change them after the initial deploy, you must **redeploy** for changes to take effect.

### Paystack webhook returns 401/500
- Check that `PAYSTACK_SECRET_KEY` in Vercel matches Paystack dashboard exactly
- View error details in **Vercel → Project → Logs → Functions**
- Verify the webhook URL ends in `/api/webhooks/paystack` (no trailing slash)

### Emails not being delivered
- Confirm `RESEND_API_KEY` is set in Vercel env vars
- Check the sending domain is verified in Resend (green status)
- Review delivery logs in **Resend Dashboard → Logs**

### Images from Supabase not loading
- The app's `next.config.ts` allowlists `*.supabase.co` — no config change needed
- Ensure the Supabase Storage bucket is set to **public** access

---

## Ongoing Operations

| Action                      | How                                                                 |
| --------------------------- | ------------------------------------------------------------------- |
| **Deploy code changes**     | Push to your GitHub branch — Vercel auto-deploys                    |
| **Update env vars**         | Change in Vercel → redeploy (Deployments → ⋮ → Redeploy)           |
| **Preview PRs**             | Every pull request gets an automatic preview URL                    |
| **View function logs**      | Vercel → Project → Logs                                            |
| **Rollback a bad deploy**   | Vercel → Project → Deployments → find the good deploy → ⋮ → Promote to Production |
| **Monitor usage**           | Vercel → Project → Analytics (if enabled)                          |
