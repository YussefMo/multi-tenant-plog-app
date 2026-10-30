import { Link } from 'react-router-dom';
import type { Journey, JourneyStep } from '@/types';
import { DbOpBadge, MethodBadge, RealmBadge, ToneBadge } from '@/components/Badges';

interface JourneyPlayerProps {
  journey: Journey;
  stepIndex: number;
  onStepChange: (index: number) => void;
  presenter?: boolean;
  showNotes?: boolean;
}

function FileLink({ path }: { path: string }) {
  return (
    <Link className="ref-link" to={`/files?path=${encodeURIComponent(path)}`}>
      {path}
    </Link>
  );
}

function StepDetail({ step, presenter }: { step: JourneyStep; presenter: boolean }) {
  return (
    <div className={`step-detail${presenter ? ' presenter-step' : ''}`}>
      <div className="step-heading">
        <div>
          <p className="section-label">Step · {step.actor}</p>
          <h3>{step.title}</h3>
        </div>
        {step.request && (
          <Link
            className="request-pill"
            to={`/requests?path=${encodeURIComponent(step.request.path)}`}
          >
            <MethodBadge method={step.request.method} />
            <code>{step.request.path}</code>
          </Link>
        )}
      </div>

      <p className="step-summary">{step.summary}</p>

      <div className="step-grid">
        <div className="step-main">
          {(step.middleware?.length || step.controller || step.requestClass || step.service) && (
            <div className="flow-block">
              <p className="section-label">Request path</p>
              <div className="flow-chain">
                {step.middleware?.map((item) => (
                  <span key={item} className="flow-node middleware">
                    {item}
                  </span>
                ))}
                {step.requestClass && (
                  <span className="flow-node request">{step.requestClass.split('\\').at(-1)}</span>
                )}
                {step.controller && <span className="flow-node controller">{step.controller}</span>}
                {step.service && <span className="flow-node service">{step.service}</span>}
                {step.models?.map((model) => (
                  <Link
                    key={model}
                    className="flow-node model"
                    to={`/models?model=${encodeURIComponent(model)}`}
                  >
                    {model}
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="step-io-grid">
            {step.response && (
              <article className="io-card response">
                <p className="section-label">Response</p>
                <code>{step.response}</code>
              </article>
            )}
            {step.errors && step.errors.length > 0 && (
              <article className="io-card errors">
                <p className="section-label">Error branches</p>
                <ul>
                  {step.errors.map((error) => (
                    <li key={error}>{error}</li>
                  ))}
                </ul>
              </article>
            )}
          </div>

          {step.files && step.files.length > 0 && (
            <div className="step-files">
              <p className="section-label">Files touched</p>
              <div className="step-file-list">
                {step.files.map((path) => (
                  <FileLink key={path} path={path} />
                ))}
              </div>
            </div>
          )}
        </div>

        <aside className="step-side">
          <div className="impact-card">
            <p className="section-label">Database impact</p>
            {step.tables && step.tables.length > 0 ? (
              <ul className="impact-list">
                {step.tables.map((impact, index) => (
                  <li key={`${impact.table}-${impact.operation}-${index}`}>
                    <div>
                      <Link
                        className="ref-link"
                        to={`/models?table=${encodeURIComponent(impact.table)}`}
                      >
                        {impact.table}
                      </Link>
                      <DbOpBadge operation={impact.operation} />
                    </div>
                    <p>{impact.detail}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted-copy">No database writes or reads in this step.</p>
            )}
          </div>

          {step.speakerNotes && (
            <div className="speaker-card">
              <p className="section-label">Speaker notes</p>
              <p>{step.speakerNotes}</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

export default function JourneyPlayer({
  journey,
  stepIndex,
  onStepChange,
  presenter = false,
  showNotes = true,
}: JourneyPlayerProps) {
  const step = journey.steps[stepIndex] ?? journey.steps[0];
  const isFirst = stepIndex <= 0;
  const isLast = stepIndex >= journey.steps.length - 1;

  return (
    <div className={`journey-player${presenter ? ' presenter-player' : ''}`}>
      <header className="journey-header">
        <div>
          <p className="eyebrow">
            {journey.kind === 'system' ? 'Cross-cutting system' : 'Journey'} · {journey.feature}
          </p>
          <h2>{journey.title}</h2>
          <p className="journey-subtitle">{journey.subtitle}</p>
        </div>
        <div className="journey-badges">
          <RealmBadge realm={journey.realm} />
          <ToneBadge tone={journey.tone}>{journey.kind}</ToneBadge>
          <span className="step-counter">
            {stepIndex + 1} / {journey.steps.length}
          </span>
        </div>
      </header>

      <div className="journey-context">
        <div>
          <p className="section-label">Actors</p>
          <p>{journey.actors.join(' · ')}</p>
        </div>
        <div>
          <p className="section-label">Preconditions</p>
          <ul>
            {journey.preconditions.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="section-label">Outcome</p>
          <p>{journey.outcome}</p>
        </div>
      </div>

      <div className="step-rail" role="tablist" aria-label={`${journey.title} steps`}>
        {journey.steps.map((item, index) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={index === stepIndex}
            className={`step-rail-item${index === stepIndex ? ' active' : ''}${index < stepIndex ? ' done' : ''}`}
            onClick={() => onStepChange(index)}
          >
            <span className="step-number">{String(index + 1).padStart(2, '0')}</span>
            <span>{item.title}</span>
          </button>
        ))}
      </div>

      <StepDetail step={step} presenter={presenter} />

      {showNotes && !presenter && (
        <div className="player-actions">
          <button
            type="button"
            className="ghost-button"
            onClick={() => onStepChange(Math.max(0, stepIndex - 1))}
            disabled={isFirst}
          >
            ← Previous
          </button>
          <span className="player-hint">
            Use the rail to jump. Every step links to its request and files.
          </span>
          <button
            type="button"
            className="primary-button"
            onClick={() => onStepChange(Math.min(journey.steps.length - 1, stepIndex + 1))}
            disabled={isLast}
          >
            Next step →
          </button>
        </div>
      )}
    </div>
  );
}
