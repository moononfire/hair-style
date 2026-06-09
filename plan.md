# HairBook — aplikacja do zarządzania wizytami w salonie fryzjerskim

Wewnętrzna aplikacja dla pracowników salonu. Obsługuje rezerwacje telefoniczne i przy counter, zarządzanie grafikiem pracowników, widok kalendarza i szybkie znajdowanie wolnych terminów.

---

## Stack

| Warstwa       | Technologia                              |
|---------------|------------------------------------------|
| Framework     | Next.js 16 (App Router)                  |
| Język         | TypeScript                               |
| Styling       | Tailwind CSS v4 + shadcn/ui              |
| Baza danych   | Neon (PostgreSQL serverless)             |
| ORM           | Prisma                                   |
| Auth          | NextAuth.js v5 (credentials — email + hasło) |
| Hosting       | Vercel                                   |
| CI/CD         | GitHub Actions + Vercel                  |

Stripe i Resend są w repo ale **nie są używane** na tym etapie — zostawiamy jako baza pod przyszłe rozszerzenia.

---

## Dlaczego Neon + Prisma (zamiast Supabase)

- **Prisma schema** — jeden plik definiuje cały model, migracje generowane automatycznie (`prisma migrate dev`)
- **Neon** — serverless Postgres, darmowy tier, zero konfiguracji CLI, jeden connection string
- **NextAuth v5** — wbudowany adapter Prisma, sesje w DB, prosty credentials provider
- Mniej zależności, mniej plików konfiguracyjnych, szybszy start

---

## Funkcjonalności (MoSCoW)

### Must Have (MVP)
- Tworzenie wizyty: klient, usługa, pracownik, data/godzina, czas trwania
- Widok kalendarza dzienny i tygodniowy (wszyscy pracownicy side-by-side)
- Widok "Najbliższe wolne terminy" — dla rozmów telefonicznych ASAP
- Zarządzanie pracownikami: godziny pracy, dni wolne
- Zarządzanie usługami: nazwa, domyślny czas trwania, kolor
- Status wizyty: `pending` → `confirmed` → `arrived` → `in_progress` → `completed` | `no_show` | `cancelled`
- Logowanie pracownika (email + hasło)

### Should Have
- Baza klientów: imię, telefon, historia wizyt
- Widok "Dzisiaj" — uproszczony, co jest zaplanowane na bieżący dzień
- Szybka rezerwacja klikając na wolny slot w kalendarzu
- Blokada czasu (urlop, przerwa, szkolenie) bez przypisania klienta
- Notatki do wizyty (np. "kolor włosów z ostatniego razu")

### Could Have
- Powtarzające się wizyty (np. co 6 tygodni)
- Eksport dnia do PDF / drukowanie
- Statystyki: obłożenie pracownika, najpopularniejsze usługi
- Historia zmian wizyty (kto zmienił i kiedy)

### Won't Have (na razie)
- Aplikacja mobilna
- Samodzielna rezerwacja online przez klienta
- Płatności / Stripe
- SMS/email przypomnienia dla klientów

---

## Prisma Schema (`prisma/schema.prisma`)

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")   // Neon wymaga osobnego URL dla migracji
}

generator client {
  provider = "prisma-client-js"
}

// --- NextAuth.js wymagane modele ---

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime
  @@unique([identifier, token])
}

model User {
  id            String    @id @default(cuid())
  name          String?
  email         String?   @unique
  emailVerified DateTime?
  image         String?
  password      String?   // bcrypt hash — credentials provider
  accounts      Account[]
  sessions      Session[]
  employee      Employee?
}

// --- Salon ---

model Employee {
  id           String        @id @default(cuid())
  userId       String?       @unique
  user         User?         @relation(fields: [userId], references: [id])
  name         String
  color        String        // kolor w kalendarzu (#hex)
  phone        String?
  active       Boolean       @default(true)
  createdAt    DateTime      @default(now())
  appointments Appointment[]
  timeBlocks   TimeBlock[]
  hours        EmployeeHours[]
}

model Service {
  id           String        @id @default(cuid())
  name         String
  durationMin  Int           // domyślny czas w minutach
  color        String?
  pricePln     Decimal?      @db.Decimal(8, 2)
  active       Boolean       @default(true)
  createdAt    DateTime      @default(now())
  appointments Appointment[]
}

model Client {
  id           String        @id @default(cuid())
  name         String
  phone        String?
  email        String?
  notes        String?       // stałe uwagi (alergie itp.)
  createdAt    DateTime      @default(now())
  appointments Appointment[]
}

model Appointment {
  id         String   @id @default(cuid())
  clientId   String?
  client     Client?  @relation(fields: [clientId], references: [id])
  employeeId String
  employee   Employee @relation(fields: [employeeId], references: [id])
  serviceId  String
  service    Service  @relation(fields: [serviceId], references: [id])
  startsAt   DateTime
  endsAt     DateTime
  status     String   @default("confirmed")
  // pending | confirmed | arrived | in_progress | completed | no_show | cancelled
  notes      String?
  source     String   @default("counter") // counter | phone | walk_in
  createdById String?
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}

