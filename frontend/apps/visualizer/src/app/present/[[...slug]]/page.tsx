import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import CommandDetail from '@/components/CommandDetail';
import JourneyPlayer from '@/components/JourneyPlayer';
import ModelDetail from '@/components/ModelDetail';
import RequestDetail from '@/components/RequestDetail';
import { ThemeToggle } from '@multi-tenant-plog/shared/ui/theme-toggle';
import { commands, journeys, journeysById, models, modelsByName, requestsDocument } from '@/data';

type Collection = 'journeys' | 'models' | 'commands' | 'requests';

const collections: { id: Collection; label: string; count: number }[] = [
  { id: 'journeys', label: 'Journeys', count: journeys.length },
  { id: 'models', label: 'Models', count: models.length },
  { id: 'commands', label: 'Commands', count: commands.length },
  { id: 'requests', label: 'Requests', count: requestsDocument.count },
];

function parseCollection(value: string | undefined): Collection {
  return collections.some((item) => item.id === value) ? (value as Collection) : 'journeys';
}

export default function PresentPage() {
  const navigate = useNavigate();
  const params = useParams();
  const collection = parseCollection(params.collection);
  const [focus, setFocus] = useState(false);

  const journey = journeysById.get(params.itemId ?? '') ?? journeys[0];
  const stepIndex = Math.max(
    0,
    journey.steps.findIndex((step) => step.id === params.stepId),
  );

  const model = modelsByName.get(params.itemId ?? '') ?? models[0];
  const command = commands.find((item) => item.name === params.itemId) ?? commands[0];
  const request =
    requestsDocument.requests.find((item) => item.name === params.itemId) ??
    requestsDocument.requests[0];

  const journeyPosition = journeys.findIndex((item) => item.id === journey.id);
  const modelPosition = models.findIndex((item) => item.name === model.name);
  const commandPosition = commands.findIndex((item) => item.name === command.name);
  const requestPosition = requestsDocument.requests.findIndex((item) => item.name === request.name);

  const goNext = useCallback(() => {
    if (collection === 'journeys') {
      if (stepIndex < journey.steps.length - 1) {
        navigate(`/present/journeys/${journey.id}/${journey.steps[stepIndex + 1].id}`);
        return;
      }

      const nextJourney = journeys[(journeyPosition + 1) % journeys.length];
      navigate(`/present/journeys/${nextJourney.id}/${nextJourney.steps[0].id}`);
      return;
    }

    if (collection === 'models') {
      const next = models[(modelPosition + 1) % models.length];
      navigate(`/present/models/${encodeURIComponent(next.name)}`);
      return;
    }

    if (collection === 'commands') {
      const next = commands[(commandPosition + 1) % commands.length];
      navigate(`/present/commands/${encodeURIComponent(next.name)}`);
      return;
    }

    const next =
      requestsDocument.requests[(requestPosition + 1) % requestsDocument.requests.length];
    navigate(`/present/requests/${encodeURIComponent(next.name)}`);
  }, [
    collection,
    commandPosition,
    journey,
    journeyPosition,
    modelPosition,
    requestPosition,
    stepIndex,
  ]);

  const goPrevious = useCallback(() => {
    if (collection === 'journeys') {
      if (stepIndex > 0) {
        navigate(`/present/journeys/${journey.id}/${journey.steps[stepIndex - 1].id}`);
        return;
      }

      const previousJourney = journeys[(journeyPosition - 1 + journeys.length) % journeys.length];
      navigate(
        `/present/journeys/${previousJourney.id}/${previousJourney.steps.at(-1)?.id ?? previousJourney.steps[0].id}`,
      );
      return;
    }

    if (collection === 'models') {
      const previous = models[(modelPosition - 1 + models.length) % models.length];
      navigate(`/present/models/${encodeURIComponent(previous.name)}`);
      return;
    }

    if (collection === 'commands') {
      const previous = commands[(commandPosition - 1 + commands.length) % commands.length];
      navigate(`/present/commands/${encodeURIComponent(previous.name)}`);
      return;
    }

    const previous =
      requestsDocument.requests[
        (requestPosition - 1 + requestsDocument.requests.length) % requestsDocument.requests.length
      ];
    navigate(`/present/requests/${encodeURIComponent(previous.name)}`);
  }, [
    collection,
    commandPosition,
    journey,
    journeyPosition,
    modelPosition,
    requestPosition,
    stepIndex,
  ]);

  const switchCollection = useCallback(
    (next: Collection) => {
      if (next === 'journeys') {
        navigate(`/present/journeys/${journey.id}/${journey.steps[stepIndex].id}`);
      } else if (next === 'models') {
        navigate(`/present/models/${encodeURIComponent(model.name)}`);
      } else if (next === 'commands') {
        navigate(`/present/commands/${encodeURIComponent(command.name)}`);
      } else {
        navigate(`/present/requests/${encodeURIComponent(request.name)}`);
      }
    },
    [command.name, journey, model.name, navigate, request.name, stepIndex],
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;

      if (target && ['INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName)) {
        return;
      }

      if (event.key === 'ArrowRight' || event.key === ' ' || event.key === 'PageDown') {
        event.preventDefault();
        goNext();
      } else if (event.key === 'ArrowLeft' || event.key === 'PageUp') {
        event.preventDefault();
        goPrevious();
      } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        goNext();
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        goPrevious();
      } else if (event.key === '1') {
        switchCollection('journeys');
      } else if (event.key === '2') {
        switchCollection('models');
      } else if (event.key === '3') {
        switchCollection('commands');
      } else if (event.key === '4') {
        switchCollection('requests');
      } else if (event.key.toLowerCase() === 'f') {
        setFocus((value) => !value);
      } else if (event.key === 'Escape') {
        navigate('/');
      }
    };

    window.addEventListener('keydown', onKeyDown);

    return () => window.removeEventListener('keydown', onKeyDown);
  }, [goNext, goPrevious, navigate, switchCollection]);

  const position =
    collection === 'journeys'
      ? journeyPosition
      : collection === 'models'
        ? modelPosition
        : collection === 'commands'
          ? commandPosition
          : requestPosition;
  const total =
    collection === 'journeys'
      ? journeys.length
      : collection === 'models'
        ? models.length
        : collection === 'commands'
          ? commands.length
          : requestsDocument.count;
  const stepTotal = collection === 'journeys' ? journey.steps.length : 1;
  const stepCurrent = collection === 'journeys' ? stepIndex + 1 : 1;
  const progress =
    collection === 'journeys'
      ? ((journeyPosition + stepCurrent / stepTotal) / journeys.length) * 100
      : ((position + 1) / total) * 100;

  return (
    <div className={`presenter${focus ? ' focus-mode' : ''}`}>
      <header className="presenter-topbar">
        <div>
          <p className="eyebrow">Presenter mode</p>
          <strong>
            {collection === 'journeys'
              ? journey.title
              : collection === 'models'
                ? model.name
                : collection === 'commands'
                  ? command.name
                  : request.path}
          </strong>
        </div>

        <nav className="presenter-tabs" aria-label="Presenter collections">
          {collections.map((item, index) => (
            <button
              key={item.id}
              type="button"
              className={`presenter-tab${collection === item.id ? ' active' : ''}`}
              onClick={() => switchCollection(item.id)}
            >
              <span>{index + 1}</span>
              {item.label}
              <small>{item.count}</small>
            </button>
          ))}
        </nav>

        <div className="presenter-actions">
          <ThemeToggle compact />
          <button
            type="button"
            className="ghost-button"
            onClick={() => setFocus((value) => !value)}
          >
            {focus ? 'Show chrome' : 'Focus mode'}
          </button>
          <Link className="ghost-button" to="/">
            Exit
          </Link>
        </div>
      </header>

      <main className="presenter-stage">
        {collection === 'journeys' && (
          <JourneyPlayer
            journey={journey}
            stepIndex={stepIndex}
            onStepChange={(index) =>
              navigate(`/present/journeys/${journey.id}/${journey.steps[index].id}`)
            }
            presenter
          />
        )}
        {collection === 'models' && <ModelDetail model={model} />}
        {collection === 'commands' && <CommandDetail command={command} />}
        {collection === 'requests' && <RequestDetail request={request} />}
      </main>

      <footer className="presenter-footer">
        <div className="presenter-progress">
          <span>
            {collection} {position + 1} / {total}
          </span>
          <div className="progress-track">
            <span style={{ width: `${progress}%` }} />
          </div>
          <span>
            step {stepCurrent} / {stepTotal}
          </span>
        </div>
        <div className="presenter-controls">
          <button
            type="button"
            className="ghost-button"
            onClick={goPrevious}
            aria-label="Previous slide"
          >
            ←
          </button>
          <button type="button" className="primary-button" onClick={goNext} aria-label="Next slide">
            →
          </button>
        </div>
        <p className="presenter-hint">← → steps · 1–4 switch collection · F focus · Esc exit</p>
      </footer>
    </div>
  );
}
