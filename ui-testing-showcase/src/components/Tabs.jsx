import { useState } from 'react';

export default function Tabs({ tabs, testId = 'tabs' }) {
  const [active, setActive] = useState(tabs[0].id);

  return (
    <div className="tabs" data-testid={testId}>
      <div className="tab-list" role="tablist" aria-label="Content tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={active === tab.id}
            aria-controls={`tabpanel-${tab.id}`}
            className={`tab ${active === tab.id ? 'tab-active' : ''}`}
            data-testid={`tab-${tab.id}`}
            onClick={() => setActive(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {tabs.map((tab) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={`tabpanel-${tab.id}`}
          aria-labelledby={`tab-${tab.id}`}
          hidden={active !== tab.id}
          className="tab-panel"
          data-testid={`tabpanel-${tab.id}`}
        >
          {tab.content}
        </div>
      ))}
    </div>
  );
}
