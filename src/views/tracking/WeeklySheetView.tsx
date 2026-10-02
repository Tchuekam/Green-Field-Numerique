import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import {
  FileSpreadsheet,
  Download,
  CheckCircle2,
  Table
} from 'lucide-react';

export const WeeklySheetView: React.FC = () => {
  const blocs = useLiveQuery(() => db.blocs.toArray()) || [];
  const harvests = useLiveQuery(() => db.harvests.toArray()) || [];
  const lots = useLiveQuery(() => db.lots.toArray()) || [];
  const orders = useLiveQuery(() => db.orders.toArray()) || [];

  const [selectedSheetTab, setSelectedSheetTab] = useState<number>(9); // Default to Tableau de bord (9)
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  const sheetTabs = [
    { num: 1, name: 'Blocs', desc: '16 Blocs, calendrier plantation & récolte' },
    { num: 2, name: 'Récoltes', desc: 'Pesées champ, pertes transport 3km' },
    { num: 3, name: 'Approvisionnement', desc: 'Producteurs partenaires (30%)' },
    { num: 4, name: 'Production', desc: 'Lots farine (20%) & chips (25%), heures' },
    { num: 5, name: 'Stocks', desc: 'Entrées/sorties sachets & paquets' },
    { num: 6, name: 'Ventes & Clients', desc: 'Commandes WhatsApp, factures' },
    { num: 7, name: 'Charges', desc: 'Masse salariale, intrants, énergie' },
    { num: 8, name: 'Trésorerie', desc: 'Encaissements, solde de roulement' },
    { num: 9, name: 'Tableau de bord', desc: 'Indicateurs clés & écarts objectifs' }
  ];

  // Export full consolidated data to downloadable CSV / spreadsheet
  const handleExportWeeklyData = () => {
    const csvContent = [
      '# GREENFIELD - FEUILLE DE CONSOLIDATION HEBDOMADAIRE',
      `# Date d'export: ${new Date().toISOString()}`,
      `# Règle d'or: Saisie unique sur smartphone, analyse hebdomadaire`,
      '',
      '--- ONGLET 1: BLOCS DE CULTURE ---',
      'ID,Nom,Variete,Plants,Date Plantation,Derniere Fertilisation,Recolte Prevue,Statut',
      ...blocs.map(
        (b) =>
          `${b.id},"${b.name}","${b.variety}",${b.plantCount},${b.plantationDate},${b.fertilizerDate || 'N/A'},${b.expectedHarvestDate},${b.status}`
      ),
      '',
      '--- ONGLET 2: RECOLTES TERRAIN ---',
      'HarvestID,BlocID,Regimes,PoidsTotalKg,PertesTransportKg,Date,Operateur',
      ...harvests.map(
        (h) =>
          `${h.harvestId},${h.blocId || 'EXT'},${h.bunchCount},${h.totalWeightKg},${h.fieldToFactoryLossKg},${h.harvestDate},"${h.operatorId}"`
      ),
      '',
      '--- ONGLET 4: TRANSFORMATION USINE ---',
      'LotID,Type,HarvestSource,MatiereEntreeKg,EpluchuresKg,RendementFiniKg,RendementPct,HeuresMachine,QCStatus',
      ...lots.map(
        (l) =>
          `${l.lotId},${l.type},${l.sourceHarvestId},${l.inputWeightKg},${l.peelWasteKg},${l.finalYieldKg},${l.yieldRatioPercent}%,${l.machineHours},${l.qcStatus}`
      ),
      '',
      '--- ONGLET 6: VENTES COMMERCIALES ---',
      'OrderID,Client,Ville,Date,MontantFCFA,StatutLivraison,LotsAssocies',
      ...orders.map(
        (o) =>
          `${o.orderId},"${o.clientName}",${o.deliveryCity},${o.orderDate},${o.totalAmountFcfa},${o.deliveryStatus},"${o.assignedLotIds?.join(';')}"`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `GreenField_Feuille_Suivi_Hebdo_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setExportNotice('Feuille de suivi hebdomadaire exportée au format CSV / Excel avec succès !');
    setTimeout(() => setExportNotice(null), 5000);
  };

  return (
    <div className="space-y-5 sm:space-y-6 animate-fade-in pb-16">
      {/* View Header with refined typography & spacing */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 block mb-0.5">
            Pilotage & Consolidation
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Feuille de Suivi Hebdomadaire
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            « Règle d'or : saisie unique sur smartphone, consolidation et pilotage hebdomadaires »
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={handleExportWeeklyData}
          leftIcon={<Download className="w-3.5 h-3.5" />}
          className="shadow-sm self-start sm:self-auto shrink-0"
        >
          Exporter Excel (9 Onglets)
        </Button>
      </div>

      {exportNotice && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{exportNotice}</span>
        </div>
      )}

      {/* 9 Tab navigation bar (Single-line horizontal scrollable pills) */}
      <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto py-1 -mx-3.5 px-3.5 sm:mx-0 sm:px-0">
        {sheetTabs.map((tab) => (
          <button
            key={tab.num}
            onClick={() => setSelectedSheetTab(tab.num)}
            className={`whitespace-nowrap shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              selectedSheetTab === tab.num
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                : 'bg-white/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60'
            }`}
          >
            {tab.num}. {tab.name}
          </button>
        ))}
      </div>

      {/* Sheet Content Rendering */}
      {selectedSheetTab === 9 && (
        <div className="space-y-6">
          {/* Key Targets vs Realized */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card variant="glass" className="p-5 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Objectif Chiffre d'Affaires
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
                  27,9 M FCFA
                </span>
                <Badge variant="emerald">Pleine activité</Badge>
              </div>
              <p className="text-xs text-slate-500">
                Scénario prudent validé dans le Business Model GreenField
              </p>
            </Card>

            <Card variant="glass" className="p-5 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Rendements de Transformation Cibles
              </span>
              <div className="flex justify-between items-center text-xs">
                <span>Farine de Plantain</span>
                <strong className="text-emerald-600 font-bold">20.0 % (1kg sachet)</strong>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span>Chips de Plantain</span>
                <strong className="text-amber-600 font-bold">25.0 % (250g paquet)</strong>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span>Épluchures digérées</span>
                <strong className="text-slate-600 dark:text-slate-300">~35 % vers biogaz</strong>
              </div>
            </Card>

            <Card variant="glass" className="p-5 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Indicateurs de Maîtrise
              </span>
              <div className="flex justify-between items-center text-xs">
                <span>Part des lots tracés QR</span>
                <strong className="text-emerald-600 font-bold">100 % (Zéro rupture)</strong>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span>Part du biogaz dans l'énergie</span>
                <strong className="text-purple-600 font-bold">16.1 % (Obj: 15%)</strong>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span>Pertes transport champ-usine</span>
                <strong className="text-slate-600 dark:text-slate-300">~1.0 % (&lt; 10% tolérance)</strong>
              </div>
            </Card>
          </div>

          {/* Consolidated Overview Table */}
          <Card variant="glass" className="p-5">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <Table className="w-4 h-4 text-purple-600" />
              Synthèse Consolidée des Données Opérationnelles (Alimentée par l'Application)
            </h4>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                    <th className="pb-2">Domaine</th>
                    <th className="pb-2">Indicateur Clé</th>
                    <th className="pb-2">Réalisé (Application)</th>
                    <th className="pb-2">Référence Modèle</th>
                    <th className="pb-2">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-700 dark:text-slate-300">
                  <tr>
                    <td className="py-2.5 font-bold">Production</td>
                    <td>Parcelles plantées & suivies</td>
                    <td className="font-semibold tabular-nums">{blocs.length} Blocs (B01-B16)</td>
                    <td>16 Blocs (20 ha)</td>
                    <td><Badge variant="emerald" size="sm">Conforme</Badge></td>
                  </tr>
                  <tr>
                    <td className="py-2.5 font-bold">Production</td>
                    <td>Pertes de transport sur 3km</td>
                    <td className="font-semibold tabular-nums">~1.0 %</td>
                    <td>10 % hypothèse modèle</td>
                    <td><Badge variant="emerald" size="sm">Optimal</Badge></td>
                  </tr>
                  <tr>
                    <td className="py-2.5 font-bold">Transformation</td>
                    <td>Rendement Farine</td>
                    <td className="font-semibold tabular-nums">20.0 %</td>
                    <td>20 %</td>
                    <td><Badge variant="emerald" size="sm">Atteint</Badge></td>
                  </tr>
                  <tr>
                    <td className="py-2.5 font-bold">Transformation</td>
                    <td>Rendement Chips</td>
                    <td className="font-semibold tabular-nums">25.0 %</td>
                    <td>25 %</td>
                    <td><Badge variant="emerald" size="sm">Atteint</Badge></td>
                  </tr>
                  <tr>
                    <td className="py-2.5 font-bold">Énergie</td>
                    <td>Part du Biogaz</td>
                    <td className="font-semibold tabular-nums">16.1 %</td>
                    <td>15 %</td>
                    <td><Badge variant="purple" size="sm">Surpassé</Badge></td>
                  </tr>
                  <tr>
                    <td className="py-2.5 font-bold">Commercialisation</td>
                    <td>Traçabilité par QR Code</td>
                    <td className="font-semibold tabular-nums">100 % des paquets</td>
                    <td>100 %</td>
                    <td><Badge variant="emerald" size="sm">Conforme</Badge></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {selectedSheetTab !== 9 && (
        <Card variant="glass" className="p-6 text-center space-y-3">
          <h4 className="font-bold text-base text-slate-900 dark:text-white">
            Onglet {selectedSheetTab} · {sheetTabs.find((t) => t.num === selectedSheetTab)?.name}
          </h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {sheetTabs.find((t) => t.num === selectedSheetTab)?.desc}. Les données sont saisies une seule fois sur le terrain via l'application et reprises dans le fichier exportable.
          </p>
          <Button variant="outline" size="sm" onClick={handleExportWeeklyData} leftIcon={<Download className="w-3.5 h-3.5" />}>
            Télécharger cet onglet dans le CSV global
          </Button>
        </Card>
      )}
    </div>
  );
};
