# MotoTrack Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full-stack Next.js PWA for tracking motorcycle operating hours and service intervals, connected to Supabase and deployed on Vercel.

**Architecture:** Next.js 16.2.6 App Router with Supabase SSR auth via middleware. Authenticated routes live under the `(app)` route group with a shared Bottom Tab Bar layout. Server Components fetch data directly from Supabase; Client Components handle forms and interactivity via Server Actions.

**Tech Stack:** Next.js 16.2.6, TypeScript, Tailwind CSS 4, `@supabase/supabase-js`, `@supabase/ssr`, Vitest (for calculations tests)

---

## File Map

```
src/mototrack/
├── .env.local                          ← credentials (new)
├── middleware.ts                        ← auth guard (new)
├── vitest.config.ts                    ← test config (new)
├── next.config.ts                      ← update for PWA manifest
├── app/
│   ├── layout.tsx                      ← root layout, no BottomNav (modify)
│   ├── page.tsx                        ← redirect → /dashboard (modify)
│   ├── globals.css                     ← dark theme vars (modify)
│   ├── login/
│   │   ├── page.tsx                    ← email/password form (new)
│   │   └── actions.ts                  ← server actions: login, signup (new)
│   ├── (app)/                          ← route group: auth + BottomNav layout
│   │   ├── layout.tsx                  ← BottomNav wrapper (new)
│   │   ├── dashboard/
│   │   │   └── page.tsx               ← bike list (new)
│   │   ├── bikes/
│   │   │   ├── new/
│   │   │   │   ├── page.tsx           ← bike form (new)
│   │   │   │   └── actions.ts         ← server action: createBike (new)
│   │   │   └── [id]/
│   │   │       ├── page.tsx           ← bike detail + service intervals (new)
│   │   │       └── settings/
│   │   │           ├── page.tsx       ← edit intervals + show API key (new)
│   │   │           └── actions.ts     ← server actions: CRUD intervals (new)
│   │   ├── service/
│   │   │   └── new/
│   │   │       ├── page.tsx           ← log a service (new)
│   │   │       └── actions.ts         ← server action: createServiceLog (new)
│   │   └── account/
│   │       ├── page.tsx               ← user info + logout (new)
│   │       └── LogoutButton.tsx       ← client logout component (new)
│   └── api/
│       └── update-hours/
│           └── route.ts               ← ESP32 endpoint (new)
├── components/
│   ├── BottomNav.tsx                   ← tab bar (new)
│   ├── BikeCard.tsx                    ← dashboard card (new)
│   ├── ServiceBadge.tsx               ← ok/soon/overdue badge (new)
│   ├── ServiceInterval.tsx            ← progress bar row (new)
│   └── ServiceHistory.tsx             ← past service list (new)
├── lib/
│   ├── types.ts                        ← shared TypeScript types (new)
│   ├── calculations.ts                 ← service status logic (new)
│   ├── __tests__/
│   │   └── calculations.test.ts       ← vitest unit tests (new)
│   └── supabase/
│       ├── client.ts                   ← browser client (new)
│       └── server.ts                   ← server client (new)
└── public/
    └── manifest.json                   ← PWA manifest (new)
```

---

## Task 1: Install Dependencies + Environment

**Files:**
- Modify: `package.json`
- Create: `.env.local`
- Create: `vitest.config.ts`

- [ ] **Step 1: Install Supabase + Vitest packages**

In `src/mototrack/`:
```bash
npm install @supabase/supabase-js @supabase/ssr
npm install -D vitest
```

- [ ] **Step 2: Add test script to package.json**

In `package.json`, add to `"scripts"`:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 3: Create vitest.config.ts**

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
  },
})
```

- [ ] **Step 4: Create .env.local**

```env
NEXT_PUBLIC_SUPABASE_URL=https://gklqyvzzxubpznwaqees.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_Aw-zubi2rg3k0iaUrG1OdA_HYJbJ1K9
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdrbHF5dnp6eHVicHpud2FxZWVzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODc2NTM0MCwiZXhwIjoyMDk0MzQxMzQwfQ.PEHpklTcV-CmcU6BvpugX_bR5UJ8GOuS1mEUdpT-Kw4
```

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json vitest.config.ts
git commit -m "chore: install supabase + vitest dependencies"
```

---

## Task 2: TypeScript Types

**Files:**
- Create: `lib/types.ts`

- [ ] **Step 1: Create shared types**

```typescript
// lib/types.ts
export interface Bike {
  id: string
  user_id: string
  name: string
  make: string | null
  model: string | null
  year: number | null
  total_hours: number
  api_key: string
  created_at: string
}

export interface ServiceInterval {
  id: string
  bike_id: string
  name: string
  interval_hours: number
  created_at: string
}

export interface ServiceLog {
  id: string
  bike_id: string
  interval_id: string | null
  service_name: string
  hours_at_service: number
  date: string
  notes: string | null
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/types.ts
git commit -m "feat: add shared TypeScript types"
```

---

## Task 3: Supabase Clients

**Files:**
- Create: `lib/supabase/client.ts`
- Create: `lib/supabase/server.ts`

- [ ] **Step 1: Create browser client**

```typescript
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )
}
```

- [ ] **Step 2: Create server client**

```typescript
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component — cookies are read-only here
          }
        },
      },
    }
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add lib/supabase/client.ts lib/supabase/server.ts
git commit -m "feat: add Supabase SSR clients"
```

---

## Task 4: Calculations Library (TDD)

