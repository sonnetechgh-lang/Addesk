# Development Approach: Sonnet AdDesk

## 1. Architectural Philosophy

- **Component-Driven UI**: Utilize React Server Components alongside localized Client Components to optimize load times and simplify the data-fetching paradigm.
- **Type Safety Foundation**: Strongly typed boundaries via TypeScript to minimize runtime errors, particularly across external boundaries (Supabase, Paystack, Resend).
- **Security First**: Row Level Security (RLS) on all Supabase tables. Webhooks from Stripe/Paystack must be cryptographically verified before processing.
- **Fail-Safe Transactions**: Defer order creation in the database until _after_ verified confirmation from the payment provider (Paystack Webhook).

## 2. Phase-by-Phase Execution

- **Phase 1: Skeleton & Scaffolding**: Setup Next.js, ESLint, Prettier, Tailwind CSS, and essential directories (`/lib`, `/components`, `/app`, `/actions`).
- **Phase 2: Data Layer (Supabase)**: Define schema and generate DB types. Setup `lib/supabase` helper methods and middleware for session persistence.
- **Phase 3: Core Features - Backend Actions**: Server Actions for authentication, package CRUD, and handling onboarding steps.
- **Phase 4: Frontend Development (Dashboard)**: Build the influencer Dashboard, settings UI, and package management UI using modern UI primitives to keep it accessible and clean.
- **Phase 5: Public Experience**: Create the public `/book/[username]` pages. Optimize for zero-friction conversion for clients.
- **Phase 6: Integrations**: Integrate Paystack form + Webhook for split payments. Wire Resend to send transactional emails upon webhook confirmation.

## 3. Code Maintainability

- Break UI into small reusable pieces (e.g., `OrderCard`, `StatsBar`).
- Separate business logic (inside `actions/` and `lib/`) from presentation logic (inside `components/` and `app/`).
- Document utility methods and data structures clearly.
