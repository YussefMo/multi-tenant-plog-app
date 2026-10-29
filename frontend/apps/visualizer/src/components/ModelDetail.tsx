import { Link } from 'react-router-dom';
import type { ModelRecord } from '../types';
import { DbOpBadge } from './Badges';

interface ModelDetailProps {
  model: ModelRecord;
}

export default function ModelDetail({ model }: ModelDetailProps) {
  return (
    <article className="detail-panel">
      <header className="detail-head">
        <div>
          <p className="eyebrow">
            {model.connection === 'owner' ? 'Owner database' : 'Application database'} · model
          </p>
          <h2>{model.name}</h2>
          <code className="detail-path">{model.table}</code>
        </div>
        <div className="detail-chips">
          <span className={`connection-chip ${model.connection}`}>{model.connection}</span>
          {model.softDeletes && <span className="connection-chip soft">soft deletes</span>}
        </div>
      </header>

      <p className="detail-purpose">{model.purpose}</p>

      <div className="detail-columns">
        <p className="section-label">Columns</p>
        <table className="data-table">
          <thead>
            <tr>
              <th>Column</th>
              <th>Type</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {model.columns.map((column) => (
              <tr key={column.name}>
                <td>
                  <code>{column.name}</code>
                </td>
                <td>{column.type}</td>
                <td>{column.note ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="detail-split">
        <div>
          <p className="section-label">Relationships</p>
          {model.relations.length > 0 ? (
            <ul className="relation-list">
              {model.relations.map((relation) => (
                <li key={`${relation.type}-${relation.model}-${relation.foreignKey}`}>
                  <span className="relation-type">{relation.type}</span>
                  <Link
                    className="ref-link"
                    to={`/models?model=${encodeURIComponent(relation.model)}`}
                  >
                    {relation.model}
                  </Link>
                  <code>{relation.foreignKey}</code>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted-copy">
              No Eloquent relationships. This model is isolated by design.
            </p>
          )}

          {model.scopes.length > 0 && (
            <>
              <p className="section-label">Scopes</p>
              <div className="feature-list">
                {model.scopes.map((scope) => (
                  <span key={scope}>{scope}</span>
                ))}
              </div>
            </>
          )}
        </div>

        <div>
          <p className="section-label">Readers</p>
          <ul className="plain-list">
            {model.readers.map((reader) => (
              <li key={reader}>{reader}</li>
            ))}
          </ul>
          <p className="section-label">Writers</p>
          <ul className="plain-list">
            {model.writers.map((writer) => (
              <li key={writer}>{writer}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="detail-footer">
        <span className="section-label">Model file</span>
        <Link className="ref-link" to={`/files?path=${encodeURIComponent(model.file)}`}>
          {model.file}
        </Link>
        <span className="detail-op">
          <DbOpBadge operation="read" /> authorization and display
        </span>
        <span className="detail-op">
          <DbOpBadge operation="upsert" /> writes listed above
        </span>
      </div>
    </article>
  );
}
