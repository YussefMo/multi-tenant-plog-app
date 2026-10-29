import { useMemo, useState } from 'react';
import { MethodBadge, RealmBadge } from '../components/Badges';
import { requestsDocument } from '../data';

const methods = [
  'ALL',
  ...Array.from(new Set(requestsDocument.requests.map((item) => item.method))),
];
const groups = [
  'ALL',
  ...Array.from(new Set(requestsDocument.requests.map((item) => item.group))).sort(),
];
const realms = ['ALL', 'public', 'owner', 'tenant'] as const;

export default function RequestsPage() {
  const [query, setQuery] = useState('');
  const [method, setMethod] = useState('ALL');
  const [group, setGroup] = useState('ALL');
  const [realm, setRealm] = useState<(typeof realms)[number]>('ALL');

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();

    return requestsDocument.requests.filter((request) => {
      const matchesQuery =
        term.length === 0 ||
        [request.path, request.name, request.controller, request.group]
          .join(' ')
          .toLowerCase()
          .includes(term);

      return (
        matchesQuery &&
        (method === 'ALL' || request.method === method) &&
        (group === 'ALL' || request.group === group) &&
        (realm === 'ALL' || request.realm === realm)
      );
    });
  }, [group, method, query, realm]);

  return (
    <div className="page">
      <section className="page-hero compact">
        <div>
          <p className="eyebrow">Generated inventory</p>
          <h2>Every API operation, one card each.</h2>
          <p>
            This list is generated from Laravel itself, so it cannot silently miss a route. Each
            card shows its realm, permissions, controller, middleware, and source file.
          </p>
        </div>
        <div className="hero-counter">
          <strong>{filtered.length}</strong>
          <span>of {requestsDocument.count} operations</span>
        </div>
      </section>

      <section className="catalog-toolbar">
        <label className="search-field">
          <span>Search</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="path, controller, route name…"
          />
        </label>

        <label className="select-field">
          <span>Method</span>
          <select value={method} onChange={(event) => setMethod(event.target.value)}>
            {methods.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>

        <label className="select-field">
          <span>Realm</span>
          <select
            value={realm}
            onChange={(event) => setRealm(event.target.value as (typeof realms)[number])}
          >
            {realms.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>

        <label className="select-field wide">
          <span>Group</span>
          <select value={group} onChange={(event) => setGroup(event.target.value)}>
            {groups.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
      </section>

      <section className="request-grid">
        {filtered.map((request) => (
          <article key={`${request.method}-${request.path}`} className="request-card">
            <div className="request-head">
              <MethodBadge method={request.method} />
              <RealmBadge realm={request.realm} />
              <span className="request-group">{request.group}</span>
            </div>

            <code className="request-path">{request.path}</code>
            <p className="request-name">{request.name}</p>

            <dl className="request-meta">
              <div>
                <dt>Controller</dt>
                <dd>{request.controller}</dd>
              </div>
              <div>
                <dt>File</dt>
                <dd>
                  <code>{request.controllerFile}</code>
                </dd>
              </div>
              {request.permissions.length > 0 && (
                <div>
                  <dt>Permission</dt>
                  <dd className="permission-list">
                    {request.permissions.map((permission) => (
                      <span key={permission}>{permission}</span>
                    ))}
                  </dd>
                </div>
              )}
            </dl>

            <div className="middleware-list">
              {request.middleware.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          </article>
        ))}
      </section>

      {filtered.length === 0 && (
        <p className="empty-state">No operations match the current filters.</p>
      )}
    </div>
  );
}
