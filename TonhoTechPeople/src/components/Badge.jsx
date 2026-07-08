export function Badge({ children, tone = 'blue' }) {
  return <span className={`tt-badge tt-badge-${tone}`}>{children}</span>;
}
