import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import SecurityDetail from '@/components/SecurityDetail';
import StatCard from '@/components/StatCard';
import { securityCategories, securityMeasures } from '@/data';
import type { SecurityPosture } from '@/types';

const realms = ['all', 'owner', 'tenant', 'public', 'cross-cutting'] as const;
const postures: (SecurityPosture | 'all')[] = [
  'all',
  'enforced',
  'configurable',
  'defense-in-depth',
];

export default function SecurityPage() {
  const [params, setParams] = useSearchParams();
  const query = (params.get('q') ?? '').trim().toLowerCase();
  const category = params.get('category') ?? 'all';
  const realm = params.get('realm') ?? 'all';
  const posture = params.get('posture') ?? 'all';
  const selectedId = params.get('measure') ?? '';

  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params);

    if (value === '' || value === 'all') {
      next.delete(key);
    } else {
      next.set(key, value);
    }

    if (key !== 'measure') {
      next.delete('measure');
    }

    setParams(next, { replace: true });
  };

  const filtered = useMemo(() => {
    return securityMeasures.filter((measure) => {
      if (category !== 'all' && measure.category !== category) {
        return false;
      }

      if (realm !== 'all' && measure.realm !== realm) {
        return false;
      }

      if (posture !== 'all' && measure.posture !== posture) {
        return false;
      }

      if (query === '') {
        return true;
      }

      return [
        measure.title,
        measure.summary,
        measure.threat,
        measure.control,
        measure.why,
        measure.category,
        measure.realm,
        ...measure.files,
      ]
        .join(' ')
        .toLowerCase()
        .includes(query);
    });
  }, [category, posture, query, realm]);

  const grouped = securityCategories
    .map((item) => ({
      ...item,
      measures: filtered.filter((measure) => measure.category === item.id),
    }))
    .filter((item) => item.measures.length > 0);

  const selected = filtered.find((measure) => measure.id === selectedId) ?? filtered[0] ?? null;

  const criticalCount = securityMeasures.filter(
    (measure) => measure.risk === 'critical' || measure.risk === 'high',
  ).length;
  const fileCount = new Set(securityMeasures.flatMap((measure) => measure.files)).size;

  return (
    <div className="page">
      <section className="page-hero compact">
        <div>
          <p className="eyebrow">Security layer · cross-cutting</p>
          <h2>Every control that protects the API.</h2>
          <p>
            Each measure records the threat, the control, the reason it exists, the exact
            implementation, and the files, endpoints, tests, and journeys behind it.
          </p>
        </div>
        <div className="hero-counter">
          <strong>{securityMeasures.length}</strong>
          <span>security measures</span>
        </div>
      </section>

      <div className="stat-grid">
        <StatCard
          label="Measures"
          value={securityMeasures.length}
          detail={`${securityCategories.length} categories`}
          tone="cyan"
        />
        <StatCard
          label="Critical + high"
          value={criticalCount}
          detail="Controls with the largest blast radius"
          tone="red"
        />
        <StatCard
          label="Realms"
          value="3 + shared"
          detail="Owner, tenant, public, cross-cutting"
          tone="amber"
        />
        <StatCard
          label="Referenced files"
          value={fileCount}
          detail="Every link resolves through the file catalog"
          tone="green"
        />
      </div>

      <div className="security-toolbar">
        <input
          className="security-search"
          value={params.get('q') ?? ''}
          onChange={(event) => update('q', event.target.value)}
          placeholder="Search threats, controls, or files"
          aria-label="Search security measures"
        />

        <label className="select-field inline">
          <span>Category</span>
          <select value={category} onChange={(event) => update('category', event.target.value)}>
            <option value="all">All categories</option>
            {securityCategories.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

        <label className="select-field inline">
          <span>Realm</span>
          <select value={realm} onChange={(event) => update('realm', event.target.value)}>
            {realms.map((item) => (
              <option key={item} value={item}>
                {item === 'all' ? 'All realms' : item}
              </option>
            ))}
          </select>
        </label>

        <label className="select-field inline">
          <span>Posture</span>
          <select value={posture} onChange={(event) => update('posture', event.target.value)}>
            {postures.map((item) => (
              <option key={item} value={item}>
                {item === 'all' ? 'All postures' : item}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="journey-layout">
        <aside className="journey-index">
          <p className="section-label">
            {filtered.length} of {securityMeasures.length} measures
          </p>

          <div className="journey-index-list">
            {grouped.map((group) => (
              <div key={group.id} className="security-category-group">
                <div className="security-category-row">
                  <span className={`tone-dot tone-${group.tone}`} />
                  <span>{group.label}</span>
                  <small>{group.measures.length}</small>
                </div>

                {group.measures.map((measure) => (
                  <button
                    key={measure.id}
                    type="button"
                    className={`journey-index-item${measure.id === selected?.id ? ' active' : ''}`}
                    onClick={() => update('measure', measure.id)}
                  >
                    <span className={`tone-dot tone-${group.tone}`} />
                    <div>
                      <strong>{measure.title}</strong>
                      <p>{measure.summary}</p>
                    </div>
                  </button>
                ))}
              </div>
            ))}
          </div>

          {grouped.length === 0 ? (
            <div className="empty-state">
              <strong>No measures found</strong>
              <p>Try a different search, category, realm, or posture.</p>
            </div>
          ) : null}
        </aside>

        <div className="journey-stage">
          {selected ? (
            <SecurityDetail measure={selected} />
          ) : (
            <div className="empty-state">
              <strong>No measure selected</strong>
              <p>Adjust the filters to see a security measure.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
