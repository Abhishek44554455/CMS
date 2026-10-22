const VARIANTS = {
  primary: 'bg-blue-700 text-white hover:bg-blue-800 focus-visible:ring-blue-600',
  secondary: 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 focus-visible:ring-slate-400',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500',
  warning: 'bg-orange-600 text-white hover:bg-orange-700 focus-visible:ring-orange-500',
  ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 focus-visible:ring-slate-400',
};

const SIZES = {
  sm: 'px-2.5 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-5 py-2.5 text-sm gap-2',
};

/**
 * Shared button used across the public site and admin app.
 * Renders a <button> by default; pass `as` + `to` via react-router Link in pages when navigating.
 */
export default function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  icon = null,
  children,
  type = 'button',
  ...rest
}) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]} ${SIZES[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
}
