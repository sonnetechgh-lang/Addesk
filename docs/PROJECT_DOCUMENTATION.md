# AdDesk — Technical Documentation

**Version:** 0.1.0  
**Last Updated:** July 2025  
**Status:** Active Development

---

## Table of Contents

1. [Overview](#1-overview)
2. [Architecture](#2-architecture)
3. [Technology Stack](#3-technology-stack)
4. [Project Structure](#4-project-structure)
5. [Environment Configuration](#5-environment-configuration)
6. [Authentication & Authorization](#6-authentication--authorization)
7. [Database Schema](#7-database-schema)
8. [Application Routes](#8-application-routes)
9. [Server Actions](#9-server-actions)
10. [API Routes](#10-api-routes)
11. [Component Library](#11-component-library)
12. [Design System](#12-design-system)
13. [Payment Integration](#13-payment-integration)
14. [Email System](#14-email-system)
15. [Notification System](#15-notification-system)
16. [Multi-Tenancy & RBAC](#16-multi-tenancy--rbac)
17. [Security](#17-security)
18. [Deployment](#18-deployment)
19. [Development Workflow](#19-development-workflow)

---

## 1. Overview

### 1.1 What Is AdDesk?

AdDesk is a full-stack **Advertising Workflow & Management Platform** built for the Ghanaian and West African advertising market. It serves as a unified workspace for managing the entire advertising lifecycle — from client acquisition and campaign planning through creative production, client approvals, media scheduling, and billing.

### 1.2 Target Users

| User Type | Description |
|-----------|-------------|
| **Solo Creators / Influencers** | Individual content creators monetizing their social media presence through bookable service packages |
| **Media Houses** | Print publications, radio/TV stations, and digital publishers managing advertising inventory |
| **Agencies** | Advertising agencies coordinating campaigns across multiple media channels and clients |

### 1.3 Core Capabilities

- **Public Booking Pages** — Shareable profile URLs where clients can browse packages and pay via Paystack
- **Order Management** — Lifecycle tracking from payment through delivery (digital, physical, on-premise)
- **Campaign Management** — Multi-channel campaign planning with line items, budgets, and client management
- **Creative Production** — Brief assignment, task management (Kanban), file versioning, and internal review
- **Client Approvals** — Token-based external review portal for clients to approve/request revisions
- **Media Scheduling** — Master calendar for scheduling placements across channels with conflict detection
- **Billing & Invoicing** — Invoice generation, email delivery, public invoice view, and payment tracking
- **Analytics & Reporting** — Revenue reports, outstanding invoice tracking, and profile view analytics
- **Organization Management** — Multi-tenant workspaces with role-based access control (RBAC)

### 1.4 Business Model

AdDesk uses a **platform fee model**: a configurable percentage (default 6%) is deducted from each transaction made through the public booking flow. Creators receive payments directly via Paystack subaccounts (split payments).

---

## 2. Architecture

### 2.1 High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        Client (Browser)                          │
│  Next.js App Router (React 19 + Server Components)               │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐  ┌────────────────┐  │
│  │ Landing   │  │ Auth     │  │ Dashboard │  │ Public Booking │  │
│  │ Page      │  │ Flow     │  │ (SSR)     │  │ Pages          │  │
│  └──────────┘  └──────────┘  └───────────┘  └────────────────┘  │
└──────────────────────────┬───────────────────────────────────────┘
                           │
                    ┌──────┴──────┐
                    │ Middleware   │  Session refresh, route guards
                    └──────┬──────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
   ┌──────┴──────┐  ┌─────┴─────┐  ┌──────┴──────┐
   │ Server      │  │ API       │  │ Webhooks    │
   │ Actions     │  │ Routes    │  │ (Paystack)  │
   │ (Mutations) │  │ (Push,    │  │ HMAC-signed │
   │             │  │ Onboard)  │  │             │
   └──────┬──────┘  └─────┬─────┘  └──────┬──────┘
          │                │                │
          └────────────────┼────────────────┘
                           │
              ┌────────────┴────────────┐
              │       Supabase          │
              │  ┌──────┐ ┌──────────┐  │
              │  │ Auth │ │ Postgres │  │
              │  └──────┘ │ (RLS)    │  │
              │           └──────────┘  │
              │  ┌──────────────────┐   │
              │  │ Storage (Blobs)  │   │
              │  └──────────────────┘   │
              └─────────────────────────┘
                           │
              ┌────────────┴────────────┐
              │    External Services     │
              │  ┌─────────┐ ┌────────┐ │
              │  │Paystack │ │ Resend │ │
              │  │(Payments│ │(Email) │ │
              │  └─────────┘ └────────┘ │
              └──────────────────────────┘
```

### 2.2 Key Architectural Decisions

| Decision | Rationale |
|----------|-----------|
| **Server Components by default** | Minimize client JS bundle; data fetching at the server layer |
| **Server Actions for mutations** | Type-safe RPC with automatic revalidation; collocated validation |
| **Supabase RLS** | Row-Level Security ensures data isolation at the database layer, even if application-layer bugs exist |
| **Paystack split payments** | Direct creator payouts via subaccounts; platform automatically collects its fee |
| **Zod validation at boundaries** | All user inputs validated in Server Actions before touching the database |
| **Organization-scoped multi-tenancy** | All expanded tables scope data via `organization_id` with RLS policies |

### 2.3 Request Flow

1. **Browser** → Next.js Middleware (`updateSession`) refreshes the Supabase auth session via cookies
2. **Middleware** guards protected routes (`/dashboard/*`, `/onboarding/*`)
3. **Server Components** fetch data using `createClient()` (user-scoped, respects RLS)
4. **Server Actions** validate inputs with Zod, then mutate data via Supabase client
5. **Webhooks** verify HMAC signatures, then use `createAdminClient()` (bypasses RLS) for system-level operations
6. **Email/Push** are triggered as side effects of mutations (order status changes, approvals, etc.)

---

## 3. Technology Stack

### 3.1 Core Framework

| Technology | Version | Purpose |
|-----------|---------|---------|
| **Next.js** | 16.1.6 | Full-stack React framework (App Router, Turbopack) |
| **React** | 19.2.3 | UI library with Server Components and Suspense |
| **TypeScript** | 5.x | Static type safety with strict mode |

### 3.2 Styling

| Technology | Version | Purpose |
|-----------|---------|---------|
| **Tailwind CSS** | 4.x | Utility-first CSS with custom design tokens |
| **class-variance-authority** | 0.7.1 | Component variant management (button, card, badge) |
| **tailwind-merge** | 3.5.0 | Intelligent class merging to resolve conflicts |
| **clsx** | 2.1.1 | Conditional class name composition |

### 3.3 Backend & Data

| Technology | Version | Purpose |
|-----------|---------|---------|
| **Supabase** | 2.97.0 | Postgres database, Auth, Storage, RLS |
| **@supabase/ssr** | 0.8.0 | Server-side rendering integration with cookie management |
| **Zod** | 4.3.6 | Runtime schema validation for all inputs |

### 3.4 Payments & Communication

| Technology | Version | Purpose |
|-----------|---------|---------|
| **react-paystack** | 6.0.0 | Client-side Paystack checkout integration |
| **Resend** | 6.9.2 | Transactional email delivery |
| **web-push** | 3.6.7 | Web Push notifications via VAPID |

### 3.5 UI Components

| Technology | Version | Purpose |
|-----------|---------|---------|
| **Radix UI** | 2.x | Accessible primitives (Label, Slot) |
| **React Hook Form** | 7.71.2 | Performant form state management |
| **@hookform/resolvers** | 5.2.2 | Zod integration for form validation |
| **Lucide React** | 0.575.0 | Icon library (300+ icons) |
| **date-fns** | 4.1.0 | Date formatting and manipulation |

### 3.6 Infrastructure

| Technology | Purpose |
|-----------|---------|
| **Vercel** | Hosting and deployment (serverless functions, edge network) |
| **@ducanh2912/next-pwa** | Progressive Web App support (offline caching, installability) |

---

## 4. Project Structure

```
AdDesk/
├── app/                          # Next.js App Router pages
│   ├── layout.tsx                # Root layout (fonts, metadata)
│   ├── page.tsx                  # Landing page (marketing)
│   ├── globals.css               # Design system tokens & utilities
│   ├── manifest.ts               # PWA manifest
│   ├── accept-terms/             # Terms acceptance gate
│   ├── actions/                  # App-scoped server actions (consent)
│   ├── api/                      # API routes
│   │   ├── onboarding/           #   Paystack subaccount creation
│   │   ├── push/                 #   Web push notification sender
│   │   └── webhooks/             #   Paystack payment webhooks
│   ├── auth/                     # Auth flows
│   │   ├── callback/             #   OAuth/email confirmation callback
│   │   └── signout/              #   Logout endpoint
│   ├── book/                     # Public booking flow
│   │   ├── [username]/           #   Creator public profile
│   │   │   ├── [packageId]/      #   Checkout page
│   │   │   └── loading.tsx       #   Loading skeleton
│   │   └── success/              #   Payment confirmation
│   ├── dashboard/                # Protected dashboard
│   │   ├── layout.tsx            #   Dashboard layout (sidebar, nav)
│   │   ├── page.tsx              #   Dashboard home (stats, orders)
│   │   ├── approvals/            #   Approval management
│   │   ├── billing/              #   Billing & invoicing
│   │   ├── briefs/               #   Creative briefs
│   │   ├── campaigns/            #   Campaign management
│   │   ├── channels/             #   Media channels
│   │   ├── clients/              #   Client/advertiser directory
│   │   ├── deals/                #   Sales pipeline
│   │   ├── inventory/            #   Ad slot inventory
│   │   ├── orders/               #   Order management
│   │   ├── org/                  #   Organization settings
│   │   ├── packages/             #   Service package CRUD
│   │   ├── production/           #   Production task board
│   │   ├── reports/              #   Analytics & reports
│   │   ├── schedule/             #   Content scheduling calendar
│   │   └── settings/             #   User settings
│   ├── demo/                     # Demo mode (read-only sandbox)
│   │   ├── layout.tsx            #   Demo layout (matches dashboard)
│   │   ├── booking/              #   Demo public profile
│   │   ├── orders/               #   Demo orders
│   │   ├── packages/             #   Demo packages
│   │   └── settings/             #   Demo settings
│   ├── invoice/                  # Public invoice viewer
│   │   └── [token]/              #   Token-based invoice access
│   ├── login/                    # Sign in
│   ├── onboarding/               # Creator onboarding wizard
│   ├── privacy/                  # Privacy policy
│   ├── review/                   # Client approval portal
│   │   └── [token]/              #   Token-based approval access
│   ├── signup/                   # Registration
│   └── terms/                    # Terms of service
├── actions/                      # Global server actions
│   ├── activity.ts               #   Activity log recording
│   ├── approvals.ts              #   Approval request CRUD
│   ├── briefs.ts                 #   Creative brief CRUD
│   ├── campaigns.ts              #   Campaign & line item CRUD
│   ├── channels.ts               #   Channel & ad slot CRUD
│   ├── clients.ts                #   Client CRUD
│   ├── deals.ts                  #   Pipeline deal CRUD
│   ├── files.ts                  #   File management
│   ├── inventory.ts              #   Rate card CRUD
│   ├── invoices.ts               #   Invoice CRUD & sending
│   ├── notifications.ts          #   Notification management
│   ├── onboarding.ts             #   Profile & package setup
│   ├── orders.ts                 #   Order status management
│   ├── organizations.ts          #   Organization CRUD
│   ├── payments.ts               #   Payment recording
│   ├── profile-views.ts          #   Profile view analytics
│   ├── reports.ts                #   Revenue & analytics queries
│   ├── schedule.ts               #   Schedule entry CRUD
│   ├── settings.ts               #   Profile & payout settings
│   └── shipments.ts              #   Physical shipment tracking
├── components/                   # React components
│   ├── booking/                  #   Public booking components
│   ├── dashboard/                #   Dashboard feature components (25)
│   ├── demo/                     #   Demo navigation
│   ├── onboarding/               #   Onboarding step components
│   ├── payment/                  #   Paystack checkout button
│   └── ui/                       #   Base UI primitives (8)
├── lib/                          # Shared utilities
│   ├── constants.ts              #   App constants (terms version)
│   ├── demo-data.ts              #   Demo mode sample data
│   ├── invoice-number.ts         #   Sequential invoice numbering
│   ├── rbac.ts                   #   Role-based access control
│   ├── utils.ts                  #   cn() helper, sanitizeLog()
│   ├── email/                    #   Email templates & sending
│   │   ├── approval.ts           #     Approval request emails
│   │   ├── invoice.ts            #     Invoice emails
│   │   └── resend.ts             #     Booking & completion emails
│   └── supabase/                 #   Supabase client factories
│       ├── admin.ts              #     Service role client (RLS bypass)
│       ├── client.ts             #     Browser client
│       ├── middleware.ts          #     Session refresh middleware
│       └── server.ts             #     Server Component client
├── types/                        # TypeScript type definitions
│   ├── approvals.ts              #   Approval types & statuses
│   ├── billing.ts                #   Invoice, payment, line item types
│   ├── campaigns.ts              #   Client, campaign, activity types
│   ├── channels.ts               #   Channel, slot, spec types
│   ├── production.ts             #   Brief, task, file types
│   ├── roles.ts                  #   Org types, roles, permissions
│   └── schedule.ts               #   Schedule entry types
├── supabase/                     # Database schema & migrations
│   ├── schema.sql                #   Core schema (profiles, packages, orders)
│   ├── migration_all_consolidated.sql
│   ├── migration_p0_organizations.sql
│   ├── migration_p1_channels.sql
│   ├── migration_p2_campaigns.sql
│   ├── migration_p3_production.sql
│   ├── migration_p4_approvals_scheduling.sql
│   ├── migration_p5_billing.sql
│   └── ...                       #   Feature-specific migrations
└── public/                       # Static assets
    └── icons/                    #   PWA icons
```

---

## 5. Environment Configuration

### 5.1 Required Environment Variables

| Variable | Scope | Description |
|----------|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Supabase anonymous key (client-side safe) |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret | Supabase service role key (bypasses RLS — server-only) |
| `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` | Public | Paystack publishable key (client-side checkout) |
| `PAYSTACK_SECRET_KEY` | Secret | Paystack secret key (API calls) |
| `PAYSTACK_WEBHOOK_SECRET` | Secret | Paystack webhook HMAC signing key |
| `RESEND_API_KEY` | Secret | Resend email API key |
| `EMAIL_FROM_ADDRESS` | Config | Sender email address for transactional emails |
| `NEXT_PUBLIC_APP_URL` | Public | Application base URL (e.g., `https://addesk.io`) |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Public | VAPID public key for web push |
| `VAPID_PRIVATE_KEY` | Secret | VAPID private key for web push |
| `VAPID_SUBJECT` | Secret | VAPID subject (e.g., `mailto:admin@addesk.io`) |
| `PLATFORM_PERCENTAGE_CHARGE` | Config | Platform fee percentage (default: `6`) |

### 5.2 Setup

```bash
# 1. Clone the repository
git clone <repo-url> && cd AdDesk

# 2. Install dependencies
npm install

# 3. Create environment file
cp .env.example .env.local   # Then fill in all variables above

# 4. Run database migrations
# Apply schema.sql then migrations in order (p0 → p5) via Supabase Dashboard SQL Editor

# 5. Start development server
npm run dev                   # Starts at http://localhost:3000
```

---

## 6. Authentication & Authorization

### 6.1 Authentication Flow

AdDesk uses **Supabase Auth** with email/password authentication:

```
User enters email + password
        │
        ▼
  Supabase Auth API
  (signInWithPassword / signUp)
        │
        ▼
  JWT issued → stored in HTTP-only cookies via @supabase/ssr
        │
        ▼
  Middleware (updateSession) refreshes session on every request
        │
        ▼
  Server Components/Actions call supabase.auth.getUser() → verified identity
```

### 6.2 Route Protection

| Route Pattern | Protection | Redirect |
|--------------|------------|----------|
| `/dashboard/*` | Must be authenticated | → `/login` |
| `/onboarding/*` | Must be authenticated | → `/login` |
| `/login`, `/signup` | Must NOT be authenticated | → `/dashboard` |
| `/book/*`, `/review/*`, `/invoice/*` | Public (no auth) | — |

### 6.3 Additional Auth Gates

- **Terms Acceptance**: After login, the dashboard layout checks `consent_logs` for the current terms version. If outdated, the user is redirected to `/accept-terms`.
- **Onboarding**: Certain features require `is_onboarded = true` on the user's profile (e.g., accepting payments).

### 6.4 Session Management

Sessions are managed via `@supabase/ssr` cookie-based storage:

| Client | Usage |
|--------|-------|
| `createClient()` (server) | Server Components and Server Actions — respects RLS for the authenticated user |
| `createClient()` (browser) | Client Components — creates a browser-side Supabase client |
| `createAdminClient()` | Server-only service role — bypasses RLS entirely; used only in webhooks and system operations |
| `updateSession()` | Middleware — refreshes auth tokens on every request |

---

## 7. Database Schema

### 7.1 Entity Relationship Overview

```
auth.users
    │
    └──→ profiles (1:1) ──→ packages (1:N) ──→ orders (1:N)
              │                                      │
              └──→ organization_members (N:M) ──→ organizations (1:N)
                                                      │
                   ┌──────────────────────────────────┘
                   │
                   ├──→ channels ──→ ad_slots ──→ rate_cards
                   │
                   ├──→ clients ──→ campaigns ──→ line_items
                   │                    │
                   │                    ├──→ creative_briefs ──→ production_tasks
                   │                    │         │              creative_files
                   │                    │         │
                   │                    │         └──→ approval_requests
                   │                    │
                   │                    └──→ schedule_entries
                   │
                   ├──→ invoices ──→ invoice_line_items
                   │       └──→ payments
                   │
                   └──→ activity_log
```

### 7.2 Core Tables

#### profiles
Extends `auth.users` with application-specific fields.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK, FK → auth.users) | User ID |
| `full_name` | text | Display name |
| `username` | text (unique) | URL-safe handle for public profile |
| `email` | text | Contact email |
| `bio` | text | Profile biography |
| `profile_photo_url` | text | Avatar URL (Supabase Storage) |
| `instagram_handle` | text | Instagram username |
| `tiktok_handle` | text | TikTok username |
| `twitter_handle` | text | X/Twitter username |
| `paystack_subaccount_code` | text | Paystack subaccount for split payments |
| `payout_bank_code` | text | Bank code for payouts |
| `payout_account_number` | text | Bank account number |
| `payout_account_name` | text | Bank account holder name |
| `is_onboarded` | boolean | Whether onboarding is complete |
| `current_organization_id` | UUID (FK) | Active organization context |

#### packages
Service offerings created by creators.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Package ID |
| `influencer_id` | UUID (FK → profiles) | Creator who owns this package |
| `title` | text | Package name |
| `description` | text | Package description |
| `price` | integer | Price in pesewas (GHS × 100) |
| `delivery_days` | integer | Estimated delivery timeframe |
| `is_active` | boolean | Published / draft state |

#### orders
Booking transactions created through the public checkout flow.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Order ID |
| `reference` | text (unique) | Human-readable reference |
| `influencer_id` | UUID (FK) | Creator assigned to this order |
| `package_id` | UUID (FK) | Package that was purchased |
| `client_name` | text | Buyer's full name |
| `client_email` | text | Buyer's email |
| `client_phone` | text | Buyer's phone number |
| `brief` / `product_description` | text | Campaign brief / instructions |
| `asset_urls` | text[] | Uploaded reference images |
| `amount` | integer | Total amount (pesewas) |
| `platform_fee` | integer | Platform's commission (pesewas) |
| `influencer_amount` | integer | Creator's payout (pesewas) |
| `payment_status` | enum | `pending` · `paid` · `failed` |
| `order_status` | enum | `new` · `in_progress` · `submitted` · `live` · `completed` · `cancelled` |
| `delivery_type` | text | `digital` · `physical` · `on_premise` |
| `delivery_address` | text | Physical delivery location |

### 7.3 Organization Tables

#### organizations

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Organization ID |
| `name` | text | Organization name |
| `slug` | text (unique) | URL-safe identifier |
| `type` | enum | `influencer` · `media_house` · `agency` |
| `logo_url` | text | Organization logo |
| `website` | text | Organization website |
| `paystack_subaccount_code` | text | Org-level Paystack subaccount |

#### organization_members

| Column | Type | Description |
|--------|------|-------------|
| `user_id` | UUID (FK → profiles) | Member's user ID |
| `organization_id` | UUID (FK → organizations) | Organization ID |
| `role` | enum | `owner` · `admin` · `sales` · `production` · `finance` · `member` |
| `is_active` | boolean | Active membership status |
| `invited_email` | text | Email used for pending invitation |

### 7.4 Campaign & Production Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `clients` | Advertiser / agency contacts | company_name, contact_name, email, credit_terms |
| `campaigns` | Multi-channel campaign containers | client_id, status, total_budget, start/end dates |
| `line_items` | Individual placements within a campaign | campaign_id, channel_id, quantity, unit_price, status |
| `creative_briefs` | Creative production specifications | campaign_id, assigned_to_id, status, due_date, key_messages |
| `production_tasks` | Granular tasks within a brief | brief_id, task_type, priority, assigned_to_id, status |
| `creative_files` | Versioned file uploads for briefs | brief_id, file_url, version, is_final |
| `approval_requests` | Client review tokens | brief_id, client_email, review_token, status |

### 7.5 Media & Scheduling Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `channels` | Media properties (radio, print, digital, etc.) | organization_id, name, type, settings (JSONB) |
| `ad_slots` | Bookable positions within a channel | channel_id, name, base_price, specs (JSONB) |
| `rate_cards` | Pricing rules for ad slots | organization_id, applies_to (JSONB), is_active |
| `schedule_entries` | Placement scheduling with conflict detection | line_item_id, slot_id, scheduled_date, status |

### 7.6 Billing Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `invoices` | Organization billing records | client_id, invoice_number, total, status, due_date, view_token |
| `invoice_line_items` | Breakdown of invoice charges | invoice_id, description, quantity, unit_price |
| `payments` | Payment records against invoices | invoice_id, amount, method, paystack_reference |

### 7.7 Support Tables

| Table | Purpose |
|-------|---------|
| `notifications` | In-app notification feed (user_id, type, title, message, link, is_read) |
| `push_subscriptions` | Web push endpoints (user_id, endpoint, p256dh, auth) |
| `consent_logs` | Terms of service acceptance audit trail |
| `client_consent_logs` | Client consent recording for booking flow |
| `profile_views` | Profile visit analytics with IP rate limiting |
| `physical_shipments` | Shipment tracking (carrier, tracking number, status) |
| `activity_log` | Entity-level audit trail for campaigns, invoices, etc. |

### 7.8 Row-Level Security

All tables enforce RLS policies. The general pattern:

```sql
-- User can only access their own data
CREATE POLICY "Users can view own data"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Organization members can access org data
CREATE POLICY "Org members can access"
  ON public.campaigns FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid() AND is_active = true
  ));
```

### 7.9 Storage Buckets

| Bucket | Access | Purpose |
|--------|--------|---------|
| `avatars` | Public | Profile photos |
| `orders` | Public | Order-related file uploads |
| `brief-assets` | Public | Creative brief reference images |

---

## 8. Application Routes

### 8.1 Public Routes

| Route | Component | Purpose |
|-------|-----------|---------|
| `/` | `app/page.tsx` | Marketing landing page with feature showcase |
| `/login` | `app/login/page.tsx` | Email/password sign-in |
| `/signup` | `app/signup/page.tsx` | User registration with email verification |
| `/terms` | `app/terms/page.tsx` | Terms of service (legal) |
| `/privacy` | `app/privacy/page.tsx` | Privacy policy (legal) |
| `/book/[username]` | `app/book/[username]/page.tsx` | Creator's public profile and package listing |
| `/book/[username]/[packageId]` | Checkout page | Order form with payment (Paystack) |
| `/book/success` | `app/book/success/page.tsx` | Payment confirmation |
| `/invoice/[token]` | `app/invoice/[token]/page.tsx` | Public invoice viewer (print-ready) |
| `/review/[token]` | `app/review/[token]/page.tsx` | Client approval/review portal |
| `/demo` | `app/demo/page.tsx` | Interactive demo sandbox |

### 8.2 Protected Routes (Auth Required)

| Route | Component | Purpose |
|-------|-----------|---------|
| `/dashboard` | `app/dashboard/page.tsx` | Overview with stats, recent orders, quick actions |
| `/dashboard/orders` | Orders list | All orders with status tracking |
| `/dashboard/orders/[id]` | Order detail | Individual order management |
| `/dashboard/packages` | Packages list | Service package CRUD |
| `/dashboard/packages/new` | Create package | New package form |
| `/dashboard/packages/[id]` | Edit package | Package editor |
| `/dashboard/settings` | Settings | Profile, payout, and account settings |
| `/dashboard/clients` | Clients list | Advertiser directory |
| `/dashboard/clients/new` | Create client | New client form |
| `/dashboard/campaigns` | Campaigns list | Campaign management |
| `/dashboard/campaigns/[id]` | Campaign detail | Campaign with line items and activity |
| `/dashboard/deals` | Pipeline board | Sales pipeline (Kanban) |
| `/dashboard/briefs` | Briefs list | Creative brief management |
| `/dashboard/briefs/[id]` | Brief detail | Brief with tasks, files, and approvals |
| `/dashboard/production` | Production board | Kanban task board |
| `/dashboard/approvals` | Approvals list | Pending approval requests |
| `/dashboard/schedule` | Schedule calendar | Content scheduling with conflict detection |
| `/dashboard/channels` | Channels list | Media channel management |
| `/dashboard/channels/[id]` | Channel detail | Channel with ad slots |
| `/dashboard/inventory` | Inventory calendar | Ad slot availability and pricing |
| `/dashboard/billing` | Billing dashboard | Invoices and payments |
| `/dashboard/billing/invoices/new` | Create invoice | Invoice builder |
| `/dashboard/billing/invoices/[id]` | Invoice detail | Invoice with line items and payments |
| `/dashboard/reports` | Reports | Revenue analytics and outstanding invoices |
| `/dashboard/org` | Organization | Org settings, members, and roles |
| `/onboarding` | Onboarding wizard | 3-step setup (profile → payout → first package) |
| `/accept-terms` | Terms gate | Terms acceptance before dashboard access |

### 8.3 API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/webhooks/paystack` | POST | Paystack payment webhook (HMAC-verified) |
| `/api/onboarding/subaccount` | POST | Create Paystack subaccount during onboarding |
| `/api/push/send` | POST | Send web push notifications |

---

## 9. Server Actions

Server Actions provide type-safe server-side mutations with Zod validation.

### 9.1 Action Patterns

All server actions follow a consistent pattern:

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const schema = z.object({
  field: z.string().min(1).max(100),
})

export async function actionName(formData: FormData) {
  // 1. Authenticate
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // 2. Validate
  const parsed = schema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: 'Validation failed', details: parsed.error.flatten() }

  // 3. Authorize (for org-scoped actions)
  await checkPermission(user.id, orgId, 'required_permission')

  // 4. Mutate
  const { error } = await supabase.from('table').insert(parsed.data)
  if (error) return { error: error.message }

  // 5. Revalidate
  revalidatePath('/dashboard/resource')
  return { success: true }
}
```

### 9.2 Action Catalog

| Module | Actions | Scope |
|--------|---------|-------|
| **onboarding** | `updateProfile`, `createPackage` | User |
| **settings** | `updateProfileSettings`, `updatePayoutSettings` | User |
| **orders** | `updateOrderStatus` | User + Notification side effects |
| **notifications** | `getNotifications`, `markNotificationRead`, `markAllNotificationsRead`, `saveSubscription`, `removeSubscription` | User |
| **profile-views** | `recordProfileView` | Public (IP rate-limited) |
| **shipments** | `createShipment`, `updateShipmentStatus` | User |
| **consent** | `acceptTerms`, `logClientConsent` | User / Public |
| **clients** | `createClientAction`, `updateClientAction`, `deleteClientAction` | Org |
| **campaigns** | `createCampaign`, `updateCampaign`, `createLineItem`, `updateLineItem` | Org |
| **channels** | `createChannel`, `updateChannel`, `createAdSlot`, `updateAdSlot` | Org |
| **inventory** | `createRateCard`, `updateRateCard` | Org |
| **briefs** | `createBrief`, `updateBrief` | Org |
| **production** | `createTask`, `updateTask` | Org |
| **approvals** | `createApprovalRequest` | Org + Email side effect |
| **schedule** | `createScheduleEntry`, `updateScheduleEntry` | Org + Conflict detection |
| **invoices** | `createInvoice`, `updateInvoiceLineItem`, `sendInvoice` | Org + Email side effect |
| **reports** | `getRevenueReport`, `getOutstandingInvoices`, `getRevenueByClient` | Org (read-only) |
| **activity** | `logActivity` | Org (audit trail) |
| **organizations** | Org CRUD, member management | Org |
| **deals** | Pipeline deal CRUD | Org |
| **payments** | Payment recording | Org |
| **files** | File management | Org |

---

## 10. API Routes

### 10.1 Paystack Webhook (`/api/webhooks/paystack`)

Handles payment confirmations from Paystack. This is the primary entry point for order creation.

**Security measures:**
- HMAC-SHA512 signature verification using `PAYSTACK_WEBHOOK_SECRET`
- Replay protection (rejects events older than 5 minutes)
- Email validation with regex
- UUID validation for influencer ID
- Sanitized logging (CWE-117 mitigation)

**Flow:**
1. Verify HMAC signature
2. Extract metadata (influencer_id, package_id, client details, delivery info)
3. Parse delivery address and uploaded images
4. Create order record in `orders` table
5. Send booking notification email to creator
6. Trigger web push notification

### 10.2 Subaccount Creation (`/api/onboarding/subaccount`)

Creates a Paystack subaccount for split payments during creator onboarding.

**Flow:**
1. Validate bank code, account number, and account name
2. Call Paystack API to create subaccount
3. Store `subaccount_code` in user's profile
4. Set `is_onboarded = true`

### 10.3 Push Notification Sender (`/api/push/send`)

Sends web push notifications to a specific user.

**Flow:**
1. Look up all active push subscriptions for the target user
2. Send notification via `web-push` library with VAPID credentials
3. Clean up stale/expired endpoints (410 or 404 responses)

---

## 11. Component Library

### 11.1 Base UI Components (`components/ui/`)

| Component | File | Variants | Props |
|-----------|------|----------|-------|
| **Button** | `button.tsx` | default, primary, success, destructive, outline, secondary, tertiary, ghost, link, dark, soft-primary, soft-success | `variant`, `size` (sm/md/default/lg/xl/icon), `isLoading`, `loadingText`, `asChild` |
| **Input** | `input.tsx` | default, error, success | `error`, `success`, `disabled`, `aria-invalid` |
| **Textarea** | `textarea.tsx` | default, error, success | `error`, `success`, `disabled` |
| **Card** | `card.tsx` | default, elevated, outline, subtle, ghost | `variant`, plus `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter` |
| **Badge** | `badge.tsx` | default, secondary, destructive, outline, success | `variant` |
| **Form** | `form.tsx` | — | React Hook Form integration: `Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormDescription`, `FormMessage` |
| **Label** | `label.tsx` | — | Standard label with branded styling |
| **LogoMark** | `logo.tsx` | default, dark | `size` (sm/md/lg), `variant` |

### 11.2 Dashboard Components (`components/dashboard/`)

25 feature components covering the full dashboard experience:

| Category | Components |
|----------|------------|
| **Navigation** | `DashboardNav`, `MobileNav`, `OrgSwitcher` |
| **Notifications** | `NotificationBell`, `PushPermissionPrompt` |
| **Orders** | `OrderStatusControl`, `ShareLink` |
| **Settings** | `SettingsForm`, `OrgSettingsForm`, `OrgMembersList` |
| **Campaigns** | `CampaignCard`, `LineItemTable`, `PipelineBoard` |
| **Production** | `BriefForm`, `ProductionBoard`, `TaskCard`, `FileGallery` |
| **Approvals** | `ApprovalCard`, `ProofUpload` |
| **Channels** | `ChannelTypeIcon`, `SlotForm`, `SlotSpecsForm`, `RateCardForm`, `InventoryCalendar` |
| **Scheduling** | `ScheduleCalendar` |
| **Activity** | `ActivityTimeline` |

### 11.3 Onboarding Components (`components/onboarding/`)

| Component | Step | Purpose |
|-----------|------|---------|
| `ProfileStep` | 1 | Full name, username, bio, social media handles, profile photo upload |
| `PayoutStep` | 2 | Bank account details (bank code, account number, account name) |
| `PackageStep` | 3 | First service package (title, description, price, delivery days) |

---

## 12. Design System

### 12.1 Brand Identity

AdDesk uses an **Apple-inspired design language** with a Ghana-focused green palette:

| Token | Value | Usage |
|-------|-------|-------|
| `--brand-primary` | `#0f6443` | Primary green — CTAs, active states, success |
| `--brand-secondary` | `#1c1c1e` | Near-black — text, headers, dark surfaces |
| `--brand-accent` | `#5e5ce6` | Indigo — accent highlights |

### 12.2 Typography

| Font | Variable | Usage |
|------|----------|-------|
| **DM Sans** | `--font-sans` | Body text, UI elements (default) |
| **Fraunces** | `--font-display` | Display headings, prices |
| **JetBrains Mono** | `--font-mono` | Code, references, monospace content |

### 12.3 Color System

**Surface Colors:**

| Token | Value | Usage |
|-------|-------|-------|
| `--surface-light` | `#f5f5f7` | Page backgrounds |
| `--surface-card` | `#ffffff` | Card backgrounds |
| `--surface-dark` | `#1c1c1e` | Dark panels (login sidebar) |

**Text Colors (WCAG AA compliant):**

| Token | Value | Contrast Ratio | Usage |
|-------|-------|----------------|-------|
| `--text-primary` | `#1d1d1f` | 16.1:1 | Primary text |
| `--text-secondary` | `#6e6e73` | 5.2:1 | Secondary labels |
| `--text-tertiary` | `#6e6e73` | 5.2:1 | Tertiary labels |
| `--text-muted` | `#8e8e93` | 3.5:1 | Muted/placeholder text |

**Status Colors:**

| Token | Value | Usage |
|-------|-------|-------|
| `--success` | `#30d158` | Success states, completed |
| `--warning` | `#ff9f0a` | Warnings, in-progress |
| `--error` | `#ff3b30` | Errors, cancelled |
| `--info` | `#0a84ff` | Informational highlights |

### 12.4 Spacing & Radius

- **Spacing**: Follows Tailwind's 4px/8px grid system
- **Border Radius**: `--radius: 0.75rem` base → `rounded-lg` (inputs), `rounded-xl` (buttons/nav), `rounded-2xl` (cards), `rounded-3xl` (hero elements), `rounded-full` (badges/avatars)

### 12.5 Shadows

| Token | Usage |
|-------|-------|
| `shadow-xs` | Subtle depth separation |
| `shadow-sm` | Default elevation |
| `shadow-md` | Moderate elevation (cards) |
| `shadow-lg` | High elevation (dropdowns, modals) |
| `shadow-elevation-low/medium/high` | Semantic elevation levels |

### 12.6 Animations

Built-in CSS animation utilities:

| Class | Animation | Duration |
|-------|-----------|----------|
| `.animate-fade-in-up` | Fade in + slide up 12px | 400ms |
| `.animate-fade-in` | Fade in | 300ms |
| `.animate-slide-in-down/up/left/right` | Directional slides | 300ms |
| `.animate-scale-in` | Scale from 97% to 100% | 300ms |
| `.animate-pulse-soft` | Gentle opacity pulse | 3s infinite |

All animations respect `prefers-reduced-motion: reduce`.

### 12.7 Glassmorphism

```css
.glass     /* White overlay with blur — nav bars, overlays */
.glass-dark /* Dark overlay with blur — dark panels */
.glass-sm   /* Light variant with less blur */
```

---

## 13. Payment Integration

### 13.1 Paystack Integration

AdDesk uses **Paystack** (West Africa's leading payment processor) with the **split payment** model:

```
Client pays GHS 100
    │
    ├──→ Creator receives GHS 94 (via Paystack subaccount)
    └──→ Platform retains GHS 6 (PLATFORM_PERCENTAGE_CHARGE = 6%)
```

### 13.2 Payment Flow

```
1. Client visits /book/[username]/[packageId]
2. Fills in details (name, email, brief, delivery)
3. Clicks "Pay with Paystack"
4. PaystackButton generates 128-bit transaction reference
5. Paystack checkout popup opens
6. Client completes payment (card, MoMo, bank)
7. Paystack sends webhook to /api/webhooks/paystack
8. Webhook verifies HMAC, creates order, sends notifications
9. Client redirected to /book/success
```

### 13.3 Subaccount Setup

During onboarding, creators register a Paystack subaccount:

1. Creator enters bank details (PayoutStep)
2. System calls `/api/onboarding/subaccount`
3. Paystack validates the bank account
4. Subaccount code stored in `profiles.paystack_subaccount_code`

### 13.4 Transaction Reference

Each transaction uses a cryptographically secure 128-bit random reference:

```typescript
const bytes = crypto.getRandomValues(new Uint8Array(16))
const ref = `ADK-${Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')}`
```

### 13.5 Currency

All monetary values are stored in **pesewas** (1 GHS = 100 pesewas) as integers to avoid floating-point precision issues.

---

## 14. Email System

### 14.1 Provider

**Resend** — transactional email delivery service.

### 14.2 Email Templates

| Template | Trigger | Recipient |
|----------|---------|-----------|
| **New Booking** | Order created from webhook | Creator (order notification) |
| **Order Completed** | Order status → "completed" | Client (completion confirmation) |
| **Terms Acceptance** | User accepts terms | User (confirmation receipt) |
| **Approval Request** | Creator submits work for review | Client (review link with token) |
| **Invoice** | Invoice marked as "sent" | Client (view link with token) |

All emails use branded HTML templates with AdDesk styling, generated server-side.

---

## 15. Notification System

### 15.1 In-App Notifications

Notifications are stored in the `notifications` table and displayed via the `NotificationBell` component:

| Field | Description |
|-------|-------------|
| `type` | Category (order, approval, system, etc.) |
| `title` | Short notification heading |
| `message` | Notification body text |
| `link` | Deep link to relevant page |
| `is_read` | Read/unread status |

### 15.2 Web Push Notifications

For real-time alerts when the user is not on the platform:

1. **`PushPermissionPrompt`** — prompts users to subscribe
2. Subscription stored in `push_subscriptions` (endpoint, p256dh, auth keys)
3. **`/api/push/send`** — dispatches push via `web-push` library with VAPID
4. Stale endpoints are automatically cleaned up (410/404 responses)

---

## 16. Multi-Tenancy & RBAC

### 16.1 Organization Types

| Type | Description | UI Differences |
|------|-------------|----------------|
| `influencer` | Solo creator (default for new users) | Simplified nav (3 items), personal booking page |
| `media_house` | Print, radio, TV, or digital publisher | Full nav (16 items), channel management, scheduling |
| `agency` | Advertising agency | Full nav, client management, campaign pipeline |

### 16.2 Roles & Permissions

| Role | Permissions |
|------|-------------|
| **owner** | All permissions (manage_organization, manage_members, manage_channels, manage_inventory, create_deals, view_all_orders, manage_production, manage_approvals, manage_billing, view_reports) |
| **admin** | All permissions except manage_organization |
| **sales** | create_deals, view_all_orders, view_reports |
| **production** | manage_production, manage_approvals |
| **finance** | manage_billing, view_reports |
| **member** | view_all_orders (basic read access) |

### 16.3 Permission Checking

```typescript
// Server Action (throws on failure)
await checkPermission(userId, orgId, 'manage_production')

// Component (conditional rendering)
const canManage = await hasPermission(userId, orgId, 'manage_billing')

// Middleware-level (role check)
if (await hasRole(userId, orgId, ['owner', 'admin'])) { ... }
```

### 16.4 Data Isolation

All organization-scoped tables use RLS policies that verify membership:

```sql
USING (organization_id IN (
  SELECT organization_id FROM organization_members
  WHERE user_id = auth.uid() AND is_active = true
))
```

### 16.5 Context Switching

Users can belong to multiple organizations. The `OrgSwitcher` component updates `profiles.current_organization_id`, and the dashboard layout reads this to determine navigation items and data scope.

---

## 17. Security

### 17.1 Security Headers

Applied to all routes via `next.config.ts`:

| Header | Value |
|--------|-------|
| `X-Frame-Options` | `DENY` |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` |
| `Content-Security-Policy` | Restricts scripts to self + Paystack; connects to self + Supabase + Paystack |

### 17.2 Input Validation

All user inputs are validated with **Zod** schemas at the server action boundary:
- String fields have `.max()` length limits
- Numeric fields have `.min()` / `.max()` constraints
- Email fields are regex-validated
- File uploads are type- and size-checked client-side

### 17.3 Authentication Security

- **Open redirect protection**: Auth callback validates `next` parameter — blocks `://`, `\\`, encoded `//`, and strips query params
- **Username enumeration prevention**: Profile update errors use generic "not available" messages
- **Transaction references**: 128-bit cryptographic random (16 bytes → 32 hex chars)

### 17.4 Webhook Security

- **HMAC-SHA512** signature verification on all Paystack webhooks
- **Replay protection**: Events older than 5 minutes are rejected
- **Email validation**: Regex check before storing customer emails
- **UUID validation**: `influencer_id` verified as valid UUID format

### 17.5 Log Security

Log injection prevention (CWE-117):
```typescript
sanitizeLog(msg) → strips control chars + ANSI codes, truncates to 1000 chars
```

### 17.6 Database Security

- **Row-Level Security** on all tables — data isolation enforced at the Postgres level
- **Service role client** (`createAdminClient`) is restricted to server-side webhook handlers
- **Cookie-based sessions** with automatic refresh via middleware

---

## 18. Deployment

### 18.1 Platform

AdDesk deploys to **Vercel** with the following configuration:

```json
{
  "framework": "nextjs",
  "installCommand": "npm install",
  "buildCommand": "npm run build"
}
```

### 18.2 Build Pipeline

```bash
npm run build    # Compiles TypeScript, builds Next.js, generates PWA assets
npm run start    # Starts production server
npm run lint     # Runs ESLint with Next.js rules
```

### 18.3 PWA Configuration

AdDesk is configured as a Progressive Web App:
- **Offline caching** via `@ducanh2912/next-pwa` (disabled in development)
- **Installable** on mobile devices and desktops
- **Icons** at 192×192 and 512×512
- **Display**: `standalone` (no browser chrome)
- **Orientation**: `portrait`

### 18.4 Deployment Checklist

- [ ] Set all environment variables in Vercel dashboard
- [ ] Run database migrations (schema.sql → p0 → p5) on production Supabase
- [ ] Configure Paystack webhook URL to `https://yourdomain.com/api/webhooks/paystack`
- [ ] Generate VAPID keys for web push (`npx web-push generate-vapid-keys`)
- [ ] Set up Resend domain verification and API key
- [ ] Verify Supabase RLS policies are active on all tables
- [ ] Rotate any test API keys to production keys
- [ ] Enable Supabase email confirmation in production

---

## 19. Development Workflow

### 19.1 Local Development

```bash
npm run dev          # Start dev server (http://localhost:3000)
npm run lint         # Check for linting issues
npm run build        # Production build (type checking + compilation)
```

### 19.2 Code Conventions

| Area | Convention |
|------|-----------|
| **Components** | Server Components by default; `'use client'` only when hooks or interactivity are needed |
| **Mutations** | Always use Server Actions (not API routes) for authenticated mutations |
| **Validation** | Zod schemas at system boundaries only — no redundant internal validation |
| **Styling** | Tailwind CSS utilities with `cn()` for conditional classes; mobile-first responsive |
| **Types** | TypeScript strict mode; discriminated unions for channel specs; no `any` |
| **Error Handling** | Return `{ error: string }` from Server Actions; never throw in user-facing code |
| **Currency** | All monetary values in pesewas (integer); format for display only at the UI layer |
| **Imports** | Use `@/*` path alias for all internal imports |

### 19.3 Adding a New Feature

1. **Types** → Define types in `types/` (if new entities are involved)
2. **Migration** → Write SQL migration in `supabase/` with `IF NOT EXISTS` for idempotency
3. **Server Actions** → Create action file in `actions/` with Zod validation
4. **Components** → Build UI components in `components/dashboard/`
5. **Pages** → Wire up pages in `app/dashboard/`
6. **Lint** → Run `npm run lint` and fix all warnings

### 19.4 File Naming

| Type | Convention | Example |
|------|-----------|---------|
| Pages | `page.tsx` | `app/dashboard/campaigns/page.tsx` |
| Layouts | `layout.tsx` | `app/dashboard/layout.tsx` |
| Loading | `loading.tsx` | `app/book/[username]/loading.tsx` |
| API | `route.ts` | `app/api/webhooks/paystack/route.ts` |
| Actions | `camelCase.ts` | `actions/campaigns.ts` |
| Components | `PascalCase.tsx` | `components/dashboard/CampaignCard.tsx` |
| Types | `camelCase.ts` | `types/campaigns.ts` |
| Utils | `camelCase.ts` | `lib/utils.ts` |

---

## Appendix A: Database Migration Order

Apply migrations in this order for a fresh database setup:

```
1. supabase/schema.sql                            → Core tables (profiles, packages, orders)
2. supabase/migration_clickwrap.sql                → Consent logging
3. supabase/migration_notifications.sql            → Notification system
4. supabase/migration_payout_details.sql           → Payout bank details
5. supabase/migration_physical_delivery.sql        → Physical delivery support
6. supabase/migration_profile_views.sql            → Profile analytics
7. supabase/migration_push_subscriptions.sql       → Web push
8. supabase/migration_brief_assets.sql             → Brief image storage
9. supabase/migration_p0_organizations.sql         → Organizations & multi-tenancy
10. supabase/migration_p1_channels.sql             → Media channels & ad slots
11. supabase/migration_p2_campaigns.sql            → Campaigns & clients
12. supabase/migration_p3_production.sql           → Creative production
13. supabase/migration_p4_approvals_scheduling.sql → Approvals & scheduling
14. supabase/migration_p5_billing.sql              → Invoicing & payments
```

Or use the consolidated migration: `supabase/migration_all_consolidated.sql`

## Appendix B: Order Status Lifecycle

```
                    ┌───────────┐
                    │    new    │ ← Created by Paystack webhook
                    └─────┬─────┘
                          │
                    ┌─────▼─────┐
              ┌─────│in_progress│
              │     └─────┬─────┘
              │           │
              │     ┌─────▼─────┐
              │     │ submitted │ ← Creator delivers work
              │     └─────┬─────┘
              │           │
              │     ┌─────▼─────┐
              │     │   live    │ ← Content goes live (optional)
              │     └─────┬─────┘
              │           │
              │     ┌─────▼─────┐
              │     │ completed │ ← Order fulfilled
              │     └───────────┘
              │
              │     ┌───────────┐
              └────►│ cancelled │ ← Cancellation from any status
                    └───────────┘
```

## Appendix C: Campaign Workflow

```
Client Contact → Campaign Created (draft)
    │
    ├──→ Line Items added (channel + slot + quantity + pricing)
    │
    ├──→ Creative Briefs assigned to team members
    │       │
    │       ├──→ Production Tasks created (design, copy, video, etc.)
    │       │       │
    │       │       └──→ Files uploaded (versioned, reviewable)
    │       │
    │       └──→ Approval Request sent to client
    │               │
    │               ├──→ Client approves → Brief status: "approved"
    │               └──→ Client requests revision → Brief status: "revision_needed"
    │
    ├──→ Schedule Entries created (date + slot assignment)
    │       │
    │       └──→ Content goes live → Proof of run uploaded
    │
    └──→ Invoice generated → Emailed to client → Payment recorded
```
