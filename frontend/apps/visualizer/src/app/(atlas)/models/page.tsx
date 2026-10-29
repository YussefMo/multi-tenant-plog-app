import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import ModelDetail from '@/components/ModelDetail';
import ModelGraph from '@/components/ModelGraph';
import { models, modelsByName, tables, tablesByName } from '@/data';

export default function ModelsPage() {
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') === 'tables' ? 'tables' : 'models';
  const selectedModelName = params.get('model') ?? models[0].name;
  const selectedModel = modelsByName.get(selectedModelName) ?? models[0];
  const selectedTableName = params.get('table') ?? tables[0].name;
  const selectedTable = tablesByName.get(selectedTableName) ?? tables[0];

  const modelOptions = useMemo(() => models.map((model) => model.name), []);

  const selectModel = (name: string) => {
    const next = new URLSearchParams(params);
    next.set('model', name);
    next.delete('table');
    setParams(next);
  };

  const selectTable = (name: string) => {
    const next = new URLSearchParams(params);
    next.set('table', name);
    setParams(next);
  };

  return (
    <div className="page">
      <section className="page-hero compact">
        <div>
          <p className="eyebrow">Models and schema · phase 3</p>
          <h2>Every model, column, relation, and writer.</h2>
          <p>
            The ERD covers the application database and the isolated owner database. The table
            explorer shows which requests and commands read or write each table.
          </p>
        </div>
        <div className="hero-counter">
          <strong>{models.length}</strong>
          <span>{tables.length} tables · 2 connections</span>
        </div>
      </section>

      <div className="tab-row">
        <button
          type="button"
          className={`tab-button${tab === 'models' ? ' active' : ''}`}
          onClick={() => {
            const next = new URLSearchParams(params);
            next.delete('tab');
            setParams(next);
          }}
        >
          Model explorer
        </button>
        <button
          type="button"
          className={`tab-button${tab === 'tables' ? ' active' : ''}`}
          onClick={() => {
            const next = new URLSearchParams(params);
            next.set('tab', 'tables');
            setParams(next);
          }}
        >
          Table explorer
        </button>
        <span className="tab-note">
          {tab === 'models'
            ? 'Click a node to inspect the model.'
            : 'Select a table to see readers and writers.'}
        </span>
      </div>

      {tab === 'models' ? (
        <>
          <section className="map-panel">
            <div className="panel-heading">
              <div>
                <p className="section-label">Entity relationship diagram</p>
                <h3>13 Eloquent models</h3>
              </div>
              <label className="select-field inline">
                <span>Model</span>
                <select
                  value={selectedModel.name}
                  onChange={(event) => selectModel(event.target.value)}
                >
                  {modelOptions.map((name) => (
                    <option key={name}>{name}</option>
                  ))}
                </select>
              </label>
            </div>
            <ModelGraph selectedName={selectedModel.name} onSelect={selectModel} />
          </section>
          <ModelDetail model={selectedModel} />
        </>
      ) : (
        <div className="table-layout">
          <aside className="table-index">
            <p className="section-label">Tables</p>
            {tables.map((table) => (
              <button
                key={table.name}
                type="button"
                className={`table-index-item${table.name === selectedTable.name ? ' active' : ''}`}
                onClick={() => selectTable(table.name)}
              >
                <code>{table.name}</code>
                <span>{table.connection}</span>
              </button>
            ))}
          </aside>

          <article className="detail-panel">
            <header className="detail-head">
              <div>
                <p className="eyebrow">{selectedTable.connection} connection · table</p>
                <h2>{selectedTable.name}</h2>
                {selectedTable.model && (
                  <Link
                    className="ref-link"
                    to={`/models?model=${encodeURIComponent(selectedTable.model)}`}
                  >
                    Model: {selectedTable.model}
                  </Link>
                )}
              </div>
              <div className="detail-chips">
                <span className={`connection-chip ${selectedTable.connection}`}>
                  {selectedTable.connection}
                </span>
                {selectedTable.softDeletes && (
                  <span className="connection-chip soft">soft deletes</span>
                )}
              </div>
            </header>

            <p className="detail-purpose">{selectedTable.purpose}</p>

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
                  {selectedTable.columns.map((column) => (
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

            {selectedTable.indexes.length > 0 && (
              <div className="detail-columns">
                <p className="section-label">Indexes</p>
                <div className="feature-list">
                  {selectedTable.indexes.map((index) => (
                    <span key={index}>{index}</span>
                  ))}
                </div>
              </div>
            )}

            <div className="detail-split">
              <div>
                <p className="section-label">Read by</p>
                <ul className="plain-list">
                  {selectedTable.readers.map((reader) => (
                    <li key={reader}>{reader}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="section-label">Written by</p>
                <ul className="plain-list">
                  {selectedTable.writers.map((writer) => (
                    <li key={writer}>{writer}</li>
                  ))}
                </ul>
              </div>
            </div>
          </article>
        </div>
      )}
    </div>
  );
}
