import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Download, Copy, Check } from 'lucide-react';
import { Button } from '../ui/Button';

interface QRCodeDisplayProps {
  hash: string;
  label?: string;
  sublabel?: string;
  size?: number;
}

export const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({
  hash,
  label,
  sublabel,
  size = 180
}) => {
  const [dataUrl, setDataUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    QRCode.toDataURL(hash, {
      width: size,
      margin: 1.5,
      color: {
        dark: '#16392B',
        light: '#FFFFFF'
      }
    })
      .then(setDataUrl)
      .catch((err) => console.error('QR code generation error:', err));
  }, [hash, size]);

  const handleCopy = () => {
    navigator.clipboard.writeText(hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `GreenField_QR_${hash}.png`;
    a.click();
  };

  return (
    <div className="flex flex-col items-center p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm text-center">
      <div className="p-2.5 rounded-xl bg-white shadow-inner border border-slate-100 flex items-center justify-center">
        {dataUrl ? (
          <img src={dataUrl} alt={`QR Code pour ${hash}`} className="rounded-lg" width={size} height={size} />
        ) : (
          <div className="w-36 h-36 flex items-center justify-center text-xs text-slate-400">
            Génération QR...
          </div>
        )}
      </div>

      {label && <p className="mt-3 text-xs font-bold text-slate-900 dark:text-slate-100">{label}</p>}
      {sublabel && <p className="text-[11px] text-slate-500 dark:text-slate-400">{sublabel}</p>}

      <div className="mt-2.5 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-mono text-slate-700 dark:text-slate-300 max-w-full truncate">
        <span className="truncate">{hash}</span>
        <button
          onClick={handleCopy}
          className="p-1 hover:text-plantation-600 transition-colors shrink-0"
          title="Copier le code hash"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <Button size="sm" variant="outline" onClick={handleDownload} leftIcon={<Download className="w-3.5 h-3.5" />}>
          Télécharger
        </Button>
      </div>
    </div>
  );
};

