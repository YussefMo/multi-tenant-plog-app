import { Link, useNavigate, useParams } from 'react-router-dom';
import JourneyPlayer from '../components/JourneyPlayer';
import { journeys, journeysById } from '../data';

export default function JourneysPage() {
  const navigate = useNavigate();
  const { journeyId, stepId } = useParams();
  const journey = journeyId ? journeysById.get(journeyId) : undefined;
  const stepIndex = journey
    ? Math.max(
        0,
        journey.steps.findIndex((step) => step.id === stepId),
      )
    : 0;

  const featureList = journeys.filter((item) => item.kind === 'journey');
  const systemList = journeys.filter((item) => item.kind === 'system');

  return (
    <div className="page">
      <section className="page-hero compact">
        <div>
          <p className="eyebrow">Playable architecture · phase 2</p>
          <h2>Follow a request from actor to database.</h2>
          <p>
            Every journey is a typed sequence with middleware, request class, controller, service,
            models, tables, database operations, response, and error branches. Steps link back to
            the request and file catalogs.
          </p>
        </div>
        <div className="hero-counter">
          <strong>{journeys.length}</strong>
          <span>
            {featureList.length} journeys · {systemList.length} systems
          </span>
        </div>
      </section>

      <div className="journey-layout">
        <aside className="journey-index">
          <p className="section-label">Feature journeys</p>
          <div className="journey-index-list">
            {featureList.map((item) => (
              <Link
                key={item.id}
                to={`/journeys/${item.id}/${item.steps[0].id}`}
                className={`journey-index-item${journey?.id === item.id ? ' active' : ''}`}
              >
                <span className={`tone-dot tone-${item.tone}`} />
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.subtitle}</p>
                </div>
                <span className="journey-steps">{item.steps.length}</span>
              </Link>
            ))}
          </div>

          <p className="section-label">Cross-cutting systems</p>
          <div className="journey-index-list">
            {systemList.map((item) => (
              <Link
                key={item.id}
                to={`/journeys/${item.id}/${item.steps[0].id}`}
                className={`journey-index-item${journey?.id === item.id ? ' active' : ''}`}
              >
                <span className={`tone-dot tone-${item.tone}`} />
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.subtitle}</p>
                </div>
                <span className="journey-steps">{item.steps.length}</span>
              </Link>
            ))}
          </div>
        </aside>

        <div className="journey-stage">
          {journey ? (
            <JourneyPlayer
              journey={journey}
              stepIndex={stepIndex}
              onStepChange={(index) =>
                navigate(`/journeys/${journey.id}/${journey.steps[index].id}`)
              }
            />
          ) : (
            <div className="journey-empty">
              <p className="section-label">Select a journey</p>
              <h3>Pick a flow to start the walkthrough.</h3>
              <p>
                Each step shows the request path, authorization, service call, SQL impact, and the
                files behind it. Deep links are stable, so a step can be shared directly.
              </p>
              <Link
                className="primary-button"
                to={`/journeys/${journeys[0].id}/${journeys[0].steps[0].id}`}
              >
                Start with {journeys[0].title} →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
