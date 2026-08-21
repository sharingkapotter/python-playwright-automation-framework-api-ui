# Python Playwright Automation Framework — UI + API

![Test Automation](https://github.com/sharingkapotter/python-playwright-automation-framework-api-ui/actions/workflows/ci.yml/badge.svg)

A production-grade test automation framework built with **Python, pytest and Playwright**, tested against a purpose-built React application. This repository demonstrates framework architecture, CI/CD integration, and automation governance — not just test scripts.

**Live application under test:** https://python-playwright-automation-framew-eight.vercel.app

---

## What this demonstrates

| Capability | Where to look |
|---|---|
| Page Object Model with reusable component objects | `pages/`, `components/` |
| Dependency injection via pytest fixtures | `conftest.py` |
| Multi-environment configuration (local / preview / prod) | `config/settings.py` |
| Data builders for maintainable test data | `data/applicant.py` |
| Data-driven negative testing | `tests/ui/test_application_form.py` |
| CI pipelines — smoke gate and hermetic regression | `.github/workflows/ci.yml` |
| Suite health metrics and trend tracking | `tools/metrics.py` |
| Automation strategy, metrics and anti-bloat policy | `docs/test-strategy.md` |
| Architecture decisions with trade-offs | `docs/framework-guide.md` |

---

## Repository structure

├── .github/workflows/ci.yml # smoke + regression pipelines
├── components/ # reusable widget objects (pagination)
├── config/ # typed environment definitions
├── data/ # test data builders
├── docs/ # build journal and test strategy
├── pages/ # page objects
├── tests/
│ ├── ui/ # UI suites (23 tests)
│ └── api/ # API suites (planned)
├── tools/metrics.py # suite health reporting
├── ui-testing-showcase/ # target application (React + Vite)
├── conftest.py # fixtures and CLI options
├── pytest.ini # configuration and markers
└── requirements.txt # pinned dependencies


---

## Quick start

```bash
python -m venv .venv
.venv\Scripts\Activate.ps1        # Windows PowerShell
pip install -r requirements.txt
playwright install chromium
pytest
```

## Running tests

```bash
pytest                            # full suite against production
pytest -m smoke                   # critical path only (< 2 min)
pytest -m regression              # full functional coverage
pytest -m negative                # invalid input and failure paths
pytest --env local                # run against http://localhost:5173
pytest -n auto                    # parallel execution
pytest --headed --slowmo 500      # watch it run
python tools/metrics.py           # suite health summary and trend
```

Failures automatically produce a Playwright trace and screenshot under `test-results/`. Inspect with:

```bash
playwright show-trace test-results/<test-name>/trace.zip
```

---

## CI pipeline

Two jobs, answering different questions:

- **Smoke — deployed environment**: runs on every push and pull request against the live Vercel deployment, verifying the real artifact in its real environment. Gated under two minutes.
- **Regression — hermetic build**: runs nightly and on demand. Builds the application from source, serves it locally, and runs the full suite in parallel — no dependency on external availability.

Reports and failure artifacts are uploaded from both jobs.

---

## Target application

BrightPath HR Portal (`ui-testing-showcase/`) is a React + Vite business application built deliberately for automation:

- **Dashboard** — sortable and filterable table, search, pagination, simulated loading delay
- **Application form** — every input type, full client-side validation, deterministic success and server-error paths
- **Component playground** — modals, tabs, accordions, tooltips, alerts, and elements that appear after delays

Every interactive element carries a stable `data-testid`, and the dataset is deterministic, so exact-value assertions are safe.

```bash
cd ui-testing-showcase
npm install
npm run dev                       # http://localhost:5173
```

---

## Roadmap

- [x] Target application built and deployed
- [x] Page Object Model with reusable components
- [x] Configuration layer and fixtures
- [x] UI suites with markers and data-driven negative tests
- [x] Tracing, HTML reporting, parallel execution
- [x] CI/CD with GitHub Actions
- [x] Metrics, flake policy, anti-bloat strategy
- [ ] API test layer and UI/API coverage split