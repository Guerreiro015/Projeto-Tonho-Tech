export function Logo({ compact = false }) {
  return (
    <div className="tt-logo">
      <div className="tt-logo-mark">TT</div>
      {!compact && (
        <div>
          <strong>TONHO TECH</strong>
          <span>Software & Business Solutions</span>
        </div>
      )}
    </div>
  );
}
