import React, { useRef, useState, useEffect } from 'react';
import jsQR from 'jsqr';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Camera, Upload, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (qrHash: string) => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualHash, setManualHash] = useState<string>('');
  const [scannedResult, setScannedResult] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameId = useRef<number | null>(null);

  // Stop camera stream
  const stopCamera = () => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  // Start camera stream
  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setCameraActive(true);
        requestAnimationFrame(tick);
      }
    } catch (err: any) {
      console.warn('Camera access denied or unavailable:', err);
      setCameraError('Accès caméra non disponible. Utilisez l\'import d\'image ou un code de test ci-dessous.');
      setCameraActive(false);
    }
  };

  // Scan frame loop
  const tick = () => {
    if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          canvas.height = videoRef.current.videoHeight;
          canvas.width = videoRef.current.videoWidth;
          ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert'
          });

          if (code && code.data) {
            handleCodeFound(code.data);
            return;
          }
        }
      }
    }
    animationFrameId.current = requestAnimationFrame(tick);
  };

  const handleCodeFound = (codeData: string) => {
    stopCamera();
    setScannedResult(codeData);
    setTimeout(() => {
      onScanSuccess(codeData);
      onClose();
    }, 600);
  };

  // Handle image file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0, img.width, img.height);
        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        if (code && code.data) {
          handleCodeFound(code.data);
        } else {
          setCameraError('Aucun QR code valide détecté dans l\'image téléchargée.');
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (isOpen) {
      setScannedResult(null);
      setCameraError(null);
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen]);

  const testCodes = [
    { label: 'Sachet Farine 1kg (Lot LF-001 · Bloc B07)', hash: 'GF-LF001-B07-001' },
    { label: 'Paquet Chips 250g (Lot LC-001 · Bloc B03)', hash: 'GF-LC001-B03-001' },
    { label: 'Lot Direct Farine (LF-001)', hash: 'LF-001' }
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Scanner un QR Code Traçabilité"
      subtitle="Reconnaissance optique instantanée sur smartphone ou webcam"
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Camera Viewfinder */}
        <div className="relative aspect-video w-full rounded-2xl bg-black overflow-hidden flex items-center justify-center border border-slate-700 shadow-inner">
          <video ref={videoRef} className={`w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`} />
          <canvas ref={canvasRef} className="hidden" />

          {/* Laser targeting UI */}
          {cameraActive && !scannedResult && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-48 h-48 border-2 border-dashed border-emerald-400 rounded-2xl animate-pulse flex items-center justify-center">
                <div className="w-full h-0.5 bg-emerald-400 shadow-[0_0_8px_#34d399] animate-bounce" />
              </div>
            </div>
          )}

          {/* Success scan banner */}
          {scannedResult && (
            <div className="absolute inset-0 bg-emerald-950/80 backdrop-blur-sm flex flex-col items-center justify-center text-white p-4">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mb-2 animate-bounce" />
              <p className="font-bold text-sm">QR Code Détecté !</p>
              <p className="text-xs font-mono text-emerald-200 mt-1 truncate max-w-[90%]">{scannedResult}</p>
            </div>
          )}

          {!cameraActive && !scannedResult && (
            <div className="text-center p-6 text-slate-400 space-y-2">
              <Camera className="w-10 h-10 mx-auto text-slate-500" />
              <p className="text-xs">Caméra en pause ou non autorisée</p>
              <Button size="sm" variant="glass" onClick={startCamera}>
                Réactiver la caméra
              </Button>
            </div>
          )}
        </div>

        {cameraError && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2 text-xs text-amber-700 dark:text-amber-300">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{cameraError}</span>
          </div>
        )}

        {/* Gallery upload fallback */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <label className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 cursor-pointer border border-slate-200/60 dark:border-slate-700 transition-colors">
            <Upload className="w-4 h-4" />
            <span>Charger une photo du QR</span>
            <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
          </label>
        </div>

        {/* Manual Hash Input */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Saisie manuelle du hash ou numéro de lot :
          </p>
          <div className="flex gap-2">
            <Input
              placeholder="Ex: GF-LF001-B07-001"
              value={manualHash}
              onChange={(e) => setManualHash(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && manualHash.trim()) {
                  handleCodeFound(manualHash.trim());
                }
              }}
            />
            <Button
              size="md"
              variant="primary"
              disabled={!manualHash.trim()}
              onClick={() => handleCodeFound(manualHash.trim())}
            >
              Résoudre
            </Button>
          </div>
        </div>

        {/* Quick Demo Test Buttons */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Échantillons de test rapide (1-Clic) :
          </p>
          <div className="space-y-1.5">
            {testCodes.map((item) => (
              <button
                key={item.hash}
                onClick={() => handleCodeFound(item.hash)}
                className="w-full text-left p-2.5 rounded-xl bg-slate-50 hover:bg-emerald-50/60 dark:bg-slate-850 dark:hover:bg-slate-800 border border-slate-200/70 dark:border-slate-700/60 text-xs flex items-center justify-between group transition-colors"
              >
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-plantation-700 dark:group-hover:text-plantation-400">
                    {item.label}
                  </span>
                  <span className="block font-mono text-[10px] text-slate-500 dark:text-slate-400">
                    Code: {item.hash}
                  </span>
                </div>
                <span className="text-xs text-plantation-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                  Tester →
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
};

