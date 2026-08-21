import re

from playwright.sync_api import Page, expect

from pages.dashboard_page import DashboardPage


def test_dashboard_loads(page: Page):
    dashboard = DashboardPage(page).open()
    expect(page).to_have_title(re.compile("BrightPath"))
    expect(dashboard.table).to_be_visible()
    expect(dashboard.total_employees).to_have_text("32")


def test_search_filters_the_table(page: Page):
    dashboard = DashboardPage(page).open()
    dashboard.search_for("Alice")
    expect(dashboard.rows).to_have_count(1)
    expect(dashboard.table_body).to_contain_text("Alice Johnson")


def test_filter_by_department(page: Page):
    dashboard = DashboardPage(page).open()
    dashboard.filter_by_department("Finance")
    expect(dashboard.result_count).to_contain_text("of 6 employees")


def test_sorting_by_name(page: Page):
    dashboard = DashboardPage(page).open()
    dashboard.sort_by("name")
    assert dashboard.employee_names()[0] == "Aaron Fischer"


def test_pagination_moves_between_pages(page: Page):
    dashboard = DashboardPage(page).open()
    dashboard.pagination.go_next()
    expect(dashboard.pagination.info).to_have_text("Page 2 of 4")
    dashboard.pagination.go_previous()
    expect(dashboard.pagination.info).to_have_text("Page 1 of 4")