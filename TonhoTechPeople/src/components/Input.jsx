export function Input({ label, ...props }) {
  return (
    <label className="tt-field">
      <span>{label}</span>
      <input {...props} />
    </label>
  );
}
