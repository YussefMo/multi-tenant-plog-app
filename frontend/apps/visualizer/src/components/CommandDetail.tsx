import { Link } from 'react-router-dom';
import type { CommandRecord } from '../types';
import { DbOpBadge, ToneBadge } from './Badges';

interface CommandDetailProps {
  command: CommandRecord;
}

export default function CommandDetail({ command }: CommandDetailProps) {
  return (
    <article className="detail-panel">
      <header className="detail-head">
        <div>
          <p className="eyebrow">Operational command</p>
          <h2>{command.name}</h2>
          <code className="detail-path">{command.signature}</code>
        </div>
        <div className="detail-chips">
          <ToneBadge tone={command.tone}>artisan</ToneBadge>
          <span className={`connection-chip ${command.idempotent ? 'soft' : ''}`}>
            {command.idempotent ? 'idempotent' : 'not idempotent'}
          </span>
        </div>
      </header>

      <p className="detail-purpose">{command.purpose}</p>

      <div className="detail-split">
        <div>
          <p className="section-label">Options</p>
          {command.options.length > 0 ? (
            <ul className="option-list">
              {command.options.map((option) => (
                <li key={option.flag}>
                  <code>{option.flag}</code>
                  <p>{option.description}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted-copy">No options.</p>
          )}

          <p className="section-label">Reads</p>
          <ul className="plain-list">
            {command.reads.map((read) => (
              <li key={read}>{read}</li>
            ))}
          </ul>

          {command.external.length > 0 && (
            <>
              <p className="section-label">External calls</p>
              <ul className="plain-list">
                {command.external.map((call) => (
                  <li key={call}>{call}</li>
                ))}
              </ul>
            </>
          )}
        </div>

        <div>
          <p className="section-label">Writes</p>
          <ul className="impact-list">
            {command.writes.map((write, index) => (
              <li key={`${write.table}-${write.operation}-${index}`}>
                <div>
                  <Link
                    className="ref-link"
                    to={`/models?table=${encodeURIComponent(write.table)}`}
                  >
                    {write.table}
                  </Link>
                  <DbOpBadge operation={write.operation} />
                </div>
                <p>{write.detail}</p>
              </li>
            ))}
          </ul>

          {command.schedule && (
            <>
              <p className="section-label">Schedule</p>
              <p className="schedule-note">{command.schedule}</p>
            </>
          )}
        </div>
      </div>

      <div className="detail-columns">
        <p className="section-label">Output</p>
        <div className="feature-list">
          {command.output.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </div>
        <p className="command-note">{command.notes}</p>
      </div>

      <div className="detail-footer">
        <span className="section-label">Command file</span>
        <Link className="ref-link" to={`/files?path=${encodeURIComponent(command.file)}`}>
          {command.file}
        </Link>
      </div>
    </article>
  );
}
