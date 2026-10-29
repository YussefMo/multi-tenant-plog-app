import { useState } from 'react';
import { Link } from 'react-router-dom';
import ArchitectureMap from '../components/ArchitectureMap';
import Inspector from '../components/Inspector';
import StatCard from '../components/StatCard';
import { commands, files, journeys, models, requestsDocument } from '../data';
import { architectureNodes } from '../data/architecture';

const serviceCount = files.filter((file) => file.layer === 'service').length;

export default function OverviewPage() {
  const [selectedId, setSelectedId] = useState('frontends');
  const selectedNode =
    architectureNodes.find((node) => node.id === selectedId) ?? architectureNodes[0];

  return (
    <div className="page">
      <section className="page-hero">
        <div>
          <p className="eyebrow">System atlas · complete</p>
          <h2>Trace the backend before you demo it.</h2>
          <p>
            A live map of the Laravel system: request entry points, session realms, middleware,
            controllers, services, models, databases, commands, and the files behind them. Every
            journey is playable step by step and every reference is validated.
          </p>
          <div className="hero-actions">
            <Link
              className="primary-button"
              to={`/journeys/${journeys[0].id}/${journeys[0].steps[0].id}`}
            >
              Open the journey player →
            </Link>
            <Link className="ghost-button" to="/present">
              Start presenter mode
            </Link>
          </div>
        </div>
        <div className="hero-stamp">
          <span>ATLAS</span>
          <strong>06</strong>
          <small>complete</small>
        </div>
      </section>

      <section className="stats-grid">
        <StatCard
          label="API operations"
          value={requestsDocument.count}
          detail="generated from route:list"
        />
        <StatCard
          label="Journeys"
          value={journeys.length}
          detail="steps + DB impact"
          tone="amber"
        />
        <StatCard label="Models" value={models.length} detail="ERD + table explorer" tone="green" />
        <StatCard
          label="Commands"
          value={commands.length}
          detail={`${serviceCount} services documented`}
          tone="red"
        />
      </section>

      <section className="atlas-grid">
        <div className="map-panel">
          <div className="panel-heading">
            <div>
              <p className="section-label">Architecture map</p>
              <h3>Request → response spine</h3>
            </div>
            <span className="panel-note">click a node to inspect files</span>
          </div>
          <ArchitectureMap selectedId={selectedId} onSelect={setSelectedId} />
        </div>
        <Inspector node={selectedNode.data} />
      </section>

      <section className="phase-grid">
        <article>
          <span className="section-label">What is navigable</span>
          <h3>Six surfaces, one system</h3>
          <ul>
            <li>Generated request catalog for all {requestsDocument.count} API operations.</li>
            <li>{journeys.length} playable journeys and cross-cutting systems with SQL impact.</li>
            <li>{models.length} models, an ERD, and a table explorer with readers and writers.</li>
            <li>{commands.length} commands with options, writes, external calls, and schedules.</li>
            <li>{files.length} catalogued files, each with a purpose.</li>
            <li>Presenter mode with keyboard navigation and live collection switching.</li>
          </ul>
        </article>
        <article>
          <span className="section-label">Presentation flow</span>
          <h3>Suggested demo path</h3>
          <ul>
            <li>Owner login → tenant provisioning → invitation acceptance.</li>
            <li>Tenant login → post lifecycle → viewer directory.</li>
            <li>Permission resync → support access audit trail.</li>
            <li>Checkout → Stripe webhook → billing metrics.</li>
            <li>Tenant soft delete → restore → scheduled purge.</li>
            <li>Finish on the cross-cutting systems, then open the ERD.</li>
          </ul>
        </article>
      </section>
    </div>
  );
}