**Files:**
- Create: `lib/__tests__/calculations.test.ts`
- Create: `lib/calculations.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// lib/__tests__/calculations.test.ts
import { describe, it, expect } from 'vitest'
import { calculateServiceStatus, getServiceStatuses, getWorstStatus } from '../calculations'

describe('calculateServiceStatus', () => {
  it('returns ok when less than 80% of interval reached', () => {
    // Intervall 40h, letzter Service bei 0h, aktuell 30h → 75%
    const result = calculateServiceStatus('Ölwechsel', 40, 0, 30)
    expect(result.status).toBe('ok')
    expect(result.percentageDue).toBe(75)
    expect(result.hoursUntilNext).toBe(10)
    expect(result.hoursOverdue).toBe(0)
  })

  it('returns soon when 80–100% of interval reached', () => {
    // Intervall 40h, letzter Service bei 10h, aktuell 42h → 80%
    const result = calculateServiceStatus('Ölwechsel', 40, 10, 42)
    expect(result.status).toBe('soon')
    expect(result.percentageDue).toBe(80)
    expect(result.hoursUntilNext).toBe(8)
    expect(result.hoursOverdue).toBe(0)
  })

  it('returns overdue when over 100% of interval reached', () => {
    // Aus CLAUDE.md: Intervall 40h, letzter bei 10h, aktuell 55h → 112.5%
    const result = calculateServiceStatus('Ölwechsel', 40, 10, 55)
    expect(result.status).toBe('overdue')
    expect(result.percentageDue).toBe(112.5)
    expect(result.hoursOverdue).toBe(5)
    expect(result.hoursUntilNext).toBe(-5)
  })

  it('returns exactly ok at 79.9%', () => {
    const result = calculateServiceStatus('Test', 100, 0, 79.9)
    expect(result.status).toBe('ok')
  })

  it('returns exactly soon at 80%', () => {
    const result = calculateServiceStatus('Test', 100, 0, 80)
    expect(result.status).toBe('soon')
  })

  it('returns exactly overdue at 100%', () => {
    const result = calculateServiceStatus('Test', 100, 0, 100)
    expect(result.status).toBe('overdue')
  })
})

describe('getWorstStatus', () => {
  it('returns overdue if any status is overdue', () => {
    const statuses = [
      { status: 'ok' as const, name: '', intervalHours: 0, lastServiceHours: 0, currentHours: 0, hoursUntilNext: 0, hoursOverdue: 0, percentageDue: 0 },
      { status: 'overdue' as const, name: '', intervalHours: 0, lastServiceHours: 0, currentHours: 0, hoursUntilNext: 0, hoursOverdue: 0, percentageDue: 0 },
    ]
    expect(getWorstStatus(statuses)).toBe('overdue')
  })

  it('returns soon if any is soon and none overdue', () => {
    const statuses = [
      { status: 'ok' as const, name: '', intervalHours: 0, lastServiceHours: 0, currentHours: 0, hoursUntilNext: 0, hoursOverdue: 0, percentageDue: 0 },
      { status: 'soon' as const, name: '', intervalHours: 0, lastServiceHours: 0, currentHours: 0, hoursUntilNext: 0, hoursOverdue: 0, percentageDue: 0 },
    ]
    expect(getWorstStatus(statuses)).toBe('soon')
  })

  it('returns ok if all are ok', () => {
    const statuses = [
      { status: 'ok' as const, name: '', intervalHours: 0, lastServiceHours: 0, currentHours: 0, hoursUntilNext: 0, hoursOverdue: 0, percentageDue: 0 },
    ]
    expect(getWorstStatus(statuses)).toBe('ok')
  })

  it('returns ok for empty array', () => {
    expect(getWorstStatus([])).toBe('ok')
  })
})

describe('getServiceStatuses', () => {
  it('uses 0 as last service hours when no log entry exists for an interval', () => {
    const intervals = [{ id: 'a', name: 'Ölwechsel', interval_hours: 40 }]
    const logs: { interval_id: string | null; hours_at_service: number; date: string }[] = []
    const statuses = getServiceStatuses(42.5, intervals, logs)
    expect(statuses[0].lastServiceHours).toBe(0)
    expect(statuses[0].percentageDue).toBeCloseTo(106.25)
    expect(statuses[0].status).toBe('overdue')
  })

  it('uses the most recent log entry for each interval', () => {
    const intervals = [{ id: 'a', name: 'Ölwechsel', interval_hours: 40 }]
    const logs = [
      { interval_id: 'a', hours_at_service: 0, date: '2025-01-01' },
      { interval_id: 'a', hours_at_service: 40, date: '2025-06-01' }, // newer
    ]
    const statuses = getServiceStatuses(50, intervals, logs)
    expect(statuses[0].lastServiceHours).toBe(40) // uses the newer entry
    expect(statuses[0].hoursUntilNext).toBe(30)
  })
})
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
npm test
```

Expected: FAIL — "calculateServiceStatus is not a function"

- [ ] **Step 3: Implement calculations.ts**

