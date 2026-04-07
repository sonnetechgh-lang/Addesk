# AdDesk Expansion Plan: Full Advertising Workflow & Management Platform

---

## STEP 1 — CODEBASE AUDIT

### 1.1 Current Architecture Summary

| Layer | Technology | Notes |
|-------|-----------|-------|
| Framework | Next.js 16 (App Router) | Pages, layouts, server components, server actions |
| Database | Supabase (Postgres) | RLS-enabled, admin + server + browser clients |
| Auth | Supabase Auth | Email/password, OAuth callback, middleware guards |
| Payments | Paystack | Split payments via subaccounts, HMAC-verified webhook |
| Email | Resend | Transactional emails (booking confirmation, completion) |
| Push | Web Push (VAPID) | `web-push` library, push subscription management |
| Storage | Supabase Storage | Buckets: `avatars`, `orders`, `brief-assets` |
| Styling | Tailwind CSS 4 + Shadcn UI | Radix primitives, class-variance-authority |
| Validation | Zod 4 | Server action input validation |
| PWA | `@ducanh2912/next-pwa` | Manifest, offline-ready |

### 1.2 Database Tables (Current)

| Table | Purpose | Key Fields |
|-------|---------|-----------|
| `profiles` | User accounts (influencers) | `full_name`, `username`, social handles, `paystack_subaccount_code`, `is_onboarded` |
| `packages` | Service offerings | `influencer_id`, `title`, `price` (pesewas), `delivery_days`, `requires_physical_delivery`, `requires_on_premise` |
| `orders` | Client bookings | `influencer_id`, `package_id`, `client_*`, `order_status`, `delivery_type`, `delivery_address`, `brief_image_urls` |
| `notifications` | In-app notifications | `user_id`, `type`, `title`, `message`, `link`, `is_read` |
| `push_subscriptions` | Web Push endpoints | `user_id`, `endpoint`, `p256dh`, `auth` |
| `consent_logs` | Influencer terms acceptance | `user_id`, `terms_version`, `ip_address` |
| `client_consent_logs` | Client terms acceptance | `influencer_id`, `client_email`, `terms_version` |
| `profile_views` | Analytics | `profile_id`, `viewer_ip` |
| `physical_shipments` | Delivery tracking | `order_id`, `carrier_name`, `tracking_number`, `shipment_status` |

### 1.3 Key Flows (Current)

1. **Onboarding:** Sign up → Profile → Package → Payout (Paystack subaccount) → Dashboard
2. **Booking:** Client visits `/book/[username]` → selects package → fills brief → pays via Paystack inline
3. **Webhook:** Paystack `charge.success` → creates order → sends email + push to influencer
4. **Order lifecycle:** `new` → `in_progress` → `submitted` → `completed` (or `cancelled`)
5. **Delivery:** Digital (default) | Physical (with shipment tracking) | On-premise (date/location)

### 1.4 What Maps to the Expanded Use Case

| Existing Feature | Reusable For | Adaptation Needed |
|-----------------|-------------|-------------------|
| `profiles` table | All media vendors (print/digital/broadcast) | Add `account_type` / `organization` fields; rename "influencer" references |
| `packages` | Ad products/slots for any channel | Add `channel_type`, slot metadata, scheduling fields |
| `orders` | Ad orders across all channels | Add campaign linkage, production stages, approval tracking |
| Order status workflow | Production tracking | Expand statuses for creative → review → approved → scheduled → live |
| Paystack split payments | Billing for all vendors | Already generalized; just needs per-organization config |
| Notifications system | All user roles | Already role-agnostic (scoped to `user_id`) |
| Push subscriptions | All user roles | Already role-agnostic |
| Storage buckets | Creative assets, proofs | Need new buckets for creatives, proofs, contracts |
| Consent tracking | All parties | Already has both authenticated + unauthenticated consent |
| Email templates | All notification types | Templates need to be parameterized beyond "influencer" language |
| Public booking page | Client-facing order forms | Needs to support media-specific booking flows |
| Demo mode | Onboarding for new user types | Needs demo data per channel type |

### 1.5 Influencer-Specific Code That Must Be Abstracted

#### Hard-Coded Terminology (rename `influencer` → `vendor` or `publisher`)

