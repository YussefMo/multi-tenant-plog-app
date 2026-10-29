import { Link } from 'react-router-dom';
import type { RequestRecord } from '../types';
import { MethodBadge, RealmBadge } from './Badges';

export default function RequestDetail({ request }: { request: RequestRecord }) {
  return (
    <article className="detail-panel">
      <header className="detail-head">
        <div>
          <p className="eyebrow">API operation · {request.group}</p>
          <h2 className="request-detail-path">
            <MethodBadge method={request.method} />
            <code>{request.path}</code>
          </h2>
          <code className="detail-path">{request.name}</code>
        </div>
        <div className="detail-chips">
          <RealmBadge realm={request.realm} />
        </div>
      </header>

      <div className="detail-split">
        <div>
          <p className="section-label">Controller</p>
          <p>{request.controller}</p>
          <Link
            className="ref-link"
            to={`/files?path=${encodeURIComponent(request.controllerFile)}`}
          >
            {request.controllerFile}
          </Link>

          <p className="section-label">Middleware</p>
          <div className="feature-list">
            {request.middleware.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </div>

        <div>
          <p className="section-label">Required permissions</p>
          {request.permissions.length > 0 ? (
            <div className="feature-list">
              {request.permissions.map((permission) => (
                <span key={permission}>{permission}</span>
              ))}
            </div>
          ) : (
            <p className="muted-copy">No permission middleware on this operation.</p>
          )}

          <p className="section-label">Action</p>
          <code className="detail-path">{request.action}</code>
        </div>
      </div>
    </article>
  );
}
