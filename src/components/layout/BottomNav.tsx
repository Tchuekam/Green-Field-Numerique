import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Sprout, Factory, TrendingUp, QrCode, FileSpreadsheet } from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenScanner: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  setActiveTab,
  onOpenScanner
}) => {
  const { setRole } = useAuth();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl border-t border-slate-200/80 dark:border-slate-800 px-3 py-1.5 shadow-lg">
      <div className="max-w-md mx-auto flex items-center justify-around">
        <button
          onClick={() => {
            setRole('EXPERT_AGRICOLE');
            setActiveTab('production');
          }}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
            activeTab === 'production'
              ? 'text-plantation-700 dark:text-plantation-400 font-bold'
              : 'text-slate-400 dark:text-slate-500 hover:text-slate-600'
          }`}
        >
          <Sprout className="w-4 h-4 mb-0.5" />
          <span className="text-[10px] tracking-tight">Production</span>
        </button>

        <button
          onClick={() => {
            setRole('RESPONSABLE_USINE');
            setActiveTab('transformation');
          }}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
            activeTab === 'transformation'
              ? 'text-amber-600 dark:text-amber-400 font-bold'
              : 'text-slate-400 dark:text-slate-500 hover:text-slate-600'
          }`}
        >
          <Factory className="w-4 h-4 mb-0.5" />
          <span className="text-[10px] tracking-tight">Usine</span>
        </button>

        {/* Center QR Scanner - Refined Apple-style Floating Action Button */}
        <button
          onClick={onOpenScanner}
          className="flex items-center justify-center w-10 h-10 rounded-2xl bg-plantation-800 dark:bg-plantation-700 text-white shadow-md active:scale-95 transition-transform mx-1 shrink-0"
          aria-label="Scanner un code QR"
          title="Scanner un code QR"
        >
          <QrCode className="w-5 h-5" />
        </button>

        <button
          onClick={() => {
            setRole('PORTEUR_PROJET');
            setActiveTab('commercialisation');
          }}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
            activeTab === 'commercialisation'
              ? 'text-blue-600 dark:text-blue-400 font-bold'
              : 'text-slate-400 dark:text-slate-500 hover:text-slate-600'
          }`}
        >
          <TrendingUp className="w-4 h-4 mb-0.5" />
          <span className="text-[10px] tracking-tight">Commercial</span>
        </button>

        <button
          onClick={() => setActiveTab('feuille-suivi')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
            activeTab === 'feuille-suivi'
              ? 'text-purple-600 dark:text-purple-400 font-bold'
              : 'text-slate-400 dark:text-slate-500 hover:text-slate-600'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4 mb-0.5" />
          <span className="text-[10px] tracking-tight">Suivi</span>
        </button>
      </div>
    </nav>
  );
};
