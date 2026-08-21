from playwright.sync_api import Page, expect


class Pagination:
    """Reusable pagination control, usable by any page that embeds it."""

    def __init__(self, page: Page, test_id: str = "pagination"):
        self.root = page.get_by_test_id(test_id)
        self.previous_button = self.root.get_by_test_id("pagination-previous")
        self.next_button = self.root.get_by_test_id("pagination-next")
        self.info = self.root.get_by_test_id("pagination-info")

    def go_next(self):
        expect(self.next_button).to_be_enabled()
        self.next_button.click()
        return self

    def go_previous(self):
        expect(self.previous_button).to_be_enabled()
        self.previous_button.click()
        return self

    def current_page(self) -> int:
        return int(self.info.inner_text().split()[1])