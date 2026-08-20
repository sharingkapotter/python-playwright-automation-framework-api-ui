# BrightPath HR Portal — UI Automation Testing Showcase

A small, professional-looking React business application built specifically as a **target application for UI test automation** (Playwright, Selenium, etc.). Every important element has a stable `data-testid`, meaningful `id`/`name` attributes, and accessible labels. The app includes dynamic behavior (simulated network delays, delayed elements, state changes) so you can demonstrate waits, synchronization, and negative testing.

**Tech stack:** React 18 · Vite · React Router · plain CSS (no UI library). No backend — all data is static and deterministic.

---

## Pages

| Route | Page | What it demonstrates |
|---|---|---|
| `/` | **Dashboard** | Summary cards, search box, department/status filter dropdowns, sortable table (click column headers), pagination with prev/next arrows, simulated 1.2s loading spinner, refresh button, empty state |
| `/apply` | **Job Application** | Text/email/tel/number inputs, textarea with character counter, radio buttons, checkboxes, single select, multi-select, date picker, date range, slider, toggle switch, file upload (with type validation), form validation, disabled submit button, simulated submit with spinner and success/error banners |
| `/playground` | **Component Playground** | Modal (open/close/save), tooltip (hover + focus), tabs, accordion, success/error/info alerts, async data loading (2s), delayed element (appears after 3s), click counter, enable/disable field, progress bar, double-click box, toggle with visible state |

### Built-in negative / dynamic scenarios

- Submitting the application form empty (with terms checked) shows validation errors under each field, each with its own `data-testid` (`error-firstName`, `error-email`, …).
- Submitting with an email ending in **`@error.com`** triggers a simulated **server error** banner (`submit-error`). Any other valid email shows the **success** banner (`submit-success`).
- The submit button is **disabled** until the terms checkbox is checked; fields are disabled while submitting.
- Dashboard table, "Load Users", and "Reveal Hidden Element" all render after deliberate delays — no fixed sleeps needed, just proper waits.

---

## Project structure

```
ui-testing-showcase/
├── index.html                  # HTML entry point
├── package.json
├── vite.config.js
├── vercel.json                 # SPA rewrite so deep links work on Vercel
├── smoke.mjs                   # Bonus: Playwright smoke test (18 checks) used to verify the app
├── src/
│   ├── main.jsx                # React entry point
│   ├── App.jsx                 # Layout, navigation, routes
│   ├── styles.css              # All styling (design tokens + components)
│   ├── data/
│   │   └── employees.js        # Static, deterministic employee dataset (32 rows)
│   ├── components/
│   │   ├── Accordion.jsx
│   │   ├── Modal.jsx
│   │   ├── Spinner.jsx
│   │   ├── Tabs.jsx
│   │   └── Tooltip.jsx
│   └── pages/
│       ├── Dashboard.jsx
│       ├── ApplicationForm.jsx
│       └── Playground.jsx
```

---

## Installation

Requires **Node.js 18+**.

```bash
cd ui-testing-showcase
npm install
```

## Run locally

```bash
npm run dev        # dev server → http://localhost:5173
npm run build      # production build → dist/
npm run preview    # serve the production build → http://localhost:4173
```

Optional — run the included Playwright smoke test against the preview build:

```bash
npm run build && npm run preview &   # start server on :4173
node smoke.mjs
```

---

## Deploy to Vercel

**Option A — GitHub (recommended):**

1. Push this folder to a GitHub repository.
2. Go to [vercel.com](https://vercel.com) → **Add New… → Project** → import the repo.
3. Vercel auto-detects Vite. Accept the defaults (build command `vite build`, output `dist`) and click **Deploy**.

**Option B — Vercel CLI:**

```bash
npm install -g vercel
vercel          # first deploy (answer the prompts)
vercel --prod   # production deploy
```

The included `vercel.json` rewrites all routes to `index.html`, so `/apply` and `/playground` work when opened directly.

---

## Locator strategy

- Every interactive element has a stable, unique `data-testid` (kebab-case, never randomized).
- Table rows/cells use ID-based testids: `employee-row-1001`, `cell-name-1001`, `status-badge-1001`.
- Inputs also have meaningful `id` + `name` attributes and proper `<label for>` associations, so `page.get_by_label()` and `page.get_by_role()` work too — good for demonstrating multiple locator strategies.
- Sortable headers expose `aria-sort`; the toggle switches expose `role="switch"`; the modal is `role="dialog"` with `aria-modal`.

Example (Playwright Python):

```python
page.get_by_test_id("search-input").fill("Alice")
expect(page.get_by_test_id("employee-table-body").locator("tr")).to_have_count(1)
```

---

## Suggested Playwright automation scenarios

1. **Table loading wait** — open the Dashboard, assert the spinner (`table-loading`) is visible, then wait for `employee-table` and assert 8 rows on page 1.
2. **Search filtering** — search "Alice", assert exactly one row (`employee-row-1001`); search gibberish and assert the `empty-state` message.
3. **Column sorting** — click `sort-name` and assert first row is "Aaron Fischer"; click again and assert descending order; verify `aria-sort` changes.
4. **Filter combinations** — filter Department=Engineering + Status=Active, assert `result-count` text and that every `status-badge-*` reads "Active".
5. **Pagination** — walk all pages with `pagination-next`, assert `pagination-info` updates, and assert prev/next buttons are disabled on the first/last page.
6. **Form happy path** — fill every field type (text, select, radio, checkboxes, multi-select, date, slider, number, toggle, textarea, file upload), submit, and assert the `submit-success` banner with confirmation ID.
7. **Validation errors** — check the terms box, submit an empty form, and assert each `error-*` message; fix one field and assert its error disappears.
8. **Negative submit** — submit with `someone@error.com` and assert the `submit-error` banner appears after the loading spinner.
9. **Disabled-state assertions** — assert `submit-button` is disabled until `terms-checkbox` is checked; assert `conditional-input` on the Playground enables only after its toggle.
10. **Modal lifecycle** — open the modal, assert focus/visibility, save a name, assert `modal-saved-name` renders; reopen and close via ✕, Cancel, Escape, and overlay click.
11. **Synchronization without sleeps** — click `load-users-button` and `reveal-delayed-button`, and use web-first assertions to wait for `user-list` (2s) and `delayed-element` (3s).
12. **Tabs & accordion** — switch tabs and assert only the active panel is visible (`hidden` attribute); expand/collapse accordion items and verify `aria-expanded`.
13. **Tooltip** — hover (and keyboard-focus) `tooltip-button` and assert the tooltip text becomes visible.
14. **Alerts** — trigger success/error/info alerts, assert stacking, and dismiss them individually.
15. **File upload validation** — upload a `.pdf` and assert the file chip; upload a `.txt` and assert `error-resume`; remove the file and assert the chip disappears.
16. **Progress/state change** — start the progress bar, wait for `progress-complete`; click the counter button N times and assert `click-count`.
17. **Navigation & deep links** — navigate via the top nav, assert active link styling, open `/apply` directly, and test the 404 page + `footer-external-link` (new-tab/popup handling).
18. **E2E journey** — Dashboard → find an employee → navigate to the form → submit an application → verify success → reset form and confirm all fields cleared.

---

*This application intentionally contains no real data. All employees and users are fictional.*
