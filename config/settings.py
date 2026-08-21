import os
from dataclasses import dataclass

from dotenv import load_dotenv

load_dotenv()


@dataclass(frozen=True)
class Environment:
    """One deployable target the suite can run against."""

    name: str
    base_url: str
    api_base_url: str = "https://reqres.in"


ENVIRONMENTS = {
    "local": Environment("local", "http://localhost:5173"),
    "preview": Environment("preview", "http://localhost:4173"),
    "prod": Environment("prod", "https://python-playwright-automation-framew-eight.vercel.app"),
}


def api_key() -> str:
    """API credential, loaded from .env (never committed)."""
    return os.getenv("REQRES_API_KEY", "reqres-free-v1")