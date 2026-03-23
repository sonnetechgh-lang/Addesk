# Sonnet AdDesk Project Documentation

## Tech Stack Overview

- **Frontend / Framework**: Next.js 14+ (App Router)
- **Database, Auth & Storage**: Supabase (PostgreSQL + Supabase Storage for Assets/Avatars)
- **Payments**: Paystack (with split payments via subaccounts)
- **Email**: Resend
- **Styling**: Tailwind CSS + Shadcn UI (or similar Tailwind components)
- **Language**: TypeScript

## Directory Structure

- `/app`: Next.js App Router (Pages, Layouts, API Routes). Includes `/onboarding` for the critical profile/bank setup flow.
- `/components`: Reusable frontend UI components. Organized into context-specific directories: `dashboard`, `booking`, `onboarding`, and a general `ui` folder.
- `/lib`: Helper libraries for setting up and calling third-party integrations (`supabase`, `paystack`, `email`, `config` for env validation).
- `/actions`: Next.js Server Actions handling asynchronous server-side database mutations.
- `/supabase`: Contains initial SQL schema creation commands, storage buckets, and eventually migrations.

## Integration Details

### Supabase

- Handles user Authentication.
- `profiles` table automatically maps to the default `auth.users` entity.
- Row Level Security (RLS) policies are configured to ensure data privacy between different influencers.
- Supabase Storage powers client asset uploads (`orders` bucket) and profile photos (`avatars` bucket).

### Paystack

- Utilizes the Subaccount API infrastructure to facilitate split payments.
- When an influencer onboards at `/api/onboarding/subaccount`, their account logic calls the Paystack Resolve API to verify the number.
- Verified accounts yield a `.paystack_subaccount_code` which is saved to the `profiles` table.
- Clients check out from the public link using an inline popup initialized via frontend triggers.
- Crucially, we rely wholly on a Webhook Endpoint (`/api/webhooks/paystack`) to finalize and create the order in Supabase — preventing malicious callbacks.

### Resend

- Responsible for transactional emails.
- Triggered asynchronously upon webhook finalization to notify both the Influencer and the Client of successful engagements.
