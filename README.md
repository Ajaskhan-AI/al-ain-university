# Al Ain University — FacilityIQ FM demo (Kuroshio AI)

A clickable demo of Kuroshio AI's **FacilityIQ** building-intelligence platform, packaged for the
Facilities Management team at Al Ain University (AAU).

> **Sample data — for demonstration only.** Everything runs in the browser with generated sample data.
> There is no backend, no database and no real sensors. Names are fictional. Savings are not promised —
> they are to be measured during a pilot.

## Modules

| # | Module | What it shows |
|---|--------|---------------|
| 1 | SMDB Live Monitoring | 20 boards updated every 4 s, thresholds, alerts → acknowledge → work order, simulate fault |
| 2 | Predictive Maintenance | Health score from motor current signature (CT clamps), diagnosis, schedule / work order / resolve |
| 3 | Digital Logbook & PPM | QR-tagged assets, checklists, PPM calendar, completion %, history |
| 4 | Complaints & Work Orders | Room QR → complaint → assign → start → close, response / resolution times, repeat faults |
| 5 | Energy Analytics | Energy vs academic calendar, waste detection, heatmap, editable calendar, CSV export |
| 6 | Monthly Report | PDF report (plus single work-order and asset-history PDFs) |

Plus an **Overview** with live KPIs, **How it works**, **Settings** (thresholds, users & roles, demo tools)
and role-based access for 6 demo roles.

## Run it (Windows PowerShell)

```powershell
npm install
npm run dev       # http://localhost:5173
npm run build     # type-check + production build into dist/
npm run preview   # serve the production build
```

## Demo users (no passwords — click a card)

| Role | User | Lands on |
|------|------|----------|
| FM Manager | Ahmed Al Mansoori (both campuses) | Overview |
| FM Engineer | Rashid Khan (Al Ain), Priya Nair (Abu Dhabi) | SMDB monitoring |
| Technician | Joseph (HVAC), Imran (Electrical), Suresh (Plumbing) — Al Ain | My Jobs (mobile) |
| Helpdesk | Fatima Saeed | Complaints |
| Sustainability | Dr. Layla Hassan | Energy Analytics |
| System Admin | Kuroshio Admin | Settings |
| Staff / student | no login — room QR, e.g. `/#/report/AIN-B2-105` | Report a problem |

Use **Switch role** (top right) to jump between users, and **Reset demo data** (top bar) to start fresh.

## Suggested demo flow (about 10 minutes)

1. **Manager → Overview** — live KPIs; click a KPI to drill into its module.
2. **Staff/student** — open `/#/report/AIN-B2-105` on a phone, report "AC not cooling", get a ticket number.
3. **Helpdesk** — the new ticket is in the inbox; assign it (HVAC technician is suggested).
4. **Technician (Joseph)** — My Jobs on a phone: start and close with a remark; then scan an asset QR and complete a PPM checklist.
5. **Admin** — Settings → Simulate fault (trip) → live alert + toast. **Engineer** acknowledges and clicks *Create work order*.
6. **Engineer → Predictive** — CHW Primary Pump 1 is in *Alert* (bearing wear): schedule maintenance.
7. **Sustainability → Energy Analytics** — waste flags (library weekends), heatmap, edit the calendar, export CSV.
8. **Manager → Monthly Report** — download the PDF; the tickets and PPM done in steps 2–6 are included.

## Deploy (static site)

The app uses hash URLs (`/#/page`) and relative asset paths, so `dist/` works on any static host.

- **Vercel** — <https://vercel.com/new> → import `Ajaskhan-AI/al-ain-university` → Deploy. Settings come from
  `vercel.json` (Vite, `npm run build`, output `dist`). Every push to `main` redeploys automatically.
  No rewrites are needed because of the hash URLs.
- **Netlify** — connect the repo (settings come from `netlify.toml`) or drag `dist/` onto <https://app.netlify.com/drop>.
- **GitHub Pages** — in the repo: *Settings → Pages → Source: GitHub Actions*, then run the
  *Deploy to GitHub Pages* workflow from the *Actions* tab (`.github/workflows/deploy-pages.yml`).

## Project structure

```
src/
  auth/        permissions matrix (can()), roles, route guard
  data/        seed data + generators (buildings, rooms, assets, PPM, tickets, energy, calendar)
  sim/         live SMDB simulator and predictive-maintenance model
  store/       React Context + reducer, saved to localStorage
  lib/         pure logic (KPIs, waste detection, report numbers, CO₂, CSV…)
  pdf/         PDF generation (jsPDF + autotable), loaded on demand
  components/  layout shells and shared UI
  pages/       one folder per module
```

Kuroshio AI · www.kuroshioai.com · www.kuroshioai.ae · info@kuroshioai.com
