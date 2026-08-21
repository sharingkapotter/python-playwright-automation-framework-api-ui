# Test Automation Strategy

**Project:** python-playwright-automation-framework-api-ui
**Application under test:** BrightPath HR Portal
**Status:** living document — reviewed each release cycle

This document defines what gets automated, at which layer, how suite health is measured, and how tests are retired. It exists because a framework's long-term cost is governed by policy, not by tooling.

---

## 1. Testing layers — what belongs where

Automation is assigned to the cheapest layer that can answer the question.

| Layer | Answers | Characteristics | Target share |
|---|---|---|---|
| Unit (app repo) | Does this function behave correctly? | Milliseconds, no browser, run on save | Largest |
| API / service | Does the contract hold? Are rules enforced server-side? | Fast, stable, no rendering | Large |
| UI functional | Does the user-facing behaviour work in a browser? | Seconds, browser required | Deliberately small |
| UI end-to-end | Does a complete business journey hold together? | Slowest, most brittle | Very small |

**Placement rule.** A behaviour is automated at the UI layer only when the browser is essential to the risk. Validation *rules* belong in API or unit tests; validation *rendering* — that the message appears, in the right place, on the right field — belongs in the UI.

**Applied to this project.** Field-level validation logic lives client-side in this application, so it is currently tested through the UI. When the API layer is introduced (Phase 8), rule coverage moves down: the UI keeps one representative case per rendering pattern, and the exhaustive rule matrix moves to API tests. This is the single largest lever for keeping UI execution time flat as coverage grows.

---

## 2. What is deliberately not automated

Automation is an investment with a maintenance cost, not a free good. Excluded by policy:

- **Purely cosmetic styling** — colour, spacing, font. High churn, low risk, better served by design review or visual snapshot tooling used selectively.
- **Third-party behaviour** — the browser's native date picker, the OS file dialog. Testing these tests the vendor, not the product.
- **One-off exploratory questions** — answered by a human once, not encoded forever.
- **Scenarios whose failure carries no business consequence** — every automated test costs execution time and maintenance attention on every future change.
- **Behaviour still in active design churn** — automation written against an unstable UI is rewritten before it ever catches a defect.

Being able to justify *what was not automated* is as important as coverage itself. Unbounded automation is how suites become slow, distrusted, and eventually abandoned.

---

## 3. Test taxonomy

Every test carries exactly one purpose marker, and optionally `negative`.

| Marker | Purpose | Runs when | Time budget |
|---|---|---|---|
| `smoke` | Critical path — is the application fundamentally working? | Every push and PR | < 2 min |
| `regression` | Full functional coverage | Nightly and pre-release | < 20 min |
| `negative` | Invalid input and failure paths | With regression | — |
| `flaky` | Quarantined, under remediation | Excluded from gating jobs | — |

`--strict-markers` is enabled so an unregistered or misspelled marker fails the run. Silent under-execution is invisible in a green build and is therefore treated as a defect class of its own.

---

## 4. Metrics

Each metric exists to drive a specific decision. Metrics that inform no decision are not collected.

| Metric | Definition | Target | Decision it drives |
|---|---|---|---|
| Pass rate | Passed ÷ executed, per run | 100% on main | Anything below 100% blocks release until triaged |
| Execution time | Wall-clock per suite | Smoke < 2 min; regression < 20 min | Breach triggers parallelism review or layer reassignment |
| Slowest tests | Per-test duration, top 10 | No UI test > 5s | Slow tests are reviewed for redundancy or moved to a lower layer |
| Flake rate | Tests failing then passing unchanged ÷ total | < 1% | Above threshold, new feature automation pauses until stability is restored |
| Escaped defects | Production defects that had automatable coverage gaps | Trending down | Each one produces a specific test and a layer decision |
| Suite growth vs. duration | Test count against execution time | Sub-linear | Superlinear growth signals duplication rather than coverage |

**Collection.** `pytest` emits `reports/junit.xml`; `python tools/metrics.py` summarises it and appends a row to `reports/metrics-history.csv`, producing a trend rather than a snapshot. Trend is what supports decisions — a single run tells you almost nothing.

