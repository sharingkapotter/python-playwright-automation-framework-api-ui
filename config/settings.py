from dataclasses import dataclass


@dataclass(frozen=True)
class Environment:
    """One deployable target the suite can run against."""

    name: str
    base_url: str


ENVIRONMENTS = {
    "local": Environment("local", "http://localhost:5173"),
    "preview": Environment("preview", "http://localhost:4173"),
    "prod": Environment("prod", "https://python-playwright-automation-framew-eight.vercel.app"),
}