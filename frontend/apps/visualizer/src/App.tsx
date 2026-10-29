import { NavLink, Route, Routes, useLocation } from 'react-router-dom';
import { files, requestsDocument } from './data';
import FilesPage from './pages/FilesPage';
import OverviewPage from './pages/OverviewPage';
import RequestsPage from './pages/RequestsPage';

const navigation = [
  { to: '/', label: 'Overview', code: '01', ready: true },
  { to: '/requests', label: 'Requests', code: '02', ready: true },
  { to: '/files', label: 'Files', code: '03', ready: true },
  { to: '/journeys', label: 'Journeys', code: '04', ready: false, phase: 'Phase 2' },
  { to: '/models', label: 'Models + DB', code: '05', ready: false, phase: 'Phase 3' },
  { to: '/commands', label: 'Commands', code: '06', ready: false, phase: 'Phase 3' },
  { to: '/present', label: 'Presenter', code: '07', ready: false, phase: 'Phase 5' },
];

const sectionNames: Record<string, string> = {
  '/': 'System overview',
  '/requests': 'Request catalog',
  '/files': 'File catalog',
};

function App() {
  const location = useLocation();
  const section = sectionNames[location.pathname] ?? 'System atlas';

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">SA</span>
          <div>
            <p className="brand-kicker">Multi Tenant Plog</p>
            <h1>System Atlas</h1>
          </div>
        </div>

        <div className="phase-pill">
          <span className="pulse-dot" />
          Phase 1 · Foundation
        </div>

        <nav className="nav" aria-label="Atlas sections">
          {navigation.map((item) =>
            item.ready ? (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
              >
                <span className="nav-code">{item.code}</span>
                <span>{item.label}</span>
                <span className="nav-arrow">→</span>
              </NavLink>
            ) : (
              <div key={item.to} className="nav-item locked" aria-disabled="true">
                <span className="nav-code">{item.code}</span>
                <span>{item.label}</span>
                <span className="nav-phase">{item.phase}</span>
              </div>
            ),
          )}
        </nav>

        <div className="sidebar-footer">
          <div>
            <span>API operations</span>
            <strong>{requestsDocument.count}</strong>
          </div>
          <div>
            <span>Catalogued files</span>
            <strong>{files.length}</strong>
          </div>
          <p>Public locally · dark blueprint mode</p>
        </div>
      </aside>

      <div className="workspace">
        <header className="topbar">
          <div>
            <p className="breadcrumb">
              Atlas <span>/</span> {section}
            </p>
            <p className="topbar-note">
              Generated from <code>php artisan route:list --json</code>
            </p>
          </div>
          <div className="topbar-actions">
            <span className="status-chip">API · /api/v1</span>
            <span className="status-chip amber">localhost</span>
          </div>
        </header>

        <main className="content">
          <Routes>
            <Route path="/" element={<OverviewPage />} />
            <Route path="/requests" element={<RequestsPage />} />
            <Route path="/files" element={<FilesPage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default App;
