export default function App() {
  return (
    <main className="placeholder">
      <div className="grid" aria-hidden="true" />
      <header className="topline">
        <span className="signal" />
        <span>TENANT CONSOLE</span>
        <span className="port">:3001</span>
      </header>
      <section className="panel">
        <p className="eyebrow">Phase 1 placeholder</p>
        <h1>Tenant frontend</h1>
        <p className="lede">
          Reserved for the tenant dashboard: users, permission profiles, posts, support access, and
          billing. Phase 1 is focused on the System Atlas visualizer.
        </p>
        <dl>
          <div>
            <dt>Realm</dt>
            <dd>tenant_session</dd>
          </div>
          <div>
            <dt>API</dt>
            <dd>http://localhost:8000/api</dd>
          </div>
          <div>
            <dt>Visualizer</dt>
            <dd>
              <a href="http://localhost:3003">localhost:3003 ↗</a>
            </dd>
          </div>
        </dl>
      </section>
    </main>
  );
}
