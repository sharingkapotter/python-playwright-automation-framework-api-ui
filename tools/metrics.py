"""Summarise suite health from the latest JUnit XML and append it to a trend file.

Usage:
    pytest                     # writes reports/junit.xml
    python tools/metrics.py    # summarises it and records a history row
"""

import csv
import sys
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path

REPORTS = Path("reports")
JUNIT_XML = REPORTS / "junit.xml"
HISTORY_CSV = REPORTS / "metrics-history.csv"
SLOW_TEST_THRESHOLD_SECONDS = 5.0


def load_results(path: Path) -> dict:
    if not path.exists():
        sys.exit(f"No results at {path}. Run pytest first.")

    root = ET.parse(path).getroot()
    suite = root.find("testsuite") if root.tag == "testsuites" else root

    total = int(suite.get("tests", 0))
    failures = int(suite.get("failures", 0))
    errors = int(suite.get("errors", 0))
    skipped = int(suite.get("skipped", 0))

    cases = [
        {
            "name": f"{case.get('classname', '')}::{case.get('name', '')}",
            "seconds": float(case.get("time", 0.0)),
        }
        for case in suite.iter("testcase")
    ]

    return {
        "total": total,
        "passed": total - failures - errors - skipped,
        "failed": failures + errors,
        "skipped": skipped,
        "duration": float(suite.get("time", 0.0)),
        "cases": cases,
    }


def report(results: dict) -> None:
    total = results["total"] or 1
    pass_rate = results["passed"] / total * 100

    print("\nSuite health")
    print("-" * 46)
    print(f"  Tests executed     {results['total']}")
    print(f"  Passed             {results['passed']}")
    print(f"  Failed             {results['failed']}")
    print(f"  Skipped            {results['skipped']}")
    print(f"  Pass rate          {pass_rate:.1f}%")
    print(f"  Execution time     {results['duration']:.1f}s")

    slow = sorted(results["cases"], key=lambda c: c["seconds"], reverse=True)[:5]
    print("\n  Slowest tests")
    for case in slow:
        flag = "  <-- over threshold" if case["seconds"] > SLOW_TEST_THRESHOLD_SECONDS else ""
        print(f"    {case['seconds']:6.2f}s  {case['name'].split('::')[-1]}{flag}")

    over = [c for c in results["cases"] if c["seconds"] > SLOW_TEST_THRESHOLD_SECONDS]
    if over:
        print(f"\n  {len(over)} test(s) exceed the {SLOW_TEST_THRESHOLD_SECONDS}s budget — review for redundancy.")
    print()


def record_history(results: dict) -> None:
    HISTORY_CSV.parent.mkdir(exist_ok=True)
    is_new = not HISTORY_CSV.exists()
    total = results["total"] or 1

    with HISTORY_CSV.open("a", newline="") as handle:
        writer = csv.writer(handle)
        if is_new:
            writer.writerow(["timestamp", "total", "passed", "failed", "skipped", "pass_rate", "duration_seconds"])
        writer.writerow([
            datetime.now(timezone.utc).isoformat(timespec="seconds"),
            results["total"],
            results["passed"],
            results["failed"],
            results["skipped"],
            f"{results['passed'] / total * 100:.1f}",
            f"{results['duration']:.1f}",
        ])
    print(f"  Trend appended to {HISTORY_CSV}\n")


if __name__ == "__main__":
    data = load_results(JUNIT_XML)
    report(data)
    record_history(data)