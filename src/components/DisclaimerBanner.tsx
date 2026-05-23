import { useState } from 'react';

export default function DisclaimerBanner() {
  const [dismissed, setDismissed] = useState(() => localStorage.getItem('disclaimer_dismissed') === 'true');
  if (dismissed) return null;

  return (
    <div className="bg-sky-50 border-b border-sky-200 px-4 py-3 dark:bg-sky-500/10 dark:border-sky-500/20">
      <div className="flex items-start gap-3 text-base text-sky-700 dark:text-sky-200">
        <span className="flex-1 leading-relaxed">
          <strong>Disclaimer:</strong> This app is for educational and informational purposes only. It does not constitute financial advice. Past performance does not guarantee future results.
        </span>
        <button
          onClick={() => { setDismissed(true); localStorage.setItem('disclaimer_dismissed', 'true'); }}
          className="touch-target text-sky-500 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-200 font-bold text-xl leading-none shrink-0"
          aria-label="Dismiss disclaimer"
        >
          x
        </button>
      </div>
    </div>
  );
}
