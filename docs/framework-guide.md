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

---

## Phase 2 — Page Object Model (complete)

### The problem being solved

With locators written inline in tests, a single renamed `data-testid` requires editing every test that touches that element. At 80 tests against one screen, that is 80 edits. Locator churn of this kind is the largest hidden maintenance cost in a mature suite and the most common reason teams abandon automation.

**The rule:** a locator is defined exactly once, in the object that owns it.

### Structure added

```
pages/
├── __init__.py
├── base_page.py          ← shared behaviour for all pages
└── dashboard_page.py     ← one screen
components/
├── __init__.py
└── pagination.py         ← one reusable widget
```

### Design rules adopted

**Locators are attributes; behaviours are methods.** `search_for("Alice")` expresses user intent. A test never says "type into this input" — translating intent into interaction is the page object's job.

**The page owns its own definition of "loaded".** `DashboardPage.open()` waits for the table before returning, because the dashboard shows a spinner for ~1.2 seconds. Without this, every test would repeat the wait, and eventually one would omit it and become flaky.

**Methods return `self`.** Enables chaining (`page.open().search_for("Alice")`) and keeps tests reading as sentences.

**No assertions inside page objects.** Page objects describe *capability*; tests own *expectation*. Mixing the two produces page objects that can only be used by the one test whose assertions they contain.

### Component objects — composition over inheritance

Pagination is not a page. It is a widget appearing on many pages. Implemented as a method on `DashboardPage`, the second paginated screen would copy it; implemented as a component object that pages *contain*, the second screen costs nothing.

```python
class DashboardPage(BasePage):
    def __init__(self, page):
        ...
        self.pagination = Pagination(page)   # composed, not inherited
```

Child locators are scoped inside the component's root (`self.root.get_by_test_id(...)`), so two paginators on one screen never collide.

**Why not inheritance:** deep hierarchies in test frameworks converge on a `BasePage` with dozens of unrelated methods that nobody can safely change. Composition keeps each unit small, independently testable, and independently replaceable.

### Assertion boundary — a framework standard

| Use | When | Why |
|---|---|---|
| `expect(locator)` | Any UI-produced state | Auto-retries until true or timeout |
| plain `assert` | A value already extracted for logic | Evaluates once — no retry |

`assert page.get_by_test_id("x").inner_text() == "5"` is a classic flake source: it fails whenever the app is 50 ms slower. **Assert on locators, not on extracted strings, unless the value itself is needed.**

### Incident: the pagination failure

A test failed with `Actual value: Page 1 of 4` after 14 retries. Diagnosis sequence:

1. **Read the failure literally.** The locator resolved 14 times — so the assertion was not mistargeted. The click produced no state change.
2. **Establish deterministic vs intermittent.** It failed on every run — a defect, not a race. This distinction determines the entire investigation path and should always be step one.
3. **Root cause:** `self.next_button` had been assigned `get_by_test_id("pagination-info")` — the click was landing on a `<span>`, which does nothing.

**Lessons carried forward:**

- Actionability checks verify the element *named*, not that the *right* element was named. `to_be_enabled()` passed trivially because a `<span>` is never disabled. Role-based locators (`get_by_role("button", name="Next page")`) would have failed loudly instead — worth considering as the standard for interactive elements while `data-testid` remains the standard for content assertions.
- The defect was in the test, not the application. **False failures are more corrosive than missing coverage:** once a team learns that red does not mean broken, real regressions pass unnoticed. Test code is production code.
- Environmental explanations ("the network is slow", "CI is flaky") should be the *last* hypothesis, not the first.

---

## Phase 3 — Configuration layer and fixtures (complete)

### The problems being solved

1. The target environment was hardcoded in `pytest.ini` — running against local and production required editing a file.
2. Every test repeated `DashboardPage(page).open()` — setup knowledge duplicated rather than injected.

### Structure added

```
config/
├── __init__.py
└── settings.py           ← typed environment definitions
conftest.py               ← composition root: options, fixtures, wiring
```

### Environments as typed objects

```python
@dataclass(frozen=True)
class Environment:
    name: str
    base_url: str

ENVIRONMENTS = {"local": ..., "preview": ..., "prod": ...}
```

**Why a dataclass rather than a dict of strings.** An environment currently holds one URL. It will soon hold an API base URL, a timeout profile, credentials, and feature flags. A typed object grows cleanly and supports autocomplete and refactoring; a bare dict degrades into stringly-typed keys that cannot be changed safely. `frozen=True` prevents a test from mutating shared configuration mid-run.

### `conftest.py` as the composition root

pytest discovers `conftest.py` automatically and shares its contents with every test beneath it — no imports required. It is the single place where the framework's pieces are wired together.

