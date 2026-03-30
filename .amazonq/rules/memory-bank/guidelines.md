# AdDesk - Development Guidelines

## Code Quality Standards

### TypeScript
- Strict TypeScript throughout — no `any` except when casting Supabase join results (e.g., `(order as any).packages?.title`)
- Use `type` imports: `import type { Metadata } from "next"`
- Define Zod schemas before server actions; use `safeParse` for validation
- Export named interfaces alongside components: `export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>`

### File Directives
- Client Components must start with `'use client'` as the very first line
- Server Actions must start with `'use server'` as the very first line
- No directive = Server Component (default in App Router)

### Naming Conventions
- Components: PascalCase (`DashboardNav`, `ProfileViewTracker`)
- Server Actions: camelCase verbs (`updateOrderStatus`, `createPackage`, `recordProfileView`)
- Files: PascalCase for components, camelCase for lib/actions/hooks
- Database columns: snake_case; TypeScript props: camelCase (map explicitly)
- CSS variables: kebab-case with semantic prefixes (`--font-fraunces`, `brand-success`, `text-primary`)

## Architectural Patterns

### Server Actions Pattern
All mutations follow this exact structure:
```ts
'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function actionName(input: InputType) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // validate → query → mutate → revalidate
  revalidatePath('/affected/path')
  return { success: true }
}
```

### Return Type Convention
Server Actions always return `{ error: string }` or `{ success: true, ...data }` — never throw.

### Zod Validation in Actions
```ts
const schema = z.object({ field: z.string().min(2) })
const validated = schema.safeParse(rawData)
if (!validated.success) {
  return { error: 'Invalid fields', details: validated.error.flatten().fieldErrors }
}
```

### Supabase Client Selection
| Context | Client to use |
|---|---|
| Server Component / Server Action | `createClient()` from `@/lib/supabase/server` |
| Client Component | `createClient()` from `@/lib/supabase/client` |
| Webhook / Admin bypass RLS | `createAdminClient()` from `@/lib/supabase/admin` |
| Middleware | `createServerClient` directly from `@supabase/ssr` |

### Route Protection
Handled entirely in `proxy.ts` (the middleware entry point) via `updateSession()`:
- Protected: `/dashboard/*`, `/onboarding/*`
- Auth-only: `/login`, `/signup` (redirect to `/dashboard` if logged in)

### One-Time Effect Pattern (Client Components)
Use `useRef` to prevent double-firing in React 19 Strict Mode:
```ts
const tracked = useRef(false)
useEffect(() => {
  if (tracked.current) return
  tracked.current = true
  doSideEffect()
}, [dep])
```

## UI Component Patterns

### cn() Utility
Always use `cn()` from `@/lib/utils` for conditional Tailwind classes:
```ts
import { cn } from '@/lib/utils'
className={cn('base-classes', condition && 'conditional-class', className)}
```

### CVA for Variants
UI primitives use `class-variance-authority`:
```ts
const variants = cva('base', { variants: { variant: {}, size: {} }, defaultVariants: {} })
```
Button variants available: `default`, `primary`, `success`, `destructive`, `outline`, `secondary`, `tertiary`, `ghost`, `link`, `dark`, `soft-primary`, `soft-success`
Button sizes: `default`, `sm`, `md`, `lg`, `xl`, `icon`, `icon-sm`, `icon-lg`

### Radix UI Slot Pattern
Components support `asChild` prop via `@radix-ui/react-slot` for polymorphic rendering:
```tsx
const Comp = asChild ? Slot : 'button'
return <Comp ref={ref} {...props} />
```

### isLoading State
Button component has built-in `isLoading` prop that shows a spinner and disables the button.

## Styling Conventions

### Design Token System (Tailwind CSS v4)
Use semantic color tokens, never raw colors:
- Backgrounds: `bg-surface-card`, `bg-surface-light`
- Text: `text-text-primary`, `text-text-secondary`, `text-text-muted`, `text-text-tertiary`
- Brand: `text-brand-success`, `bg-brand-success`, `text-brand-secondary`, `text-brand-accent`
- Borders: `border-border`
- Status: `text-success`, `text-warning`, `text-error`
- Shadows: `shadow-elevation-low`, `shadow-elevation-medium`, `shadow-elevation-high`

### Border Radius Conventions
- Cards/containers: `rounded-3xl` or `rounded-2xl`
- Buttons/inputs: `rounded-xl` (default), `rounded-lg` (sm/md)
- Icons/badges: `rounded-lg` or `rounded-full`

### Animation Classes
- Entry animations: `animate-fade-in-up`, `animate-slide-in-left`, `animate-slide-in-right`
- Use `style={{ animationDelay: '0.Xs' }}` for staggered animations
- Hover transitions: `transition-all duration-300` or `duration-150` for nav items

### Responsive Patterns
- Mobile-first with `lg:` breakpoint for desktop sidebar/nav
- Mobile nav: fixed bottom bar (`MobileNav` component)
- Desktop nav: sidebar (`DashboardNav` component)
- Hide decorative elements on mobile: `hidden lg:block`

## Data & Currency
- Prices stored in **pesewas** (integer) in the database: `Math.round(ghsValue * 100)`
- Display in GHS: divide by 100 and format with `GHS` prefix
- Currency: Ghanaian Cedi (GHS), payment via MTN MoMo / AT Money / Telecel Cash

## Security Practices
- Never trust client-side payment callbacks — always use Paystack webhook to create orders
- Use Supabase RLS for all user-scoped queries; admin client only in webhook handlers
- Security headers set globally in `next.config.ts` (X-Frame-Options DENY, nosniff, etc.)
- Validate all form inputs with Zod before any database operation
- Always verify `user` from `supabase.auth.getUser()` before mutations

## Path Aliases
Use `@/` for all internal imports (configured in `tsconfig.json`):
```ts
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
```

## Revalidation Strategy
After mutations, call `revalidatePath()` for all affected routes:
```ts
revalidatePath('/dashboard')
revalidatePath('/dashboard/orders')
revalidatePath(`/dashboard/orders/${id}`)
```
