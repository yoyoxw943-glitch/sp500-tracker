import { useState, useEffect } from 'react';

export default function ShareModal({ onClose }: { onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== 'undefined' ? window.location.href : '';

  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}&bgcolor=FFFFFF&color=0EA5E9`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <div className="bg-white dark:bg-[#1E3A5F] rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-[#BAE6FD] dark:border-[#2563EB]/20" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-xl font-bold text-[#0369A1] dark:text-[#60A5FA]">Share App</h3>
          <button onClick={onClose} className="touch-target text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl font-bold">x</button>
        </div>

        <div className="flex flex-col items-center gap-4">
          <img
            src={qrSrc}
            alt={`QR code for ${url}`}
            width={200}
            height={200}
            className="rounded-xl border border-[#BAE6FD] dark:border-[#2563EB]/20"
            loading="eager"
          />

          <p className="text-base text-slate-500 dark:text-slate-400 text-center">
            Scan to view on mobile<br />
            <span className="text-sm">扫码在手机上查看</span>
          </p>

          <div className="flex items-center gap-2 w-full">
            <input
              type="text"
              readOnly
              value={url}
              className="flex-1 px-3 py-2 rounded-lg border border-[#BAE6FD] dark:border-[#2563EB]/20 bg-[#F8FAFC] dark:bg-[#0A1628] text-sm text-slate-600 dark:text-slate-300 truncate"
            />
            <button onClick={handleCopy} className="btn-primary text-sm whitespace-nowrap">
              {copied ? 'Copied!' : 'Copy URL'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