```typescript
// lib/calculations.ts
export interface ServiceStatus {
  name: string
  intervalHours: number
  lastServiceHours: number
  currentHours: number
  hoursUntilNext: number
  hoursOverdue: number
  percentageDue: number
  status: 'ok' | 'soon' | 'overdue'
}

export function calculateServiceStatus(
  name: string,
  intervalHours: number,
  lastServiceHours: number,
  currentHours: number
): ServiceStatus {
  const hoursUntilNext = lastServiceHours + intervalHours - currentHours
  const hoursOverdue = hoursUntilNext < 0 ? Math.abs(hoursUntilNext) : 0
  const percentageDue = ((currentHours - lastServiceHours) / intervalHours) * 100
  const status: 'ok' | 'soon' | 'overdue' =
    percentageDue >= 100 ? 'overdue' : percentageDue >= 80 ? 'soon' : 'ok'
  return { name, intervalHours, lastServiceHours, currentHours, hoursUntilNext, hoursOverdue, percentageDue, status }
}

export function getWorstStatus(statuses: ServiceStatus[]): 'ok' | 'soon' | 'overdue' {
  if (statuses.some(s => s.status === 'overdue')) return 'overdue'
  if (statuses.some(s => s.status === 'soon')) return 'soon'
  return 'ok'
}

export function getServiceStatuses(
  currentHours: number,
  intervals: { id: string; name: string; interval_hours: number }[],
  logs: { interval_id: string | null; hours_at_service: number; date: string }[]
): ServiceStatus[] {
  return intervals.map((interval) => {
    const intervalLogs = logs
      .filter((l) => l.interval_id === interval.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    const lastServiceHours = intervalLogs[0]?.hours_at_service ?? 0
    return calculateServiceStatus(interval.name, interval.interval_hours, lastServiceHours, currentHours)
  })
}
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
npm test
```

Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add lib/calculations.ts lib/__tests__/calculations.test.ts
git commit -m "feat: add service interval calculation logic with tests"
```

---

## Task 5: Middleware (Auth Guard)

**Files:**
- Create: `middleware.ts` (at project root, next to `app/`)

- [ ] **Step 1: Create middleware**

```typescript
// middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const isLoginPage = request.nextUrl.pathname.startsWith('/login')

  if (!user && !isLoginPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user && isLoginPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/update-hours|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

- [ ] **Step 2: Commit**

```bash
git add middleware.ts
git commit -m "feat: add auth middleware — protect all routes except /login and /api/update-hours"
```

---

## Task 6: Root Layout, Globals, BottomNav

**Files:**
- Modify: `app/layout.tsx`
- Modify: `app/globals.css`
- Modify: `app/page.tsx`
- Create: `app/(app)/layout.tsx`
- Create: `components/BottomNav.tsx`

- [ ] **Step 1: Update globals.css**

```css
/* app/globals.css */
@import "tailwindcss";

html,
body {
  background-color: #0a0a0a;
  color: #ffffff;
}
```

- [ ] **Step 2: Update root layout**

```tsx
// app/layout.tsx
import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist-sans' })

export const metadata: Metadata = {
  title: 'MotoTrack',
  description: 'Motorrad Betriebsstunden & Service Tracker',
  manifest: '/manifest.json',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className={geist.variable}>
      <head>
        <meta name="theme-color" content="#ff6600" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="min-h-screen bg-[#0a0a0a] text-white font-[family-name:var(--font-geist-sans)]">
        {children}
      </body>
    </html>
  )
}
```

- [ ] **Step 3: Update root page.tsx (redirect)**

```tsx
// app/page.tsx
import { redirect } from 'next/navigation'

export default function RootPage() {
  redirect('/dashboard')
}
```

- [ ] **Step 4: Create BottomNav component**

```tsx
// components/BottomNav.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  { href: '/dashboard', icon: '🏍️', label: 'Bikes' },
  { href: '/bikes/new', icon: '➕', label: 'Hinzufügen' },
  { href: '/account', icon: '👤', label: 'Konto' },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#111111] border-t border-[#2a2a2a] flex z-50">
      {tabs.map((tab) => {
        const isActive =
          pathname === tab.href ||
          (tab.href !== '/dashboard' && tab.href !== '/account' && pathname.startsWith(tab.href))
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex-1 flex flex-col items-center py-2 gap-0.5 text-xs transition-colors ${
              isActive ? 'text-[#ff6600]' : 'text-[#888888] hover:text-[#aaaaaa]'
            }`}
          >
            <span className="text-xl leading-none">{tab.icon}</span>
            <span>{tab.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
```

- [ ] **Step 5: Create (app) route group layout**

```tsx
// app/(app)/layout.tsx
import BottomNav from '@/components/BottomNav'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="pb-16">
      {children}
      <BottomNav />
    </div>
  )
}
```

- [ ] **Step 6: Commit**

```bash
git add app/layout.tsx app/globals.css app/page.tsx "app/(app)/layout.tsx" components/BottomNav.tsx
git commit -m "feat: root layout, dark theme, bottom tab navigation"
```

---

## Task 7: Login Page

**Files:**
- Create: `app/login/page.tsx`
- Create: `app/login/actions.ts`

- [ ] **Step 1: Create server actions**

```typescript
// app/login/actions.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function login(formData: FormData) {
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  })
  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`)
  }
  redirect('/dashboard')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  })
  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`)
  }
  redirect('/dashboard')
}
```

- [ ] **Step 2: Create login page**

```tsx
// app/login/page.tsx
import { login, signup } from './actions'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-bold text-[#ff6600] mb-2">MotoTrack</h1>
        <p className="text-[#888] mb-8 text-sm">Betriebsstunden & Service Tracker</p>

        {error && (
          <div className="bg-red-900/30 border border-red-800 text-red-300 rounded-lg p-3 mb-4 text-sm">
            {decodeURIComponent(error)}
          </div>
        )}

        <form className="flex flex-col gap-3">
          <input
            name="email"
            type="email"
            placeholder="E-Mail"
            required
            className="bg-[#1a1a1a] border border-[#333] text-white placeholder-[#555] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#ff6600]"
          />
          <input
            name="password"
            type="password"
            placeholder="Passwort"
            required
            minLength={6}
            className="bg-[#1a1a1a] border border-[#333] text-white placeholder-[#555] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#ff6600]"
          />
          <button
            formAction={login}
            className="bg-[#ff6600] text-black font-semibold rounded-lg py-3 text-sm mt-1"
          >
            Einloggen
          </button>
          <button
            formAction={signup}
            className="bg-[#1a1a1a] border border-[#333] text-white rounded-lg py-3 text-sm"
          >
            Registrieren
          </button>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add app/login/page.tsx app/login/actions.ts
git commit -m "feat: login/signup page with Supabase SSR auth"
```

---

## Task 8: Dashboard + BikeCard + ServiceBadge

**Files:**
- Create: `components/ServiceBadge.tsx`
- Create: `components/BikeCard.tsx`
- Create: `app/(app)/dashboard/page.tsx`

- [ ] **Step 1: Create ServiceBadge component**

```tsx
// components/ServiceBadge.tsx
export default function ServiceBadge({
  status,
}: {
  status: 'ok' | 'soon' | 'overdue'
}) {
  const styles = {
    ok: 'bg-green-900/40 text-green-400 border border-green-800',
    soon: 'bg-orange-900/40 text-orange-400 border border-orange-800',
    overdue: 'bg-red-900/40 text-red-400 border border-red-800',
  }
  const labels = {
    ok: 'OK',
    soon: 'Bald fällig',
    overdue: 'Überfällig',
  }
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${styles[status]}`}>
      {labels[status]}
    </span>
  )
}
```

- [ ] **Step 2: Create BikeCard component**

```tsx
// components/BikeCard.tsx
import Link from 'next/link'
import ServiceBadge from './ServiceBadge'

interface BikeCardProps {
  id: string
  name: string
  make: string | null
  model: string | null
  totalHours: number
  worstStatus: 'ok' | 'soon' | 'overdue'
  nextServiceName?: string
}

export default function BikeCard({
  id,
  name,
  make,
  model,
  totalHours,
  worstStatus,
  nextServiceName,
}: BikeCardProps) {
  const borderColor = {
    ok: 'border-green-800',
    soon: 'border-orange-700',
    overdue: 'border-red-800',
  }[worstStatus]

  return (
    <Link href={`/bikes/${id}`}>
      <div className={`bg-[#1a1a1a] border-l-4 ${borderColor} rounded-lg p-4 flex flex-col gap-2`}>
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="font-semibold text-white text-base leading-tight">{name}</h2>
            {(make || model) && (
              <p className="text-[#888] text-xs mt-0.5">
                {[make, model].filter(Boolean).join(' ')}
              </p>
            )}
          </div>
          <ServiceBadge status={worstStatus} />
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-white">{totalHours.toFixed(1)}</span>
          <span className="text-[#888] text-sm">Stunden</span>
        </div>
        {nextServiceName && (
          <p className="text-xs text-[#888]">
            Nächster Service: <span className="text-white">{nextServiceName}</span>
          </p>
        )}
      </div>
    </Link>
  )
}
```

- [ ] **Step 3: Create dashboard page**

```tsx
// app/(app)/dashboard/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getServiceStatuses, getWorstStatus } from '@/lib/calculations'
import BikeCard from '@/components/BikeCard'
import type { ServiceLog } from '@/lib/types'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: bikes } = await supabase
    .from('bikes')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  if (!bikes || bikes.length === 0) {
    return (
      <main className="p-4">
        <h1 className="text-2xl font-bold mb-6">Meine Bikes</h1>
        <div className="text-center py-16 text-[#555]">
          <p className="text-4xl mb-4">🏍️</p>
          <p className="mb-2">Noch keine Bikes</p>
          <Link href="/bikes/new" className="text-[#ff6600] text-sm">
            Erstes Bike hinzufügen →
          </Link>
        </div>
      </main>
    )
  }

  const bikeIds = bikes.map((b) => b.id)
  const { data: intervals } = await supabase
    .from('service_intervals')
    .select('*')
    .in('bike_id', bikeIds)

  const intervalIds = (intervals ?? []).map((i) => i.id)
  const { data: logs } = intervalIds.length
    ? await supabase
        .from('service_log')
        .select('interval_id, hours_at_service, date')
        .in('interval_id', intervalIds)
    : { data: [] as ServiceLog[] }

  return (
    <main className="p-4">
      <h1 className="text-2xl font-bold mb-6">Meine Bikes</h1>
      <div className="flex flex-col gap-3">
        {bikes.map((bike) => {
          const bikeIntervals = (intervals ?? []).filter((i) => i.bike_id === bike.id)
          const bikeLogs = (logs ?? []).filter((l) =>
            bikeIntervals.some((i) => i.id === l.interval_id)
          )
          const statuses = getServiceStatuses(bike.total_hours, bikeIntervals, bikeLogs as ServiceLog[])
          const worstStatus = getWorstStatus(statuses)
          const nextService = statuses
            .filter((s) => s.status !== 'ok')
            .sort((a, b) => b.percentageDue - a.percentageDue)[0]

          return (
            <BikeCard
              key={bike.id}
              id={bike.id}
              name={bike.name}
              make={bike.make}
              model={bike.model}
              totalHours={bike.total_hours}
              worstStatus={worstStatus}
              nextServiceName={nextService?.name}
            />
          )
        })}
      </div>
    </main>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add components/ServiceBadge.tsx components/BikeCard.tsx "app/(app)/dashboard/page.tsx"
git commit -m "feat: dashboard with bike list and service status"
```

---

## Task 9: Bike anlegen

**Files:**
- Create: `app/(app)/bikes/new/page.tsx`
- Create: `app/(app)/bikes/new/actions.ts`

- [ ] **Step 1: Create server action**

```typescript
// app/(app)/bikes/new/actions.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function createBike(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const name = formData.get('name') as string
  const make = formData.get('make') as string || null
  const model = formData.get('model') as string || null
  const year = formData.get('year') ? Number(formData.get('year')) : null

  const { data: bike, error } = await supabase
    .from('bikes')
    .insert({
      user_id: user.id,
      name,
      make,
      model,
      year,
      total_hours: 0,
      api_key: crypto.randomUUID(),
    })
    .select()
    .single()

  if (error || !bike) redirect('/bikes/new?error=' + encodeURIComponent(error?.message ?? 'Fehler'))
  redirect(`/bikes/${bike.id}`)
}
```

- [ ] **Step 2: Create new bike page**

```tsx
// app/(app)/bikes/new/page.tsx
import { createBike } from './actions'

