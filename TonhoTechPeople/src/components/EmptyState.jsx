export function EmptyState({ icon = '📭', title, message }) {
  return (
    <div className="tt-empty">
      <div>{icon}</div>
      <strong>{title}</strong>
      <p>{message}</p>
    </div>
  );
}
