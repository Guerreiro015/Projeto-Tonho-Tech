export function StatCard({ icon, label, value, hint, tone = 'blue' }) {
  return (
    <section className={`tt-stat tt-stat-${tone}`}>
      <div className="tt-stat-icon">{icon}</div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        {hint && <small>{hint}</small>}
      </div>
    </section>
  );
}
