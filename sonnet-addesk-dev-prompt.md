# Sonnet AdDesk — Developer Prompt

## Project Overview

You are building **Sonnet AdDesk**, a web application that allows social media influencers in Ghana (and eventually across Africa) to professionalize their advertisement order management. Influencers get a unique public booking page where clients can browse packages, submit a creative brief, and pay instantly. The platform takes an automatic percentage cut from every transaction via Paystack's split payment (subaccount) feature. There are no subscriptions — revenue is purely transaction-based.

---

## Tech Stack

- **Framework:** Next.js 14+ (App Router)
- **Database & Auth:** Supabase (PostgreSQL + Supabase Auth)
- **File Storage:** Supabase Storage (client asset uploads)
- **Payments:** Paystack (GHS — Ghana Cedis, subaccounts for split payments)
- **Transactional Email:** Resend
- **Hosting:** Vercel
- **Language:** TypeScript throughout

---

## Core User Roles

1. **Influencer** — Signs up, creates packages, shares their booking link, manages orders via dashboard.
2. **Client** — Visits an influencer's public booking page, fills a brief, selects a package, and pays. No account required.

---

## Database Schema

### `profiles` table
Extends Supabase `auth.users`.

```sql
id                    uuid PRIMARY KEY REFERENCES auth.users(id)
full_name             text NOT NULL
username              text UNIQUE NOT NULL  -- used in public URL: /book/[username]
email                 text NOT NULL
phone                 text
bio                   text
profile_photo_url     text
instagram_handle      text
tiktok_handle         text
twitter_handle        text
paystack_subaccount_code  text            -- set after onboarding step
is_onboarded          boolean DEFAULT false
created_at            timestamptz DEFAULT now()
```

### `packages` table

```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
influencer_id   uuid REFERENCES profiles(id) ON DELETE CASCADE
title           text NOT NULL              -- e.g. "Instagram Story", "Dedicated Post"
description     text
price           integer NOT NULL           -- stored in pesewas (GHS * 100) to avoid float issues
delivery_days   integer NOT NULL DEFAULT 3
is_active       boolean DEFAULT true
created_at      timestamptz DEFAULT now()
```

### `orders` table

```sql
id                    uuid PRIMARY KEY DEFAULT gen_random_uuid()
reference             text UNIQUE NOT NULL      -- internal order reference (e.g. SAD-XXXXXX)
client_name           text NOT NULL
client_email          text NOT NULL
client_phone          text
client_business_name  text NOT NULL
product_description   text NOT NULL
target_audience       text
preferred_dates       text
asset_urls            text[]                    -- Supabase Storage URLs
influencer_id         uuid REFERENCES profiles(id)
package_id            uuid REFERENCES packages(id)
amount                integer NOT NULL          -- total in pesewas
platform_fee          integer NOT NULL          -- your cut in pesewas
influencer_amount     integer NOT NULL          -- influencer's share in pesewas
paystack_reference    text                      -- Paystack transaction reference
payment_status        text DEFAULT 'pending'    -- pending | paid | failed
order_status          text DEFAULT 'new'        -- new | in_progress | submitted | live | completed | cancelled
notes                 text                      -- influencer's internal notes
created_at            timestamptz DEFAULT now()
updated_at            timestamptz DEFAULT now()
```

---

## URL Structure

```
/                                     Landing page
/signup                               Influencer signup
/login                                Influencer login
/dashboard                            Order overview (protected)
/dashboard/orders/[id]                Single order detail (protected)
/dashboard/packages                   Manage packages (protected)
/dashboard/settings                   Profile & payout settings (protected)
/book/[username]                      Public influencer profile & packages
/book/[username]/[packageId]          Booking form + Paystack payment
/order/confirm/[reference]            Client order confirmation page
```

---

## Feature Specifications

### 1. Influencer Onboarding Flow