| Location | Current Reference | Change Needed |
|----------|------------------|---------------|
| `schema.sql` | `influencer_id` FK in packages, orders | Add `vendor_id` alias or rename |
| `actions/orders.ts` | `influencer_id` filter | Generalize to `vendor_id` |
| `actions/onboarding.ts` | `influencer_id` in package creation | Generalize |
| `lib/email/resend.ts` | `influencerName` param, email copy | Parameterize to `vendorName` / `publisherName` |
| `app/api/webhooks/paystack/route.ts` | `influencer_id` metadata field, validation | Rename to `vendor_id` |
| `app/api/onboarding/subaccount/route.ts` | "Subaccount for Influencer" | Use dynamic description |
| `app/manifest.ts` | "Influencer Booking and Monetization" | "Advertising Workflow & Management" |
| `app/layout.tsx` metadata | "Influencer Booking and Monetization" | Update |
| `components/booking/*` | Profile page designed for social-media creators | Needs channel-agnostic public pages |
| `app/book/[username]/page.tsx` | Social handles (IG, TikTok, Twitter) display | Show channel-relevant info |
| `lib/demo-data.ts` | All demo data is influencer-centric | Needs multi-channel demo variants |
| `consent.ts` | `acceptInfluencerTerms()` | Rename to `acceptVendorTerms()` |

#### Influencer-Specific Data Model Assumptions

1. **Social handles** on `profiles` (instagram, tiktok, twitter) — not relevant for print/broadcast
2. **Packages as "service offerings"** — print/broadcast sell ad *slots* with dimensions/airtime, not creator services
3. **Single-vendor orders** — no campaign concept grouping orders across multiple vendors
4. **Flat order status** — no creative production stages, no client approval gates
5. **No roles beyond "influencer" and anonymous "client"** — need sales, production, admin, client roles
6. **No organization/team concept** — a newspaper has multiple sales reps and production staff

---

## STEP 2 — GAP ANALYSIS

### 2.1 Missing: Organization & Multi-Tenancy

**Current:** Single user = single influencer. No team or org concept.
**Needed:**
- `organizations` table (media house, agency, station)
- `organization_members` with role assignments (admin, sales, production, finance)
- Organization-level settings (branding, payout config, channel types)
- User can belong to multiple organizations

### 2.2 Missing: Channel / Media Type Management

**Current:** Implicitly "influencer/social media" only.
**Needed:**
- `channels` table with `type` enum: `influencer`, `print`, `digital`, `broadcast_tv`, `broadcast_radio`
- Channel-specific metadata schemas (e.g., print: page size, color/BW, section; broadcast: time slot, duration, daypart)
- Ability to configure channels per organization

### 2.3 Missing: Ad Inventory / Slot Management

**Current:** `packages` table serves as service offerings with price and delivery days.
**Needed:**
- `ad_slots` / `inventory` table per channel
- Print: page/section/size/position, run dates, available units
- Broadcast: daypart, program, duration, avails per break
- Digital: placement, dimensions, impressions/CPM, date ranges
- Influencer: existing package model is fine
- Availability calendar / blackout dates
- Rate cards with tiered pricing

### 2.4 Missing: Sales-to-Production Handoff

**Current:** Order created via webhook → influencer manually progresses status.
**Needed:**
- Formal sales pipeline stages: `lead` → `proposal` → `booked` → `production` → `live` → `billed`
- Sales rep assignment on deals
- Handoff trigger from sales → production with checklist
- Internal notes and activity log per order/deal

### 2.5 Missing: Creative Brief Capture & Assignment

**Current:** Basic `product_description`, `target_audience`, `asset_urls`, `brief_image_urls` on orders.
**Needed:**
- Structured `creative_briefs` table with:
  - Specs per channel (dimensions, format, resolution, duration)
  - Client-provided assets (reference files, logos, brand guidelines)
  - Internal creative team assignment
  - Brief status: `draft` → `assigned` → `in_production` → `review` → `approved`
- Multiple briefs per order (e.g., one for print ad, one for radio spot)

### 2.6 Missing: Production Status Tracking

**Current:** Order status is flat: `new` → `in_progress` → `submitted` → `completed`.
**Needed:**
- `production_tasks` table tracking each step:
  - Task type: design, copywriting, voiceover, filming, editing
  - Assigned team member
  - Due date, actual completion date
  - File attachments (WIP files, drafts)
- Kanban / timeline view for production manager
- Dependencies between tasks

### 2.7 Missing: Client Approval Flow

**Current:** No approval mechanism. Influencer marks "completed" unilaterally.
**Needed:**
- `approval_requests` table:
  - Links to creative version/proof
  - Status: `pending_review` → `approved` | `revision_requested`
  - Client comments/annotations
  - Revision history (version tracking)
- Email/push notification to client when proof is ready
- Client portal for reviewing and approving without needing a full account
- Approval deadline with auto-escalation

### 2.8 Missing: Campaign Management

**Current:** Each order is independent. No way to group orders.
**Needed:**
- `campaigns` table:
  - Client reference, campaign name, date range, budget
  - Links to multiple orders/line items across channels
  - Campaign-level status rollup
  - Campaign brief (umbrella strategy doc)
- Campaign dashboard showing cross-channel status
- Budget tracking (allocated vs. spent vs. invoiced)

### 2.9 Missing: Scheduling & Go-Live Tracking

