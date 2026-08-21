from playwright.sync_api import Page

from components.pagination import Pagination
from pages.base_page import BasePage


class DashboardPage(BasePage):
    PATH = "/"

    def __init__(self, page: Page):
        super().__init__(page)
        self.heading = page.get_by_test_id("dashboard-heading")
        self.loading_spinner = page.get_by_test_id("table-loading")
        self.table = page.get_by_test_id("employee-table")
        self.table_body = page.get_by_test_id("employee-table-body")
        self.rows = self.table_body.locator("tr")
        self.search_input = page.get_by_test_id("search-input")
        self.department_filter = page.get_by_test_id("department-filter")
        self.status_filter = page.get_by_test_id("status-filter")
        self.clear_filters_button = page.get_by_test_id("clear-filters-button")
        self.result_count = page.get_by_test_id("result-count")
        self.empty_state = page.get_by_test_id("empty-state")
        self.total_employees = page.get_by_test_id("card-total-employees-value")
        self.pagination = Pagination(page)

    def open(self):
        super().open()
        self.table.wait_for()
        return self

    def search_for(self, term: str):
        self.search_input.fill(term)
        return self

    def filter_by_department(self, department: str):
        self.department_filter.select_option(department)
        return self

    def sort_by(self, column: str):
        self.page.get_by_test_id(f"sort-{column}").click()
        return self

    def employee_names(self) -> list[str]:
        return self.table_body.locator('[data-testid^="cell-name-"]').all_text_contents()