export default async function NewBikePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

  return (
    <main className="p-4">
      <h1 className="text-2xl font-bold mb-6">Neues Bike</h1>

      {error && (
        <div className="bg-red-900/30 border border-red-800 text-red-300 rounded-lg p-3 mb-4 text-sm">
          {decodeURIComponent(error)}
        </div>
      )}

      <form action={createBike} className="flex flex-col gap-3">
        <div>
          <label className="text-xs text-[#888] block mb-1">Name *</label>
          <input
            name="name"
            required
            placeholder="z.B. KTM 350 EXC-F"
            className="w-full bg-[#1a1a1a] border border-[#333] text-white placeholder-[#555] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#ff6600]"
          />
        </div>
        <div>
          <label className="text-xs text-[#888] block mb-1">Marke</label>
          <input
            name="make"
            placeholder="z.B. KTM"
            className="w-full bg-[#1a1a1a] border border-[#333] text-white placeholder-[#555] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#ff6600]"
          />
        </div>
        <div>
          <label className="text-xs text-[#888] block mb-1">Modell</label>
          <input
            name="model"
            placeholder="z.B. 350 EXC-F"
            className="w-full bg-[#1a1a1a] border border-[#333] text-white placeholder-[#555] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#ff6600]"
          />
        </div>
        <div>
          <label className="text-xs text-[#888] block mb-1">Baujahr</label>
          <input
            name="year"
            type="number"
            min="1990"
            max="2030"
            placeholder="z.B. 2023"
            className="w-full bg-[#1a1a1a] border border-[#333] text-white placeholder-[#555] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#ff6600]"
          />
        </div>
        <button
          type="submit"
          className="bg-[#ff6600] text-black font-semibold rounded-lg py-3 text-sm mt-2"
        >
          Bike anlegen
        </button>
      </form>
    </main>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add "app/(app)/bikes/new/page.tsx" "app/(app)/bikes/new/actions.ts"
git commit -m "feat: new bike form with server action and UUID api_key"
```

---

## Task 10: Bike-Detail Page

**Files:**
- Create: `components/ServiceInterval.tsx`
- Create: `app/(app)/bikes/[id]/page.tsx`

- [ ] **Step 1: Create ServiceInterval component**

```tsx
// components/ServiceInterval.tsx
import type { ServiceStatus } from '@/lib/calculations'

export default function ServiceInterval({ status }: { status: ServiceStatus }) {
  const clampedPercent = Math.min(status.percentageDue, 100)

  const barColor =
    status.status === 'overdue'
      ? 'bg-red-500'
      : status.status === 'soon'
      ? 'bg-orange-500'
      : 'bg-green-500'

  const textColor =
    status.status === 'overdue'
      ? 'text-red-400'
      : status.status === 'soon'
      ? 'text-orange-400'
      : 'text-green-400'

  return (
    <div className="bg-[#1a1a1a] rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-white">{status.name}</span>
        <span className={`text-xs font-medium ${textColor}`}>
          {status.status === 'overdue'
            ? `${status.hoursOverdue.toFixed(1)}h überfällig`
            : `noch ${status.hoursUntilNext.toFixed(1)}h`}
        </span>
      </div>
      <div className="bg-[#333] rounded-full h-2">
        <div
          className={`${barColor} h-2 rounded-full transition-all`}
          style={{ width: `${clampedPercent}%` }}
        />
      </div>
      <div className="text-xs text-[#555] mt-1.5">
        alle {status.intervalHours}h · letzter Service bei {status.lastServiceHours}h
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create bike detail page**

```tsx
// app/(app)/bikes/[id]/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { getServiceStatuses } from '@/lib/calculations'
import ServiceInterval from '@/components/ServiceInterval'
import Link from 'next/link'
import type { ServiceLog } from '@/lib/types'

export default async function BikeDetailPage(props: PageProps<'/bikes/[id]'>) {
  const { id } = await props.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: bike } = await supabase
    .from('bikes')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!bike) notFound()

  const { data: intervals } = await supabase
    .from('service_intervals')
    .select('*')
    .eq('bike_id', id)
    .order('created_at', { ascending: true })

  const { data: logs } = await supabase
    .from('service_log')
    .select('*')
    .eq('bike_id', id)
    .order('date', { ascending: false })

  const statuses = getServiceStatuses(
    bike.total_hours,
    intervals ?? [],
    (logs ?? []) as ServiceLog[]
  )

  const sortedStatuses = [...statuses].sort((a, b) => b.percentageDue - a.percentageDue)

  return (
    <main className="p-4">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h1 className="text-xl font-bold text-white">{bike.name}</h1>
          {(bike.make || bike.model) && (
            <p className="text-[#888] text-sm">{[bike.make, bike.model].filter(Boolean).join(' ')}</p>
          )}
        </div>
        <Link
          href={`/bikes/${id}/settings`}
          className="text-[#888] text-xs border border-[#333] rounded-lg px-3 py-1.5"
        >
          ⚙️ Einstellungen
        </Link>
      </div>

      <div className="bg-[#1a1a1a] rounded-xl p-5 mb-6 text-center">
        <div className="text-5xl font-bold text-white">{bike.total_hours.toFixed(1)}</div>
        <div className="text-[#888] text-sm mt-1">Betriebsstunden</div>
      </div>

      {sortedStatuses.length > 0 ? (
        <div className="flex flex-col gap-3 mb-6">
          <h2 className="text-sm font-semibold text-[#888] uppercase tracking-wide">Service-Intervalle</h2>
          {sortedStatuses.map((status) => (
            <ServiceInterval key={status.name} status={status} />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-[#555] mb-6">
          <p className="text-sm">Keine Service-Intervalle konfiguriert.</p>
          <Link href={`/bikes/${id}/settings`} className="text-[#ff6600] text-sm">
            Jetzt konfigurieren →
          </Link>
        </div>
      )}

      <Link
        href={`/service/new?bike_id=${id}`}
        className="block bg-[#ff6600] text-black text-center font-semibold rounded-lg py-3 text-sm"
      >
        + Service eintragen
      </Link>
    </main>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add components/ServiceInterval.tsx "app/(app)/bikes/[id]/page.tsx"
git commit -m "feat: bike detail page with service interval progress bars"
```

---

## Task 11: Bike Settings (Intervals + API Key)

**Files:**
- Create: `app/(app)/bikes/[id]/settings/page.tsx`
- Create: `app/(app)/bikes/[id]/settings/actions.ts`

- [ ] **Step 1: Create settings server actions**

```typescript
// app/(app)/bikes/[id]/settings/actions.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function addInterval(bikeId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const name = formData.get('name') as string
  const intervalHours = Number(formData.get('interval_hours'))

  await supabase.from('service_intervals').insert({
    bike_id: bikeId,
    name,
    interval_hours: intervalHours,
  })

  revalidatePath(`/bikes/${bikeId}/settings`)
}

export async function deleteInterval(intervalId: string, bikeId: string) {
  const supabase = await createClient()
  await supabase.from('service_intervals').delete().eq('id', intervalId)
  revalidatePath(`/bikes/${bikeId}/settings`)
}

export async function deleteBike(bikeId: string) {
  const supabase = await createClient()
  await supabase.from('bikes').delete().eq('id', bikeId)
  redirect('/dashboard')
}
```

- [ ] **Step 2: Create settings page**

```tsx
// app/(app)/bikes/[id]/settings/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { addInterval, deleteInterval, deleteBike } from './actions'
import Link from 'next/link'

export default async function BikeSettingsPage(props: PageProps<'/bikes/[id]/settings'>) {
  const { id } = await props.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: bike } = await supabase
    .from('bikes')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!bike) notFound()

  const { data: intervals } = await supabase
    .from('service_intervals')
    .select('*')
    .eq('bike_id', id)
    .order('created_at', { ascending: true })

  const addIntervalForBike = addInterval.bind(null, id)
  const deleteBikeAction = deleteBike.bind(null, id)

  return (
    <main className="p-4">
      <Link href={`/bikes/${id}`} className="text-[#ff6600] text-sm block mb-4">
        ← Zurück
      </Link>
      <h1 className="text-xl font-bold mb-6">{bike.name} — Einstellungen</h1>

      {/* API Key */}
      <section className="mb-6">
        <h2 className="text-sm font-semibold text-[#888] uppercase tracking-wide mb-2">ESP32 API Key</h2>
        <div className="bg-[#1a1a1a] rounded-lg p-3">
          <p className="text-xs text-[#888] mb-2">Diesen Key im ESP32 Code hinterlegen:</p>
          <code className="text-xs text-[#ff6600] break-all">{bike.api_key}</code>
        </div>
      </section>

      {/* Service Intervalle */}
      <section className="mb-6">
        <h2 className="text-sm font-semibold text-[#888] uppercase tracking-wide mb-2">Service-Intervalle</h2>
        <div className="flex flex-col gap-2 mb-3">
          {(intervals ?? []).map((interval) => {
            const deleteAction = deleteInterval.bind(null, interval.id, id)
            return (
              <div key={interval.id} className="bg-[#1a1a1a] rounded-lg p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm text-white">{interval.name}</p>
                  <p className="text-xs text-[#888]">alle {interval.interval_hours}h</p>
                </div>
                <form action={deleteAction}>
                  <button type="submit" className="text-red-500 text-sm px-2 py-1">
                    Löschen
                  </button>
                </form>
              </div>
            )
          })}
          {(intervals ?? []).length === 0 && (
            <p className="text-[#555] text-sm">Noch keine Intervalle</p>
          )}
        </div>

        {/* Add interval form */}
        <form action={addIntervalForBike} className="flex gap-2">
          <input
            name="name"
            required
            placeholder="z.B. Ölwechsel"
            className="flex-1 bg-[#1a1a1a] border border-[#333] text-white placeholder-[#555] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#ff6600]"
          />
          <input
            name="interval_hours"
            type="number"
            required
            min="1"
            placeholder="40"
            className="w-20 bg-[#1a1a1a] border border-[#333] text-white placeholder-[#555] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#ff6600]"
          />
          <button
            type="submit"
            className="bg-[#ff6600] text-black font-semibold rounded-lg px-3 py-2 text-sm"
          >
            +
          </button>
        </form>
        <p className="text-xs text-[#555] mt-1">Name + Stunden</p>
      </section>

      {/* Delete bike */}
      <section>
        <h2 className="text-sm font-semibold text-[#888] uppercase tracking-wide mb-2">Bike löschen</h2>
        <form action={deleteBikeAction}>
          <button
            type="submit"
            className="w-full bg-red-900/30 border border-red-800 text-red-400 rounded-lg py-2 text-sm"
            onClick={(e) => {
              if (!confirm('Bike wirklich löschen? Alle Daten werden gelöscht.')) e.preventDefault()
            }}
          >
            Bike löschen
          </button>
        </form>
      </section>
    </main>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add "app/(app)/bikes/[id]/settings/page.tsx" "app/(app)/bikes/[id]/settings/actions.ts"
git commit -m "feat: bike settings — manage service intervals and show API key"
```

---

## Task 12: Service eintragen + Service History

**Files:**
- Create: `app/(app)/service/new/page.tsx`
- Create: `app/(app)/service/new/actions.ts`
- Create: `components/ServiceHistory.tsx`
- Modify: `app/(app)/bikes/[id]/page.tsx` (add ServiceHistory at bottom)

- [ ] **Step 1: Create service log server action**

```typescript
// app/(app)/service/new/actions.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function createServiceLog(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const bikeId = formData.get('bike_id') as string
  const intervalId = formData.get('interval_id') as string || null
  const serviceName = formData.get('service_name') as string
  const hoursAtService = Number(formData.get('hours_at_service'))
  const notes = formData.get('notes') as string || null

  await supabase.from('service_log').insert({
    bike_id: bikeId,
    interval_id: intervalId,
    service_name: serviceName,
    hours_at_service: hoursAtService,
    notes,
  })

  redirect(`/bikes/${bikeId}`)
}
```

- [ ] **Step 2: Create service log page**

```tsx
// app/(app)/service/new/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { createServiceLog } from './actions'
import Link from 'next/link'

export default async function NewServicePage({
  searchParams,
}: {
  searchParams: Promise<{ bike_id?: string }>
}) {
  const { bike_id } = await searchParams
  if (!bike_id) redirect('/dashboard')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: bike } = await supabase
    .from('bikes')
    .select('*')
    .eq('id', bike_id)
    .eq('user_id', user.id)
    .single()

  if (!bike) notFound()

  const { data: intervals } = await supabase
    .from('service_intervals')
    .select('*')
    .eq('bike_id', bike_id)
    .order('created_at', { ascending: true })

  return (
    <main className="p-4">
      <Link href={`/bikes/${bike_id}`} className="text-[#ff6600] text-sm block mb-4">
        ← Zurück
      </Link>
      <h1 className="text-xl font-bold mb-1">Service eintragen</h1>
      <p className="text-[#888] text-sm mb-6">{bike.name} · {bike.total_hours.toFixed(1)}h aktuell</p>

      <form action={createServiceLog} className="flex flex-col gap-3">
        <input type="hidden" name="bike_id" value={bike_id} />
        <input
          type="hidden"
          name="hours_at_service"
          value={bike.total_hours}
        />

        <div>
          <label className="text-xs text-[#888] block mb-1">Service-Art</label>
          {(intervals ?? []).length > 0 ? (
            <select
              name="interval_id"
              onChange={(e) => {
                const selected = (intervals ?? []).find(i => i.id === e.target.value)
                const nameInput = document.querySelector<HTMLInputElement>('[name="service_name"]')
                if (nameInput && selected) nameInput.value = selected.name
              }}
              className="w-full bg-[#1a1a1a] border border-[#333] text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#ff6600]"
            >
              <option value="">Kein Intervall (freier Eintrag)</option>
              {(intervals ?? []).map((interval) => (
                <option key={interval.id} value={interval.id}>
                  {interval.name} (alle {interval.interval_hours}h)
                </option>
              ))}
            </select>
          ) : null}
        </div>

        <div>
          <label className="text-xs text-[#888] block mb-1">Bezeichnung *</label>
          <input
            name="service_name"
            required
            placeholder="z.B. Ölwechsel"
            className="w-full bg-[#1a1a1a] border border-[#333] text-white placeholder-[#555] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#ff6600]"
          />
        </div>

        <div>
          <label className="text-xs text-[#888] block mb-1">Stunden bei Service</label>
          <div className="bg-[#1a1a1a] border border-[#333] rounded-lg px-4 py-3 text-sm text-[#888]">
            {bike.total_hours.toFixed(1)}h (aktuelle Stunden)
          </div>
        </div>

        <div>
          <label className="text-xs text-[#888] block mb-1">Notizen (optional)</label>
          <textarea
            name="notes"
            rows={3}
            placeholder="z.B. Motorex 10W-50, Filterwechsel ebenfalls..."
            className="w-full bg-[#1a1a1a] border border-[#333] text-white placeholder-[#555] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#ff6600] resize-none"
          />
        </div>

        <button
          type="submit"
          className="bg-[#ff6600] text-black font-semibold rounded-lg py-3 text-sm mt-2"
        >
          Service speichern
        </button>
      </form>
    </main>
  )
}
```

- [ ] **Step 3: Create ServiceHistory component**

```tsx
// components/ServiceHistory.tsx
import type { ServiceLog } from '@/lib/types'

export default function ServiceHistory({ logs }: { logs: ServiceLog[] }) {
  if (logs.length === 0) return null

  return (
    <div className="mt-6">
      <h2 className="text-sm font-semibold text-[#888] uppercase tracking-wide mb-3">Service-Historie</h2>
      <div className="flex flex-col gap-2">
        {logs.map((log) => (
          <div key={log.id} className="bg-[#1a1a1a] rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-white">{log.service_name}</span>
              <span className="text-xs text-[#888]">{log.hours_at_service.toFixed(1)}h</span>
            </div>
            <p className="text-xs text-[#555] mt-0.5">
              {new Date(log.date).toLocaleDateString('de-AT', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              })}
            </p>
            {log.notes && <p className="text-xs text-[#888] mt-1">{log.notes}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Add ServiceHistory to bike detail page**

In `app/(app)/bikes/[id]/page.tsx`, add the import and render at the bottom (before closing `<main>`):

```tsx
// Add import at top:
import ServiceHistory from '@/components/ServiceHistory'

// Add before closing </main> tag (after the "Service eintragen" button):
{logs && logs.length > 0 && (
  <ServiceHistory logs={logs as ServiceLog[]} />
)}
```

- [ ] **Step 5: Commit**

```bash
git add "app/(app)/service/new/page.tsx" "app/(app)/service/new/actions.ts" components/ServiceHistory.tsx "app/(app)/bikes/[id]/page.tsx"
git commit -m "feat: service log form and history display"
```

---

## Task 13: Account Page

**Files:**
- Create: `app/(app)/account/page.tsx`
- Create: `app/(app)/account/LogoutButton.tsx`

- [ ] **Step 1: Create LogoutButton (Client Component)**

```tsx
// app/(app)/account/LogoutButton.tsx
'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LogoutButton() {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <button
      onClick={handleLogout}
      className="w-full bg-red-900/30 border border-red-800 text-red-400 rounded-lg py-3 text-sm mt-6"
    >
      Abmelden
    </button>
  )
}
```

- [ ] **Step 2: Create account page**

```tsx
// app/(app)/account/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LogoutButton from './LogoutButton'

export default async function AccountPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <main className="p-4">
      <h1 className="text-2xl font-bold mb-6">Konto</h1>
      <div className="bg-[#1a1a1a] rounded-lg p-4">
        <p className="text-xs text-[#888] mb-1">Angemeldet als</p>
        <p className="text-white text-sm">{user.email}</p>
      </div>
      <LogoutButton />
    </main>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add "app/(app)/account/page.tsx" "app/(app)/account/LogoutButton.tsx"
git commit -m "feat: account page with logout"
```

---

## Task 14: ESP32 API Endpoint

**Files:**
- Create: `app/api/update-hours/route.ts`

- [ ] **Step 1: Create the route handler**

```typescript
// app/api/update-hours/route.ts
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ success: false, error: 'Invalid JSON' }, { status: 400 })
  }

  const { api_key, total_hours } = body as { api_key?: string; total_hours?: number }

  if (!api_key || typeof total_hours !== 'number') {
    return Response.json({ success: false, error: 'api_key and total_hours required' }, { status: 400 })
  }

  const { data: bike, error: bikeError } = await supabase
    .from('bikes')
    .select('id, total_hours')
    .eq('api_key', api_key)
    .single()

  if (bikeError || !bike) {
    return Response.json({ success: false, error: 'Invalid api_key' }, { status: 401 })
  }

  if (total_hours <= bike.total_hours) {
    return Response.json({ success: true, bike_id: bike.id, hours_updated: bike.total_hours })
  }

  const [{ error: updateError }] = await Promise.all([
    supabase.from('bikes').update({ total_hours }).eq('id', bike.id),
    supabase.from('hour_sessions').insert({ bike_id: bike.id, hours_reported: total_hours }),
  ])

  if (updateError) {
    return Response.json({ success: false, error: 'Update failed' }, { status: 500 })
  }

  return Response.json({ success: true, bike_id: bike.id, hours_updated: total_hours })
}
```

- [ ] **Step 2: Test the endpoint manually**

Start the dev server with `npm run dev`, then run:
```bash
curl -X POST http://localhost:3000/api/update-hours \
  -H "Content-Type: application/json" \
  -d '{"api_key":"INVALID","total_hours":42.75}'