**Current:** No scheduling concept. Orders have `preferred_dates` (free text).
**Needed:**
- `schedule_entries` table:
  - Linked to order/line item and ad slot
  - Scheduled date/time, actual run date/time
  - Proof of run (tear sheet scan, aircheck recording, screenshot)
  - Status: `scheduled` → `live` → `confirmed` (with proof)
- Calendar view per channel
- Conflict detection (double-booking a slot)
- Integration hooks for trafficking systems (future)

### 2.10 Missing: Billing Tied to Delivery

**Current:** Payment is upfront at booking time. No post-delivery invoicing.
**Needed:**
- `invoices` table:
  - Links to campaign or individual orders
  - Line items with quantity, rate, amount
  - Status: `draft` → `sent` → `paid` → `overdue`
  - Proof of delivery attached
- Support for both prepaid (current Paystack flow) and post-delivery invoicing
- Credit terms / net-30 support for enterprise clients
- Revenue recognition tied to actual go-live confirmation

### 2.11 Missing: Role-Based Access Control (RBAC)

**Current:** Two implicit roles: authenticated user (influencer) and anonymous visitor (client).
**Needed:**
- System roles: `super_admin`
- Organization roles: `org_admin`, `sales`, `production`, `finance`, `client`
- Permission matrix:

| Permission | Admin | Sales | Production | Finance | Client |
|-----------|-------|-------|------------|---------|--------|
| Manage org settings | ✅ | ❌ | ❌ | ❌ | ❌ |
| Create/edit deals | ✅ | ✅ | ❌ | ❌ | ❌ |
| View all orders | ✅ | ✅ | ✅ | ✅ | Own only |
| Manage production | ✅ | ❌ | ✅ | ❌ | ❌ |
| Approve creatives | ❌ | ❌ | ❌ | ❌ | ✅ |
| Manage billing | ✅ | ❌ | ❌ | ✅ | View own |
| View reports | ✅ | ✅ | ✅ | ✅ | ❌ |

- RLS policies per role
- Middleware guard for role-based route protection

---

## STEP 3 — PHASED IMPLEMENTATION PLAN

### Overview

| Phase | Name | Goal | Breaking Changes |
|-------|------|------|-----------------|
| 0 | Foundation | Generalize terminology, add org + roles layer | None — influencer flow preserved |
| 1 | Multi-Channel Core | Channel types, inventory, generalized packages | None — existing packages backward-compatible |
| 2 | Sales Pipeline | Deals, campaigns, sales workflow | None — existing orders untouched |
| 3 | Creative & Production | Briefs, production tracking, file management | None — existing order flow extended |
| 4 | Approval & Scheduling | Client portal, approvals, scheduling calendar | None — additive features |
| 5 | Billing & Invoicing | Invoices, delivery-based billing, reporting | None — current prepaid flow preserved |

---

### PHASE 0: Foundation — Generalize & Add Multi-Tenancy

**Goal:** Remove influencer-specific assumptions, introduce organizations and RBAC without breaking existing functionality.

#### Database Changes

```sql
-- 0.1 Organizations
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL DEFAULT 'influencer',  -- influencer | media_house | agency
  logo_url TEXT,
  website TEXT,
  paystack_subaccount_code TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- 0.2 Organization Members (RBAC)
CREATE TABLE public.organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',  -- owner | admin | sales | production | finance | member
  invited_email TEXT,
  invited_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- 0.3 Extend profiles table
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS account_type TEXT DEFAULT 'influencer',  -- influencer | organization_member
  ADD COLUMN IF NOT EXISTS current_organization_id UUID REFERENCES public.organizations(id),
  ADD COLUMN IF NOT EXISTS display_role TEXT DEFAULT 'creator';  -- creator | sales | production | admin | client

-- 0.4 Auto-create solo organization for existing influencers
-- (migration script: for each existing profile, create an org of type 'influencer' and add them as 'owner')

-- 0.5 Add organization_id to existing tables for multi-tenant scoping
ALTER TABLE public.packages
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);

-- Backfill: UPDATE packages SET organization_id = (SELECT o.id FROM organizations o JOIN organization_members om ON o.id = om.organization_id WHERE om.user_id = packages.influencer_id AND om.role = 'owner' LIMIT 1);
-- Same for orders.
```

#### RLS Policies (Phase 0)

```sql
-- Organization members can view their org
CREATE POLICY "Members can view their organization"
  ON organizations FOR SELECT
  USING (id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

-- Members can view other members in same org
CREATE POLICY "Members can view org members"
  ON organization_members FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

-- Packages: org-scoped access
CREATE POLICY "Org members can view org packages"
  ON packages FOR SELECT
  USING (
    organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
    OR influencer_id = auth.uid()  -- backward compat for solo influencers
  );
```

#### Code Changes

