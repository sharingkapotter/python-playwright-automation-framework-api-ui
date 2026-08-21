import re

from playwright.sync_api import expect


def test_dashboard_loads(dashboard):
    expect(dashboard.page).to_have_title(re.compile("BrightPath"))
    expect(dashboard.table).to_be_visible()
    expect(dashboard.total_employees).to_have_text("32")


def test_search_filters_the_table(dashboard):
    dashboard.search_for("Alice")
    expect(dashboard.rows).to_have_count(1)
    expect(dashboard.table_body).to_contain_text("Alice Johnson")


def test_filter_by_department(dashboard):
    dashboard.filter_by_department("Finance")
    expect(dashboard.result_count).to_contain_text("of 6 employees")


def test_sorting_by_name(dashboard):
    dashboard.sort_by("name")
    assert dashboard.employee_names()[0] == "Aaron Fischer"


def test_pagination_moves_between_pages(dashboard):
    dashboard.pagination.go_next()
    expect(dashboard.pagination.info).to_have_text("Page 2 of 4")
    dashboard.pagination.go_previous()
    expect(dashboard.pagination.info).to_have_text("Page 1 of 4")