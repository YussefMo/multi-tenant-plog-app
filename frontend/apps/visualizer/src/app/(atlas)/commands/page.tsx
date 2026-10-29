import { Link, useSearchParams } from 'react-router-dom';
import CommandDetail from '@/components/CommandDetail';
import { commands, commandsByName, schedules } from '@/data';

export default function CommandsPage() {
  const [params, setParams] = useSearchParams();
  const selectedName = params.get('command') ?? commands[0].name;
  const selected = commandsByName.get(selectedName) ?? commands[0];

  return (
    <div className="page">
      <section className="page-hero compact">
        <div>
          <p className="eyebrow">Operational entry points · phase 3</p>
          <h2>Commands are part of the architecture too.</h2>
          <p>
            Each command documents its options, reads, writes, external calls, schedule,
            idempotency, and output. Commands share services and models with the HTTP surface.
          </p>
        </div>
        <div className="hero-counter">
          <strong>{commands.length}</strong>
          <span>{schedules.length} scheduled job</span>
        </div>
      </section>

      <div className="command-layout">
        <aside className="journey-index">
          <p className="section-label">Artisan commands</p>
          <div className="journey-index-list">
            {commands.map((command) => (
              <button
                key={command.name}
                type="button"
                className={`journey-index-item${command.name === selected.name ? ' active' : ''}`}
                onClick={() => {
                  const next = new URLSearchParams(params);
                  next.set('command', command.name);
                  setParams(next);
                }}
              >
                <span className={`tone-dot tone-${command.tone}`} />
                <div>
                  <strong>{command.name}</strong>
                  <p>{command.purpose}</p>
                </div>
              </button>
            ))}
          </div>

          <p className="section-label">Scheduled</p>
          <div className="journey-index-list">
            {schedules.map((schedule) => (
              <div key={schedule.id} className="schedule-card">
                <strong>{schedule.command}</strong>
                <code>{schedule.expression}</code>
                <p>{schedule.cadence}</p>
                <Link className="ref-link" to={`/files?path=${encodeURIComponent(schedule.file)}`}>
                  {schedule.file}
                </Link>
              </div>
            ))}
          </div>
        </aside>

        <div className="journey-stage">
          <CommandDetail command={selected} />

          {schedules.map((schedule) => (
            <article key={schedule.id} className="schedule-panel">
              <p className="section-label">Scheduler · {schedule.cadence}</p>
              <h3>{schedule.command}</h3>
              <p>{schedule.purpose}</p>
              <ul className="plain-list">
                {schedule.effects.map((effect) => (
                  <li key={effect}>{effect}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
