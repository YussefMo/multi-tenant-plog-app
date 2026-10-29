import { useState } from 'react';
import ArchitectureMap from '../components/ArchitectureMap';
import Inspector from '../components/Inspector';
import StatCard from '../components/StatCard';
import { files, requestsDocument } from '../data';
import { architectureNodes } from '../data/architecture';

const modelCount = files.filter((file) => file.layer === 'model').length;
const commandCount = files.filter((file) => file.layer === 'command').length;
const serviceCount = files.filter((file) => file.layer === 'service').length;

export default function OverviewPage() {
  const [selectedId, setSelectedId] = useState('frontends');
  const selectedNode =
    architectureNodes.find((node) => node.id === selectedId) ?? architectureNodes[0];

  return (
    <div className="page">
      <section className="page-hero">
        <div>
          <p className="eyebrow">Visual journey · phase 1</p>
          <h2>Trace the backend before you demo it.</h2>
          <p>
            A live map of the Laravel system: request entry points, session realms, middleware,
            controllers, services, models, databases, commands, and the files behind them.
          </p>
        </div>
        <div className="hero-stamp">
          <span>ATLAS</span>
          <strong>01</strong>
          <small>foundation</small>
        </div>
      </section>

      <section className="stats-grid">
        <StatCard
          label="API operations"
          value={requestsDocument.count}
          detail="generated from route:list"
        />
        <StatCard label="Models" value={modelCount} detail="Eloquent + scopes" tone="amber" />
        <StatCard
          label="Services"
          value={serviceCount}
          detail="business logic layer"
          tone="green"
        />
        <StatCard
          label="Commands"
          value={commandCount}
          detail="operational entry points"
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
          <span className="section-label">Phase 1 surface</span>
          <h3>What is already navigable</h3>
          <ul>
            <li>Generated request catalog for all 60 API operations.</li>
            <li>Searchable catalog of 126 files with purpose and feature tags.</li>
            <li>Clickable architecture map across middleware, services, models, and databases.</li>
            <li>Pnpm monorepo with owner, tenant, user, and visualizer apps.</li>
          </ul>
        </article>
        <article>
          <span className="section-label">Next surface</span>
          <h3>What comes next</h3>
          <ul>
            <li>Step-by-step journeys with request and DB impact.</li>
            <li>ERD and table explorer.</li>
            <li>Command atlas with side effects.</li>
            <li>Presenter mode with live feature switching.</li>
          </ul>
        </article>
      </section>
    </div>
  );
}
