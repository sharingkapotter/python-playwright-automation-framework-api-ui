import { Routes, Route, NavLink, Link } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import ApplicationForm from './pages/ApplicationForm';
import Playground from './pages/Playground';

export default function App() {
  return (
    <div className="app" data-testid="app-root">
      <header className="topbar" data-testid="topbar">
        <div className="topbar-inner">
          <Link to="/" className="brand" data-testid="brand-link" aria-label="BrightPath HR home">
            <span className="brand-mark" aria-hidden="true">BP</span>
            <span className="brand-name">BrightPath&nbsp;HR</span>
          </Link>
          <nav className="main-nav" aria-label="Main navigation" data-testid="main-nav">
            <NavLink to="/" end data-testid="nav-dashboard" id="nav-dashboard">
              Dashboard
            </NavLink>
            <NavLink to="/apply" data-testid="nav-apply" id="nav-apply">
              Job Application
            </NavLink>
            <NavLink to="/playground" data-testid="nav-playground" id="nav-playground">
              Components
            </NavLink>
          </nav>
        </div>
      </header>

      <main className="page" data-testid="page-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/apply" element={<ApplicationForm />} />
          <Route path="/playground" element={<Playground />} />
          <Route
            path="*"
            element={
              <section className="card empty-state" data-testid="not-found">
                <h1>Page not found</h1>
                <p>The page you are looking for does not exist.</p>
                <Link to="/" data-testid="not-found-home-link" className="btn btn-primary">
                  Back to Dashboard
                </Link>
              </section>
            }
          />
        </Routes>
      </main>

      <footer className="footer" data-testid="footer">
        <span>© 2026 BrightPath HR — Demo application for UI test automation practice.</span>
        <a
          href="https://playwright.dev"
          target="_blank"
          rel="noreferrer"
          data-testid="footer-external-link"
        >
          Playwright Docs
        </a>
      </footer>
    </div>
  );
}
