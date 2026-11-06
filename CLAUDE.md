# CLAUDE.md — Al Ain University FM Demo (Kuroshio AI)

## What this project is
A **clickable demo web app** that Kuroshio AI will show to the **Facilities Management (FM) team manager at Al Ain University (AAU)**.
It demonstrates Kuroshio's **FacilityIQ** building intelligence platform, packaged for a university FM team.

This is a **sales demo, not a production system**:
- All data is **sample/mock data** stored in local JSON/JS files. No backend, no database, no real sensors.
- Every screen must show a visible **"Sample data — for demonstration only"** label.
- Never present numbers as AAU's real data, and never claim Kuroshio has done this for other universities.
- Do not show specific savings percentages as promises. Use wording like "to be measured during pilot".

## Company
- **Kuroshio AI** — deep tech startup (India: Kuroshio AI Private Limited, STPI Trivandrum; UAE: Kuroshio AI Ltd, RAKEZ, Ras Al Khaimah).
- Website: www.kuroshioai.com · www.kuroshioai.ae · info@kuroshioai.com
- Hardware used in the real system (show in the "How it works" screen): Selec energy meters (RS-485/Modbus) → ESP32-S3 IoT node → SIM7080G cellular → cloud dashboard. CT clamps for predictive maintenance.

## AAU context
- Two campuses: **Al Ain Campus** and **Abu Dhabi Campus**.
- AAU's public goal: carbon-neutral by 2050; reports to UI GreenMetric, THE Impact Rankings, and EAD's Sustainable Universities Initiative.
- Utility is Abu Dhabi's distribution company — **not DEWA**. Do not mention DEWA anywhere.

## Modules to build (the 6 selected)
1. **SMDB Live Monitoring** — list of SMDBs per building with live kW, kWh, voltage, current, status (Normal / Warning / Tripped). Alerts panel. Simulate live updates every few seconds.
2. **Predictive Maintenance** — chillers, AHUs, pumps with health status (OK / Watch / Alert), motor current trend chart, recommended action.
3. **Digital Logbook & PPM (Planned Preventive Maintenance)** — **must be fully working end-to-end with demo data** (see "Fully working modules" below). Asset list with QR tag IDs; "scan QR" screen opens an asset's checklist + history; PPM calendar showing due / overdue / done; PPM completion %.
4. **Complaint & Work-Order Tracking** — **must be fully working end-to-end with demo data** (see below). Room QR → simple complaint form (AC, lighting, plumbing, cleaning, other) → ticket list with status (Open / Assigned / In progress / Closed), assigned technician, response time; repeat-fault rooms.
5. **Academic-Calendar Energy Analytics** — energy chart overlaid with academic periods (teaching, exams, weekends, Ramadan, summer break); flags "energy use doesn't match occupancy" cases per building.
6. **Monthly FM & Energy Report** — report page with a **"Download PDF" button that generates a real PDF file** (see "PDF reports" below). Contents: PPM completion, ticket stats, energy by building/campus, Scope 2 CO₂ (use UAE grid emission factor, labelled as indicative), top fault areas.

## Role-based access (RBAC)
The app must show **different views and permissions per role**. This is a demo, so there is no real authentication:
- A **demo login screen** shows one card per demo user (name, role, campus, avatar initials) — click a card to log in. No passwords.
- A **"Switch role"** dropdown in the top bar lets the presenter jump between users instantly during the meeting.
- Current user is stored in the app store (persisted in localStorage); "Reset demo data" logs out too.

**Roles and demo users**
| Role | Demo user (example) | Campus scope | Lands on |
|---|---|---|---|
| FM Manager | Ahmed Al Mansoori | Both campuses | Overview |
| FM Engineer / Supervisor | Rashid Khan (Al Ain), Priya Nair (Abu Dhabi) | Own campus | Alerts + Tickets |
| Technician | e.g. Joseph (HVAC), Imran (Electrical), Suresh (Plumbing) | Own campus | My Jobs (mobile layout) |
| Helpdesk / FM Coordinator | Fatima Saeed | Both | Complaints inbox |
| Sustainability Officer | Dr. Layla Hassan | Both | Energy Analytics |
| System Admin (Kuroshio) | Kuroshio Admin | Both | Settings |
| Requester (staff/student) | Not logged in — public complaint form via room QR | — | Report a problem |

