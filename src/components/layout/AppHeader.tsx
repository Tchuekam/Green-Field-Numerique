import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useSyncEngine } from '../../db/syncEngine';
import { Button } from '../ui/Button';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  Sun,
  Moon,
  QrCode,
  Sprout,
  Factory,
  TrendingUp,
  ShieldCheck,
  ChevronDown
} from 'lucide-react';

interface AppHeaderProps {
  onOpenScanner: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  onOpenScanner,
  activeTab,
  setActiveTab
}) => {
  const { role, roleTitle, setRole, availableRoles } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { isOnline, isSyncing, pendingCount, triggerSync, toggleSimulatedOffline } =
    useSyncEngine();
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

  const getRoleIcon = (roleId: string, className = 'w-4 h-4') => {
    switch (roleId) {
      case 'EXPERT_AGRICOLE':
        return <Sprout className={`${className} text-plantation-600 dark:text-plantation-400`} />;
      case 'RESPONSABLE_USINE':
        return <Factory className={`${className} text-amber-600 dark:text-amber-400`} />;
      case 'PORTEUR_PROJET':
        return <TrendingUp className={`${className} text-blue-600 dark:text-blue-400`} />;
      default:
        return null;
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full glass-nav px-3.5 sm:px-6 lg:px-8 py-2.5 transition-colors duration-200">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand identity */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-plantation-800 text-white flex items-center justify-center shadow-sm">
            <span className="font-extrabold text-xs sm:text-sm tracking-tight">GF</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm sm:text-base font-extrabold tracking-tight text-slate-900 dark:text-white leading-none">
                GreenField
              </h1>
              <span className="hidden md:inline-block text-[10px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded-full bg-plantation-100 dark:bg-plantation-950 text-plantation-700 dark:text-plantation-300">
                Traçabilité
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium hidden md:block mt-0.5">
              De la parcelle au client · Bertoua, Cameroun
            </p>
          </div>
        </div>

        {/* Center / Desktop Tab Navigation */}
        <nav className="hidden lg:flex items-center gap-1 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
          <button
            onClick={() => {
              setRole('EXPERT_AGRICOLE');
              setActiveTab('production');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'production'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sprout className="w-3.5 h-3.5 text-plantation-600" />
            1. Production
          </button>

          <button
            onClick={() => {
              setRole('RESPONSABLE_USINE');
              setActiveTab('transformation');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'transformation'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Factory className="w-3.5 h-3.5 text-amber-600" />
            2. Transformation
          </button>

          <button
            onClick={() => {
              setRole('PORTEUR_PROJET');
              setActiveTab('commercialisation');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'commercialisation'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
            3. Commercialisation
          </button>

          <button
            onClick={() => setActiveTab('feuille-suivi')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'feuille-suivi'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
            Feuille de Suivi
          </button>
        </nav>

        {/* Right Tools: Connectivity + Quick Scanner + Role Dropdown + Theme Switch */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Network status pill */}
          <button
            onClick={toggleSimulatedOffline}
            title={isOnline ? 'En ligne (Appuyez pour simuler hors-ligne)' : 'Hors-ligne (Appuyez pour reconnecter)'}
            className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
              isOnline
                ? 'bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800'
                : 'bg-amber-50/80 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200/80 dark:border-amber-800'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
            />
            {isOnline ? (
              <span className="hidden sm:inline text-[11px] font-semibold">En ligne</span>
            ) : (
              <span className="text-[11px] font-semibold">Offline</span>
            )}
            {pendingCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-white">
                {pendingCount}
              </span>
            )}
          </button>

          {pendingCount > 0 && (
            <button
              onClick={triggerSync}
              disabled={isSyncing}
              title="Synchroniser"
              className="p-1.5 rounded-full text-slate-600 hover:text-plantation-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-plantation-600' : ''}`} />
            </button>
          )}

          {/* Quick QR Scanner Button (Tablet & Desktop) */}
          <Button
            size="sm"
            variant="glass"
            onClick={onOpenScanner}
            leftIcon={<QrCode className="w-3.5 h-3.5 text-plantation-700 dark:text-plantation-400" />}
            className="hidden sm:inline-flex text-xs px-3 py-1.5 rounded-full"
          >
            Scanner
          </Button>

          {/* Role selector dropdown */}
          <div className="relative">
            <button
              onClick={() => setRoleMenuOpen((prev) => !prev)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 text-xs font-semibold text-slate-800 dark:text-slate-200 shadow-sm hover:border-plantation-500 transition-colors"
            >
              {getRoleIcon(role)}
              <span className="hidden md:inline max-w-[130px] truncate font-medium text-[12px]">
                {roleTitle}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {roleMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setRoleMenuOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-64 p-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-modal z-50 animate-fade-in">
                  <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 px-2 py-1">
                    Changer de Rôle
                  </p>
                  {availableRoles.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => {
                        setRole(r.id);
                        if (r.id === 'EXPERT_AGRICOLE') setActiveTab('production');
                        if (r.id === 'RESPONSABLE_USINE') setActiveTab('transformation');
                        if (r.id === 'PORTEUR_PROJET') setActiveTab('commercialisation');
                        setRoleMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-start gap-2.5 transition-colors ${
                        role === r.id
                          ? 'bg-plantation-50 dark:bg-plantation-950/60 text-plantation-900 dark:text-plantation-200 font-semibold'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="mt-0.5">{getRoleIcon(r.id)}</div>
                      <div>
                        <div className="font-semibold">{r.title}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">
                          {r.subtitle}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Theme Switcher */}
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-full text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Basculer le mode sombre"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};
