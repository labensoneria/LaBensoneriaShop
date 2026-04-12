import { useState, useEffect } from 'react';
import { getActivePopup } from '../api/popup';
import type { PopupMessage } from '../api/popup';

export default function PopupBanner() {
  const [popup, setPopup] = useState<PopupMessage | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    getActivePopup()
      .then((p) => {
        if (p) {
          setPopup(p);
          setVisible(true);
        }
      })
      .catch(() => {/* silent fail */});
  }, []);

  function dismiss() {
    setVisible(false);
  }

  if (!visible || !popup) return null;

  return (
    <div className="bg-brand-sky text-white px-4 py-2.5 flex items-center justify-between gap-4">
      <p className="text-sm text-center flex-1">{popup.content}</p>
      <button
        onClick={dismiss}
        aria-label="Cerrar"
        className="flex-shrink-0 hover:opacity-70 transition-opacity"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
