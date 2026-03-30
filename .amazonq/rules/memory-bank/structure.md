# AdDesk - Project Structure

## Directory Layout

```
AdDesk/
├── app/                        # Next.js App Router
│   ├── (public pages)
│   │   ├── page.tsx            # Landing/home page
│   │   ├── login/              # Auth pages
│   │   ├── signup/
│   │   ├── terms/ privacy/     # Legal pages
│   │   └── accept-terms/       # Clickwrap consent flow
│   ├── book/[username]/        # Public influencer booking page
│   ├── dashboard/              # Protected influencer dashboard
│   │   ├── layout.tsx          # Dashboard shell with nav
│   │   ├── page.tsx            # Dashboard home
│   │   ├── orders/             # Order management
│   │   ├── packages/           # Package management
│   │   └── settings/           # Profile/payout settings
│   ├── demo/                   # Unauthenticated demo mode (mirrors dashboard)
│   ├── onboarding/             # New user setup flow
│   ├── auth/callback|signout/  # Supabase auth callbacks
│   ├── api/
│   │   ├── onboarding/         # Paystack subaccount creation
│   │   └── webhooks/           # Paystack webhook handler
│   ├── actions/consent.ts      # Clickwrap server action
│   ├── layout.tsx              # Root layout (fonts, metadata)
│   └── globals.css             # Global styles + Tailwind
├── components/
│   ├── booking/                # Public booking page components
│   │   └── ProfileViewTracker.tsx
│   ├── dashboard/              # Dashboard-specific components
│   │   ├── DashboardNav.tsx
│   │   ├── NotificationBell.tsx
│   │   ├── OrderStatusControl.tsx
│   │   ├── SettingsForm.tsx
│   │   └── ShareLink.tsx
│   ├── demo/                   # Demo mode nav
│   ├── onboarding/             # Multi-step onboarding components
│   │   ├── ProfileStep.tsx
│   │   ├── PackageStep.tsx
│   │   └── PayoutStep.tsx
│   ├── payment/
│   │   └── PaystackButton.tsx  # Inline Paystack checkout trigger
│   └── ui/                     # Shadcn-style base components
│       ├── button.tsx, card.tsx, badge.tsx
│       ├── form.tsx, input.tsx, label.tsx, textarea.tsx
├── actions/                    # Next.js Server Actions ('use server')
│   ├── orders.ts               # Order status updates + notifications
│   ├── notifications.ts        # Mark notifications read
│   ├── onboarding.ts           # Profile/package save during onboarding
│   ├── profile-views.ts        # Track profile view counts
│   ├── settings.ts             # Update profile/payout settings
│   └── shipments.ts            # Shipment tracking updates
├── lib/
│   ├── supabase/
│   │   ├── client.ts           # Browser Supabase client
│   │   ├── server.ts           # Server Supabase client (cookie-based)
│   │   ├── admin.ts            # Service role admin client
│   │   └── middleware.ts       # Session refresh + route protection
│   ├── email/resend.ts         # Transactional email via Resend
│   ├── paystack/               # Paystack API helpers
│   ├── constants.ts            # App-wide constants
│   ├── demo-data.ts            # Static demo data
│   └── utils.ts                # cn() utility and helpers
├── supabase/                   # SQL migrations and schema
│   ├── schema.sql              # Base schema
│   └── migration_*.sql         # Feature migrations
├── types/                      # Shared TypeScript types
├── hooks/                      # Custom React hooks
├── public/                     # Static assets
├── next.config.ts              # Next.js config (images, security headers)
├── proxy.ts                    # Dev proxy config
└── vercel.json                 # Vercel deployment config
```

## Core Architectural Patterns

### Route Protection
Middleware (`lib/supabase/middleware.ts`) intercepts all requests:
- `/dashboard/*` and `/onboarding/*` → redirect to `/login` if no session
- `/login` and `/signup` → redirect to `/dashboard` if already authenticated

### Data Flow
1. Client actions → Next.js Server Actions (`actions/`) → Supabase (with RLS)
2. Paystack payments → Webhook (`/api/webhooks/paystack`) → Supabase order creation → Resend emails
3. Server Components fetch data directly via `lib/supabase/server.ts`

### Supabase Client Strategy
- `lib/supabase/server.ts` — Server Components and Server Actions (cookie-based auth)
- `lib/supabase/client.ts` — Client Components (browser session)
- `lib/supabase/admin.ts` — Webhook handlers requiring service role (bypasses RLS)

### Component Organization
- Feature-scoped directories (`dashboard/`, `booking/`, `onboarding/`)
- `ui/` contains generic, reusable primitives (Shadcn-style)
- Demo mode mirrors dashboard structure with static data from `lib/demo-data.ts`
