import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <main className="not-found">
      <p className="eyebrow">404 · System Atlas</p>
      <h1>Route not found</h1>
      <p>
        This Atlas route does not exist. Journeys, models, commands, requests, and presenter deep
        links all start from the overview.
      </p>
      <Link className="primary-button" to="/">
        Back to overview →
      </Link>
    </main>
  );
}