| File | Change |
|------|--------|
| `app/manifest.ts` | Description → "Advertising Workflow & Management" |
| `app/layout.tsx` | Metadata description update |
| `lib/email/resend.ts` | Rename `influencerName` → `vendorName`, parameterize email copy |
| `actions/consent.ts` | Rename `acceptInfluencerTerms` → `acceptTerms` |
| `app/api/webhooks/paystack/route.ts` | Accept `vendor_id` alongside `influencer_id` in metadata (backward compat) |
| `app/api/onboarding/subaccount/route.ts` | Dynamic subaccount description |

#### New Routes & Components

| Route / Component | Purpose |
|------------------|---------|
| `app/dashboard/org/page.tsx` | Organization dashboard (for media houses) |
| `app/dashboard/org/settings/page.tsx` | Org settings (name, logo, members) |
| `app/dashboard/org/members/page.tsx` | Member management + invitations |
| `components/dashboard/OrgSwitcher.tsx` | Dropdown to switch between orgs |
| `lib/rbac.ts` | Role checking utilities (`hasPermission(userId, orgId, permission)`) |
| `types/roles.ts` | Role + permission type definitions |

#### Migration Strategy

- Existing influencer accounts automatically get a solo `organization` created via migration
- All existing RLS policies remain functional (backward compatible via `OR influencer_id = auth.uid()`)
- New org-based policies are additive
- Frontend conditionally shows org features only when `account_type === 'organization_member'`

---

### PHASE 1: Multi-Channel Core

**Goal:** Support different media channel types with channel-specific ad inventory and pricing.

#### Database Changes

```sql
-- 1.1 Channels
CREATE TABLE public.channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,  -- influencer | print | digital | broadcast_tv | broadcast_radio
  name TEXT NOT NULL,  -- e.g., "Daily Graphic - Full Page", "Joy FM Morning Show"
  description TEXT,
  specs JSONB DEFAULT '{}',  -- channel-type-specific: {pageSize, colorMode} | {duration, daypart} | {dimensions, format}
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;

-- 1.2 Ad Inventory / Slots
CREATE TABLE public.ad_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID REFERENCES public.channels(id) ON DELETE CASCADE NOT NULL,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,  -- e.g., "Full Page Color", "30-sec Prime Time", "Homepage Banner"
  slot_type TEXT NOT NULL,  -- print_page | broadcast_spot | digital_placement | social_post
  specs JSONB DEFAULT '{}',  -- {width, height, bleed} | {duration_seconds, format} | {dimensions, file_types}
  base_price INTEGER NOT NULL,  -- in pesewas
  currency TEXT DEFAULT 'GHS',
  availability_schedule JSONB DEFAULT '{}',  -- recurring availability rules
  max_units_per_period INTEGER,  -- e.g., 1 for a unique print position, null for unlimited
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.ad_slots ENABLE ROW LEVEL SECURITY;

-- 1.3 Rate Cards
CREATE TABLE public.rate_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_slot_id UUID REFERENCES public.ad_slots(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,  -- e.g., "Standard Rate", "Agency Rate", "Non-Profit Discount"
  price INTEGER NOT NULL,
  valid_from DATE,
  valid_to DATE,
  conditions JSONB DEFAULT '{}',  -- e.g., {min_bookings: 5, discount_pct: 10}
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.rate_cards ENABLE ROW LEVEL SECURITY;

-- 1.4 Extend packages with channel linkage (backward compatible)
ALTER TABLE public.packages
  ADD COLUMN IF NOT EXISTS channel_id UUID REFERENCES public.channels(id),
  ADD COLUMN IF NOT EXISTS ad_slot_id UUID REFERENCES public.ad_slots(id),
  ADD COLUMN IF NOT EXISTS channel_type TEXT DEFAULT 'influencer';
```

#### New Routes & Components

| Route / Component | Purpose |
|------------------|---------|
| `app/dashboard/channels/page.tsx` | List org's channels |
| `app/dashboard/channels/[id]/page.tsx` | Channel detail + inventory management |
| `app/dashboard/channels/new/page.tsx` | Create new channel |
| `app/dashboard/inventory/page.tsx` | Ad slot inventory overview (calendar/grid) |
| `app/dashboard/inventory/[id]/page.tsx` | Slot detail + availability |
| `components/dashboard/ChannelTypeIcon.tsx` | Icon per channel type |
| `components/dashboard/InventoryCalendar.tsx` | Visual availability calendar |
| `components/dashboard/SlotSpecsForm.tsx` | Dynamic form for channel-type-specific specs |
| `actions/channels.ts` | CRUD for channels and slots |
| `actions/inventory.ts` | Availability and rate card management |

#### Spec Schemas by Channel Type

