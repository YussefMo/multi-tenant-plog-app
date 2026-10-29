import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <main className="placeholder">
      <div className="grid" aria-hidden="true" />
      <section className="panel">
        <p className="eyebrow">404 · Tenant console</p>
        <h1>Page not found</h1>
        <p className="lede">This tenant route does not exist yet.</p>
        <Link to="/">Back to the console →</Link>
      </section>
    </main>
  );
}
