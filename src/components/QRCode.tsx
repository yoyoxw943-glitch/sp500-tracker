import { useMemo } from 'react';

export default function QRCode() {
  const url = useMemo(() => {
    if (typeof window !== 'undefined') {
      return `${window.location.protocol}//${window.location.host}`;
    }
    return 'http://localhost:5173';
  }, []);

  // Generate a simple QR code using Google Charts API (no npm dependency needed)
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(url)}&bgcolor=0F1117&color=FFFFFF`;

  return (
    <div className="inline-block">
      <img
        src={qrSrc}
        alt={`QR code for ${url}`}
        width={120}
        height={120}
        className="rounded-lg"
        loading="lazy"
      />
    </div>
  );
}
