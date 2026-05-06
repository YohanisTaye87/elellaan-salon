# Elellaan Beauty Salon

Mobile-friendly web app:

- **Customer flow**: scan QR → select services → see total → confirm → thank-you screen
- **Admin flow**: password-protected `/admin` dashboard with orders, revenue, and a services manager that lets staff add/edit/delete categories and services from any device

Stack: Next.js 14 (App Router) + TypeScript + Tailwind + Supabase. Apple-style UI with a purple/lavender palette pulled from the elellaan logo.

---

## 1. Set up Supabase (free)

1. Create a project at https://supabase.com (free tier is plenty).
2. In the project's **SQL Editor**, paste the contents of [`supabase/schema.sql`](supabase/schema.sql) and run it. This creates the tables, RLS policies, and seeds every category and service from the printed price list.
3. In **Project Settings → API**, copy:
   - `Project URL`
   - `anon public` key
   - `service_role` key (treat as a secret)

## 2. Configure local env

```bash
cp .env.example .env.local
```

Fill in:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
ADMIN_PASSWORD=pick-something-strong
```

## 3. Drop your real logo (optional)

Save your salon logo as `public/logo.png`. The app uses it automatically; if it isn't there, an SVG fallback wordmark is shown.

## 4. Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000 — that's the customer page. The QR code you generate (from any QR generator) should point at this URL once deployed.

The staff dashboard is at http://localhost:3000/admin (password = `ADMIN_PASSWORD`).

## 5. Deploy free

Push the repo to GitHub, then on https://vercel.com:

1. Import the repo.
2. In **Settings → Environment Variables**, add the same four env vars from `.env.local`.
3. Deploy. Vercel will give you a `https://your-app.vercel.app` URL.
4. Generate a QR code pointing at that URL (e.g. https://qrcode.tec-it.com) and print it for the salon.

---

## Layout

```
app/
  page.tsx              # customer service-selection
  thank-you/page.tsx    # thank-you receipt
  admin/page.tsx        # login + orders dashboard
  admin/services/       # services & categories manager
  api/
    orders/             # POST (public), GET (admin)
    services/           # admin CRUD
    categories/         # admin CRUD
    admin/login/        # password gate (sets httpOnly cookie)
components/
  ServiceSelector.tsx   # client component — checkboxes + sticky total
  HeaderLogo.tsx
  Logo.tsx              # SVG fallback wordmark
lib/
  supabase.ts           # browser + server clients
  auth.ts               # cookie-based admin gate
  format.ts             # ETB formatter
  types.ts
supabase/
  schema.sql            # tables + RLS + seed
```

## Notes

- Prices are stored in ETB as integers (no decimals).
- Services with a range (e.g. `Hair Coloring 5000–7000`) store `price_min` and `price_max`. The customer-side total uses `price_min` and the UI marks the row as “varies”.
- Order rows snapshot the service name, category name, and price at the moment of submission — editing or deleting a service later does **not** alter past orders.
- The admin password lives only in env vars (no separate accounts table). For multi-staff auth, swap `lib/auth.ts` for Supabase Auth.

## Scripts

```bash
npm run dev     # local dev (http://localhost:3000)
npm run build   # production build
npm run start   # serve the production build
npm run lint    # next lint
```
