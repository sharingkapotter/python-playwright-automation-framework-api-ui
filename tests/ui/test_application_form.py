import pytest
from playwright.sync_api import expect

from data.applicant import an_applicant


@pytest.mark.smoke
def test_submit_is_disabled_until_terms_are_accepted(application_form):
    expect(application_form.submit_button).to_be_disabled()
    application_form.accept_terms()
    expect(application_form.submit_button).to_be_enabled()


@pytest.mark.smoke
def test_valid_application_is_submitted_successfully(application_form):
    application_form.fill_application(an_applicant()).accept_terms().submit()
    expect(application_form.success_message).to_be_visible()
    expect(application_form.success_message).to_contain_text("Confirmation ID: APP-TES")


@pytest.mark.negative
def test_server_error_is_surfaced_to_the_user(application_form):
    application_form.fill_application(an_applicant(email="broken@error.com"))
    application_form.accept_terms().submit()
    expect(application_form.error_message).to_be_visible()
    expect(application_form.error_message).to_contain_text("could not be submitted")


@pytest.mark.negative
@pytest.mark.parametrize(
    "field, message",
    [
        ("firstName", "First name is required."),
        ("lastName", "Last name is required."),
        ("email", "Email is required."),
        ("position", "Select a position."),
        ("employmentType", "Choose an employment type."),
        ("skills", "Select at least one skill."),
        ("expectedSalary", "Expected salary is required."),
        ("startDate", "Earliest start date is required."),
    ],
)
def test_required_fields_are_validated(application_form, field, message):
    application_form.accept_terms().submit()
    expect(application_form.error_for(field)).to_have_text(message)


@pytest.mark.negative
@pytest.mark.parametrize("email", ["not-an-email", "missing@domain", "@example.com"])
def test_malformed_email_is_rejected(application_form, email):
    application_form.fill_application(an_applicant(email=email))
    application_form.accept_terms().submit()
    expect(application_form.error_for("email")).to_contain_text("valid email address")
    expect(application_form.success_message).not_to_be_visible()


@pytest.mark.negative
@pytest.mark.parametrize("salary", ["1000", "999999"])
def test_salary_outside_the_accepted_range_is_rejected(application_form, salary):
    application_form.fill_application(an_applicant(expected_salary=salary))
    application_form.accept_terms().submit()
    expect(application_form.error_for("expectedSalary")).to_contain_text("between 30,000 and 500,000")


@pytest.mark.regression
def test_resume_upload_rejects_unsupported_file_type(application_form, tmp_path):
    bad_file = tmp_path / "notes.txt"
    bad_file.write_text("not a resume")
    application_form.upload_resume(bad_file)
    expect(application_form.error_for("resume")).to_contain_text("Only PDF, DOC, or DOCX")


@pytest.mark.regression
def test_slider_and_toggle_reflect_their_state(application_form):
    application_form.set_experience(15)
    expect(application_form.experience_value).to_have_text("15")
    expect(application_form.relocation_state).to_have_text("No")
    application_form.relocation_toggle.check()
    expect(application_form.relocation_state).to_have_text("Yes")