- Signup with email + password via Supabase Auth
- Email verification required before proceeding
- After verification, redirect to a multi-step onboarding:
  1. **Profile setup** — name, username (check uniqueness in real time), bio, photo upload, social handles
  2. **Create first package** — at least one package required to complete onboarding
  3. **Connect payout** — create a Paystack subaccount using the influencer's bank details (bank name, account number); store returned `subaccount_code` in `profiles`
- Set `is_onboarded = true` on completion
- Any dashboard visit while `is_onboarded = false` should redirect to the onboarding flow at the correct step

### 2. Public Booking Page (`/book/[username]`)

- Fully public — no login required for clients
- Display influencer's photo, name, bio, and social handles
- List all active packages with title, description, price (in GHS), and delivery time
- Each package has a "Book Now" button leading to the booking form
- If influencer has not completed onboarding or has no active packages, show a friendly "not available" state

### 3. Booking Form (`/book/[username]/[packageId]`)

- Fields:
  - Full name (required)
  - Email address (required)
  - Phone number
  - Business/brand name (required)
  - Product or service description (required)
  - Target audience
  - Preferred campaign dates
  - Upload brand assets (images, logos) — multiple files, stored in Supabase Storage under `orders/[reference]/`
- On submit, initialize a Paystack payment popup with:
  - Amount = package price (full amount paid by client)
  - Subaccount = influencer's `paystack_subaccount_code`
  - Bearer = `subaccount` (influencer bears transaction fees) OR `account` depending on business decision
  - Platform fee charged as percentage via Paystack's `transaction_charge` or `percentage_charge` on the subaccount configuration
  - Metadata: `{ order_reference, influencer_id, package_id }`
- Do **not** create the order in the database until payment is confirmed via webhook

### 4. Paystack Webhook (`/api/webhooks/paystack`)

- Listen for `charge.success` event
- Verify webhook signature using `x-paystack-signature` header and your Paystack secret key (HMAC SHA512)
- On valid `charge.success`:
  1. Extract metadata (`order_reference`, `influencer_id`, `package_id`)
  2. Create the order record in Supabase with `payment_status = 'paid'` and `order_status = 'new'`
  3. Send confirmation email to client via Resend
  4. Send new order notification email to influencer via Resend
- Return `200 OK` immediately to Paystack regardless of internal processing to prevent retries; handle errors internally
- **Never rely on the frontend Paystack callback to create orders — always use the webhook**

### 5. Influencer Dashboard (`/dashboard`)

- Protected route — redirect to `/login` if no session
- Overview stats: total orders, pending orders, total revenue (GHS)
- Order list showing: client name, package, amount, order status, date
- Filter by order status
- Click any order to open the detail view

### 6. Order Detail View (`/dashboard/orders/[id]`)