**The most important metric is the last one.** Test count is an output, not an achievement. If 40 new tests add 30 seconds, the framework is healthy; if they add six minutes, the tests are doing work that belongs at a lower layer.

---

## 5. Flaky test policy

A flaky test is defined as one that passes and fails without any change to the application or the test.

Retries are **not** enabled globally. A blanket `--reruns` turns instability into an invisible cost: the build goes green, nobody investigates, and confidence quietly erodes.

**Procedure:**

1. **Classify first.** Establish whether the failure is deterministic or intermittent. A deterministic failure is a defect — in the application or the test — and is fixed, not retried.
2. **Quarantine.** Genuinely intermittent tests are marked `@pytest.mark.flaky(reruns=2)` plus the `flaky` marker, and excluded from gating jobs (`-m "not flaky"`).
3. **Time-box.** Quarantine lasts one sprint. At expiry the test is fixed or deleted. There is no permanent quarantine — that is just a slower way of deleting it while still paying to run it.
4. **Diagnose from evidence.** `--tracing=retain-on-failure` captures DOM snapshots before and after every action; traces are inspected with `playwright show-trace`. Guessing at causes produces speculative fixes that mask rather than resolve.
5. **Report.** Flake rate is published with the other suite metrics so the trend is visible to the whole team.

**Case study — pagination, Phase 2.** A test failed against the deployed environment while passing locally, which invited an environmental explanation. Reading the failure literally showed the locator resolving 14 times, proving the assertion was correctly targeted and the click had produced no state change. The failure was deterministic, and the cause was a locator assigned to the wrong element — the click was landing on a `<span>`. Two conclusions were carried into policy: environmental explanations are the last hypothesis, not the first; and actionability checks verify the element named, not that the correct element was named.

---

## 6. Preventing automation bloat

Bloat is not "too many tests" — it is duplicated knowledge and unjustified coverage. Four mechanisms, structural before procedural:

**Structural (the framework makes duplication difficult):**

- **One locator, one definition.** Page objects mean a renamed `data-testid` is a one-line change regardless of how many tests use it.
- **Component objects for shared widgets.** Pagination is defined once; every future paginated screen reuses it at zero cost.
- **Data builders over inline setup.** `an_applicant(email="bad@example.com")` states only what the scenario changes. A new required field is added in one place, not in forty tests.
- **Parametrisation over copy-paste.** Eight validation cases share one test body: coverage grows with *data*, maintenance grows with *code*, and the two are decoupled.

**Procedural (regular review catches what structure cannot):**

- **Retirement criteria** — a test is removed when it covers a retired feature; duplicates another test's assertions; has never failed in twelve months on stable code *and* covers low-risk behaviour; or costs more maintenance than the risk it mitigates.
- **Review cadence** — the test inventory is reviewed each release cycle against the slowest-tests and growth-versus-duration metrics.
- **Layer reassignment** — the first response to a slow UI suite is to ask what could be verified at the API layer instead, before reaching for more parallelism.
- **Deletion is a normal outcome.** A suite that only ever grows is a suite nobody is managing.

---

## 7. Framework standards

Enforced by review; violations are treated as defects.

1. No `time.sleep()`. Wait on observable application state, never on the clock.
2. Assert with `expect(locator)`, not on extracted strings, unless the value itself is needed for logic.
3. Locator priority: `data-testid` > role/label > text. Structural CSS and XPath are prohibited.
4. No assertions inside page objects — pages describe capability, tests own expectation.
5. No test depends on another test's state; every test must pass in isolation and in any order.
6. No `page.pause()` or `.only`-style focus committed to the repository.
7. Test data is generated or built, never depended on from a shared mutable fixture.
8. Every test carries exactly one purpose marker.

---

## 8. Ownership

Test code is production code: reviewed, refactored, and owned. A failing suite that does not mean "something is broken" is worse than no suite, because it trains the team to ignore results — and the first ignored real regression is the cost of that training.
