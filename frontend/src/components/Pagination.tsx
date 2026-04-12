interface Props {
  page: number;
  pages: number;
  onChange: (page: number) => void;
}

export default function Pagination({ page, pages, onChange }: Props) {
  if (pages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-3 mt-10">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        className="w-9 h-9 flex items-center justify-center rounded-full border border-brand-greenLight text-brand-green disabled:opacity-30 hover:bg-brand-green hover:text-white hover:border-brand-green transition-all shadow-sm"
        aria-label="Página anterior"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <span className="text-sm font-medium text-brand-dark/70 min-w-[4rem] text-center">
        {page} de {pages}
      </span>
      <button
        onClick={() => onChange(page + 1)}
        disabled={page >= pages}
        className="w-9 h-9 flex items-center justify-center rounded-full border border-brand-greenLight text-brand-green disabled:opacity-30 hover:bg-brand-green hover:text-white hover:border-brand-green transition-all shadow-sm"
        aria-label="Página siguiente"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}
