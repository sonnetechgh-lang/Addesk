# AdDesk - Technology Stack

## Core Framework
- **Next.js 16.1.6** — App Router, Server Components, Server Actions, Middleware
- **React 19.2.3** — UI rendering
- **TypeScript 5** — strict typing throughout

## Backend & Database
- **Supabase** (`@supabase/supabase-js ^2.97.0`, `@supabase/ssr ^0.8.0`)
  - PostgreSQL database with Row Level Security (RLS)
  - Auth (email/password via Supabase Auth)
  - Storage (avatars bucket, orders bucket)
- **Next.js Server Actions** — server-side mutations (`'use server'` directive)
- **Next.js API Routes** — webhook endpoints (`/api/webhooks/paystack`)

## Payments
- **Paystack** (`react-paystack ^6.0.0`)
  - Inline checkout popup on booking page
  - Subaccount API for split payments to influencer
  - Webhook-based order finalization (prevents client-side manipulation)

## Email
- **Resend** (`resend ^6.9.2`) with `@react-email/components ^1.0.8`
  - Transactional emails for booking confirmation and order completion

## Styling
- **Tailwind CSS v4** (`tailwindcss ^4`, `@tailwindcss/postcss ^4`)
- **class-variance-authority ^0.7.1** — component variant management
- **clsx ^2.1.1** + **tailwind-merge ^3.5.0** — conditional class merging via `cn()`
- **lucide-react ^0.575.0** — icon library

## Forms & Validation
- **react-hook-form ^7.71.2** with `@hookform/resolvers ^5.2.2`
- **Zod ^4.3.6** — schema validation for forms and API inputs

## UI Primitives
- **@radix-ui/react-label ^2.1.8**
- **@radix-ui/react-slot ^1.2.4**
- Custom Shadcn-style components in `components/ui/`

## Fonts (next/font/google)
- **Fraunces** — display/heading font (`--font-fraunces`)
- **DM Sans** — primary body font (`--font-dm-sans`, applied as `font-sans`)
- **JetBrains Mono** — monospace (`--font-jetbrains-mono`)

## Development Tools
- **ESLint 9** with `eslint-config-next 16.1.6`
- **.npmrc** — custom npm config

## Key Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY      # admin client only
PAYSTACK_SECRET_KEY            # webhook verification + subaccount API
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY
RESEND_API_KEY
```

## Development Commands
```bash
npm run dev      # Start dev server (Next.js)
npm run build    # Production build
npm run start    # Start production server
npm run lint     # ESLint
```

## Deployment
- **Vercel** — primary deployment platform (`vercel.json` present)
- `.vercelignore` excludes `addesk-temp/` from deployment
- Security headers configured in `next.config.ts` (X-Frame-Options, CSP, etc.)
- Supabase Storage remote patterns whitelisted in `next.config.ts`
