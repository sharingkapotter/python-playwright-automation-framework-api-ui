import { useEffect, useRef } from 'react';

export default function Modal({ open, title, onClose, children, testId = 'modal' }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Escape') onClose();
    }
    if (open) {
      document.addEventListener('keydown', onKeyDown);
      // Focus the dialog when it opens (keyboard/a11y friendly)
      dialogRef.current?.focus();
    }
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="modal-overlay"
      data-testid={`${testId}-overlay`}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${testId}-title`}
        data-testid={testId}
        tabIndex={-1}
        ref={dialogRef}
      >
        <div className="modal-header">
          <h2 id={`${testId}-title`} data-testid={`${testId}-title`}>{title}</h2>
          <button
            type="button"
            className="icon-btn"
            aria-label="Close dialog"
            data-testid={`${testId}-close-button`}
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        <div className="modal-body" data-testid={`${testId}-body`}>{children}</div>
      </div>
    </div>
  );
}