model TimeBlock {
  id         String   @id @default(cuid())
  employeeId String
  employee   Employee @relation(fields: [employeeId], references: [id])
  startsAt   DateTime
  endsAt     DateTime
  reason     String?  // "Urlop", "Przerwa obiadowa"
  createdAt  DateTime @default(now())
}

model EmployeeHours {
  id         String   @id @default(cuid())
  employeeId String
  employee   Employee @relation(fields: [employeeId], references: [id])
  dayOfWeek  Int      // 0=niedziela … 6=sobota
  startTime  String   // "09:00"
  endTime    String   // "18:00"
  @@unique([employeeId, dayOfWeek])
}
```

---

## Struktura projektu

```
prisma/
├── schema.prisma
├── migrations/           # generowane przez prisma migrate dev
└── seed.ts               # dane testowe

app/
├── (auth)/
│   └── login/
│       └── page.tsx      # formularz email + hasło
├── (app)/
│   ├── layout.tsx        # sidebar + topbar, wymaga sesji
│   ├── page.tsx          # redirect → /calendar
│   ├── calendar/
│   │   └── page.tsx      # główny widok kalendarza (dzień/tydzień)
│   ├── today/
│   │   └── page.tsx      # widok "Dzisiaj"
│   ├── availability/
│   │   └── page.tsx      # najbliższe wolne terminy
│   ├── appointments/
│   │   ├── page.tsx
│   │   ├── new/
│   │   │   └── page.tsx
│   │   └── [id]/
│   │       └── page.tsx
│   ├── clients/
│   │   ├── page.tsx
│   │   └── [id]/
│   │       └── page.tsx
│   ├── employees/
│   │   ├── page.tsx
│   │   └── [id]/
│   │       └── page.tsx
│   └── services/
│       └── page.tsx
└── api/
    ├── auth/
    │   └── [...nextauth]/
    │       └── route.ts  # NextAuth handler
    ├── appointments/
    │   ├── route.ts
    │   └── [id]/
    │       └── route.ts
    ├── availability/
    │   └── route.ts
    └── health/
        └── route.ts

components/
├── ui/                   # shadcn/ui
├── calendar/
│   ├── CalendarWeek.tsx
│   ├── CalendarDay.tsx
│   ├── AppointmentBlock.tsx
│   ├── TimeBlockBlock.tsx
│   └── TimeGrid.tsx
├── appointments/
│   ├── AppointmentForm.tsx
│   ├── AppointmentCard.tsx
│   └── StatusBadge.tsx
├── availability/
│   └── NextSlotsList.tsx
└── layout/
    ├── Sidebar.tsx
    └── Topbar.tsx

lib/
├── prisma.ts             # singleton PrismaClient
├── auth.ts               # NextAuth config (providers, callbacks)
├── appointments.ts       # logika biznesowa wizyt
├── availability.ts       # algorytm wolnych slotów
└── date.ts               # helpery dat
```

---

## Kluczowy algorytm: Wolne terminy (`lib/availability.ts`)

```
wejście: employeeId (lub null = dowolny), dateFrom, dateTo, durationMin

dla każdego dnia w zakresie:
  1. pobierz EmployeeHours dla dayOfWeek
  2. pobierz Appointments (startsAt–endsAt, status != cancelled)
  3. pobierz TimeBlocks
  4. zajęte = appointments + timeBlocks posortowane po startsAt
  5. wolne sloty = luki między zajętymi >= durationMin
  6. zwróć: { employee, date, startTime, endTime }

