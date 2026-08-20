# Python Playwright Automation Framework — API + UI

A portfolio automation framework demonstrating professional SDET skills: UI test automation with **Playwright (Python)** against a purpose-built React demo application, with **API test automation** to follow.

## Repository structure

```
├── ui-testing-showcase/     # Target application: BrightPath HR Portal (React + Vite)
│                            # Deployed to Vercel; see its README for details
├── tests/
│   ├── ui/                  # Playwright UI tests (in progress)
│   └── api/                 # API tests (planned)
└── README.md
```

## The target application

**BrightPath HR Portal** (`ui-testing-showcase/`) is a small business-style React app built specifically for test automation practice:

- Dashboard with sortable/filterable table, search, and pagination
- Job application form with full validation and negative scenarios
- Component playground: modals, tabs, accordions, tooltips, alerts, and dynamic elements with deliberate loading delays
- Every element exposes a stable `data-testid`; deterministic data makes exact assertions safe

Live demo: _(add your Vercel URL here after deploying)_

## Roadmap

- [x] Build and deploy the target UI application
- [ ] Playwright (Python) UI test suite — page object model, fixtures, parallel execution
- [ ] API test suite
- [ ] CI pipeline (GitHub Actions) with HTML reporting

## Running the target app locally

```bash
cd ui-testing-showcase
npm install
npm run dev     # http://localhost:5173
```
