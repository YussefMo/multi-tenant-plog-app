export default function App() {
  return (
    <main className="placeholder">
      <div className="grid" aria-hidden="true" />
      <header className="topline">
        <span className="signal" />
        <span>USER WEB</span>
        <span className="port">:3002</span>
      </header>
      <section className="panel">
        <p className="eyebrow">Phase 1 placeholder</p>
        <h1>User web</h1>
        <p className="lede">
          Reserved for the global viewer experience: signup, tenant directory, and published posts.
          Phase 1 is focused on the System Atlas visualizer.
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
