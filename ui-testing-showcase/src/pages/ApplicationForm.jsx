import { useRef, useState } from 'react';
import Spinner from '../components/Spinner';

const POSITIONS = [
  'QA Automation Engineer',
  'Software Developer',
  'DevOps Engineer',
  'Product Manager',
  'UX Designer',
];

const LOCATIONS = ['Austin', 'Chicago', 'New York', 'Remote', 'San Francisco'];

const SKILLS = [
  { id: 'playwright', label: 'Playwright' },
  { id: 'selenium', label: 'Selenium' },
  { id: 'python', label: 'Python' },
  { id: 'javascript', label: 'JavaScript' },
  { id: 'ci-cd', label: 'CI/CD' },
];

const initialForm = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  position: '',
  employmentType: '',
  skills: [],
  locations: [],
  experience: 5,
  expectedSalary: '',
  startDate: '',
  availableFrom: '',
  availableTo: '',
  relocation: false,
  coverLetter: '',
  terms: false,
};

export default function ApplicationForm() {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null); // { type: 'success' | 'error', message }
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef(null);

  function setField(name, value) {
    setForm((f) => ({ ...f, [name]: value }));
    // Clear the field's error as soon as the user edits it.
    setErrors((e) => {
      if (!e[name]) return e;
      const next = { ...e };
      delete next[name];
      return next;
    });
  }

  function handleInput(e) {
    const { name, value, type, checked } = e.target;
    setField(name, type === 'checkbox' ? checked : value);
  }

  function handleSkillToggle(e) {
    const { value, checked } = e.target;
    setField(
      'skills',
      checked ? [...form.skills, value] : form.skills.filter((s) => s !== value)
    );
  }

  function handleLocations(e) {
    const selected = Array.from(e.target.selectedOptions, (o) => o.value);
    setField('locations', selected);
  }

  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (!/\.(pdf|doc|docx)$/i.test(file.name)) {
      setFileName('');
      setErrors((err) => ({ ...err, resume: 'Only PDF, DOC, or DOCX files are allowed.' }));
      e.target.value = '';
      return;
    }
    setFileName(file.name);
    setErrors((err) => {
      const next = { ...err };
      delete next.resume;
      return next;
    });
  }

  function removeFile() {
    setFileName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function validate() {
    const errs = {};
    if (!form.firstName.trim()) errs.firstName = 'First name is required.';
    if (!form.lastName.trim()) errs.lastName = 'Last name is required.';
    if (!form.email.trim()) {
      errs.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = 'Enter a valid email address (e.g. name@example.com).';
    }
    if (form.phone && !/^[\d\s()+-]{7,15}$/.test(form.phone)) {
      errs.phone = 'Enter a valid phone number (7–15 digits).';
    }
    if (!form.position) errs.position = 'Select a position.';
    if (!form.employmentType) errs.employmentType = 'Choose an employment type.';
    if (form.skills.length === 0) errs.skills = 'Select at least one skill.';
    if (!form.expectedSalary) {
      errs.expectedSalary = 'Expected salary is required.';
    } else if (Number(form.expectedSalary) < 30000 || Number(form.expectedSalary) > 500000) {
      errs.expectedSalary = 'Salary must be between 30,000 and 500,000.';
    }
    if (!form.startDate) errs.startDate = 'Earliest start date is required.';
    if (form.availableFrom && form.availableTo && form.availableTo < form.availableFrom) {
      errs.availableTo = 'Interview availability end date must be after the start date.';
    }
    if (!form.terms) errs.terms = 'You must accept the terms to submit.';
    return errs;
  }

  function handleSubmit(e) {
    e.preventDefault();
    setResult(null);
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSubmitting(true);
    // Simulated server call. Emails at @error.com deterministically fail —
    // useful for negative test scenarios.
    setTimeout(() => {
      setSubmitting(false);
      if (form.email.toLowerCase().endsWith('@error.com')) {
        setResult({
          type: 'error',
          message: 'Server error: application could not be submitted. Please try again later.',
        });
      } else {
        setResult({
          type: 'success',
          message: `Application submitted successfully! Confirmation ID: APP-${form.lastName.toUpperCase().slice(0, 3)}-2026`,
        });
        setForm(initialForm);
        setFileName('');
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    }, 1500);
  }

  function fieldError(name) {
    if (!errors[name]) return null;
    return (
      <span className="field-error" role="alert" data-testid={`error-${name}`}>
        {errors[name]}
      </span>
    );
  }

  return (
    <section aria-labelledby="apply-heading">
      <div className="page-header">
        <div>
          <h1 id="apply-heading" data-testid="apply-heading">Job Application</h1>
          <p className="page-subtitle">
            Apply for an open position at BrightPath. Fields marked * are required.
          </p>
        </div>
      </div>

      {result && (
        <div
          className={`alert alert-${result.type}`}
          role={result.type === 'error' ? 'alert' : 'status'}
          data-testid={`submit-${result.type}`}
        >
          {result.message}
          <button
            type="button"
            className="icon-btn"
            aria-label="Dismiss message"
            data-testid="dismiss-result"
            onClick={() => setResult(null)}
          >
            ✕
          </button>
        </div>
      )}

      <form className="card form-card" onSubmit={handleSubmit} noValidate data-testid="application-form" id="application-form">
        <fieldset disabled={submitting} className="form-fieldset">
          <h2 className="form-section-title">Personal Information</h2>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="firstName">First Name *</label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                autoComplete="given-name"
                value={form.firstName}
                onChange={handleInput}
                aria-invalid={!!errors.firstName}
                data-testid="first-name-input"
              />
              {fieldError('firstName')}
            </div>
            <div className="field">
              <label htmlFor="lastName">Last Name *</label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                autoComplete="family-name"
                value={form.lastName}
                onChange={handleInput}
                aria-invalid={!!errors.lastName}
                data-testid="last-name-input"
              />
              {fieldError('lastName')}
            </div>
            <div className="field">
              <label htmlFor="email">Email *</label>
              <input
                type="email"
                id="email"
                name="email"
                autoComplete="email"
                placeholder="name@example.com"
                value={form.email}
                onChange={handleInput}
                aria-invalid={!!errors.email}
                data-testid="email-input"
              />
              {fieldError('email')}
            </div>
            <div className="field">
              <label htmlFor="phone">Phone</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                autoComplete="tel"
                placeholder="(555) 123-4567"
                value={form.phone}
                onChange={handleInput}
                aria-invalid={!!errors.phone}
                data-testid="phone-input"
              />
              {fieldError('phone')}
            </div>
          </div>

          <h2 className="form-section-title">Position Details</h2>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="position">Position *</label>
              <select
                id="position"
                name="position"
                value={form.position}
                onChange={handleInput}
                aria-invalid={!!errors.position}
                data-testid="position-select"
              >
                <option value="">— Select a position —</option>
                {POSITIONS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              {fieldError('position')}
            </div>
            <div className="field">
              <label htmlFor="locations">Preferred Locations (multi-select)</label>
              <select
                id="locations"
                name="locations"
                multiple
                size={5}
                value={form.locations}
                onChange={handleLocations}
                data-testid="locations-multiselect"
              >
                {LOCATIONS.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
              <span className="field-hint">Hold Ctrl / Cmd to select multiple.</span>
            </div>

            <fieldset className="field radio-group" aria-invalid={!!errors.employmentType}>
              <legend>Employment Type *</legend>
              {['Full-time', 'Part-time', 'Contract'].map((t) => {
                const slug = t.toLowerCase().replace('-', '');
                return (
                  <label key={t} className="choice" htmlFor={`employment-${slug}`}>
                    <input
                      type="radio"
                      id={`employment-${slug}`}
                      name="employmentType"
                      value={t}
                      checked={form.employmentType === t}
                      onChange={handleInput}
                      data-testid={`employment-type-${slug}`}
                    />
                    {t}
                  </label>
                );
              })}
              {fieldError('employmentType')}
            </fieldset>

            <fieldset className="field checkbox-group" aria-invalid={!!errors.skills}>
              <legend>Skills * (select at least one)</legend>
              {SKILLS.map((s) => (
                <label key={s.id} className="choice" htmlFor={`skill-${s.id}`}>
                  <input
                    type="checkbox"
                    id={`skill-${s.id}`}
                    name="skills"
                    value={s.label}
                    checked={form.skills.includes(s.label)}
                    onChange={handleSkillToggle}
                    data-testid={`skill-${s.id}`}
                  />
                  {s.label}
                </label>
              ))}
              {fieldError('skills')}
            </fieldset>

            <div className="field">
              <label htmlFor="experience">
                Years of Experience: <strong data-testid="experience-value">{form.experience}</strong>
              </label>
              <input
                type="range"
                id="experience"
                name="experience"
                min="0"
                max="30"
                step="1"
                value={form.experience}
                onChange={handleInput}
                data-testid="experience-slider"
                aria-valuemin={0}
                aria-valuemax={30}
                aria-valuenow={form.experience}
              />
            </div>
            <div className="field">
              <label htmlFor="expectedSalary">Expected Salary (USD) *</label>
              <input
                type="number"
                id="expectedSalary"
                name="expectedSalary"
                min="30000"
                max="500000"
                step="1000"
                placeholder="85000"
                value={form.expectedSalary}
                onChange={handleInput}
                aria-invalid={!!errors.expectedSalary}
                data-testid="salary-input"
              />
              {fieldError('expectedSalary')}
            </div>

            <div className="field">
              <label htmlFor="startDate">Earliest Start Date *</label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={form.startDate}
                onChange={handleInput}
                aria-invalid={!!errors.startDate}
                data-testid="start-date-input"
              />
              {fieldError('startDate')}
            </div>
            <div className="field">
              <span className="field-label">Interview Availability (date range)</span>
              <div className="date-range" data-testid="availability-range">
                <label className="sr-only" htmlFor="availableFrom">Available from</label>
                <input
                  type="date"
                  id="availableFrom"
                  name="availableFrom"
                  value={form.availableFrom}
                  onChange={handleInput}
                  data-testid="available-from-input"
                  aria-label="Available from"
                />
                <span aria-hidden="true">→</span>
                <label className="sr-only" htmlFor="availableTo">Available to</label>
                <input
                  type="date"
                  id="availableTo"
                  name="availableTo"
                  value={form.availableTo}
                  onChange={handleInput}
                  aria-invalid={!!errors.availableTo}
                  data-testid="available-to-input"
                  aria-label="Available to"
                />
              </div>
              {fieldError('availableTo')}
            </div>
          </div>

          <h2 className="form-section-title">Documents &amp; Extras</h2>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="resume">Resume (PDF, DOC, DOCX)</label>
              <input
                type="file"
                id="resume"
                name="resume"
                accept=".pdf,.doc,.docx"
                onChange={handleFile}
                ref={fileInputRef}
                data-testid="resume-upload"
              />
              {fileName && (
                <span className="file-chip" data-testid="uploaded-file-name">
                  {fileName}
                  <button
                    type="button"
                    className="icon-btn"
                    aria-label="Remove uploaded file"
                    data-testid="remove-file-button"
                    onClick={removeFile}
                  >
                    ✕
                  </button>
                </span>
              )}
              {fieldError('resume')}
            </div>
            <div className="field">
              <label className="switch-label" htmlFor="relocation">
                <span>Willing to relocate</span>
                <span className="switch">
                  <input
                    type="checkbox"
                    id="relocation"
                    name="relocation"
                    role="switch"
                    checked={form.relocation}
                    onChange={handleInput}
                    data-testid="relocation-toggle"
                  />
                  <span className="switch-track" aria-hidden="true" />
                </span>
                <span data-testid="relocation-state">{form.relocation ? 'Yes' : 'No'}</span>
              </label>
            </div>
            <div className="field field-full">
              <label htmlFor="coverLetter">Cover Letter</label>
              <textarea
                id="coverLetter"
                name="coverLetter"
                rows={5}
                maxLength={1000}
                placeholder="Tell us why you are a great fit…"
                value={form.coverLetter}
                onChange={handleInput}
                data-testid="cover-letter-textarea"
              />
              <span className="field-hint" data-testid="cover-letter-count">
                {form.coverLetter.length}/1000 characters
              </span>
            </div>
          </div>

          <div className="field terms-row">
            <label className="choice" htmlFor="terms">
              <input
                type="checkbox"
                id="terms"
                name="terms"
                checked={form.terms}
                onChange={handleInput}
                aria-invalid={!!errors.terms}
                data-testid="terms-checkbox"
              />
              I agree to the terms and privacy policy. *
            </label>
            {fieldError('terms')}
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!form.terms || submitting}
              data-testid="submit-button"
              id="submit-application"
            >
              {submitting ? 'Submitting…' : 'Submit Application'}
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              data-testid="reset-button"
              onClick={() => {
                setForm(initialForm);
                setErrors({});
                setResult(null);
                setFileName('');
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
            >
              Reset Form
            </button>
          </div>
        </fieldset>
        {submitting && <Spinner label="Submitting application…" testId="submit-loading" />}
      </form>

      <p className="field-hint tip-note" data-testid="error-simulation-hint">
        Tip for testers: submit with an email ending in <code>@error.com</code> to trigger a
        simulated server error.
      </p>
    </section>
  );
}
