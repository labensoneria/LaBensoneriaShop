type LoadingRippleProps = {
  className?: string;
  centered?: boolean;
};

export default function LoadingRipple({ className = '', centered = true }: LoadingRippleProps) {
  const wrapperClassName = centered
    ? `loading-ripple-shell relative min-h-[160px] ${className}`.trim()
    : className.trim();

  return (
    <div className={wrapperClassName} aria-label="Cargando" role="status">
      <div className="loading-ripple">
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}
