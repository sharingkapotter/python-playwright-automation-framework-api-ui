from playwright.sync_api import Page

from data.applicant import Applicant
from pages.base_page import BasePage


class ApplicationFormPage(BasePage):
    PATH = "/apply"

    def __init__(self, page: Page):
        super().__init__(page)
        self.form = page.get_by_test_id("application-form")
        self.first_name = page.get_by_test_id("first-name-input")
        self.last_name = page.get_by_test_id("last-name-input")
        self.email = page.get_by_test_id("email-input")
        self.phone = page.get_by_test_id("phone-input")
        self.position = page.get_by_test_id("position-select")
        self.locations = page.get_by_test_id("locations-multiselect")
        self.experience_slider = page.get_by_test_id("experience-slider")
        self.experience_value = page.get_by_test_id("experience-value")
        self.salary = page.get_by_test_id("salary-input")
        self.start_date = page.get_by_test_id("start-date-input")
        self.available_from = page.get_by_test_id("available-from-input")
        self.available_to = page.get_by_test_id("available-to-input")
        self.resume_upload = page.get_by_test_id("resume-upload")
        self.uploaded_file_name = page.get_by_test_id("uploaded-file-name")
        self.relocation_toggle = page.get_by_test_id("relocation-toggle")
        self.relocation_state = page.get_by_test_id("relocation-state")
        self.cover_letter = page.get_by_test_id("cover-letter-textarea")
        self.terms_checkbox = page.get_by_test_id("terms-checkbox")
        self.submit_button = page.get_by_test_id("submit-button")
        self.reset_button = page.get_by_test_id("reset-button")
        self.success_message = page.get_by_test_id("submit-success")
        self.error_message = page.get_by_test_id("submit-error")

    def open(self):
        super().open()
        self.form.wait_for()
        return self

    def fill_application(self, applicant: Applicant):
        self.first_name.fill(applicant.first_name)
        self.last_name.fill(applicant.last_name)
        self.email.fill(applicant.email)
        self.phone.fill(applicant.phone)
        self.position.select_option(applicant.position)
        self.page.get_by_test_id(f"employment-type-{applicant.employment_type}").check()
        for skill in applicant.skills:
            self.page.get_by_test_id(f"skill-{skill}").check()
        self.salary.fill(applicant.expected_salary)
        self.start_date.fill(applicant.start_date)
        self.cover_letter.fill(applicant.cover_letter)
        return self

    def set_experience(self, years: int):
        self.experience_slider.fill(str(years))
        return self

    def upload_resume(self, file_path):
        self.resume_upload.set_input_files(file_path)
        return self

    def accept_terms(self):
        self.terms_checkbox.check()
        return self

    def submit(self):
        self.submit_button.click()
        return self

    def error_for(self, field: str):
        """Validation message for a single field, e.g. error_for('email')."""
        return self.page.get_by_test_id(f"error-{field}")