```typescript
// types/channels.ts
type PrintSpecs = {
  pageSize: 'full' | 'half' | 'quarter' | 'eighth' | 'custom';
  width_mm?: number;
  height_mm?: number;
  bleed_mm?: number;
  colorMode: 'full_color' | 'spot_color' | 'bw';
  section: string;  // e.g., "Front Page", "Sports", "Classifieds"
  position?: 'run_of_paper' | 'preferred' | 'guaranteed';
};

type BroadcastSpecs = {
  duration_seconds: 15 | 30 | 45 | 60 | 90 | 120;
  daypart: 'morning' | 'midday' | 'afternoon' | 'prime_time' | 'late_night';
  program?: string;
  format: 'live_read' | 'pre_recorded' | 'sponsorship';
};

type DigitalSpecs = {
  placement: 'banner' | 'sidebar' | 'interstitial' | 'native' | 'video_pre_roll';
  width_px: number;
  height_px: number;
  file_types: string[];  // ['jpg', 'png', 'gif', 'mp4']
  max_file_size_mb: number;
  pricing_model: 'flat' | 'cpm' | 'cpc';
};

type InfluencerSpecs = {
  platform: 'instagram' | 'tiktok' | 'youtube' | 'twitter';
  content_type: 'post' | 'story' | 'reel' | 'video' | 'thread';
  includes_usage_rights: boolean;
};
```

#### Refactoring

- `components/onboarding/PackageStep.tsx` → conditional fields based on `channel_type`
- `app/book/[username]/page.tsx` → show channel-appropriate info instead of social handles
- Existing influencer packages remain valid with `channel_type = 'influencer'`

---

### PHASE 2: Sales Pipeline & Campaign Management

**Goal:** Enable sales teams to manage deals and group orders into multi-channel campaigns.

#### Database Changes

```sql
-- 2.1 Clients (authenticated or referenced)
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id),  -- nullable: client may or may not have an account
  company_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  billing_address JSONB DEFAULT '{}',
  credit_terms TEXT DEFAULT 'prepaid',  -- prepaid | net_15 | net_30 | net_60
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- 2.2 Campaigns
CREATE TABLE public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES public.clients(id) NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  start_date DATE,
  end_date DATE,
  total_budget INTEGER,    -- pesewas
  status TEXT DEFAULT 'draft',  -- draft | active | paused | completed | cancelled
  created_by UUID REFERENCES public.profiles(id) NOT NULL,
  assigned_to UUID REFERENCES public.profiles(id),  -- sales rep
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

-- 2.3 Line Items (individual ad placements within a campaign)
CREATE TABLE public.line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE NOT NULL,
  order_id UUID REFERENCES public.orders(id),  -- links to existing orders table
  ad_slot_id UUID REFERENCES public.ad_slots(id),
  channel_id UUID REFERENCES public.channels(id) NOT NULL,
  description TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  unit_price INTEGER NOT NULL,  -- pesewas
  total_price INTEGER NOT NULL,
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'pending',  -- pending | confirmed | in_production | scheduled | live | completed | cancelled
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.line_items ENABLE ROW LEVEL SECURITY;

-- 2.4 Activity Log (audit trail)
CREATE TABLE public.activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) NOT NULL,
  entity_type TEXT NOT NULL,  -- campaign | order | line_item | brief | approval
  entity_id UUID NOT NULL,
  action TEXT NOT NULL,  -- created | updated | status_changed | assigned | commented
  actor_id UUID REFERENCES public.profiles(id),
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- 2.5 Extend orders for campaign linkage
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES public.campaigns(id),
  ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id),
  ADD COLUMN IF NOT EXISTS assigned_sales_rep UUID REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS channel_id UUID REFERENCES public.channels(id);
```

#### New Routes & Components

| Route / Component | Purpose |
|------------------|---------|
| `app/dashboard/clients/page.tsx` | Client CRM list |
| `app/dashboard/clients/[id]/page.tsx` | Client detail + history |
| `app/dashboard/clients/new/page.tsx` | Add new client |
| `app/dashboard/campaigns/page.tsx` | Campaign list with filters |
| `app/dashboard/campaigns/[id]/page.tsx` | Campaign detail + line items |
| `app/dashboard/campaigns/new/page.tsx` | Create campaign wizard |
| `app/dashboard/deals/page.tsx` | Sales pipeline board (Kanban) |
| `components/dashboard/CampaignCard.tsx` | Campaign summary card |
| `components/dashboard/PipelineBoard.tsx` | Drag-and-drop Kanban view |
| `components/dashboard/LineItemTable.tsx` | Editable line items with pricing |
| `components/dashboard/ActivityTimeline.tsx` | Chronological activity log |
| `actions/clients.ts` | Client CRUD |
| `actions/campaigns.ts` | Campaign + line item management |
| `actions/activity.ts` | Activity log recording |

#### Refactoring

