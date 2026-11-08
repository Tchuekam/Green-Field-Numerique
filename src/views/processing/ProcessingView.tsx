import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import type { ProcessingLot, InventoryItem, ProductType } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { QRCodeDisplay } from '../../components/qr/QRCodeDisplay';
import {
  Factory,
  Flame,
  Droplets,
  CheckCircle2,
  QrCode,
  Plus,
  Scale
} from 'lucide-react';

export const ProcessingView: React.FC = () => {
  const rawLots = useLiveQuery(() => db.lots.toArray()) || [];
  const lots = [...rawLots].sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
  const harvests = useLiveQuery(() => db.harvests.toArray()) || [];

  const [activeSubTab, setActiveSubTab] = useState<'lots' | 'farine' | 'chips' | 'biogaz'>('lots');
  const [selectedLotForQR, setSelectedLotForQR] = useState<ProcessingLot | null>(null);

  // New Lot Creation State
  const [lotType, setLotType] = useState<ProductType>('FLOUR');
  const [sourceHarvestId, setSourceHarvestId] = useState<string>('R-001');
  const [inputWeightKg, setInputWeightKg] = useState<number>(1000);
  const [machineHours, setMachineHours] = useState<number>(5.5);
  const [peelWasteKg, setPeelWasteKg] = useState<number>(350); // ~35%
  // Flour params
  const [humidityPercent, setHumidityPercent] = useState<number>(10.5);
  // Chips params
  const [oilTemp, setOilTemp] = useState<number>(175);
  const [oilVolume, setOilVolume] = useState<number>(35);
  const [lotCreatedMessage, setLotCreatedMessage] = useState<string | null>(null);

  const handleCreateLot = async (e: React.FormEvent) => {
    e.preventDefault();
    const count = await db.lots.count();
    const prefix = lotType === 'FLOUR' ? 'LF' : 'LC';
    const lotId = `${prefix}-${(count + 1).toString().padStart(3, '0')}`;

    const yieldRatio = lotType === 'FLOUR' ? 0.2 : 0.25;
    const finalYieldKg = Math.round(inputWeightKg * yieldRatio);
    const packagingCount = lotType === 'FLOUR' ? finalYieldKg : Math.round(finalYieldKg / 0.25);
    const packageFormat = lotType === 'FLOUR' ? 'Farine 1kg' : 'Chips 250g';

    const sourceHarvest = harvests.find((h) => h.harvestId === sourceHarvestId);

    const newLot: ProcessingLot = {
      lotId,
      type: lotType,
      sourceHarvestId,
      sourceBlocId: sourceHarvest?.blocId,
      inputWeightKg: Number(inputWeightKg),
      peelWasteKg: Number(peelWasteKg),
      finalYieldKg,
      yieldRatioPercent: yieldRatio * 100,
      machineHours: Number(machineHours),
      humidityPercent: lotType === 'FLOUR' ? Number(humidityPercent) : undefined,
      oilTemp: lotType === 'CHIPS' ? Number(oilTemp) : undefined,
      oilVolumeLiters: lotType === 'CHIPS' ? Number(oilVolume) : undefined,
      qcStatus: 'APPROVED',
      qcNotes:
        lotType === 'FLOUR'
          ? `Tamisage fin. Humidité ${humidityPercent}%, conforme norme qualité.`
          : `Friture à ${oilTemp}°C. Texture croustillante, aspect doré.`,
      qcPassedBy: 'Suzanne Kamga, Ing.',
      packagingCount,
      packageFormat,
      createdAt: new Date().toLocaleString('fr-FR')
    };

    await db.lots.add(newLot);

    const newItems: InventoryItem[] = Array.from({ length: Math.min(20, packagingCount) }, (_, idx) => {
      const seq = (idx + 1).toString().padStart(3, '0');
      const blocLabel = sourceHarvest?.blocId || 'EXT';
      return {
        productId: `PROD-${lotId}-${seq}`,
        lotId,
        packageType: packageFormat,
        qrCodeHash: `GF-${lotId}-${blocLabel}-${seq}`,
        stockStatus: 'IN_STOCK' as const,
        unitWeightKg: lotType === 'FLOUR' ? 1.0 : 0.25,
        unitPriceFcfa: lotType === 'FLOUR' ? 1500 : 500,
        createdAt: new Date().toISOString().split('T')[0]
      };
    });

    await db.inventory.bulkAdd(newItems);

    setLotCreatedMessage(`Lot ${lotId} (${packageFormat}) créé avec succès ! 20 premiers sachets étiquetés QR.`);
    setSelectedLotForQR(newLot);
    setTimeout(() => setLotCreatedMessage(null), 5000);
  };

  const totalFlourKg = lots.filter((l) => l.type === 'FLOUR').reduce((acc, l) => acc + l.finalYieldKg, 0);
  const totalChipsKg = lots.filter((l) => l.type === 'CHIPS').reduce((acc, l) => acc + l.finalYieldKg, 0);
  const totalPeelToBiogas = lots.reduce((acc, l) => acc + l.peelWasteKg, 0);

  return (
    <div className="space-y-5 sm:space-y-6 animate-fade-in">
      {/* View Header with refined typography & spacing */}
      <div className="flex flex-col gap-3">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 block mb-0.5">
            Étape 2 · Transformation Usine
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Farine, Chips & Qualité
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Suivi des lots de transformation, valorisation biogaz des épluchures et étiquetage QR
          </p>
        </div>

        {/* Horizontal Scrolling Segmented Controls (No-Scrollbar, Single line pills) */}
        <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto py-1 -mx-3.5 px-3.5 sm:mx-0 sm:px-0">
          <button
            onClick={() => setActiveSubTab('lots')}
            className={`whitespace-nowrap shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeSubTab === 'lots'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                : 'bg-white/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60'
            }`}
          >
            Lots & Réception
          </button>
          <button
            onClick={() => setActiveSubTab('farine')}
            className={`whitespace-nowrap shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'farine'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                : 'bg-white/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60'
            }`}
          >
            <span>Ligne Farine</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-plantation-100 dark:bg-plantation-900/60 text-plantation-700 dark:text-plantation-300 font-bold">
              20%
            </span>
          </button>
          <button
            onClick={() => setActiveSubTab('chips')}
            className={`whitespace-nowrap shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'chips'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                : 'bg-white/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60'
            }`}
          >
            <span>Ligne Chips</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 font-bold">
              25%
            </span>
          </button>
          <button
            onClick={() => setActiveSubTab('biogaz')}
            className={`whitespace-nowrap shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeSubTab === 'biogaz'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                : 'bg-white/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60'
            }`}
          >
            Énergie & Biogaz
          </button>
        </div>
      </div>

      {/* KPI Cards: Clean Apple Metrics Layout */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Card 1: Farine */}
        <Card variant="glass" className="p-3.5 sm:p-4.5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1 mb-2">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 truncate">
              Farine Produite
            </span>
            <Badge variant="blue" size="sm" className="text-[10px] px-1.5 py-0.5 shrink-0">
              Rend. 20%
            </Badge>
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums tracking-tight">
                {totalFlourKg.toLocaleString()}
              </span>
              <span className="text-xs font-bold text-slate-400 uppercase">kg</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
              Humidité &lt; 12%
            </p>
          </div>
        </Card>

        {/* Card 2: Chips */}
        <Card variant="glass" className="p-3.5 sm:p-4.5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1 mb-2">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 truncate">
              Chips Produites
            </span>
            <Badge variant="amber" size="sm" className="text-[10px] px-1.5 py-0.5 shrink-0">
              Rend. 25%
            </Badge>
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-amber-600 dark:text-amber-400 tabular-nums tracking-tight">
                {totalChipsKg.toLocaleString()}
              </span>
              <span className="text-xs font-bold text-slate-400 uppercase">kg</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
              Friture à 175°C
            </p>
          </div>
        </Card>

        {/* Card 3: Épluchures */}
        <Card variant="glass" className="p-3.5 sm:p-4.5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1 mb-2">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 truncate">
              Épluchures Digesteur
            </span>
            <Badge variant="emerald" size="sm" className="text-[10px] px-1.5 py-0.5 shrink-0">
              35% Bilan
            </Badge>
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums tracking-tight">
                {totalPeelToBiogas.toLocaleString()}
              </span>
              <span className="text-xs font-bold text-slate-400 uppercase">kg</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
              Valorisé en biogaz
            </p>
          </div>
        </Card>

        {/* Card 4: Biogaz */}
        <Card variant="glass" className="p-3.5 sm:p-4.5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1 mb-2">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 truncate">
              Autonomie Énergie
            </span>
            <Badge variant="purple" size="sm" className="text-[10px] px-1.5 py-0.5 shrink-0">
              Obj: 15%
            </Badge>
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-purple-600 dark:text-purple-400 tabular-nums tracking-tight">
                16.1
              </span>
              <span className="text-xs font-bold text-slate-400 uppercase">%</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
              Biogaz usine
            </p>
          </div>
        </Card>
      </div>

      {lotCreatedMessage && (
        <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{lotCreatedMessage}</span>
        </div>
      )}

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Transformation Lot Creator */}
        <Card variant="glass" className="lg:col-span-1 p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-3.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Factory className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Ouvrir un Nouveau Lot Usine
              </h3>
              <p className="text-[11px] text-slate-400">Transforme une récolte en Farine ou Chips</p>
            </div>
          </div>

          <form onSubmit={handleCreateLot} className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Ligne de Production *
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setLotType('FLOUR')}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all flex items-center justify-center gap-1.5 ${
                    lotType === 'FLOUR'
                      ? 'bg-plantation-800 text-white border-plantation-700 shadow-sm'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <Droplets className="w-3.5 h-3.5" />
                  Farine (20%)
                </button>
                <button
                  type="button"
                  onClick={() => setLotType('CHIPS')}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all flex items-center justify-center gap-1.5 ${
                    lotType === 'CHIPS'
                      ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <Flame className="w-3.5 h-3.5" />
                  Chips (25%)
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Récolte Source *
              </label>
              <select
                value={sourceHarvestId}
                onChange={(e) => setSourceHarvestId(e.target.value)}
                className="w-full rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
              >
                {harvests.map((h) => (
                  <option key={h.harvestId} value={h.harvestId}>
                    {h.harvestId} · Bloc {h.blocId || 'Partenaire'} ({h.totalWeightKg} kg)
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Plantain Brut Entré (kg) *"
              type="number"
              value={inputWeightKg}
              onChange={(e) => {
                const val = Number(e.target.value);
                setInputWeightKg(val);
                setPeelWasteKg(Math.round(val * 0.35));
              }}
            />

            <Input
              label="Épluchures vers digesteur (kg)"
              type="number"
              helperText="Taux nominal: ~35%"
              value={peelWasteKg}
              onChange={(e) => setPeelWasteKg(Number(e.target.value))}
            />

            <Input
              label="Heures Machine"
              type="number"
              step="0.1"
              value={machineHours}
              onChange={(e) => setMachineHours(Number(e.target.value))}
            />

            {lotType === 'FLOUR' ? (
              <Input
                label="Humidité farine (%) *"
                type="number"
                step="0.1"
                helperText="Norme : < 12.0%"
                value={humidityPercent}
                onChange={(e) => setHumidityPercent(Number(e.target.value))}
              />
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Input
                  label="Température (°C) *"
                  type="number"
                  value={oilTemp}
                  onChange={(e) => setOilTemp(Number(e.target.value))}
                />
                <Input
                  label="Huile (L)"
                  type="number"
                  value={oilVolume}
                  onChange={(e) => setOilVolume(Number(e.target.value))}
                />
              </div>
            )}

            <Button type="submit" variant="primary" className="w-full mt-2" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />}>
              Valider le Lot & Générer QR
            </Button>
          </form>
        </Card>

        {/* Right: Existing Lots */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Lots de Production Actifs ({lots.length})
            </h3>
            <span className="text-[11px] text-slate-400">
              Touchez un lot pour voir son QR
            </span>
          </div>

          <div className="space-y-3">
            {lots.map((lot) => {
              const isSelected = selectedLotForQR?.lotId === lot.lotId;
              const sampleQRHash = `GF-${lot.lotId}-${lot.sourceBlocId || 'EXT'}-001`;

              return (
                <div
                  key={lot.lotId}
                  className={`rounded-2xl transition-all duration-200 border p-4 sm:p-5 ${
                    isSelected
                      ? 'bg-plantation-50/50 dark:bg-plantation-950/30 border-plantation-500/60 shadow-md ring-1 ring-plantation-500/30'
                      : 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-slate-200/70 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm'
                  }`}
                >
                  {/* Top row: Identity, Badges & Action */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-extrabold text-xs shrink-0 tracking-tight ${
                          lot.type === 'FLOUR'
                            ? 'bg-plantation-100 dark:bg-plantation-950/80 text-plantation-800 dark:text-plantation-300'
                            : 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300'
                        }`}
                      >
                        {lot.type === 'FLOUR' ? 'LF' : 'LC'}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-extrabold text-sm text-slate-900 dark:text-white tracking-tight whitespace-nowrap">
                            Lot {lot.lotId}
                          </h4>
                          <Badge variant="emerald" size="sm" dot>
                            {lot.qcStatus}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          Récolte <span className="font-medium text-slate-700 dark:text-slate-300">{lot.sourceHarvestId}</span> · Bloc <span className="font-medium text-slate-700 dark:text-slate-300">{lot.sourceBlocId || 'Partenaire'}</span> · {lot.packageFormat}
                        </p>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant={isSelected ? 'primary' : 'glass'}
                      onClick={() => setSelectedLotForQR(isSelected ? null : lot)}
                      leftIcon={<QrCode className="w-3.5 h-3.5" />}
                      className="text-xs px-3 py-1.5 rounded-full shrink-0 shadow-none"
                    >
                      {isSelected ? 'Fermer' : 'Étiquette'}
                    </Button>
                  </div>

                  {/* Clean Horizontal Metric Strip — ZERO Nested Box Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2 mt-3.5 pt-3.5 border-t border-slate-100 dark:border-slate-800/80">
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-0.5">
                        Matière entrée
                      </span>
                      <span className="text-xs sm:text-sm font-bold tabular-nums text-slate-900 dark:text-slate-100">
                        {lot.inputWeightKg.toLocaleString()} <span className="text-[11px] font-medium text-slate-400">kg</span>
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-0.5">
                        Rendement fini
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                        {lot.finalYieldKg.toLocaleString()} <span className="text-[11px] font-medium text-emerald-600/70">kg ({lot.yieldRatioPercent}%)</span>
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-0.5">
                        Épluchures
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                        {lot.peelWasteKg.toLocaleString()} <span className="text-[11px] font-medium text-amber-600/70">kg</span>
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-0.5">
                        Conditionné
                      </span>
                      <span className="text-xs sm:text-sm font-bold tabular-nums text-slate-900 dark:text-slate-100">
                        {lot.packagingCount.toLocaleString()} <span className="text-[11px] font-medium text-slate-400">{lot.type === 'FLOUR' ? 'sachets' : 'paquets'}</span>
                      </span>
                    </div>
                  </div>

                  {/* Expanded QR Code label — Clean Inset without bulky nested box */}
                  {isSelected && (
                    <div className="mt-4 pt-4 border-t border-slate-200/60 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-around gap-4 animate-fade-in">
                      <div className="bg-white p-2.5 rounded-2xl shadow-sm border border-slate-100 dark:border-transparent">
                        <QRCodeDisplay
                          hash={sampleQRHash}
                          label={`Étiquette ${lot.packageFormat}`}
                          sublabel={`Lot: ${lot.lotId} · Origine: Bloc ${lot.sourceBlocId}`}
                          size={130}
                        />
                      </div>
                      <div className="text-xs space-y-1.5 text-slate-600 dark:text-slate-300 max-w-xs text-center sm:text-left">
                        <p className="font-bold text-slate-900 dark:text-white">
                          Étiquette Adhésive Pack
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Ce QR code relie instantanément le produit au Bloc {lot.sourceBlocId}.
                        </p>
                        <p className="font-mono text-[10px] text-plantation-700 dark:text-plantation-400 truncate">
                          Hash: {sampleQRHash}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