All names above are fictional demo users.

**Permission matrix** (V = view, E = edit/act, — = hidden)
| Feature | FM Manager | FM Engineer | Technician | Helpdesk | Sustainability | Admin |
|---|---|---|---|---|---|---|
| Overview KPIs | V | V (own campus) | — | V (tickets only) | V (energy only) | V |
| SMDB monitoring | V | V/E (ack alerts, create WO) | V (assigned only) | — | V | V/E |
| Edit thresholds | E | — | — | — | — | E |
| Simulate fault (demo helper) | — | — | — | — | — | E |
| Predictive maintenance | V | V/E (schedule, create WO, resolve) | — | — | — | V/E |
| PPM: view calendar & history | V | V | Own tasks | — | — | V |
| PPM: complete checklist | — | E | E (own tasks) | — | — | — |
| PPM: add assets/tasks | E | E | — | — | — | E |
| Complaints: create | E | E | — | E | — | E |
| Complaints: assign technician | E | E | — | E | — | — |
| Complaints: update/close | — | E | E (own jobs) | — | — | — |
| Energy analytics | V | V | — | — | V/E (edit calendar, export) | V |
| Monthly PDF report | V/download | V/download (own campus) | — | V/download (tickets section) | V/download (energy & CO₂) | V |
| Users & roles management | V | — | — | — | — | E |
| Reset demo data | — | — | — | — | — | E (also available in top bar for presenter) |

**Implementation rules**
- Define roles and permissions in one place (`src/auth/permissions.ts`) as typed constants, e.g. `can(user, 'tickets.assign')`. Never scatter role checks as string comparisons in components.
- Sidebar items, buttons and routes are shown/hidden from the permission check; direct URL access to a forbidden page shows an "Access restricted for your role" screen.
- **Campus scoping**: users with a single campus only see that campus's data (campus switcher hidden or locked).
- **Technician view** is mobile-first: "My Jobs" (tickets + PPM tasks assigned to them), job detail, start/complete, add photo/remarks.
- Every action records **who did it** (user name + role + timestamp) in ticket timelines and PPM history.
- Users & Roles page (Admin edit, Manager view): list users, change role/campus, add a demo user.

## Every module must feel like a working product
No static screenshots or dead buttons anywhere. Modules 1, 2 and 5 run on **simulated live data**, but every button, filter, drill-down and action must work. Modules 3 and 4 are fully functional with stored data.

**Module 1 — SMDB Live Monitoring must support:**
- Seed data: ~20 SMDBs across buildings on both campuses, each with rated capacity (A), normal load profile and a meter ID.
- A **simulator** (`src/sim/`) that updates readings every 3–5 seconds with realistic variation (daily load curve, higher cooling load in afternoon, lower at night/weekends). Values: per-phase V and A, kW, kVA, PF, kWh counter, frequency.
- Status logic from configurable thresholds: load > 80% of rating = Warning, > 95% = Critical, phase imbalance > 15%, voltage outside ±10%, "Tripped" (zero current) = Critical.
- Building → SMDB drill-down; SMDB detail page with live gauges, last-24h trend chart, per-phase table.
- **Alerts center**: alerts generated by the simulator appear live (with a toast notification); FM can **Acknowledge**, add a note, and **"Create work order"** which creates a real ticket in Module 4.
- Settings page to edit thresholds per SMDB (changes affect status immediately).
- A "Simulate fault" button (demo helper) to trigger a trip or overload on a chosen SMDB so it can be shown live in the meeting.