sortuj wg daty, zwróć pierwsze N wyników
```

---

## Widoki — opis UX

### `/calendar` — Główny kalendarz
- Przełącznik `Dzień / Tydzień`
- Widok dzienny: pionowe kolumny = pracownicy, pozioma oś = czas (8:00–20:00)
- Kliknięcie wolnego slotu → modal tworzenia wizyty z pre-wypełnioną datą/pracownikiem
- Kliknięcie bloku wizyty → panel boczny ze szczegółami (zmień status, edytuj, anuluj)

### `/availability` — Najbliższe wolne terminy
- Formularz: usługa (auto-wypełnia czas), opcjonalnie konkretny pracownik, zakres dat
- Lista slotów z przyciskiem "Zarezerwuj"
- Idealne przy telefonie: "Najszybszy wolny termin na strzyżenie → czwartek 14:00 u Anny"

### `/today` — Widok dnia
- Lista wizyt bieżącego dnia, pogrupowana po pracowniku
- Jeden klik → zmiana statusu (arrived → in_progress → completed / no_show)

### `/appointments/new` — Nowa wizyta
- Wybierz usługę → pracownika + datę → klienta (szukaj lub utwórz) → zapisz

---

## Kolejność implementacji

### Faza 1 — Baza i dane (1–2 dni)
- [ ] 1.1 Zainstalować: `prisma`, `@prisma/client`, `next-auth@beta`, `bcryptjs`, `@auth/prisma-adapter`
- [ ] 1.2 `prisma/schema.prisma` — pełny schemat (User, Employee, Service, Client, Appointment, TimeBlock, EmployeeHours)
- [ ] 1.3 `DATABASE_URL` + `DIRECT_URL` z Neon dashboard → `.env.local`
- [ ] 1.4 `prisma migrate dev --name init` — pierwsza migracja
- [ ] 1.5 `lib/prisma.ts` — singleton PrismaClient
- [ ] 1.6 `prisma/seed.ts` — 3 pracowników, 5 usług, 10 wizyt, godziny pracy
- [ ] 1.7 `lib/appointments.ts` — CRUD wizyt
- [ ] 1.8 `lib/availability.ts` — algorytm wolnych slotów

### Faza 2 — Auth i layout (1 dzień)
- [ ] 2.1 `lib/auth.ts` — NextAuth v5 config (Prisma adapter, credentials provider z bcrypt)
- [ ] 2.2 `app/api/auth/[...nextauth]/route.ts`
- [ ] 2.3 Strona `/login` — formularz email + hasło
- [ ] 2.4 Middleware ochrony tras
- [ ] 2.5 Sidebar + Topbar z info o zalogowanym

### Faza 3 — Tworzenie wizyt (2 dni)
- [ ] 3.1 Formularz `/appointments/new`
- [ ] 3.2 Wyszukiwanie klientów + tworzenie nowego inline
- [ ] 3.3 API `POST /api/appointments` z walidacją kolizji
- [ ] 3.4 API `PATCH /api/appointments/[id]` — zmiana statusu, edycja

### Faza 4 — Kalendarz (3–4 dni)
- [ ] 4.1 `TimeGrid.tsx` — siatka CSS Grid
- [ ] 4.2 `AppointmentBlock.tsx` — blok pozycjonowany na siatce
- [ ] 4.3 `CalendarDay.tsx` — widok dzienny z kolumnami
- [ ] 4.4 `CalendarWeek.tsx` — widok tygodniowy
- [ ] 4.5 Panel boczny po kliknięciu bloku
- [ ] 4.6 Kliknięcie wolnego slotu → pre-wypełniony formularz

### Faza 5 — Widok dostępności (1–2 dni)
- [ ] 5.1 API `GET /api/availability`
- [ ] 5.2 Strona `/availability` z formularzem i listą
- [ ] 5.3 Przycisk "Zarezerwuj" → formularz z pre-wypełnionymi danymi

### Faza 6 — Dzisiaj i statusy (1 dzień)
- [ ] 6.1 Strona `/today`
- [ ] 6.2 Szybka zmiana statusu jednym kliknięciem
- [ ] 6.3 `StatusBadge.tsx` z kolorami per status

### Faza 7 — Zarządzanie (1–2 dni)
- [ ] 7.1 `/employees` — lista, edycja godzin pracy, blokady
- [ ] 7.2 `/services` — CRUD usług
- [ ] 7.3 `/clients` — lista + wyszukiwarka + historia wizyt

### Faza 8 — Szlif (1 dzień)
- [x] 8.1 Responsywność (tablet — używany przy counter)
- [x] 8.2 Loading states, toasty, error boundaries
- [x] 8.3 Keyboard shortcuts: `N` → nowa wizyta, `T` → dzisiaj
- [x] 8.4 Deploy na Vercel + zmienne środowiskowe

---

## Zmienne środowiskowe (`.env.local`)

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Neon — wymagane (https://neon.tech → projekt → Connection string)
DATABASE_URL=postgresql://...?sslmode=require
DIRECT_URL=postgresql://...?sslmode=require  # bez poolera, dla migracji

# NextAuth
AUTH_SECRET=                # openssl rand -base64 32
AUTH_URL=http://localhost:3000
```

---

## Komendy

```json
{
  "dev": "next dev",
  "build": "next build",
  "lint": "next lint",
  "typecheck": "tsc --noEmit",
  "db:migrate": "prisma migrate dev",
  "db:push": "prisma db push",
  "db:seed": "prisma db seed",
  "db:studio": "prisma studio",
  "db:generate": "prisma generate"
}
```

---

## Konta do założenia

| Serwis     | Po co                          | Link              |
|------------|--------------------------------|-------------------|
| GitHub     | repo + CI/CD                   | github.com        |
| Vercel     | hosting + preview deploys      | vercel.com        |
| Neon       | serverless PostgreSQL          | neon.tech         |

---

## Decyzje architektoniczne

| Decyzja | Wybór | Powód |
|---------|-------|-------|
| ORM | Prisma | Schema as code, type-safe queries, migracje automat |
| DB | Neon | Serverless Postgres, darmowy tier, jeden connection string |
| Auth | NextAuth v5 credentials | Prosta konfiguracja, Prisma adapter, wewnętrzna aplikacja |
| Siatka kalendarza | CSS Grid + `position: absolute` | Pełna kontrola, zero zewnętrznych bibliotek |
| Widok tygodniowy | Kolumny = pracownicy | Widać wszystkich naraz |
| Stan kalendarza | URL params (`?date=2026-06-09&view=day`) | Głęboki link, refresh nie resetuje |
| Optymistyczny UI | `useOptimistic` (React 19) | Zmiana statusu działa instant |
| Walidacja kolizji | Server-side w API + Prisma transaction | Nie można podwójnie zarezerwować slotu |
