import { filesByPath } from '@/data';
import type { ArchitectureNodeData } from '@/types';

interface InspectorProps {
  node: ArchitectureNodeData;
}

export default function Inspector({ node }: InspectorProps) {
  return (
    <aside className="inspector">
      <div className="inspector-head">
        <span className="eyebrow">Selected layer</span>
        <span className={`tone-text tone-${node.tone}`}>{node.layer}</span>
      </div>

      <h2>{node.label}</h2>
      <p className="inspector-subtitle">{node.subtitle}</p>
      <p className="inspector-purpose">{node.purpose}</p>

      <div className="file-stack">
        <p className="section-label">Files in this layer</p>
        {node.files.map((path) => {
          const file = filesByPath.get(path);

          return (
            <article key={path} className="file-mini">
              <code>{path}</code>
              <p>{file?.purpose ?? 'Catalogued architecture file.'}</p>
            </article>
          );
        })}
      </div>

      <p className="inspector-hint">
        Click another node to trace its role. Journeys, models, and commands arrive in the next
        phases.
      </p>
    </aside>
  );
}
