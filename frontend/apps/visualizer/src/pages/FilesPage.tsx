import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { LayerBadge } from '../components/Badges';
import { files } from '../data';

const layers = ['ALL', ...Array.from(new Set(files.map((file) => file.layer))).sort()];

export default function FilesPage() {
  const [params] = useSearchParams();
  const deepPath = params.get('path');
  const [query, setQuery] = useState(deepPath ?? '');
  const [layer, setLayer] = useState('ALL');

  useEffect(() => {
    if (deepPath) {
      setQuery(deepPath);
    }
  }, [deepPath]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();

    return files.filter((file) => {
      const matchesQuery =
        term.length === 0 ||
        [file.path, file.purpose, ...file.features].join(' ').toLowerCase().includes(term);

      return matchesQuery && (layer === 'ALL' || file.layer === layer);
    });
  }, [layer, query]);

  return (
    <div className="page">
      <section className="page-hero compact">
        <div>
          <p className="eyebrow">Source map</p>
          <h2>Every important file, and why it exists.</h2>
          <p>
            Only files involved in journeys, requests, models, commands, or cross-cutting systems
            are catalogued. Validation checks that every path still exists.
          </p>
        </div>
        <div className="hero-counter">
          <strong>{filtered.length}</strong>
          <span>of {files.length} files</span>
        </div>
      </section>

      <section className="catalog-toolbar">
        <label className="search-field">
          <span>Search</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="path, purpose, feature…"
          />
        </label>

        <label className="select-field wide">
          <span>Layer</span>
          <select value={layer} onChange={(event) => setLayer(event.target.value)}>
            {layers.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
      </section>

      <section className="file-grid">
        {filtered.map((file) => (
          <article
            key={file.path}
            className={`file-card${file.path === deepPath ? ' highlighted' : ''}`}
          >
            <div className="file-head">
              <LayerBadge layer={file.layer} />
              <span>{file.features.length} links</span>
            </div>
            <code>{file.path}</code>
            <p>{file.purpose}</p>
            <div className="feature-list">
              {file.features.map((feature) => (
                <span key={feature}>{feature}</span>
              ))}
            </div>
          </article>
        ))}
      </section>

      {filtered.length === 0 && <p className="empty-state">No files match the current filters.</p>}
    </div>
  );
}