- Show full client brief (all form fields)
- Show uploaded assets with download links
- Show payment status and amounts (total, your cut, influencer's share)
- Status update dropdown (new → in_progress → submitted → live → completed)
- Internal notes field (auto-saved)
- Client contact info (email, phone) for direct communication

### 7. Package Management (`/dashboard/packages`)

- List all packages with active/inactive toggle
- Create new package
- Edit existing package (note: editing price does not affect already-paid orders)
- Delete package (only if no orders linked; otherwise just deactivate)

### 8. Settings (`/dashboard/settings`)

- Update profile info and photo
- Update social handles
- View connected Paystack subaccount details
- Update bank account (creates new subaccount or updates existing)

### 9. Client Confirmation Page (`/order/confirm/[reference]`)

- Public page, no login required
- Show order reference, package booked, business name, and payment confirmation
- Show estimated delivery date based on `delivery_days`
- Friendly message with influencer contact info

---

## Email Notifications (via Resend)

### To Client — Order Confirmed
- Subject: `Your ad order has been confirmed — [Order Reference]`
- Body: order reference, package name, influencer name, brief summary, estimated delivery, link to confirmation page

### To Influencer — New Order Received
- Subject: `New ad order from [Client Business Name]`
- Body: client name, business name, package, amount earned (after platform fee), brief summary, link to dashboard order detail

---

## Platform Fee Logic

- Platform takes **6%** of every transaction (adjust as needed)
- Configured at the Paystack subaccount level using `percentage_charge`
- At order creation, calculate and store:
  ```
  platform_fee = round(amount * 0.06)
  influencer_amount = amount - platform_fee
  ```
- Display both values clearly in the dashboard for transparency

---

## File/Folder Structure

```
/app
  /page.tsx                              Landing page
  /signup/page.tsx
  /login/page.tsx
  /dashboard
    /page.tsx                            Orders overview
    /orders/[id]/page.tsx                Order detail
    /packages/page.tsx                   Package management
    /settings/page.tsx
  /book
    /[username]/page.tsx                 Public profile
    /[username]/[packageId]/page.tsx     Booking form
  /order
    /confirm/[reference]/page.tsx        Confirmation page
  /api
    /webhooks/paystack/route.ts          Paystack webhook handler
    /onboarding/subaccount/route.ts      Create Paystack subaccount

/components
  /dashboard/
    OrderList.tsx
    OrderCard.tsx
    StatsBar.tsx
  /booking/
    PackageCard.tsx
    BookingForm.tsx
    PaystackButton.tsx
  /onboarding/
    ProfileStep.tsx
    PackageStep.tsx
    PayoutStep.tsx
  /ui/                                   Shared UI components

/lib
  /supabase/
    client.ts                            Browser client
    server.ts                            Server client
    middleware.ts
  /paystack/
    client.ts                            API helpers
    webhook.ts                           Signature verification
    subaccount.ts                        Subaccount creation
  /email/
    resend.ts
    templates/
      orderConfirmed.tsx                 Client email template
      newOrder.tsx                       Influencer email template

/actions                                 Next.js server actions
  onboarding.ts
  packages.ts
  orders.ts
```

---

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Paystack
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=
PAYSTACK_SECRET_KEY=
PAYSTACK_WEBHOOK_SECRET=
PLATFORM_PERCENTAGE_CHARGE=6

# Resend
RESEND_API_KEY=
EMAIL_FROM=noreply@sonnetaddesk.com

# App
NEXT_PUBLIC_APP_URL=https://sonnetaddesk.com
```

---

## Build Order (Recommended Sequence)

1. Supabase project setup — tables, RLS policies, storage buckets
2. Auth — signup, login, session middleware, protected routes
3. Influencer onboarding — profile, first package, Paystack subaccount creation
4. Package management CRUD
5. Public booking page (`/book/[username]`)
6. Booking form with Supabase Storage asset uploads
7. Paystack payment integration on booking form
8. Paystack webhook handler — order creation + email triggers
9. Resend email templates and delivery
10. Dashboard — order list, stats, status updates
11. Order detail view
12. Client confirmation page
13. Settings page
14. Landing page (last)

---

## Security & Reliability Rules

- Always verify Paystack webhook signatures — reject any request with an invalid signature
- Never create orders from the frontend payment callback — only from the verified webhook
- Apply Supabase Row Level Security (RLS) so influencers can only read/write their own data
- Store all monetary values as integers in pesewas (1 GHS = 100 pesewas) — never use floats for money
- Sanitize and validate all user inputs server-side using Zod or similar
- Use Next.js server actions for all database mutations — avoid direct client-side Supabase calls for sensitive operations
- Uploaded files must be validated for type (images only) and size (max 10MB per file) before upload

---

## MVP Scope (Do Not Over-Build)

The MVP includes exactly:
- Influencer auth and onboarding
- Package creation and management
- Public booking page and form
- Paystack payment with split
- Webhook-driven order creation
- Email notifications
- Dashboard with order list and status updates
- Client confirmation page

**Defer to v2:** client messaging/revision threads, content calendar, analytics dashboard, agency multi-profile tier, mobile app.

---

*Sonnet AdDesk — Built for African creators. Powered by simplicity.*
