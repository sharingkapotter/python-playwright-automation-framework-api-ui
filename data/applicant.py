from dataclasses import dataclass, replace


@dataclass(frozen=True)
class Applicant:
    """Test data for one job application."""

    first_name: str = "Sunil"
    last_name: str = "Tester"
    email: str = "sunil.tester@example.com"
    phone: str = "5551234567"
    position: str = "QA Automation Engineer"
    employment_type: str = "fulltime"
    skills: tuple = ("playwright", "python")
    experience: int = 8
    expected_salary: str = "125000"
    start_date: str = "2026-10-01"
    cover_letter: str = "Experienced SDET focused on scalable automation frameworks."


def an_applicant(**overrides) -> Applicant:
    """Return a valid applicant, with any field overridden for the scenario under test."""
    return replace(Applicant(), **overrides)