- `app/dashboard/orders/page.tsx` → add campaign filter, sales rep filter
- `components/dashboard/DashboardNav.tsx` → add Campaigns, Clients nav items (conditionally based on role)
- `app/dashboard/page.tsx` → role-conditional stats (sales sees pipeline, production sees queue)

---

### PHASE 3: Creative Briefs & Production Tracking

**Goal:** Structured creative briefing, assignment to production team, and task-level tracking.

#### Database Changes

```sql
-- 3.1 Creative Briefs
CREATE TABLE public.creative_briefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  line_item_id UUID REFERENCES public.line_items(id),
  order_id UUID REFERENCES public.orders(id),  -- backward compat with existing orders
  campaign_id UUID REFERENCES public.campaigns(id),
  channel_type TEXT NOT NULL,
  title TEXT NOT NULL,
  objective TEXT,
  target_audience TEXT,
  key_messages TEXT,
  deliverables JSONB DEFAULT '[]',  -- [{type, specs, quantity}]
  brand_guidelines_url TEXT,
  reference_asset_urls TEXT[] DEFAULT '{}',
  specs JSONB DEFAULT '{}',  -- channel-specific creative specs
  due_date DATE,
  status TEXT DEFAULT 'draft',  -- draft | assigned | in_production | internal_review | client_review | approved | final
  assigned_to UUID REFERENCES public.profiles(id),
  created_by UUID REFERENCES public.profiles(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.creative_briefs ENABLE ROW LEVEL SECURITY;

-- 3.2 Production Tasks
CREATE TABLE public.production_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brief_id UUID REFERENCES public.creative_briefs(id) ON DELETE CASCADE NOT NULL,
  organization_id UUID REFERENCES public.organizations(id) NOT NULL,
  title TEXT NOT NULL,
  task_type TEXT NOT NULL,  -- design | copywriting | voiceover | filming | editing | typesetting | qc
  description TEXT,
  assigned_to UUID REFERENCES public.profiles(id),
  priority TEXT DEFAULT 'medium',  -- low | medium | high | urgent
  status TEXT DEFAULT 'todo',  -- todo | in_progress | review | done | blocked
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.production_tasks ENABLE ROW LEVEL SECURITY;

-- 3.3 Creative Files (version-tracked)
CREATE TABLE public.creative_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brief_id UUID REFERENCES public.creative_briefs(id) ON DELETE CASCADE NOT NULL,
  task_id UUID REFERENCES public.production_tasks(id),
  uploaded_by UUID REFERENCES public.profiles(id) NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT,  -- image/jpeg, application/pdf, video/mp4, audio/mp3
  file_size INTEGER,
  version INTEGER DEFAULT 1,
  is_final BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.creative_files ENABLE ROW LEVEL SECURITY;

-- 3.4 New storage bucket for creatives
INSERT INTO storage.buckets (id, name, public)
VALUES ('creatives', 'creatives', false)
ON CONFLICT DO NOTHING;
```

#### New Routes & Components

| Route / Component | Purpose |
|------------------|---------|
| `app/dashboard/briefs/page.tsx` | Brief list (filterable by status, campaign, assignee) |
| `app/dashboard/briefs/[id]/page.tsx` | Brief detail + linked tasks + files |
| `app/dashboard/briefs/new/page.tsx` | Brief creation form (dynamic per channel type) |
| `app/dashboard/production/page.tsx` | Production board (Kanban of tasks) |
| `app/dashboard/production/[taskId]/page.tsx` | Task detail |
| `components/dashboard/BriefForm.tsx` | Dynamic brief form with channel-specific fields |
| `components/dashboard/ProductionBoard.tsx` | Kanban board for production tasks |
| `components/dashboard/TaskCard.tsx` | Draggable task card |
| `components/dashboard/FileGallery.tsx` | Upload, preview, version-track creative files |
| `components/dashboard/BriefStatusBadge.tsx` | Visual status indicator |
| `actions/briefs.ts` | Brief CRUD + assignment |
| `actions/production.ts` | Task CRUD + status transitions |
| `actions/files.ts` | File upload + versioning |

#### Refactoring

- Existing order `product_description` / `target_audience` / `asset_urls` mapped to auto-generated brief on order creation (backward compat)
- `components/dashboard/OrderStatusControl.tsx` → link to brief when production is involved

---

### PHASE 4: Client Approval & Scheduling

**Goal:** Enable clients to review and approve creatives; scheduling system for ad placements.

#### Database Changes

