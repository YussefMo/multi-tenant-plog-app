interface StatCardProps {
  label: string;
  value: string | number;
  detail: string;
  tone?: 'cyan' | 'amber' | 'green' | 'red';
}

export default function StatCard({ label, value, detail, tone = 'cyan' }: StatCardProps) {
  return (
    <article className={`stat-card tone-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{detail}</p>
    </article>
  );
}
