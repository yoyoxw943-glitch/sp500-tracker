import { useState } from 'react';

export default function DisclaimerBanner() {
  const [dismissed, setDismissed] = useState(() => localStorage.getItem('disclaimer_dismissed') === 'true');
  if (dismissed) return null;

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 dark:bg-amber-500/10 dark:border-amber-500/20">
      <div className="flex items-start gap-3 text-base text-amber-700 dark:text-amber-200">
        <span className="flex-1 leading-relaxed">
          <strong>Disclaimer:</strong> This app is for educational and informational purposes only. It does not constitute financial advice. Past performance does not guarantee future results.
        </span>
        <button
          onClick={() => { setDismissed(true); localStorage.setItem('disclaimer_dismissed', 'true'); }}
          className="touch-target text-amber-500 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-200 font-bold text-xl leading-none shrink-0"
          aria-label="Dismiss disclaimer"
        >
          x
        </button>
      </div>
    </div>
  );
}
