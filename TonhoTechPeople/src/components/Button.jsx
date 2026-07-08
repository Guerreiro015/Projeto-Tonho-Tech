export function Button({ children, variant = 'primary', ...props }) {
  return <button className={`tt-btn tt-btn-${variant}`} {...props}>{children}</button>;
}
