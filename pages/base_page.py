from playwright.sync_api import Page

class BasePage:
    """Behavior shared by every page object."""

    PATH = "/"

    def __init__(self, page: Page):
        self.page = page

    def open(self):
        self.page.goto(self.PATH)
        return self

    def current_path(self) -> str:
        return self.page.url