**Module 2 — Predictive Maintenance must support:**
- Seed data: ~12 critical assets (chillers, AHUs, pumps) linked to the same asset list as Module 3.
- Simulated motor current signature data with a health score (0–100) and status OK / Watch / Alert; a couple of assets slowly degrading over the seeded history.
- Asset detail: health trend chart, current trend vs. normal band, detected issue (e.g. "possible bearing wear", "filter clogging — rising current"), recommended action, estimated time to action.
- Buttons: **"Schedule maintenance"** (creates a PPM task in Module 3) and **"Create work order"** (creates a ticket in Module 4). Mark as resolved → health resets.

**Module 5 — Academic-Calendar Energy Analytics must support:**
- Seed data: 12 months of hourly or daily kWh per building, plus an academic calendar (semesters, exams, weekends, public holidays, Ramadan, summer break).
- Charts: energy by day overlaid with coloured academic-period bands; compare periods (e.g. teaching week vs. summer week); heatmap by hour × day for a building.
- **Waste detection**: automatically flag days/buildings where consumption is high but occupancy is low (holidays, nights, weekends), with estimated excess kWh and indicative AED cost.
- Filters: campus, building, date range, period type. Click a flagged item → details + "Create work order" / "Mark as reviewed".
- **Editable calendar**: user can add/edit academic periods and the analysis recalculates.
- Export the flagged-waste list to CSV.

**Overview page:** KPIs and mini charts must be calculated live from the store and simulator (not hard-coded), and each KPI card links to its module.

## Fully working modules (3 and 4) — details
These two must work end-to-end with stored data, so the FM manager can try them himself in the meeting.

**Module 3 — Logbook & PPM must support:**
- Seed data: ~25 assets across both campuses (SMDBs, chillers, AHUs, pumps, generators, fire pumps excluded), each with a QR tag ID (e.g. `AAU-AIN-AHU-03`), location, category, and a checklist template.
- ~60 PPM tasks over the current and previous month with frequencies (daily/weekly/monthly/quarterly), some done, some due, some overdue.
- "Scan QR": show a real QR code per asset (use `qrcode.react`); also allow picking the asset from a list or typing the tag ID (camera scanning is optional, not required).
- Opening a task shows the checklist; technician ticks items, enters readings (e.g. supply/return temp), adds remarks, attaches a photo (file input, preview only), enters their name, and submits.
- On submit: task becomes Done with timestamp, appears in the asset's history log, PPM completion % and calendar update instantly.
- Filters: campus, building, category, status. Overdue tasks highlighted red.
- Ability to add a new asset and a new PPM task.

