# Test Automation Framework — Build Journal & Architecture Decisions

**Project:** `python-playwright-automation-framework-api-ui`
**Application under test:** BrightPath HR Portal — https://python-playwright-automation-framew-eight.vercel.app
**Stack:** Python · pytest · Playwright · GitHub Actions (planned)

This is a living document. Each phase adds a section covering *what* was built, *why* it was built that way, and the talking points that come out of it.

---

## Phase 0–1 — Foundation (complete)

### What exists now

```
PythonPlaywright/                     ← repo root
├── .venv/                            ← virtual environment (NOT committed)
├── ui-testing-showcase/              ← the application under test
├── tests/
│   └── ui/
│       └── test_smoke.py             ← first test
├── requirements.txt                  ← pinned dependencies
├── pytest.ini                        ← pytest + base_url configuration
├── .gitignore
└── README.md
```

Current state: **1 test, passing**, running against the deployed Vercel environment.

---

### 1. The virtual environment (`.venv`)

**What it is.** A self-contained Python installation living inside the project folder. When activated, `python` and `pip` refer to *this* copy, not the system-wide one.

**Commands used.**

```powershell
python -m venv .venv              # create (takes ~30-60s, silent — let it finish)
.\.venv\Scripts\Activate.ps1      # activate (PowerShell — note the .ps1)
```

Success indicator: the prompt shows `(.venv)`.

**Why it matters architecturally.** Without isolation, every Python project on the machine shares one dependency pool — install a package for project A and you can silently break project B. More importantly, an isolated environment is a *reproducible* one: the framework declares what it needs, and any machine (including a CI runner that starts from nothing) can construct an identical environment on demand.

**Key principle:** the venv is disposable and is never committed. If it breaks, delete it and rebuild in a minute. What gets committed is the *recipe*, not the *result*.

---

### 2. Dependency pinning (`requirements.txt`)

```
pytest==8.3.3
pytest-playwright==0.5.2
```

**Why `==` and not `>=`.** Exact pins mean a suite that passes today passes identically in six months on a colleague's laptop and on a CI runner. Loose version ranges are the single most common cause of "the pipeline broke and nobody changed anything" — a transitive dependency published a new release overnight.

The trade-off is deliberate: pinning means security patches and improvements do not arrive automatically. The mitigation is a *scheduled* dependency review (monthly, or automated via Dependabot) rather than accidental upgrades on random days. **Upgrades should be events, not accidents.**

**Why `pytest-playwright` rather than hand-rolling browser setup.** The plugin supplies the browser/context/page fixtures, lifecycle management, and CLI flags (`--headed`, `--browser`, `--tracing`) out of the box. Writing that from scratch produces code that must be maintained forever and does nothing competitors' frameworks don't already do. The architectural rule: **buy the commodity, build only what is specific to your application.** Custom code should encode *your* domain, not re-implement infrastructure.

---

### 3. pytest configuration (`pytest.ini`)

```ini
[pytest]
testpaths = tests
base_url = https://python-playwright-automation-framew-eight.vercel.app
```

**`testpaths`** — restricts collection to `tests/`. Without it, pytest walks the entire repo, including `ui-testing-showcase/node_modules` (thousands of directories). This is both a speed and a correctness measure.

**`base_url`** — supplied by the `pytest-base-url` plugin (pulled in by pytest-playwright). Tests call `page.goto("/apply")` with a relative path; the environment is resolved in exactly one place.

**Why this is an architecture decision, not a convenience.** A URL hardcoded inside a test is a dependency on an environment baked into test logic. The moment the suite needs to run against local, staging, and production, every test must be edited. Centralising it means the environment becomes a runtime parameter:

```powershell
pytest --base-url http://localhost:5173      # same tests, different environment
```

This one line is the seed of the configuration layer built in Phase 3.

---

### 4. The first test — line by line

```python
import re
from playwright.sync_api import Page, expect


def test_dashboard_loads(page: Page):
    page.goto("/")
    expect(page).to_have_title(re.compile("BrightPath"))
    expect(page.get_by_test_id("employee-table")).to_be_visible()
    expect(page.get_by_test_id("card-total-employees-value")).to_have_text("32")
```

| Element | What it does | Why it is written this way |
|---|---|---|
| `test_` prefix | How pytest discovers tests | Convention-based discovery — no test registry to maintain, no file that must be updated when a test is added |
| `page: Page` | A pytest **fixture** | Requested by name in the signature; pytest constructs a fresh browser page and tears it down automatically. Zero setup/teardown code in the test |
| `page.goto("/")` | Relative navigation | Resolved against `base_url` — environment-agnostic |
| `expect(...)` | Playwright **web-first assertion** | Auto-retries until the condition holds or the timeout expires |
| `get_by_test_id(...)` | Locator by `data-testid` | Decoupled from styling and copy (see below) |

**Test isolation.** Every test receives its own browser context: fresh cookies, fresh storage, no shared state. Tests therefore cannot leak into each other and can safely run in parallel later. Shared mutable state between tests is one of the most expensive mistakes a framework can bake in, because it surfaces as *intermittent* failures that look like application bugs.

---

### 5. Auto-waiting and the elimination of `sleep`

The dashboard displays a loading spinner for ~1.2 seconds before the table exists. The test contains **no wait of any kind** — yet it passes reliably.

`expect(locator).to_be_visible()` polls until the condition is true or the timeout (default 5s) expires. Playwright additionally checks *actionability* before interacting — an element must be attached, visible, stable, enabled, and unobscured before a click is dispatched.

