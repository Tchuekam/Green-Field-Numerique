import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import type { Bloc, Harvest } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { enqueueOfflineMutation } from '../../db/syncEngine';
import {
  Sprout,
  Plus,
  Scale,
  Camera,
  MapPin,
  CheckCircle2
} from 'lucide-react';

export const ProductionView: React.FC = () => {
  const blocs = useLiveQuery(() => db.blocs.toArray()) || [];
  const rawHarvests = useLiveQuery(() => db.harvests.toArray()) || [];
  const harvests = [...rawHarvests].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

  const rawSanitaryLogs = useLiveQuery(() => db.sanitaryLogs.toArray()) || [];
  const sanitaryLogs = [...rawSanitaryLogs].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

  const suppliers = useLiveQuery(() => db.suppliers.toArray()) || [];

  const [selectedBloc, setSelectedBloc] = useState<Bloc | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'blocs' | 'recolte' | 'sanitaire' | 'partenaires'>('blocs');

  // Form states: Harvest Logger
  const [harvestBlocId, setHarvestBlocId] = useState<string>('B01');
  const [bunchCount, setBunchCount] = useState<number>(100);
  const [totalWeightKg, setTotalWeightKg] = useState<number>(1200);
  const [transportLossKg, setTransportLossKg] = useState<number>(12);
  const [operatorName, setOperatorName] = useState<string>('M. Jean-Paul Mbarga');
  const [harvestSuccess, setHarvestSuccess] = useState<string | null>(null);

  // Form states: Sanitary Logger
  const [sanitaryBlocId, setSanitaryBlocId] = useState<string>('B01');
  const [sanitaryStage, setSanitaryStage] = useState<any>('FRUCTIFICATION');
  const [sanitarySeverity, setSanitarySeverity] = useState<any>('NORMAL');
  const [sanitaryObservation, setSanitaryObservation] = useState<string>('');
  const [sanitaryPhoto, setSanitaryPhoto] = useState<string | null>(null);
  const [sanitarySuccess, setSanitarySuccess] = useState<boolean>(false);

  // Handle Harvest Submit
  const handleCreateHarvest = async (e: React.FormEvent) => {
    e.preventDefault();
    const count = await db.harvests.count();
    const harvestId = `R-${(count + 1).toString().padStart(3, '0')}`;

    const newHarvest: Harvest = {
      harvestId,
      blocId: harvestBlocId,
      bunchCount: Number(bunchCount),
      totalWeightKg: Number(totalWeightKg),
      fieldToFactoryLossKg: Number(transportLossKg),
      harvestDate: new Date().toISOString().split('T')[0],
      operatorId: operatorName,
      syncStatus: navigator.onLine ? 'SYNCED' : 'PENDING_SYNC',
      createdAt: Date.now()
    };

    await db.harvests.add(newHarvest);
    await enqueueOfflineMutation('HARVEST', 'CREATE', newHarvest);

    setHarvestSuccess(`Récolte ${harvestId} enregistrée avec succès pour le Bloc ${harvestBlocId} !`);
    setTimeout(() => setHarvestSuccess(null), 4000);
  };

  // Handle Sanitary Log Submit
  const handleCreateSanitaryLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sanitaryObservation.trim()) return;

    const id = `SAN-${sanitaryBlocId}-${Date.now().toString().slice(-4)}`;
    const newLog = {
      id,
      blocId: sanitaryBlocId,
      date: new Date().toISOString().split('T')[0],
      stage: sanitaryStage,
      observation: sanitaryObservation.trim(),
      severity: sanitarySeverity,
      photoUrl: sanitaryPhoto || undefined,
      loggedBy: 'Dr. Jean-Paul Mbarga (Expert Agricole)',
      syncStatus: navigator.onLine ? ('SYNCED' as const) : ('PENDING_SYNC' as const),
      createdAt: Date.now()
    };

    await db.sanitaryLogs.add(newLog);
    await enqueueOfflineMutation('SANITARY_LOG', 'CREATE', newLog);

    setSanitarySuccess(true);
    setSanitaryObservation('');
    setSanitaryPhoto(null);
    setTimeout(() => setSanitarySuccess(false), 3000);
  };

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setSanitaryPhoto(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // KPI Calculations
  const totalWeightHarvested = harvests.reduce((acc, h) => acc + Number(h.totalWeightKg), 0);
  const totalTransportLoss = harvests.reduce((acc, h) => acc + Number(h.fieldToFactoryLossKg), 0);
  const avgLossPercent = totalWeightHarvested > 0 ? ((totalTransportLoss / totalWeightHarvested) * 100).toFixed(2) : '0';

  return (
    <div className="space-y-5 sm:space-y-6 animate-fade-in pb-16">
      {/* View Header with refined typography & spacing */}
      <div className="flex flex-col gap-3">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-plantation-600 dark:text-plantation-400 block mb-0.5">
            Étape 1 · Production Agricole
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Parcelles, Récoltes & Suivi
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Fiches parcelles B01-B16, saisie terrain hors-ligne et suivi sanitaire
          </p>
        </div>

        {/* Horizontal Scrolling Segmented Controls (No-Scrollbar, Single line pills) */}
        <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto py-1 -mx-3.5 px-3.5 sm:mx-0 sm:px-0">
          <button
            onClick={() => setActiveSubTab('blocs')}
            className={`whitespace-nowrap shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeSubTab === 'blocs'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                : 'bg-white/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60'
            }`}
          >
            Fiches Blocs (16)
          </button>
          <button
            onClick={() => setActiveSubTab('recolte')}
            className={`whitespace-nowrap shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeSubTab === 'recolte'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                : 'bg-white/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60'
            }`}
          >
            Saisie Récolte
          </button>
          <button
            onClick={() => setActiveSubTab('sanitaire')}
            className={`whitespace-nowrap shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeSubTab === 'sanitaire'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                : 'bg-white/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60'
            }`}
          >
            Suivi Sanitaire
          </button>
          <button
            onClick={() => setActiveSubTab('partenaires')}
            className={`whitespace-nowrap shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'partenaires'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                : 'bg-white/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60'
            }`}
          >
            <span>Partenaires</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-plantation-100 dark:bg-plantation-900/60 text-plantation-700 dark:text-plantation-300 font-bold">
              30%
            </span>
          </button>
        </div>
      </div>

      {/* KPI Cards: Clean Apple Metrics Layout */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Card 1: Parcelles */}
        <Card variant="glass" className="p-3.5 sm:p-4.5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1 mb-2">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 truncate">
              Parcelles Actives
            </span>
            <Badge variant="emerald" size="sm" className="text-[10px] px-1.5 py-0.5 shrink-0">
              20 ha
            </Badge>
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums tracking-tight">
                16 / 16
              </span>
              <span className="text-xs font-bold text-slate-400 uppercase">blocs</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
              Bertoua · Est Cameroun
            </p>
          </div>
        </Card>

        {/* Card 2: Volume Récolté */}
        <Card variant="glass" className="p-3.5 sm:p-4.5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1 mb-2">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 truncate">
              Volume Récolté
            </span>
            <Badge variant="blue" size="sm" className="text-[10px] px-1.5 py-0.5 shrink-0">
              {harvests.length} coupes
            </Badge>
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-plantation-700 dark:text-plantation-400 tabular-nums tracking-tight">
                {totalWeightHarvested.toLocaleString()}
              </span>
              <span className="text-xs font-bold text-slate-400 uppercase">kg</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
              Numérotation R-XXX
            </p>
          </div>
        </Card>

        {/* Card 3: Pertes Transport */}
        <Card variant="glass" className="p-3.5 sm:p-4.5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1 mb-2">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 truncate">
              Pertes Piste (3 km)
            </span>
            <Badge variant="amber" size="sm" className="text-[10px] px-1.5 py-0.5 shrink-0">
              {avgLossPercent}%
            </Badge>
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-amber-600 dark:text-amber-400 tabular-nums tracking-tight">
                {totalTransportLoss.toFixed(1)}
              </span>
              <span className="text-xs font-bold text-slate-400 uppercase">kg</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
              Champ vers usine
            </p>
          </div>
        </Card>

        {/* Card 4: Suivi Sanitaire */}
        <Card variant="glass" className="p-3.5 sm:p-4.5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1 mb-2">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 truncate">
              Observations
            </span>
            <Badge variant="purple" size="sm" className="text-[10px] px-1.5 py-0.5 shrink-0">
              Terrain
            </Badge>
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums tracking-tight">
                {sanitaryLogs.length}
              </span>
              <span className="text-xs font-bold text-slate-400 uppercase">logs</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
              Stade phénologique & photos
            </p>
          </div>
        </Card>
      </div>

      {/* Subtab 1: Blocs Grid (B01 - B16) */}
      {activeSubTab === 'blocs' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Cadastre des 16 Blocs (B01 à B16)
            </h3>
            <span className="text-xs text-slate-500 hidden sm:inline">
              Sélectionnez un bloc pour sa fiche agronomique
            </span>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-4 lg:grid-cols-8 gap-2">
            {blocs.map((b) => {
              const isSelected = selectedBloc?.id === b.id;
              const isHarvestReady = b.status === 'EN_RECOLTE' || b.status === 'RECOLTE_IMMINENTE';

              return (
                <button
                  key={b.id}
                  onClick={() => setSelectedBloc(b)}
                  className={`p-2 sm:p-2.5 rounded-xl border text-left transition-all duration-150 flex flex-col justify-between min-h-[72px] sm:min-h-[80px] ${
                    isSelected
                      ? 'bg-plantation-700 text-white border-plantation-600 shadow-sm scale-[1.02]'
                      : isHarvestReady
                      ? 'bg-emerald-500/10 dark:bg-emerald-950/30 border-emerald-500/30 hover:border-emerald-500 text-slate-900 dark:text-white'
                      : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-plantation-400 text-slate-900 dark:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-extrabold text-xs sm:text-sm tracking-tight">{b.id}</span>
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        b.status === 'EN_RECOLTE'
                          ? 'bg-emerald-400 animate-pulse'
                          : b.status === 'RECOLTE_IMMINENTE'
                          ? 'bg-amber-400'
                          : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    />
                  </div>
                  <div>
                    <span
                      className={`text-[9px] sm:text-[10px] block truncate font-medium ${
                        isSelected ? 'text-plantation-200' : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {b.variety.split(' ')[0]}
                    </span>
                    <span
                      className={`text-[9px] sm:text-[10px] block font-mono ${
                        isSelected ? 'text-plantation-100' : 'text-slate-400'
                      }`}
                    >
                      {b.plantCount} pl.
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Selected Bloc Detail Modal/Card */}
          {selectedBloc && (
            <Card variant="glass" className="p-5 border-plantation-500/40 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/60 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-plantation-700 text-white flex items-center justify-center font-black">
                    {selectedBloc.id}
                  </div>
                  <div>
                    <h4 className="font-bold text-base text-slate-900 dark:text-slate-100">
                      {selectedBloc.name}
                    </h4>
                    <p className="text-xs text-slate-500 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-plantation-600" />
                      SIG: {selectedBloc.geoCoordinates.center.lat.toFixed(4)}°N, {selectedBloc.geoCoordinates.center.lng.toFixed(4)}°E · Surface: {selectedBloc.surfaceHa} ha
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => {
                      setHarvestBlocId(selectedBloc.id);
                      setActiveSubTab('recolte');
                    }}
                    leftIcon={<Scale className="w-3.5 h-3.5" />}
                  >
                    Récolter ce Bloc
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSanitaryBlocId(selectedBloc.id);
                      setActiveSubTab('sanitaire');
                    }}
                    leftIcon={<Camera className="w-3.5 h-3.5" />}
                  >
                    Suivi Sanitaire
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setSelectedBloc(null)}>
                    Fermer
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-3 mt-3.5 pt-3.5 border-t border-slate-100 dark:border-slate-800/80">
                <div>
                  <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-semibold tracking-wider mb-0.5">
                    Variété Plantain
                  </span>
                  <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                    {selectedBloc.variety}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-semibold tracking-wider mb-0.5">
                    Date Plantation
                  </span>
                  <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 tabular-nums">
                    {selectedBloc.plantationDate}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-semibold tracking-wider mb-0.5">
                    Dernière Fertilisation
                  </span>
                  <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 tabular-nums">
                    {selectedBloc.fertilizerDate}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-semibold tracking-wider mb-0.5">
                    Récolte Prévisionnelle
                  </span>
                  <span className="font-bold text-xs sm:text-sm text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {selectedBloc.expectedHarvestDate}
                  </span>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Subtab 2: Saisie Récolte (Offline-First) */}
      {activeSubTab === 'recolte' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card variant="glass" className="lg:col-span-1 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Scale className="w-5 h-5 text-plantation-700 dark:text-plantation-400" />
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Nouvelle Pesée au Champ
                </h3>
                <p className="text-xs text-slate-500">Fonctionne 100% hors-ligne sur smartphone</p>
              </div>
            </div>

            {harvestSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2 animate-fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{harvestSuccess}</span>
              </div>
            )}

            <form onSubmit={handleCreateHarvest} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                  Parcelle de Culture *
                </label>
                <select
                  value={harvestBlocId}
                  onChange={(e) => setHarvestBlocId(e.target.value)}
                  className="w-full rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
                >
                  {blocs.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.id} - {b.name} ({b.variety})
                    </option>
                  ))}
                </select>
              </div>

              <Input
                label="Nombre de régimes coupés *"
                type="number"
                min={1}
                value={bunchCount}
                onChange={(e) => setBunchCount(Number(e.target.value))}
              />

              <Input
                label="Poids total pesé au champ (kg) *"
                type="number"
                step="0.5"
                min={1}
                value={totalWeightKg}
                onChange={(e) => setTotalWeightKg(Number(e.target.value))}
              />

              <Input
                label="Perte estimée champ -> usine (kg)"
                type="number"
                step="0.1"
                min={0}
                helperText="Mesuré sur les 3 km de piste vers l'usine"
                value={transportLossKg}
                onChange={(e) => setTransportLossKg(Number(e.target.value))}
              />

              <Input
                label="Opérateur / Chef d'équipe"
                value={operatorName}
                onChange={(e) => setOperatorName(e.target.value)}
              />

              <Button type="submit" variant="primary" className="w-full mt-2" leftIcon={<Plus className="w-4 h-4" />}>
                Enregistrer la Récolte
              </Button>
            </form>
          </Card>

          {/* Harvest Log History */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
                Journal des Récoltes Terrain ({harvests.length})
              </h3>
              <span className="text-xs text-slate-500">Chaque récolte génère un code R-XXX</span>
            </div>

            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800/80 shadow-sm">
              {harvests.map((h) => (
                <div
                  key={h.harvestId}
                  className="p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-850/50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-plantation-100 dark:bg-plantation-950 text-plantation-700 dark:text-plantation-300 flex items-center justify-center font-bold text-xs shrink-0">
                      {h.harvestId}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 whitespace-nowrap">
                          Bloc {h.blocId || 'Partenaire'}
                        </span>
                        <Badge variant="slate" size="sm">
                          {h.bunchCount} régimes
                        </Badge>
                        <Badge variant={h.syncStatus === 'SYNCED' ? 'emerald' : 'amber'} size="sm" dot>
                          {h.syncStatus === 'SYNCED' ? 'Sync' : 'En attente'}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {h.harvestDate} · {h.operatorId}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-bold text-xs sm:text-sm text-plantation-700 dark:text-plantation-400 block tabular-nums">
                      {Number(h.totalWeightKg).toLocaleString()} kg
                    </span>
                    <span className="text-[10px] text-amber-600 block tabular-nums">
                      -{h.fieldToFactoryLossKg} kg piste
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Subtab 3: Suivi Sanitaire */}
      {activeSubTab === 'sanitaire' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card variant="glass" className="lg:col-span-1 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Camera className="w-5 h-5 text-purple-600" />
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Observation Sanitaire & Photo
                </h3>
                <p className="text-xs text-slate-500">Saisie smartphone même hors couverture réseau</p>
              </div>
            </div>

            {sanitarySuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Observation enregistrée en local et en attente de synchronisation !</span>
              </div>
            )}

            <form onSubmit={handleCreateSanitaryLog} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                  Parcelle concernée *
                </label>
                <select
                  value={sanitaryBlocId}
                  onChange={(e) => setSanitaryBlocId(e.target.value)}
                  className="w-full rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
                >
                  {blocs.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.id} - {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                  Stade Phénologique
                </label>
                <select
                  value={sanitaryStage}
                  onChange={(e) => setSanitaryStage(e.target.value)}
                  className="w-full rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
                >
                  <option value="VEGETATIF">Végétatif (Développement foliaire)</option>
                  <option value="FLORAISON">Floraison (Émission du bourgeon mâle)</option>
                  <option value="FRUCTIFICATION">Fructification (Régimes en formation)</option>
                  <option value="MATURITE">Maturité (Prêt pour la récolte)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                  Niveau de Criticité
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['NORMAL', 'ATTENTION', 'ALERTE_MALADIE'] as const).map((sev) => (
                    <button
                      key={sev}
                      type="button"
                      onClick={() => setSanitarySeverity(sev)}
                      className={`p-2 rounded-xl text-xs font-semibold border transition-all ${
                        sanitarySeverity === sev
                          ? sev === 'NORMAL'
                            ? 'bg-emerald-500 text-white border-emerald-600'
                            : sev === 'ATTENTION'
                            ? 'bg-amber-500 text-white border-amber-600'
                            : 'bg-red-600 text-white border-red-700'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {sev === 'NORMAL' ? 'Normal' : sev === 'ATTENTION' ? 'Attention' : 'Alerte'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                  Observation Sanitaire / Traitement *
                </label>
                <textarea
                  required
                  rows={3}
                  value={sanitaryObservation}
                  onChange={(e) => setSanitaryObservation(e.target.value)}
                  placeholder="Ex: Feuilles bien vertes, pas de nécrose, tuteurage effectué après les vents forts..."
                  className="w-full rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-2.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                  Preuve Photo Terrain (Stockée en local)
                </label>
                <label className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer text-xs text-slate-600 dark:text-slate-300 transition-colors">
                  <Camera className="w-4 h-4 text-plantation-600" />
                  <span>{sanitaryPhoto ? 'Photo sélectionnée (Changer)' : 'Prendre ou importer une photo'}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoCapture} />
                </label>
                {sanitaryPhoto && (
                  <div className="mt-2 relative w-full h-28 rounded-xl overflow-hidden border border-slate-200">
                    <img src={sanitaryPhoto} alt="Aperçu sanitaire" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <Button type="submit" variant="primary" className="w-full">
                Enregistrer l'Observation
              </Button>
            </form>
          </Card>

          {/* Sanitary Log Stream */}
          <div className="lg:col-span-2 space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
              Historique des Observations Terrain ({sanitaryLogs.length})
            </h3>

            <div className="space-y-3">
              {sanitaryLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-subtle-card space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-xs px-2.5 py-1 rounded-lg bg-plantation-100 dark:bg-plantation-950 text-plantation-800 dark:text-plantation-300">
                        Bloc {log.blocId}
                      </span>
                      <span className="text-xs text-slate-500">{log.date}</span>
                      <Badge
                        variant={
                          log.severity === 'NORMAL'
                            ? 'emerald'
                            : log.severity === 'ATTENTION'
                            ? 'amber'
                            : 'red'
                        }
                        size="sm"
                      >
                        {log.severity}
                      </Badge>
                    </div>
                    <Badge variant={log.syncStatus === 'SYNCED' ? 'emerald' : 'amber'} size="sm" dot>
                      {log.syncStatus === 'SYNCED' ? 'Sync' : 'Offline'}
                    </Badge>
                  </div>

                  <p className="text-xs text-slate-700 dark:text-slate-200">{log.observation}</p>

                  {log.photoUrl && (
                    <div className="w-32 h-20 rounded-lg overflow-hidden border border-slate-200 mt-2">
                      <img src={log.photoUrl} alt="Photo sanitaire" className="w-full h-full object-cover" />
                    </div>
                  )}

                  <p className="text-[11px] text-slate-400">Relevé par {log.loggedBy}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Subtab 4: External Suppliers */}
      {activeSubTab === 'partenaires' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                Approvisionnement Producteurs Partenaires (30% de la production)
              </h4>
              <p className="text-xs text-slate-500">
                Suivi des coopératives certifiées de l'Est pour compléter la récolte propre
              </p>
            </div>
            <Badge variant="blue">30% Objectif Modèle</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {suppliers.map((sup) => (
              <Card key={sup.supplierId} variant="glass" className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">{sup.name}</h4>
                  <Badge variant="emerald">{sup.externalLotId}</Badge>
                </div>
                <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-semibold tracking-wider mb-0.5">
                      Volume livré
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white tabular-nums">
                      {sup.volumeKg.toLocaleString()} kg
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-semibold tracking-wider mb-0.5">
                      Prix unitaire
                    </span>
                    <span className="font-bold text-plantation-700 dark:text-plantation-400 tabular-nums">
                      {sup.pricePerKg} FCFA
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-semibold tracking-wider mb-0.5">
                      Origine
                    </span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300 truncate block">
                      {sup.region}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-slate-500">Contact: {sup.phone}</p>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
