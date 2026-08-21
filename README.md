# Python Playwright Automation Framework — UI + API

![Test Automation](https://github.com/sharingkapotter/python-playwright-automation-framework-api-ui/actions/workflows/ci.yml/badge.svg)

A production-grade test automation framework built with **Python, pytest and Playwright**, covering both UI and API layers of a purpose-built application. This repository demonstrates framework architecture, CI/CD integration, and automation governance — not just test scripts.

**Live application under test:** https://python-playwright-automation-framew-eight.vercel.app

---

## Suite at a glance

| Layer | Tests | Duration | Cost per test |
|---|---|---|---|
| API | 10 | 2.3 s | ~0.19 s |
| UI | 23 | ~28 s | ~1.2 s |

A UI test costs roughly six times what an API test costs. That ratio drives the layering policy documented in [`docs/test-strategy.md`](docs/test-strategy.md): the UI verifies that an error *appears*, the API verifies that the rule is *enforced*.

---

## What this demonstrates

| Capability | Where to look |
|---|---|
| Page Object Model with reusable component objects | `pages/`, `components/` |
| API client layer — endpoint definitions, no assertions | `clients/reqres_client.py` |
| Dependency injection via pytest fixtures | `conftest.py` |
| Multi-environment configuration (local / preview / prod) | `config/settings.py` |
| Test data builders for maintainable scenarios | `data/applicant.py` |
| Data-driven negative testing | `tests/ui/test_application_form.py` |
| Secret handling — `.env` git-ignored, CI via repository secrets | `.env.example`, `.github/workflows/ci.yml` |
| CI pipelines — smoke gate, hermetic regression, API job | `.github/workflows/ci.yml` |
| Suite health metrics with trend tracking | `tools/metrics.py` |
| Automation strategy, metrics and anti-bloat policy | [`docs/test-strategy.md`](docs/test-strategy.md) |
| Build journal — 22 architecture decisions with trade-offs | [`docs/framework-guide.md`](docs/framework-guide.md) |

---

## Repository structure

```text
.
├── .github/
│   └── workflows/
│       └── ci.yml              # smoke, regression and API pipelines
├── clients/                    # API client objects
├── components/                 # reusable widget objects (pagination)
├── config/                     # typed environment definitions
├── data/                       # test data builders
├── docs/                       # build journal and test strategy
├── pages/                      # page objects
├── tests/
│   ├── ui/                     # UI suites (23 tests)
│   └── api/                    # API suites (10 tests)
├── tools/
│   └── metrics.py              # suite health reporting
├── ui-testing-showcase/        # target application (React + Vite)
├── conftest.py                 # fixtures and CLI options
├── pytest.ini                  # configuration and markers
├── .env.example                # required environment variables
└── requirements.txt            # pinned dependencies
```

---

## Quick start

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
playwright install chromium
copy .env.example .env          # then add your API key
pytest
```

## Running tests

```powershell
pytest                            # full suite (33 tests)
pytest -m smoke                   # critical path only
pytest -m api                     # API layer only (~2 s, no browser needed)
pytest -m regression              # full functional coverage
pytest -m negative                # invalid input and failure paths
pytest --env local                # run against http://localhost:5173
pytest -n auto                    # parallel execution
pytest --headed --slowmo 500      # watch it run
python tools/metrics.py           # suite health summary and trend
```

Failures automatically produce a Playwright trace and screenshot under `test-results/`:

```powershell
playwright show-trace test-results\<test-name>\trace.zip
```

---

## CI pipeline

Three jobs, each answering a different question:

- **Smoke — deployed environment**: every push and pull request, run against the live deployment. Verifies the real artefact in its real environment, catching deployment and infrastructure faults. Gated at 47 seconds.
- **Regression — hermetic build**: nightly and on demand. Builds the application from source, serves it locally, runs the full suite in parallel — so a red result means the code is broken, not that a host was slow.
- **API tests**: every push. Requires no browser binary, so it completes in well under a minute.

Reports and failure artefacts are uploaded from every job.

---

## Framework standards

Enforced by review; violations are treated as defects.

1. No `time.sleep()` — wait on observable application state, never on the clock.
2. Assert with `expect(locator)`, not on extracted strings, unless the value is needed for logic.
3. Locator priority: `data-testid` > role/label > text. Structural CSS and XPath are prohibited.
4. No assertions inside page objects — pages describe capability, tests own expectation.
5. Every test passes in isolation and in any order; no shared state.
6. No global retries — flaky tests are quarantined with a one-sprint time-box, then fixed or deleted.
7. Every test carries exactly one purpose marker; `--strict-markers` fails the run on a typo.

---

## Target application

BrightPath HR Portal (`ui-testing-showcase/`) is a React + Vite business application built deliberately for automation:

- **Dashboard** — sortable and filterable table, search, pagination, simulated loading delay
- **Application form** — every input type, full client-side validation, deterministic success and server-error paths
- **Component playground** — modals, tabs, accordions, tooltips, alerts, and elements that appear after delays

Every interactive element carries a stable `data-testid`, and the dataset is deterministic, so exact-value assertions are safe.

```powershell
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
- [x] API test layer and UI/API coverage split
