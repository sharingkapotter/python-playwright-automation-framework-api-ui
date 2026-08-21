import pytest
from pages.application_form_page import ApplicationFormPage

from config.settings import ENVIRONMENTS
from pages.dashboard_page import DashboardPage


def pytest_addoption(parser):
    parser.addoption(
        "--env",
        action="store",
        default="prod",
        help="Target environment: local | preview | prod",
    )


@pytest.fixture(scope="session")
def environment(request):
    name = request.config.getoption("--env")
    if name not in ENVIRONMENTS:
        raise pytest.UsageError(f"Unknown --env '{name}'. Choose from {list(ENVIRONMENTS)}")
    return ENVIRONMENTS[name]


@pytest.fixture(scope="session")
def base_url(request, environment):
    return request.config.getoption("--base-url") or environment.base_url


@pytest.fixture(scope="session")
def browser_context_args(browser_context_args):
    return {**browser_context_args, "viewport": {"width": 1440, "height": 900}}


@pytest.fixture
def dashboard(page):
    return DashboardPage(page).open()


@pytest.fixture
def application_form(page):
    return ApplicationFormPage(page).open()