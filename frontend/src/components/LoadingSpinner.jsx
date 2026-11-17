import { Loader2 } from 'lucide-react';

const SIZE_CLASSES = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-9 w-9',
};

export default function LoadingSpinner({
  size = 'md',
  label = 'Loading...',
  sublabel = '',
  inline = false,
}) {
  const iconSize = SIZE_CLASSES[size] || SIZE_CLASSES.md;

  if (inline) {
    return (
      <span className="inline-flex items-center gap-2" role="status" aria-live="polite">
        <Loader2 className={`${iconSize} animate-spin`} aria-hidden="true" />
        {label && <span>{label}</span>}
      </span>
    );
  }

  return (
    <div
      className="flex flex-col items-center justify-center rounded-2xl border border-emerald-900/10 bg-white px-6 py-10 text-center shadow-sm"
      role="status"
      aria-live="polite"
    >
      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
        <Loader2 className={`${iconSize} animate-spin`} aria-hidden="true" />
      </div>
      {label && <p className="text-base font-semibold text-[#1C2A21]">{label}</p>}
      {sublabel && (
        <p className="mt-1 max-w-sm text-sm text-[#4B5E51]">{sublabel}</p>
      )}
    </div>
  );
}

