export function Card({ title, children, className = '' }) {
  return (
    <section className={`tt-card ${className}`}>
      {title && <h3>{title}</h3>}
      {children}
    </section>
  );
}