**Why hard waits are prohibited in this framework.** `time.sleep(3)` is simultaneously:

- **too short** — on a slow CI runner, the element is not ready and the test fails (flake), and
- **too long** — locally the element appeared in 200ms and 2.8 seconds were wasted, multiplied by every test in the suite.

Hard waits are therefore the rare defect that damages *reliability* and *execution time* at the same time — the two headline metrics of any automation program. Web-first assertions remove the entire category.

**Standard to enforce:** no `time.sleep()` in any test. Where a wait is genuinely needed, wait on an observable application state (an element, a network response, a URL), never on the clock.

---

### 6. Locator strategy

The application was purpose-built with stable `data-testid` attributes on every meaningful element, using deterministic naming:

- `employee-row-1001` — table rows keyed by business ID
- `error-firstName` — validation messages keyed by field
- `submit-success` / `submit-error` — outcome states

**Locator priority order adopted for this framework:**

1. `get_by_test_id()` — a contract with the developers; immune to redesign
2. `get_by_role()` / `get_by_label()` — semantic and accessibility-aligned; good for form fields
3. `get_by_text()` — acceptable for genuinely user-visible content assertions
4. CSS/XPath structural selectors — **avoided**

**Why the order.** `div > div:nth-child(3) > span` documents today's DOM structure, not the user's intent, and breaks the next time a developer wraps something in a container. Locator churn from structural selectors is one of the largest hidden maintenance costs in a mature suite.

**The strategic point:** testability is a property that can be *designed in*, not merely coped with. Agreeing a `data-testid` convention with the engineering team costs them minutes and removes an entire class of downstream maintenance. Framework architecture extends upstream into the application, not just into the test code.

---

### 7. Tooling for locator discovery and debugging

```powershell
playwright codegen <url>        # record interactions, observe suggested locators
pytest --headed --slowmo 500    # watch execution in a visible browser
```

```python
page.pause()                    # opens Playwright Inspector — step through, try locators live
```

**Discipline note.** Recorded scripts are drafts, never deliverables — they inline locators, contain no abstractions, and assert little. Codegen is used to *discover* locators; the test itself is written deliberately. Committing generated scripts is a fast route to an unmaintainable suite.

`page.pause()` must never be committed — it blocks indefinitely and would hang a CI run.

---

## Architecture decisions recorded so far

| # | Decision | Rationale | Trade-off accepted |
|---|---|---|---|
| 1 | Virtual environment per project | Reproducible, isolated dependencies | One extra setup step for newcomers |
| 2 | Exactly-pinned dependencies | Deterministic builds across machines and time | Upgrades require deliberate scheduled review |
| 3 | Official `pytest-playwright` plugin over custom browser management | Do not maintain commodity infrastructure | Bound to the plugin's fixture design |
| 4 | `base_url` centralised in configuration | Environment becomes a runtime parameter | Requires discipline: no absolute URLs in tests |
| 5 | `data-testid` as the primary locator strategy | Decouples tests from markup and styling | Requires developer cooperation to maintain the attributes |
| 6 | Web-first assertions; `time.sleep` banned | Protects reliability and execution time together | Team must learn to think in conditions, not durations |
| 7 | Mono-repo (app + framework together) | Single portfolio artefact; app and tests version together | Requires per-project root directory config in Vercel |

---

## Talking points

**On starting a framework.** The first decisions made are configuration, dependency management, and locator strategy — before any test is written. Those three determine what maintenance costs look like at 500 tests. Test count is an output; the framework is the thing that governs the cost of each additional test.

**On reliability.** Flakiness is designed out rather than retried away. Banning hard waits, isolating state per test, and using web-first assertions eliminate the majority of flake causes structurally. Retries are a diagnostic signal, not a fix — a test that only passes on retry is an open defect, in the test or in the application.

**On build-versus-buy.** Custom framework code should encode domain-specific knowledge — the application's workflows, its data, its rules. Anything already solved by the ecosystem (browser lifecycle, reporting, parallelism) is adopted, not rebuilt. Every line of bespoke infrastructure is a permanent maintenance liability with no differentiating value.

**On measurement (foundation laid here).** Baseline execution time was noted from the very first run (~30s for one test, dominated by browser start-up and network latency to the deployed environment). Establishing the baseline early is what makes later optimisation defensible rather than anecdotal.

---

## Command reference

```powershell
.\.venv\Scripts\Activate.ps1              # activate the environment
pip install -r requirements.txt           # install pinned dependencies
playwright install chromium               # install the browser binary (one time)

pytest                                    # run everything, headless
pytest --headed --slowmo 500              # run visibly, slowed for observation
pytest -v                                 # verbose: one line per test
pytest tests/ui/test_smoke.py             # run a single file
pytest -k dashboard                       # run tests matching a name pattern
pytest --base-url http://localhost:5173   # override the target environment
```

---

## Roadmap

| Phase | Focus | Status |
|---|---|---|
| 0–1 | Environment, dependencies, first passing test | ✅ Complete |
| 2 | Page Object Model — reusable components, separation of concerns | Next |
| 3 | Configuration layer, custom fixtures, multi-environment support | |
| 4 | Full suites: happy paths, negative cases, markers, data-driven tests | |
| 5 | Tracing, HTML reporting, parallel execution, retry policy | |
| 6 | CI/CD — GitHub Actions, artefacts, pipeline gating | |
| 7 | Metrics, flake tracking, test-inventory governance, anti-bloat policy | |
| 8 | API test layer and the UI/API testing-pyramid split | |
