// Simple CSS-driven tooltip that shows on hover AND keyboard focus.
export default function Tooltip({ text, children, testId = 'tooltip' }) {
  return (
    <span className="tooltip-trigger" tabIndex={0} data-testid={`${testId}-trigger`}>
      {children}
      <span className="tooltip-bubble" role="tooltip" data-testid={testId}>
        {text}
      </span>
    </span>
  );
}