**Module 4 — Complaints & Work Orders must support:**
- Seed data: ~40 rooms with QR codes, ~8 technicians with trades (HVAC, electrical, plumbing, general), ~30 historical tickets.
- Public complaint form (mobile layout, opened from a room's QR / link like `/report/AIN-B2-105`): room auto-filled, pick category, description, optional photo, optional name/phone → submit → shows ticket number.
- FM supervisor view: ticket list with filters and search; open a ticket → assign technician → status Open → Assigned → In progress → Closed; closing requires a remark and optional photo.
- Timeline/history on each ticket (created, assigned, started, closed — with timestamps).
- Auto-calculated response time and resolution time; KPIs: open tickets, avg response time, tickets by category, repeat-fault rooms (3+ tickets in 30 days).
- Technician view: "My jobs" list for a selected technician.

**Data persistence for the demo:**
- Keep all data in a central store (React Context + reducer). Persist to `localStorage` so changes survive a page refresh during the meeting (wrap reads/writes in try/catch).
- Provide a **"Reset demo data"** button in settings/top bar that restores the original seed data.
- Data created in modules 3 and 4 must feed the Overview KPIs and the Monthly Report.

## PDF reports (module 6)
- Generate PDFs **in the browser** with `jspdf` + `jspdf-autotable`; include charts by capturing them with `html2canvas` (or draw simple bar charts directly in jsPDF).
- User picks **month** and **campus (Al Ain / Abu Dhabi / Both)** and clicks "Download PDF".
- PDF layout (A4 portrait): cover header with "Kuroshio AI — FacilityIQ" and "Al Ain University — Monthly FM & Energy Report", month, campus; then sections:
  1. Executive summary (KPI boxes)
  2. PPM: completion %, done / due / overdue table, overdue task list
  3. Complaints & work orders: totals by category and status, avg response & resolution time, repeat-fault rooms
  4. Energy: kWh by building and campus (chart + table), academic-period comparison
  5. Scope 2 CO₂ estimate (indicative emission factor stated)
  6. Alerts & predictive maintenance summary
- Footer on every page: page number, "Sample data — for demonstration only", www.kuroshioai.com.
- Also offer smaller PDFs: **single work-order ticket PDF** and **single asset PPM history PDF** (download buttons on those pages).
- File names like `AAU-FM-Report-2026-10-AlAin.pdf`.
- Report numbers must be calculated from the current store data (so new tickets/PPM completions made during the demo appear in the PDF).

Optional add-ons (show only as "Available add-ons" cards, not full screens): lab/cold storage alarms, water & leak monitoring, generator monitoring, panel hot-spot sensors.

## Screens / navigation
- Sidebar: Overview · SMDB Monitoring · Predictive Maintenance · Logbook & PPM · Complaints · Energy Analytics · Monthly Report · How it works
- Top bar: campus switcher (Al Ain / Abu Dhabi), "Sample data" badge, Kuroshio AI logo text.
- **Overview** = KPI cards (active alerts, open tickets, PPM completion %, today's kWh, CO₂ this month) + mini charts.
- Mobile-friendly views for the QR scan → checklist and QR → complaint flows (these are what a technician/student sees on a phone).

## Tech stack
- **React + TypeScript + Vite** (scaffold with `npm create vite@latest . -- --template react-ts`).
- TypeScript in strict mode; define shared types in `src/types/` (User, Role, Permission, Asset, PpmTask, Ticket, Technician, Room, Smdb, Reading, Alert, EnergyRecord, AcademicPeriod). No `any` unless unavoidable.
- **Tailwind CSS**, **Recharts** for charts, **React Router** for pages, **lucide-react** for icons.
- `qrcode.react` for QR codes; `jspdf` + `jspdf-autotable` + `html2canvas` for PDFs.
- Seed data in `src/data/` (buildings, rooms, technicians, smdbs, assets, ppmTasks, tickets, energy, academicCalendar).
- State in React Context + reducer, persisted to localStorage (see above). No backend.
- Must deploy as a static site (GitHub Pages or Netlify).

## Design
- Clean, professional, technical look. Light theme. Navy + teal + amber accents; avoid generic purple gradients.
- Status colours: green = normal/ok, amber = warning/watch/due, red = alert/tripped/overdue.
- Readable on a laptop projected in a meeting room (large KPI numbers, clear labels).

## Developer notes
- The developer (Ajas) is on **Windows, PowerShell 5.1**. Give PowerShell-compatible commands (no `&&` chaining in PS 5.1 — use `;` or separate lines).
- Repo: `github.com/Ajaskhan-AI/al-ain-university`, local folder `C:\Users\ajask\OneDrive\Documentos\dev\al-ain-university`.
- Explain new concepts briefly — Ajas is learning full-stack development.
- Build one module at a time, run it, then commit. Small, clear commit messages.
- Suggested build order: project setup + layout → types + data store + seed data → demo login + role switcher + permissions → Module 4 (complaints) → Module 3 (PPM) → Module 6 (PDF reports) → simulator + Module 1 → Module 2 → Module 5 → Overview → How it works.
- Run `npm run build` (which type-checks) before each commit; fix all TypeScript errors.

## Commands
```powershell
npm install
npm run dev      # start local dev server
npm run build    # type-check + production build
npm run preview  # preview the production build
```