```python
def pytest_addoption(parser):
    parser.addoption("--env", default="prod", help="local | preview | prod")

@pytest.fixture(scope="session")
def environment(request):
    name = request.config.getoption("--env")
    if name not in ENVIRONMENTS:
        raise pytest.UsageError(f"Unknown --env '{name}'. Choose from {list(ENVIRONMENTS)}")
    return ENVIRONMENTS[name]

@pytest.fixture(scope="session")
def base_url(request, environment):
    return request.config.getoption("--base-url") or environment.base_url
```

**Fail fast on invalid input.** `--env stagng` raises immediately (measured: 0.04 s) rather than launching browsers and producing dozens of confusing connection errors. Cheap validation before expensive work.

**Layered precedence:** explicit `--base-url` > named `--env` > default. This is what allows one suite to serve a developer laptop, an ephemeral PR preview URL, and a scheduled production run without modification.

**Fixture overriding.** `base_url` and `browser_context_args` already exist in the installed plugins. Redefining them *while requesting the original as an argument* extends the plugin rather than replacing it — customisation without forking.

### Fixtures are dependency injection

```python
@pytest.fixture
def dashboard(page):
    return DashboardPage(page).open()

def test_search_filters_the_table(dashboard):   # precondition requested by name
    ...
```

This is the structural advantage of pytest fixtures over `setUp`: `setUp` is one shared block every test in a class must accept, whereas fixtures are composable and requested individually.

**The trade-off, stated explicitly.** The `dashboard` fixture waits past the loading spinner, so a test that needs to *observe* the spinner cannot use it and must take raw `page`. Setup fixtures should encode the *common* precondition, not every precondition — an abstraction that forces all cases through one path makes tests contort themselves to opt out. Knowing where an abstraction should stop is as important as creating it.

### Incident: packages created in the wrong directory

`pages/`, `components/` and `config/` were initially created inside `tests/ui/`. Phase 2 worked anyway, because pytest inserts the *test file's own directory* into `sys.path` — so `from pages...` resolved by accident. Phase 3 broke, because `conftest.py` sits at the repository root and can only import root-level packages.

**Lesson:** an import succeeding is not evidence that a file is correctly located. Python's dynamic path resolution can make misplaced code appear correct until an unrelated change exposes it. `pythonpath = .` in `pytest.ini` makes the import root explicit and deterministic rather than dependent on collection order.

---

## Architecture decisions (continued)

| # | Decision | Rationale | Trade-off accepted |
|---|---|---|---|
| 8 | Page Object Model | One definition per locator; tests express intent | Indirection — a reader must open two files to see the full picture |
| 9 | Component objects for reusable widgets | Reuse across pages; composition over inheritance | More small classes to navigate |
| 10 | No assertions inside page objects | Page objects stay reusable across differing expectations | Slightly more verbose tests |
| 11 | Typed `Environment` objects over string config | Grows to hold credentials, timeouts, feature flags | More ceremony than a dict for the trivial case |
| 12 | `conftest.py` as composition root | Automatic discovery; single wiring point | Implicit — newcomers must learn that fixtures arrive by name |
| 13 | Layered `base_url` precedence (flag > env > default) | One suite serves laptop, PR preview, and production | Two ways to set the same value; documentation required |
| 14 | Page-object setup fixtures (`dashboard`, `application_form`) | Removes repeated navigation from every test | Tests needing pre-load state must bypass the fixture |

---

## Talking points (continued)

**On maintenance cost as the real metric.** Test count is an output; the framework governs the *cost of each additional test*. POM plus component objects mean one concept lives in one place, so maintenance grows sub-linearly with coverage. That is the structural answer to automation bloat — considerably stronger than "we review tests periodically".

**On flaky-test triage.** The first question is always *deterministic or intermittent*, because the two demand different investigations. Evidence comes from traces (`--tracing retain-on-failure`, then `playwright show-trace`), which capture DOM snapshots before and after every action. Retries are a diagnostic signal, never a remedy: a test that only passes on retry is an open defect in the test or the application.

**On trust in the suite.** A red suite that does not mean "broken" is worse than no suite. False failures train a team to ignore results, and the first ignored real regression is the cost. This is why test code is held to production standards — review, refactoring, and ownership included.

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
| 2 | Page Object Model — reusable components, separation of concerns | ✅ Complete |
| 3 | Configuration layer, custom fixtures, multi-environment support | ✅ Complete |
| 4 | Full suites: happy paths, negative cases, markers, data-driven tests | In progress |
| 5 | Tracing, HTML reporting, parallel execution, retry policy | |
| 6 | CI/CD — GitHub Actions, artefacts, pipeline gating | |
| 7 | Metrics, flake tracking, test-inventory governance, anti-bloat policy | |
| 8 | API test layer and the UI/API testing-pyramid split | |
