import { useState } from 'react';

export default function Accordion({ items, testId = 'accordion' }) {
  const [openId, setOpenId] = useState(null);

  return (
    <div className="accordion" data-testid={testId}>
      {items.map((item) => {
        const isOpen = openId === item.id;
        return (
          <div key={item.id} className="accordion-item" data-testid={`accordion-item-${item.id}`}>
            <button
              type="button"
              className="accordion-header"
              aria-expanded={isOpen}
              aria-controls={`accordion-panel-${item.id}`}
              id={`accordion-header-${item.id}`}
              data-testid={`accordion-header-${item.id}`}
              onClick={() => setOpenId(isOpen ? null : item.id)}
            >
              <span>{item.title}</span>
              <span className="accordion-chevron" aria-hidden="true">{isOpen ? '▲' : '▼'}</span>
            </button>
            <div
              id={`accordion-panel-${item.id}`}
              role="region"
              aria-labelledby={`accordion-header-${item.id}`}
              hidden={!isOpen}
              className="accordion-panel"
              data-testid={`accordion-panel-${item.id}`}
            >
              {item.content}
            </div>
          </div>
        );
      })}
    </div>
  );
}
