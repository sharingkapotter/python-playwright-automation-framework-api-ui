import re
from playwright.sync_api import Page, expect


def test_dashboard_loads(page: Page):
    page.goto("/")
    page.pause()   
    expect(page).to_have_title(re.compile("BrightPath"))
    expect(page.get_by_test_id("employee-table")).to_be_visible()
    expect(page.get_by_test_id("card-total-employees-value")).to_have_text("32")