```sql
-- 4.1 Approval Requests
CREATE TABLE public.approval_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brief_id UUID REFERENCES public.creative_briefs(id) ON DELETE CASCADE NOT NULL,
  organization_id UUID REFERENCES public.organizations(id) NOT NULL,
  creative_file_id UUID REFERENCES public.creative_files(id),
  client_id UUID REFERENCES public.clients(id),
  client_email TEXT NOT NULL,
  status TEXT DEFAULT 'pending',  -- pending | approved | revision_requested | expired
  review_token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  comments TEXT,
  reviewed_at TIMESTAMPTZ,
  deadline TIMESTAMPTZ,
  created_by UUID REFERENCES public.profiles(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.approval_requests ENABLE ROW LEVEL SECURITY;

-- 4.2 Approval Comments
CREATE TABLE public.approval_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  approval_request_id UUID REFERENCES public.approval_requests(id) ON DELETE CASCADE NOT NULL,
  author_email TEXT NOT NULL,
  author_name TEXT,
  is_internal BOOLEAN DEFAULT false,  -- internal comments not visible to client
  comment TEXT NOT NULL,
  attachment_urls TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.approval_comments ENABLE ROW LEVEL SECURITY;

-- 4.3 Schedule Entries
CREATE TABLE public.schedule_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  line_item_id UUID REFERENCES public.line_items(id),
  order_id UUID REFERENCES public.orders(id),
  ad_slot_id UUID REFERENCES public.ad_slots(id) NOT NULL,
  channel_id UUID REFERENCES public.channels(id) NOT NULL,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME,  -- for broadcast
  end_date DATE,  -- for multi-day runs
  status TEXT DEFAULT 'scheduled',  -- scheduled | live | confirmed | missed | cancelled
  proof_of_run_urls TEXT[] DEFAULT '{}',  -- tear sheets, airchecks, screenshots
  confirmed_by UUID REFERENCES public.profiles(id),
  confirmed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(ad_slot_id, scheduled_date, scheduled_time)  -- prevent double-booking
);

ALTER TABLE public.schedule_entries ENABLE ROW LEVEL SECURITY;
```

#### New Routes & Components

| Route / Component | Purpose |
|------------------|---------|
| `app/review/[token]/page.tsx` | **Public** client review portal (no auth required, token-based) |
| `app/review/[token]/approve/page.tsx` | Approval confirmation |
| `app/dashboard/approvals/page.tsx` | Approval queue (pending reviews) |
| `app/dashboard/schedule/page.tsx` | Master schedule calendar |
| `app/dashboard/schedule/[date]/page.tsx` | Day view with slot details |
| `components/dashboard/ApprovalCard.tsx` | Approval request with status |
| `components/dashboard/ReviewViewer.tsx` | Creative preview for client review |
| `components/dashboard/ScheduleCalendar.tsx` | Monthly/weekly calendar view |
| `components/dashboard/ProofUpload.tsx` | Upload proof-of-run after go-live |
| `components/dashboard/ConflictAlert.tsx` | Slot conflict warning |
| `actions/approvals.ts` | Send, track, resolve approval requests |
| `actions/schedule.ts` | Schedule CRUD + conflict detection |
| `lib/email/approval.ts` | Approval request email template |

#### Refactoring

- `actions/orders.ts` → when status changes to `completed`/`live`, prompt for proof of run
- Push notification when client approves/requests revision

---

### PHASE 5: Billing & Invoicing

**Goal:** Billing tied to delivery, invoicing, and financial reporting.

#### Database Changes

```sql
-- 5.1 Invoices
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES public.clients(id) NOT NULL,
  campaign_id UUID REFERENCES public.campaigns(id),
  invoice_number TEXT UNIQUE NOT NULL,  -- auto-generated: INV-2026-0001
  status TEXT DEFAULT 'draft',  -- draft | sent | viewed | paid | overdue | cancelled | void
  subtotal INTEGER NOT NULL,  -- pesewas
  tax_amount INTEGER DEFAULT 0,
  discount_amount INTEGER DEFAULT 0,
  total INTEGER NOT NULL,
  currency TEXT DEFAULT 'GHS',
  issued_date DATE,
  due_date DATE,
  paid_date DATE,
  payment_method TEXT,  -- paystack | bank_transfer | cash | mobile_money
  payment_reference TEXT,
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- 5.2 Invoice Line Items
CREATE TABLE public.invoice_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE NOT NULL,
  line_item_id UUID REFERENCES public.line_items(id),
  order_id UUID REFERENCES public.orders(id),
  schedule_entry_id UUID REFERENCES public.schedule_entries(id),
  description TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  unit_price INTEGER NOT NULL,
  total_price INTEGER NOT NULL,
  proof_of_delivery_urls TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.invoice_line_items ENABLE ROW LEVEL SECURITY;

-- 5.3 Payment Records
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE NOT NULL,
  organization_id UUID REFERENCES public.organizations(id) NOT NULL,
  amount INTEGER NOT NULL,
  method TEXT NOT NULL,  -- paystack | bank_transfer | cash | mobile_money
  reference TEXT,
  status TEXT DEFAULT 'completed',  -- completed | pending | failed | refunded
  received_at TIMESTAMPTZ DEFAULT now(),
  recorded_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
```

