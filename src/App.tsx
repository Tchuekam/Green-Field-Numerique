import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { AppHeader } from './components/layout/AppHeader';
import { BottomNav } from './components/layout/BottomNav';
import { ProductionView } from './views/production/ProductionView';
import { ProcessingView } from './views/processing/ProcessingView';
import { CommercialView } from './views/commercial/CommercialView';
import { WeeklySheetView } from './views/tracking/WeeklySheetView';
import { QRScannerModal } from './components/qr/QRScannerModal';
import { LineageModal } from './components/qr/LineageModal';
import { db } from './db';

const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('production');

  // QR Modal States
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);
  const [isLineageOpen, setIsLineageOpen] = useState<boolean>(false);
  const [activeLineageData, setActiveLineageData] = useState<any | null>(null);

  // Handle scanned QR hash
  const handleResolveQR = async (qrHash: string) => {
    try {
      const data = await db.resolveTraceabilityByHash(qrHash);
      if (data) {
        setActiveLineageData(data);
        setIsLineageOpen(true);
      } else {
        alert(`QR Code introuvable : ${qrHash}. Veuillez vérifier le code.`);
      }
    } catch (err) {
      console.error('Error resolving QR code:', err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAF9] dark:bg-[#090D0F] transition-colors duration-200">
      {/* Top Application Header */}
      <AppHeader
        onOpenScanner={() => setIsScannerOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Content Area with generous bottom clearance for mobile bar */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3.5 sm:px-6 lg:px-8 py-5 pb-24 lg:pb-12">
        {activeTab === 'production' && <ProductionView />}
        {activeTab === 'transformation' && <ProcessingView />}
        {activeTab === 'commercialisation' && (
          <CommercialView
            onScanQR={handleResolveQR}
            onOpenScannerModal={() => setIsScannerOpen(true)}
          />
        )}
        {activeTab === 'feuille-suivi' && <WeeklySheetView />}
      </main>

      {/* Mobile Floating Bottom Bar */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenScanner={() => setIsScannerOpen(true)}
      />

      {/* Camera / Upload QR Scanner Modal */}
      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={(hash) => handleResolveQR(hash)}
      />

      {/* Complete Traceability Lineage Modal (Package -> Lot -> Harvest -> Bloc) */}
      <LineageModal
        isOpen={isLineageOpen}
        onClose={() => setIsLineageOpen(false)}
        lineageData={activeLineageData}
      />
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
