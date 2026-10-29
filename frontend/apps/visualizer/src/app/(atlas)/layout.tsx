import { NavLink, Outlet } from 'react-router-dom';
import ThemeToggle from '@/components/ThemeToggle';
import { files, journeys, models, requestsDocument } from '@/data';
import { usePathname } from '@/lib/router';

const navigation = [
  { to: '/', label: 'Overview', code: '01' },
  { to: '/requests', label: 'Requests', code: '02' },
  { to: '/files', label: 'Files', code: '03' },
  { to: '/journeys', label: 'Journeys', code: '04' },
  { to: '/models', label: 'Models + DB', code: '05' },
  { to: '/commands', label: 'Commands', code: '06' },
  { to: '/present', label: 'Presenter', code: '07' },
];

function sectionFor(pathname: string): string {
  if (pathname.startsWith('/requests')) return 'Request catalog';
  if (pathname.startsWith('/files')) return 'File catalog';
  if (pathname.startsWith('/journeys')) return 'Journey player';
  if (pathname.startsWith('/models')) return 'Models and database';
  if (pathname.startsWith('/commands')) return 'Command atlas';
  if (pathname.startsWith('/present')) return 'Presenter mode';
  return 'System overview';
}

export default function AtlasLayout() {
  const pathname = usePathname();
  const section = sectionFor(pathname);

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
          Atlas complete · 6 phases
        </div>

        <nav className="nav" aria-label="Atlas sections">
          {navigation.map((item) => (
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
          ))}
        </nav>

        <div className="sidebar-footer">
          <div>
            <span>API operations</span>
            <strong>{requestsDocument.count}</strong>
          </div>
          <div>
            <span>Journeys</span>
            <strong>{journeys.length}</strong>
          </div>
          <div>
            <span>Models</span>
            <strong>{models.length}</strong>
          </div>
          <div>
            <span>Catalogued files</span>
            <strong>{files.length}</strong>
          </div>
          <p>Public locally · blueprint mode</p>
        </div>
      </aside>

      <div className="workspace">
        <header className="topbar">
          <div>
            <p className="breadcrumb">
              Atlas <span>/</span> {section}
            </p>
            <p className="topbar-note">
              Generated from <code>php artisan route:list --json</code> · validated references
            </p>
          </div>
          <div className="topbar-actions">
            <span className="status-chip">API · /api/v1</span>
            <ThemeToggle />
            <NavLink className="status-chip amber" to="/present">
              Presenter →
            </NavLink>
          </div>
        </header>

        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
