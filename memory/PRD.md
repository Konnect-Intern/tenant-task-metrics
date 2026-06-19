# Konnectify — Task Usage Analytics Tab (Tenant-level)

## Original Problem Statement
Design a tenant-level Task Usage Analytics UI for iPaaS Admin, added as a new tab on the
existing tenant detail page (shown in the supplied screenshot). Backend can provide monthly
and yearly task-usage data for Konnectors, Agents, MCP Servers and Combined tenant usage,
each exposing: Total / Billable / Successful / Failed counts. Deliver a polished, high-fidelity
mockup with realistic mock data, following the supplied design system. All other tabs should
remain present but mocked statically.

## User Choices Captured
- Tab name: **Task Usage**
- Default view: agent decided based on best UX → **Monthly**
- Chart library: **recharts**
- Comparison features: **rich but not too much** → delta pills, vs-period summary, drill-down
- Other tabs: keep existing tabs visible (mocked content)

## Architecture / What Was Built
- **Frontend-only, fully static mockup** (no backend changes required by problem statement).
- Updated design tokens (`/app/frontend/src/index.css`, `tailwind.config.js`) to mirror the
  Konnectify orchestrator-ui design system (green primary, accent green tints, OKLCH-derived
  HSL values, chart palette).
- Loaded **Inter** + **Geist Mono** via Google Fonts.

### New Files
- `src/pages/AdminTenantPage.jsx` — Top bar + sidebar + tenant header + tabs row (Profile,
  Users, Konnectors, Event Logs, Feature Customization, **Task Usage**). Feature Customization
  also gets a static recreation matching the screenshot.
- `src/components/admin/TopBar.jsx` — Hamburger, Konnectify logo, **+ New** button, avatar.
- `src/components/admin/Sidebar.jsx` — 7-item sidebar with Customers active.
- `src/components/admin/TaskUsageTab.jsx` — The hero deliverable:
  - Header row with Monthly/Yearly toggle, Resource filter (combined / konnectors / agents / mcp),
    Export button, "Live" pulse indicator, period label + comparison summary.
  - 4 KPI cards (Total / Billable / Successful / Failed) with delta pills (inverse semantics
    for Failed → red is good), info tooltips.
  - Main chart card with 3 tabs: **Trend** (area), **By Resource** (stacked bars),
    **Success vs Failed** (dual area).
  - Two-column section: **Usage Distribution** donut with center-total + legend bars, and
    **Performance by Resource** list with per-resource success-rate stacked bars + delta.
  - **Detailed table** with sparklines per row, highlighted "Combined (Tenant Total)" row.
- `src/lib/usageMockData.js` — Realistic mock data with monthly (30-day daily breakdown)
  and yearly (12-month) shapes, per-resource breakdowns, KPIs and sparkline series.

### Interactions (all working live)
- Period toggle (Monthly ↔ Yearly) updates every section
- Resource filter changes trend chart series
- Chart tab switcher (Trend / By Resource / Success vs Failed)
- Hover tooltips on every chart with branded styling
- Cross-tab navigation (Task Usage is the default active tab to showcase the work)

## What's Implemented (date: 2026-02)
- [x] Design tokens adapted from supplied design system
- [x] Static recreation of existing admin shell (sidebar + topbar + tenant header)
- [x] All 5 existing tabs preserved (with Feature Customization recreated visually)
- [x] New **Task Usage** tab — both Monthly + Yearly views fully designed
- [x] data-testid attributes on every interactive element

## Backlog / Next Tasks (P0/P1/P2)
- **P1** — Wire to real backend endpoints (`GET /api/tenants/:id/usage?period=monthly|yearly&resource=...`)
- **P1** — Date-range picker (custom range beyond preset Monthly/Yearly)
- **P2** — Drill-down: click a resource row to see top failing tasks / top consumers
- **P2** — Export to CSV / PDF
- **P2** — Comparison overlay on charts (current period vs previous period as dotted line)
- **P2** — Threshold alerting (e.g., highlight if Failed % exceeds plan SLA)
