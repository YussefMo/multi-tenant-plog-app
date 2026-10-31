import { Link } from 'react-router-dom';
import { securityCategories } from '@/data';
import type { SecurityMeasure } from '@/types';
import { ToneBadge } from '@/components/Badges';

const riskTone: Record<SecurityMeasure['risk'], 'red' | 'amber' | 'cyan' | 'green'> = {
  critical: 'red',
  high: 'amber',
  medium: 'cyan',
  low: 'green',
};

const postureTone: Record<SecurityMeasure['posture'], 'green' | 'amber' | 'cyan'> = {
  enforced: 'green',
  configurable: 'amber',
  'defense-in-depth': 'cyan',
};

const realmLabel: Record<SecurityMeasure['realm'], string> = {
  owner: 'owner realm',
  tenant: 'tenant realm',
  public: 'public',
  'cross-cutting': 'cross-cutting',
};

export default function SecurityDetail({ measure }: { measure: SecurityMeasure }) {
  const category = securityCategories.find((item) => item.id === measure.category);

  return (
    <article className="security-detail">
      <header className="map-panel security-detail-head">
        <p className="section-label">{category?.label ?? measure.category} · security measure</p>
        <h3>{measure.title}</h3>
        <p>{measure.summary}</p>
        <div className="security-badge-row">
          <ToneBadge tone={category?.tone ?? 'cyan'}>
            {category?.label ?? measure.category}
          </ToneBadge>
          <ToneBadge tone={riskTone[measure.risk]}>{measure.risk} risk</ToneBadge>
          <ToneBadge tone={postureTone[measure.posture]}>{measure.posture}</ToneBadge>
          <span className="realm">{realmLabel[measure.realm]}</span>
        </div>
      </header>

      <div className="security-detail-grid">
        <div className="security-detail-main">
          <section className="security-callout security-callout-threat">
            <p className="section-label">Threat</p>
            <p>{measure.threat}</p>
          </section>

          <section className="security-callout security-callout-control">
            <p className="section-label">Control</p>
            <p>{measure.control}</p>
          </section>

          <section className="security-callout">
            <p className="section-label">Why it matters</p>
            <p>{measure.why}</p>
          </section>

          <section className="map-panel">
            <p className="section-label">How it works</p>
            <ol className="plain-list security-steps">
              {measure.implementation.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </section>

          {measure.notes ? <p className="security-note">{measure.notes}</p> : null}
        </div>

        <aside className="security-detail-side">
          <section className="map-panel">
            <p className="section-label">Reference files</p>
            <div className="security-ref-grid">
              {measure.files.map((path) => (
                <Link
                  key={path}
                  className="ref-link"
                  to={`/files?path=${encodeURIComponent(path)}`}
                >
                  {path}
                </Link>
              ))}
            </div>
          </section>

          {measure.endpoints?.length ? (
            <section className="map-panel">
              <p className="section-label">Endpoints</p>
              <div className="security-ref-grid">
                {measure.endpoints.map((endpoint) => (
                  <Link
                    key={`${endpoint.method} ${endpoint.path}`}
                    className="ref-link"
                    to={`/requests?path=${encodeURIComponent(endpoint.path)}`}
                  >
                    <span className={`method method-${endpoint.method.toLowerCase()}`}>
                      {endpoint.method}
                    </span>{' '}
                    {endpoint.path}
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

          {measure.tests?.length ? (
            <section className="map-panel">
              <p className="section-label">Tests</p>
              <div className="security-ref-grid">
                {measure.tests.map((path) => (
                  <Link
                    key={path}
                    className="ref-link"
                    to={`/files?path=${encodeURIComponent(path)}`}
                  >
                    {path}
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

          {measure.journeys?.length ? (
            <section className="map-panel">
              <p className="section-label">Related journeys</p>
              <div className="security-ref-grid">
                {measure.journeys.map((journey) => (
                  <Link key={journey} className="ref-link" to={`/journeys/${journey}`}>
                    {journey}
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
        </aside>
      </div>
    </article>
  );
}