#### New Routes & Components

| Route / Component | Purpose |
|------------------|---------|
| `app/dashboard/billing/page.tsx` | Invoice list with status filters |
| `app/dashboard/billing/[id]/page.tsx` | Invoice detail with line items |
| `app/dashboard/billing/new/page.tsx` | Invoice creation (auto-populate from campaign/schedule) |
| `app/dashboard/reports/page.tsx` | Revenue reports, delivery reports |
| `app/invoice/[token]/page.tsx` | **Public** client invoice view (token-based, no auth) |
| `components/dashboard/InvoiceBuilder.tsx` | Line-item editor with totals |
| `components/dashboard/InvoicePreview.tsx` | Print-ready invoice layout |
| `components/dashboard/RevenueChart.tsx` | Revenue over time chart |
| `components/dashboard/DeliveryReport.tsx` | Campaign delivery status report |
| `components/dashboard/PaymentRecorder.tsx` | Record manual payments |
| `actions/invoices.ts` | Invoice CRUD + auto-generation |
| `actions/payments.ts` | Payment recording |
| `actions/reports.ts` | Report data aggregation |
| `lib/email/invoice.ts` | Invoice email template |
| `lib/invoice-number.ts` | Sequential invoice number generator |

#### Refactoring

- Current Paystack prepaid flow remains as-is for influencer bookings
- New invoicing flow is parallel — used for post-delivery billing
- `app/dashboard/page.tsx` → add revenue/billing stats for finance role

---

## PHASE DEPENDENCY GRAPH

```
Phase 0 (Foundation)
  ├── Phase 1 (Multi-Channel) ─── depends on orgs + channels
  │     └── Phase 2 (Sales Pipeline) ─── depends on channels + inventory
  │           ├── Phase 3 (Creative & Production) ─── depends on line items + briefs
  │           │     └── Phase 4 (Approval & Scheduling) ─── depends on briefs + creative files
  │           │           └── Phase 5 (Billing) ─── depends on schedule + delivery confirmation
  │           └── Phase 5 can also start after Phase 2 for basic invoicing
```

---

## NAVIGATION STRUCTURE (Final State)

```
Dashboard (role-conditional home)
├── Overview (stats, recent activity)
├── Campaigns (Phase 2)
│   ├── Campaign List
│   ├── Campaign Detail
│   └── New Campaign
├── Orders (existing, enhanced)
│   ├── Order List (filterable by campaign, channel)
│   └── Order Detail
├── Channels & Inventory (Phase 1)
│   ├── Channel List
│   ├── Channel Detail + Slots
│   └── Rate Cards
├── Briefs & Production (Phase 3)
│   ├── Brief List
│   ├── Brief Detail + Tasks
│   └── Production Board (Kanban)
├── Approvals (Phase 4)
│   └── Pending Reviews Queue
├── Schedule (Phase 4)
│   └── Calendar View
├── Billing (Phase 5)
│   ├── Invoice List
│   ├── Invoice Detail
│   └── Reports
├── Clients (Phase 2)
│   ├── Client List
│   └── Client Detail
├── Packages (existing, enhanced with channel type)
├── Settings
│   ├── Profile
│   ├── Organization (Phase 0)
│   ├── Members & Roles (Phase 0)
│   └── Payout
└── Public Page (/book/[username]) — existing
```

**For solo influencers:** Only Overview, Orders, Packages, Settings, and Public Page are shown — preserving the current experience exactly.

---

## KEY ARCHITECTURAL DECISIONS

1. **Backward Compatibility First:** Every phase adds new tables/columns. Existing tables are never dropped or renamed in-place. `influencer_id` FKs remain working; new code uses `organization_id` scoping.

2. **Progressive Disclosure:** Navigation items appear based on `organization.type` and `member.role`. Solo influencers never see campaigns, billing, or production features.

3. **RLS Strategy:** All new tables use organization-scoped RLS:
   ```sql
   USING (organization_id IN (
     SELECT organization_id FROM organization_members
     WHERE user_id = auth.uid() AND is_active = true
   ))
   ```
   Plus role-specific write policies.

4. **JSONB for Specs:** Channel-specific metadata uses JSONB columns with TypeScript discriminated union types for type safety. This avoids creating separate tables for each channel type.

5. **Token-Based Public Access:** Client review (`/review/[token]`) and invoice viewing (`/invoice/[token]`) use cryptographic tokens instead of requiring client accounts — matching the existing anonymous client model.

6. **Activity Log:** All state transitions recorded in `activity_log` for audit trail and timeline views.

7. **Email Template Parameterization:** Replace hardcoded "influencer" language with role/channel-aware templates using a template function that accepts `{ vendorName, channelType, orgName }`.
