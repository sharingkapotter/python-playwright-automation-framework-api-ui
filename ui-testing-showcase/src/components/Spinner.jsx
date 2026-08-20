export default function Spinner({ label = 'Loading…', testId = 'spinner' }) {
  return (
    <div className="spinner-wrap" data-testid={testId} role="status" aria-live="polite">
      <span className="spinner" aria-hidden="true" />
      <span className="spinner-label">{label}</span>
    </div>
  );
}
