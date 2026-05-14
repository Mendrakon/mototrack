# MotoTrack — Design Spec

**Datum:** 2026-05-14  
**Status:** Approved  
**Projekt:** `c:\Users\d.fass\Documents\SumoTracker\src\mototrack`

---

## Überblick

MotoTrack ist eine mobile-first PWA zur Verwaltung von Motorrad-Betriebsstunden und Service-Intervallen. Ein ESP32 am Motorrad sendet Betriebsstunden per HTTP POST an die API. Die App zeigt aktuelle Stunden, Service-Status und Fälligkeiten.

---

## Tech Stack

| Bereich | Technologie |
|---|---|
| Framework | Next.js 16.2.6 (App Router) |
| Sprache | TypeScript |
| Styling | Tailwind CSS 4 |
| Datenbank + Auth | Supabase (PostgreSQL + SSR Auth) |
| Supabase Pakete | `@supabase/supabase-js` + `@supabase/ssr` |
| Hosting | Vercel (mototrack-dusky.vercel.app) |
| Hardware | ESP32 NodeMCU |

---

## Authentifizierung

**Strategie: Option C — Next.js Middleware + Supabase SSR**

- `@supabase/ssr` für server-seitige Session-Verwaltung via Cookies
- `middleware.ts` leitet alle nicht-authentifizierten Requests zu `/login` weiter
- Ausgenommen: `/login` und `POST /api/update-hours`
- Session wird automatisch von Supabase verwaltet (kein Flackern, kein Client-side Auth-Check)
- Row Level Security (RLS) in Supabase: jeder User sieht nur eigene Bikes

---

## Datenbank Schema

Alle 4 Tabellen sind bereits in Supabase angelegt:

```sql
-- bikes: user_id, name, make, model, year, total_hours, api_key, created_at
-- service_intervals: bike_id, name, interval_hours, created_at
-- service_log: bike_id, interval_id, service_name, hours_at_service, date, notes
-- hour_sessions: bike_id, hours_reported, reported_at
```

RLS Policy muss in Supabase aktiviert sein: `auth.uid() = user_id` für alle Bikes-bezogenen Tabellen. Falls noch nicht aktiviert: im Supabase Dashboard → Authentication → Policies aktivieren.

---

## Routen & Seiten

| Route | Typ | Beschreibung |
|---|---|---|
| `/` | Server | Redirect zu `/dashboard` |
| `/login` | Client | Email + Passwort Login |
| `/dashboard` | Server | Liste aller Bikes als Karten |
| `/bikes/new` | Client | Formular: Neues Bike anlegen |
| `/bikes/[id]` | Server | Betriebsstunden + Service-Intervalle |
| `/bikes/[id]/settings` | Client | Intervalle konfigurieren, API-Key anzeigen |
| `/service/new` | Client | Service eintragen (query param: `?bike_id=`) |
| `POST /api/update-hours` | Route Handler | ESP32 Endpoint |
| `GET/POST /api/bikes` | Route Handler | CRUD Bikes |
| `GET/POST /api/service` | Route Handler | CRUD Service Einträge |

---

## Navigation

**Bottom Tab Bar** mit 3 Tabs:

1. **Bikes** (🏍️) → `/dashboard`
2. **+ Hinzufügen** (➕) → `/bikes/new`
3. **Konto** (👤) → Logout-Button + ggf. Account-Info

Die Tab Bar wird in einem Client Component implementiert und im Root Layout eingebunden. Bike-spezifische Einstellungen sind über einen "Einstellungen"-Button auf der Bike-Detailseite (`/bikes/[id]`) erreichbar.

---

## UI Design

**Farbschema:**
- Hintergrund: `#0a0a0a`
- Primärfarbe (Orange): `#ff6600`
- Erfolg (Grün): `#22c55e`
- Warnung (Orange): `#f97316`
- Fehler (Rot): `#ef4444`
- Text: `#ffffff` / `#888888`

**Service-Intervall Anzeige (Option A — Fortschrittsbalken):**
- Pro Intervall: Name + Stunden-Info + farbiger Fortschrittsbalken
- < 80%: Grün
- 80–100%: Orange
- > 100%: Rot (vollständig gefüllt)

**Dashboard BikeCard:**
- Name + Modell
- Aktuelle Betriebsstunden
- Kritischster Service-Status als Badge (OK / Bald / Überfällig)
- Link zur Detailseite

---

## Komponenten

| Komponente | Typ | Zweck |
|---|---|---|
| `BottomNav` | Client | Tab Bar Navigation |
| `BikeCard` | Server | Bike-Karte im Dashboard |
| `ServiceBadge` | Server | Status-Badge (ok/soon/overdue) |
| `ServiceInterval` | Server | Einzelner Fortschrittsbalken |
| `ServiceHistory` | Server | Liste vergangener Services |
| `HoursDisplay` | Server | Große Stundenanzeige |

---

## Bibliotheken / Utilities

### `lib/supabase/client.ts`
Supabase Browser-Client (für Client Components)

### `lib/supabase/server.ts`
Supabase Server-Client (für Server Components und Route Handlers)

### `lib/calculations.ts`
Service-Intervall Berechnungslogik:

```typescript
interface ServiceStatus {
  name: string
  intervalHours: number
  lastServiceHours: number
  currentHours: number
  hoursUntilNext: number   // negativ = überfällig
  hoursOverdue: number     // 0 wenn nicht überfällig
  percentageDue: number    // 0–100+
  status: 'ok' | 'soon' | 'overdue'
}
// ok: < 80%, soon: 80–100%, overdue: > 100%
```

---

## ESP32 API Endpoint

**`POST /api/update-hours`** — kein Auth, verwendet `SUPABASE_SERVICE_ROLE_KEY`

Request:
```json
{ "api_key": "...", "total_hours": 42.75 }
```

Logik:
1. `api_key` in `bikes` Tabelle suchen
2. `total_hours` updaten (nur wenn neuer Wert > alter Wert)
3. Eintrag in `hour_sessions` speichern
4. Erfolgs-Response zurückschicken

---

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://gklqyvzzxubpznwaqees.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_Aw-zubi2rg3k0iaUrG1OdA_HYJbJ1K9
SUPABASE_SERVICE_ROLE_KEY=[gesetzt in Vercel + .env.local]
```

---

## Implementierungsreihenfolge

1. Abhängigkeiten installieren (`@supabase/supabase-js`, `@supabase/ssr`)
2. Environment Variables (`.env.local`)
3. Supabase Clients (`lib/supabase/`)
4. Middleware (Auth-Schutz)
5. Berechnungslogik (`lib/calculations.ts`)
6. Root Layout + Bottom Nav
7. Login-Seite
8. Dashboard + BikeCard
9. Bike anlegen (`/bikes/new`) — `api_key` wird beim Anlegen mit `crypto.randomUUID()` generiert
10. Bike-Detail (`/bikes/[id]`) mit Service-Anzeige
11. Bike-Settings (`/bikes/[id]/settings`)
12. Service eintragen (`/service/new`)
13. ESP32 Endpoint (`/api/update-hours`)
14. Service-Historie
15. PWA Manifest + `next.config.ts`
