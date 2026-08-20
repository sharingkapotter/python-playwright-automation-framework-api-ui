import { useRef, useState } from 'react';
import Modal from '../components/Modal';
import Tabs from '../components/Tabs';
import Accordion from '../components/Accordion';
import Tooltip from '../components/Tooltip';
import Spinner from '../components/Spinner';

const FETCHED_USERS = [
  { id: 1, name: 'Amelia Clarke', email: 'amelia.clarke@example.com' },
  { id: 2, name: 'Ben Thompson', email: 'ben.thompson@example.com' },
  { id: 3, name: 'Chloe Nguyen', email: 'chloe.nguyen@example.com' },
  { id: 4, name: 'Daniel Osei', email: 'daniel.osei@example.com' },
];

export default function Playground() {
  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalName, setModalName] = useState('');
  const [savedName, setSavedName] = useState('');

  // Alerts
  const [alerts, setAlerts] = useState([]);
  const alertId = useRef(0);

  // Async loading
  const [usersLoading, setUsersLoading] = useState(false);
  const [users, setUsers] = useState(null);

  // Dynamic elements
  const [delayedVisible, setDelayedVisible] = useState(false);
  const [delayedPending, setDelayedPending] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const [inputEnabled, setInputEnabled] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressRunning, setProgressRunning] = useState(false);
  const [boxText, setBoxText] = useState('Double-click me');
  const [notifications, setNotifications] = useState(true);

  function pushAlert(type, message) {
    alertId.current += 1;
    const id = alertId.current;
    setAlerts((a) => [...a, { id, type, message }]);
  }

  function dismissAlert(id) {
    setAlerts((a) => a.filter((al) => al.id !== id));
  }

  function loadUsers() {
    setUsersLoading(true);
    setUsers(null);
    setTimeout(() => {
      setUsers(FETCHED_USERS);
      setUsersLoading(false);
    }, 2000);
  }

  function revealDelayedElement() {
    setDelayedPending(true);
    setDelayedVisible(false);
    setTimeout(() => {
      setDelayedVisible(true);
      setDelayedPending(false);
    }, 3000);
  }

  function startProgress() {
    setProgress(0);
    setProgressRunning(true);
    let value = 0;
    const interval = setInterval(() => {
      value += 10;
      setProgress(value);
      if (value >= 100) {
        clearInterval(interval);
        setProgressRunning(false);
      }
    }, 400);
  }

  return (
    <section aria-labelledby="playground-heading">
      <div className="page-header">
        <div>
          <h1 id="playground-heading" data-testid="playground-heading">Component Playground</h1>
          <p className="page-subtitle">
            Interactive components with dynamic behavior for practicing waits, assertions, and
            synchronization.
          </p>
        </div>
      </div>

      {/* Alerts / notifications */}
      <div className="card" data-testid="section-alerts">
        <h2>Alerts &amp; Messages</h2>
        <div className="btn-row">
          <button
            type="button"
            className="btn btn-primary"
            data-testid="trigger-success-alert"
            onClick={() => pushAlert('success', 'Operation completed successfully.')}
          >
            Show Success
          </button>
          <button
            type="button"
            className="btn btn-danger"
            data-testid="trigger-error-alert"
            onClick={() => pushAlert('error', 'Something went wrong. Please try again.')}
          >
            Show Error
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            data-testid="trigger-info-alert"
            onClick={() => pushAlert('info', 'Heads up: this is an informational message.')}
          >
            Show Info
          </button>
        </div>
        <div className="alert-stack" data-testid="alert-stack" aria-live="polite">
          {alerts.map((al) => (
            <div key={al.id} className={`alert alert-${al.type}`} data-testid={`alert-${al.type}`}>
              {al.message}
              <button
                type="button"
                className="icon-btn"
                aria-label="Dismiss alert"
                data-testid={`dismiss-alert-${al.id}`}
                onClick={() => dismissAlert(al.id)}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Modal + tooltip */}
      <div className="card" data-testid="section-modal">
        <h2>Modal &amp; Tooltip</h2>
        <div className="btn-row">
          <button
            type="button"
            className="btn btn-primary"
            data-testid="open-modal-button"
            id="open-modal-button"
            onClick={() => setModalOpen(true)}
          >
            Open Modal
          </button>
          <Tooltip text="Tooltips appear on hover and keyboard focus." testId="info-tooltip">
            <button type="button" className="btn btn-secondary" data-testid="tooltip-button">
              Hover for Tooltip
            </button>
          </Tooltip>
        </div>
        {savedName && (
          <p data-testid="modal-saved-name">
            Name saved from modal: <strong>{savedName}</strong>
          </p>
        )}
        <Modal
          open={modalOpen}
          title="Update Display Name"
          onClose={() => setModalOpen(false)}
          testId="name-modal"
        >
          <div className="field">
            <label htmlFor="modal-name-input">Display name</label>
            <input
              type="text"
              id="modal-name-input"
              name="modalName"
              value={modalName}
              onChange={(e) => setModalName(e.target.value)}
              data-testid="modal-name-input"
              placeholder="e.g. Sunil"
            />
          </div>
          <div className="btn-row">
            <button
              type="button"
              className="btn btn-primary"
              data-testid="modal-save-button"
              disabled={!modalName.trim()}
              onClick={() => {
                setSavedName(modalName.trim());
                setModalOpen(false);
                setModalName('');
              }}
            >
              Save
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              data-testid="modal-cancel-button"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </button>
          </div>
        </Modal>
      </div>

      {/* Tabs & accordion */}
      <div className="card" data-testid="section-tabs">
        <h2>Tabs &amp; Accordion</h2>
        <Tabs
          testId="playground-tabs"
          tabs={[
            {
              id: 'overview',
              label: 'Overview',
              content: <p data-testid="tab-content-overview">BrightPath HR streamlines onboarding, payroll, and reviews in one place.</p>,
            },
            {
              id: 'pricing',
              label: 'Pricing',
              content: <p data-testid="tab-content-pricing">Plans start at $8 per employee per month, billed annually.</p>,
            },
            {
              id: 'support',
              label: 'Support',
              content: <p data-testid="tab-content-support">Support is available 24/7 via chat and email for all plans.</p>,
            },
          ]}
        />
        <Accordion
          testId="faq-accordion"
          items={[
            {
              id: 'faq-1',
              title: 'How do I reset my password?',
              content: 'Go to Settings → Security and click "Reset password". A link is emailed to you.',
            },
            {
              id: 'faq-2',
              title: 'Can I export employee data?',
              content: 'Yes — administrators can export CSV or PDF reports from the Dashboard.',
            },
            {
              id: 'faq-3',
              title: 'Is my data encrypted?',
              content: 'All data is encrypted in transit (TLS 1.3) and at rest (AES-256).',
            },
          ]}
        />
      </div>

      {/* Async loading */}
      <div className="card" data-testid="section-async">
        <h2>Async Data Loading</h2>
        <p className="page-subtitle">Clicking the button waits 2 seconds before rendering results — practice explicit waits here.</p>
        <button
          type="button"
          className="btn btn-primary"
          data-testid="load-users-button"
          id="load-users-button"
          onClick={loadUsers}
          disabled={usersLoading}
        >
          {usersLoading ? 'Loading…' : 'Load Users'}
        </button>
        {usersLoading && <Spinner label="Fetching users…" testId="users-loading" />}
        {users && (
          <ul className="user-list" data-testid="user-list">
            {users.map((u) => (
              <li key={u.id} data-testid={`user-item-${u.id}`}>
                <strong>{u.name}</strong> — {u.email}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Dynamic elements */}
      <div className="card" data-testid="section-dynamic">
        <h2>Dynamic Elements</h2>
        <div className="dynamic-grid">
          <div className="dynamic-block">
            <h3>Delayed element</h3>
            <button
              type="button"
              className="btn btn-secondary"
              data-testid="reveal-delayed-button"
              onClick={revealDelayedElement}
              disabled={delayedPending}
            >
              {delayedPending ? 'Appearing in ~3s…' : 'Reveal Hidden Element'}
            </button>
            {delayedVisible && (
              <p className="badge badge-active delayed-badge" data-testid="delayed-element">
                I appeared after 3 seconds!
              </p>
            )}
          </div>

          <div className="dynamic-block">
            <h3>State change on click</h3>
            <button
              type="button"
              className="btn btn-secondary"
              data-testid="click-counter-button"
              onClick={() => setClickCount((c) => c + 1)}
            >
              Clicked <span data-testid="click-count">{clickCount}</span> times
            </button>
          </div>

          <div className="dynamic-block">
            <h3>Enable / disable</h3>
            <label className="switch-label" htmlFor="enable-input-toggle">
              <span className="switch">
                <input
                  type="checkbox"
                  id="enable-input-toggle"
                  name="enableInput"
                  role="switch"
                  checked={inputEnabled}
                  onChange={(e) => setInputEnabled(e.target.checked)}
                  data-testid="enable-input-toggle"
                />
                <span className="switch-track" aria-hidden="true" />
              </span>
              <span>Enable the field below</span>
            </label>
            <input
              type="text"
              id="conditional-input"
              name="conditionalInput"
              placeholder={inputEnabled ? 'Now you can type…' : 'Disabled until toggled'}
              disabled={!inputEnabled}
              data-testid="conditional-input"
              aria-label="Conditionally enabled input"
            />
          </div>

          <div className="dynamic-block">
            <h3>Progress bar</h3>
            <button
              type="button"
              className="btn btn-secondary"
              data-testid="start-progress-button"
              onClick={startProgress}
              disabled={progressRunning}
            >
              {progressRunning ? 'Running…' : 'Start Progress'}
            </button>
            <div
              className="progress"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progress}
              data-testid="progress-bar"
            >
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <span data-testid="progress-value">{progress}%</span>
            {progress >= 100 && (
              <span className="badge badge-active" data-testid="progress-complete">Complete</span>
            )}
          </div>

          <div className="dynamic-block">
            <h3>Double-click action</h3>
            <div
              className="dblclick-box"
              data-testid="double-click-box"
              onDoubleClick={() => setBoxText('Double-clicked! ✔')}
            >
              {boxText}
            </div>
          </div>

          <div className="dynamic-block">
            <h3>Toggle with visible state</h3>
            <label className="switch-label" htmlFor="notifications-toggle">
              <span className="switch">
                <input
                  type="checkbox"
                  id="notifications-toggle"
                  name="notifications"
                  role="switch"
                  checked={notifications}
                  onChange={(e) => setNotifications(e.target.checked)}
                  data-testid="notifications-toggle"
                />
                <span className="switch-track" aria-hidden="true" />
              </span>
              <span>Email notifications:</span>
              <strong data-testid="notifications-state">{notifications ? 'On' : 'Off'}</strong>
            </label>
          </div>
        </div>
      </div>
    </section>
  );
}
