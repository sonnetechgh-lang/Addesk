# AdDesk - Product Overview

## Purpose
AdDesk is an influencer booking and monetization platform that enables content creators/influencers to manage ad campaigns, receive client bookings, and get paid instantly via Paystack (MTN MoMo, AT Money, Telecel Cash).

## Value Proposition
- Influencers get a custom public booking link (`addesk.io/yourname`) to share on social media
- Clients can browse packages and pay directly via Paystack inline checkout
- Payments are secured via webhook verification — no malicious callback exploits
- All campaign briefs, orders, and earnings tracked in one dashboard

## Key Features
- **Unified Dashboard** — manage packages, track briefs, monitor earnings
- **Custom Booking Link** — public profile page with ad packages for client bookings
- **Package Management** — define offerings, physical delivery requirements, revisions
- **Instant Payouts** — Paystack split payments via subaccounts to influencer bank/mobile money
- **Order Tracking** — order status management with shipment tracking
- **Notifications** — in-app notification bell for order/booking events
- **Profile Views** — track how many clients viewed the booking profile
- **Onboarding Flow** — guided setup for profile, packages, and payout details

## Target Users
- **Influencers / Content Creators** — primary users who sign up, onboard, and receive bookings
- **Clients / Advertisers** — visit public booking links, select packages, and pay

## Use Cases
- Influencer sets up profile and ad packages during onboarding
- Client visits `addesk.io/[username]`, selects a package, pays via Paystack
- Paystack webhook fires → order created in Supabase → emails sent to both parties
- Influencer manages orders, updates status, tracks shipments from dashboard
- Demo mode available at `/demo` for unauthenticated exploration

## Market Context
- Targeted at the Ghanaian market (GHS currency, MTN MoMo, AT Money, Telecel Cash)
- Developed by Sonnet Solutions