```
Expected response: `{"success":false,"error":"Invalid api_key"}`

To test with a real bike, copy the `api_key` from the Bike Settings page and:
```bash
curl -X POST http://localhost:3000/api/update-hours \
  -H "Content-Type: application/json" \
  -d '{"api_key":"<real-api-key>","total_hours":42.75}'
```
Expected: `{"success":true,"bike_id":"...","hours_updated":42.75}`

- [ ] **Step 3: Commit**

```bash
git add app/api/update-hours/route.ts
git commit -m "feat: ESP32 update-hours API endpoint with service role auth"
```

---

## Task 15: PWA Manifest

**Files:**
- Create: `public/manifest.json`
- Modify: `app/layout.tsx` (already has manifest link in metadata)

- [ ] **Step 1: Create PWA manifest**

```json
{
  "name": "MotoTrack",
  "short_name": "MotoTrack",
  "description": "Motorrad Betriebsstunden & Service Tracker",
  "theme_color": "#ff6600",
  "background_color": "#0a0a0a",
  "display": "standalone",
  "orientation": "portrait",
  "start_url": "/dashboard",
  "scope": "/",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

- [ ] **Step 2: Add placeholder icons**

The manifest references `icon-192.png` and `icon-512.png`. For now, copy `public/vercel.svg` and rename, or create simple placeholder PNGs. The app will install without them, but icons improve the PWA experience. Add real icons later.

Note: Until real icons exist, remove the `icons` array from `manifest.json` to avoid console warnings:
```json
{
  "name": "MotoTrack",
  "short_name": "MotoTrack",
  "description": "Motorrad Betriebsstunden & Service Tracker",
  "theme_color": "#ff6600",
  "background_color": "#0a0a0a",
  "display": "standalone",
  "orientation": "portrait",
  "start_url": "/dashboard",
  "scope": "/"
}
```

- [ ] **Step 3: Verify manifest is served**

Start dev server and visit: `http://localhost:3000/manifest.json`
Expected: the JSON content is returned.

- [ ] **Step 4: Commit**

```bash
git add public/manifest.json
git commit -m "feat: PWA manifest for installable app"
```

---

## Self-Review Checklist

### Spec Coverage

| Spec Requirement | Task |
|---|---|
| Supabase SSR auth | Task 3, 5, 7 |
| Middleware auth guard | Task 5 |
| Login/signup | Task 7 |
| Dashboard with bike list | Task 8 |
| Bike anlegen (mit api_key) | Task 9 |
| Bike-Detail mit Stunden + Intervallen | Task 10 |
| Service-Intervalle konfigurieren | Task 11 |
| API-Key anzeigen | Task 11 |
| Service eintragen | Task 12 |
| Service-Historie | Task 12 |
| ESP32 API Endpoint | Task 14 |
| Calculations (ok/soon/overdue) | Task 4 |
| Bottom Tab Bar | Task 6 |
| PWA Manifest | Task 15 |
| Konto + Logout | Task 13 |
| TypeScript Types | Task 2 |
| Dark Theme | Task 6 |

All spec requirements are covered.
