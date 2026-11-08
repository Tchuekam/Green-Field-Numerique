import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import type { Order } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import {
  TrendingUp,
  MessageCircle,
  PackageCheck,
  Truck,
  AlertTriangle,
  QrCode,
  CheckCircle2
} from 'lucide-react';

interface CommercialViewProps {
  onScanQR: (hash: string) => void;
  onOpenScannerModal: () => void;
}

export const CommercialView: React.FC<CommercialViewProps> = ({
  onScanQR,
  onOpenScannerModal
}) => {
  const rawOrders = useLiveQuery(() => db.orders.toArray()) || [];
  const orders = [...rawOrders].sort((a, b) => (b.orderDate > a.orderDate ? 1 : -1));

  const inventory = useLiveQuery(() => db.inventory.toArray()) || [];

  const rawComplaints = useLiveQuery(() => db.complaints.toArray()) || [];
  const complaints = [...rawComplaints].sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));

  const [activeSubTab, setActiveSubTab] = useState<'whatsapp' | 'commandes' | 'stocks' | 'reclamations'>('whatsapp');

  // WhatsApp Intake Simulator State
  const [waSender] = useState<string>('+237 677 812 390 (Boulangerie Acropole Douala)');
  const [waPackageType, setWaPackageType] = useState<string>('Farine 1kg');
  const [waQuantity, setWaQuantity] = useState<number>(30);
  const [stockCheckResult, setStockCheckResult] = useState<{
    checked: boolean;
    available: boolean;
    inStockCount: number;
    requested: number;
    allocatedIds: string[];
  } | null>(null);
  const [orderConfirmedNotice, setOrderConfirmedNotice] = useState<string | null>(null);

  // Check real-time stock
  const handleCheckStock = () => {
    const availableItems = inventory.filter(
      (item) => item.packageType === waPackageType && item.stockStatus === 'IN_STOCK'
    );

    const isAvailable = availableItems.length >= waQuantity;
    const allocated = availableItems.slice(0, waQuantity).map((i) => i.productId);

    setStockCheckResult({
      checked: true,
      available: isAvailable,
      inStockCount: availableItems.length,
      requested: waQuantity,
      allocatedIds: allocated
    });
  };

  // Confirm and validate order via WhatsApp intake
  const handleValidateOrder = async () => {
    if (!stockCheckResult || !stockCheckResult.available) return;

    const count = await db.orders.count();
    const orderId = `CMD-2026-${(count + 1).toString().padStart(3, '0')}`;
    const blNumber = `BL-${(count + 1).toString().padStart(3, '0')}`;
    const unitPrice = waPackageType === 'Farine 1kg' ? 1500 : 500;
    const totalAmount = waQuantity * unitPrice;

    const newOrder: Order = {
      orderId,
      clientId: 'CLI-02',
      clientName: 'Boulangerie Acropole (Douala Bonanjo)',
      whatsappContact: '+237 677 812 390',
      orderDate: new Date().toLocaleString('fr-FR'),
      deliveryStatus: 'CONFIRMED',
      deliveryNoteNumber: blNumber,
      assignedLotIds: ['LF-001'],
      totalAmountFcfa: totalAmount,
      deliveryCity: 'Douala',
      notes: 'Commande générée automatiquement depuis WhatsApp Business.',
      requestedItems: [
        {
          packageType: waPackageType,
          quantity: waQuantity,
          unitPriceFcfa: unitPrice,
          allocatedProductIds: stockCheckResult.allocatedIds
        }
      ]
    };

    // Update inventory stock status to RESERVED
    await db.transaction('rw', [db.orders, db.inventory], async () => {
      await db.orders.add(newOrder);
      for (const prodId of stockCheckResult.allocatedIds) {
        await db.inventory.update(prodId, {
          stockStatus: 'RESERVED',
          reservedForOrderId: orderId
        });
      }
    });

    setOrderConfirmedNotice(
      `Commande ${orderId} validée ! Bon de livraison ${blNumber} émis. ${waQuantity} unités réservées.`
    );
    setStockCheckResult(null);
    setTimeout(() => setOrderConfirmedNotice(null), 6000);
  };

  // Stock aggregations
  const flourInStock = inventory.filter((i) => i.packageType === 'Farine 1kg' && i.stockStatus === 'IN_STOCK').length;
  const flourReserved = inventory.filter((i) => i.packageType === 'Farine 1kg' && i.stockStatus === 'RESERVED').length;
  const chipsInStock = inventory.filter((i) => i.packageType === 'Chips 250g' && i.stockStatus === 'IN_STOCK').length;
  const chipsReserved = inventory.filter((i) => i.packageType === 'Chips 250g' && i.stockStatus === 'RESERVED').length;

  const totalSalesFcfa = orders.reduce((acc, o) => acc + (o.totalAmountFcfa || 0), 0);

  return (
    <div className="space-y-5 sm:space-y-6 animate-fade-in pb-16">
      {/* View Header with refined typography & spacing */}
      <div className="flex flex-col gap-3">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 block mb-0.5">
            Étape 3 · Commercial & Ventes
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Commandes, Stocks & Traçabilité
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Intake WhatsApp Business, stocks en temps réel et résolution des réclamations
          </p>
        </div>

        {/* Horizontal Scrolling Segmented Controls (No-Scrollbar, Single line pills) */}
        <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto py-1 -mx-3.5 px-3.5 sm:mx-0 sm:px-0">
          <button
            onClick={() => setActiveSubTab('whatsapp')}
            className={`whitespace-nowrap shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'whatsapp'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                : 'bg-white/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60'
            }`}
          >
            <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
            <span>WhatsApp Intake</span>
          </button>
          <button
            onClick={() => setActiveSubTab('commandes')}
            className={`whitespace-nowrap shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeSubTab === 'commandes'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                : 'bg-white/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60'
            }`}
          >
            Commandes ({orders.length})
          </button>
          <button
            onClick={() => setActiveSubTab('stocks')}
            className={`whitespace-nowrap shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeSubTab === 'stocks'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                : 'bg-white/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60'
            }`}
          >
            Niveaux de Stocks
          </button>
          <button
            onClick={() => setActiveSubTab('reclamations')}
            className={`whitespace-nowrap shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'reclamations'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                : 'bg-white/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
            <span>Réclamations ({complaints.length})</span>
          </button>
        </div>
      </div>

      {/* KPI Cards: Clean Apple Metrics Layout */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Card 1: Chiffre d'affaires */}
        <Card variant="glass" className="p-3.5 sm:p-4.5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1 mb-2">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 truncate">
              Chiffre d'Affaires
            </span>
            <Badge variant="blue" size="sm" className="text-[10px] px-1.5 py-0.5 shrink-0">
              {orders.length} BL
            </Badge>
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums tracking-tight">
                {totalSalesFcfa.toLocaleString()}
              </span>
              <span className="text-xs font-bold text-slate-400 uppercase">FCFA</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
              Obj. 27,9 M FCFA
            </p>
          </div>
        </Card>

        {/* Card 2: Stock Farine */}
        <Card variant="glass" className="p-3.5 sm:p-4.5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1 mb-2">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 truncate">
              Stock Farine 1kg
            </span>
            <Badge variant="emerald" size="sm" className="text-[10px] px-1.5 py-0.5 shrink-0">
              {flourReserved} réservés
            </Badge>
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums tracking-tight">
                {flourInStock}
              </span>
              <span className="text-xs font-bold text-slate-400 uppercase">sachets</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
              1 500 FCFA / unité
            </p>
          </div>
        </Card>

        {/* Card 3: Stock Chips */}
        <Card variant="glass" className="p-3.5 sm:p-4.5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1 mb-2">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 truncate">
              Stock Chips 250g
            </span>
            <Badge variant="amber" size="sm" className="text-[10px] px-1.5 py-0.5 shrink-0">
              {chipsReserved} réservés
            </Badge>
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-amber-600 dark:text-amber-400 tabular-nums tracking-tight">
                {chipsInStock}
              </span>
              <span className="text-xs font-bold text-slate-400 uppercase">paquets</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
              500 FCFA / unité
            </p>
          </div>
        </Card>

        {/* Card 4: Réclamations */}
        <Card variant="glass" className="p-3.5 sm:p-4.5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-1 mb-2">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 truncate">
              Réclamations
            </span>
            <Badge variant={complaints.length > 0 ? 'red' : 'emerald'} size="sm" className="text-[10px] px-1.5 py-0.5 shrink-0">
              {complaints.length > 0 ? 'Remontées Bloc' : '0 incident'}
            </Badge>
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums tracking-tight">
                {complaints.length}
              </span>
              <span className="text-xs font-bold text-slate-400 uppercase">reçues</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
              Traçabilité garantie
            </p>
          </div>
        </Card>
      </div>

      {orderConfirmedNotice && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{orderConfirmedNotice}</span>
        </div>
      )}

      {/* Subtab 1: WhatsApp Intake Simulator */}
      {activeSubTab === 'whatsapp' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card variant="glass" className="p-5 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-sm">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Intake Commandes WhatsApp Business (Baileys / n8n)
                </h3>
                <p className="text-xs text-slate-500">
                  Règle d'or: Commande acceptée uniquement si le stock physique le permet
                </p>
              </div>
            </div>

            {/* Chat bubble simulation */}
            <div className="p-4 rounded-2xl bg-[#EFEAE2] dark:bg-slate-950 border border-slate-300/50 dark:border-slate-800 space-y-3">
              <div className="max-w-[85%] bg-white dark:bg-slate-800 p-3 rounded-2xl rounded-tl-sm shadow-sm text-xs space-y-1">
                <p className="font-bold text-emerald-700 dark:text-emerald-400 text-[11px]">
                  {waSender}
                </p>
                <p className="text-slate-800 dark:text-slate-200">
                  « Bonjour GreenField, nous souhaitons passer commande pour notre fournée spéciale : {waQuantity} sachets de {waPackageType}. Livraison possible sur Douala ce vendredi ? »
                </p>
                <span className="text-[9px] text-slate-400 block text-right">09:42 · WhatsApp</span>
              </div>
            </div>

            {/* Interactive order adjustment controls */}
            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                    Produit Demandé
                  </label>
                  <select
                    value={waPackageType}
                    onChange={(e) => {
                      setWaPackageType(e.target.value);
                      setStockCheckResult(null);
                    }}
                    className="w-full rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 px-3 py-2 text-xs font-semibold"
                  >
                    <option value="Farine 1kg">Farine de Plantain 1kg (1 500 FCFA)</option>
                    <option value="Chips 250g">Chips Croustillantes 250g (500 FCFA)</option>
                  </select>
                </div>

                <Input
                  label="Quantité demandée"
                  type="number"
                  min={1}
                  value={waQuantity}
                  onChange={(e) => {
                    setWaQuantity(Number(e.target.value));
                    setStockCheckResult(null);
                  }}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant="primary"
                  className="flex-1"
                  onClick={handleCheckStock}
                  leftIcon={<PackageCheck className="w-4 h-4" />}
                >
                  Vérifier Disponibilité Stock
                </Button>
              </div>
            </div>

            {/* Stock audit response card */}
            {stockCheckResult && (
              <div
                className={`p-4 rounded-2xl border transition-all animate-fade-in ${
                  stockCheckResult.available
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-200'
                    : 'bg-red-500/10 border-red-500/30 text-red-800 dark:text-red-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 font-bold text-xs">
                    {stockCheckResult.available ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                    )}
                    <span>
                      {stockCheckResult.available
                        ? `Stock Suffisant ! ${stockCheckResult.inStockCount} unités disponibles`
                        : `Stock Insuffisant ! Seulement ${stockCheckResult.inStockCount} unités disponibles (Demande: ${stockCheckResult.requested})`}
                    </span>
                  </div>
                </div>

                <p className="text-xs">
                  {stockCheckResult.available
                    ? `Les ${stockCheckResult.requested} sachets peuvent être réservés immédiatement avec émission d'un Bon de Livraison.`
                    : `La commande ne peut pas être validée en l'état pour éviter les ruptures.`}
                </p>

                {stockCheckResult.available && (
                  <Button
                    size="sm"
                    variant="primary"
                    className="w-full mt-3"
                    onClick={handleValidateOrder}
                    leftIcon={<Truck className="w-4 h-4" />}
                  >
                    Valider la Commande & Bloquer le Stock ({waQuantity * (waPackageType === 'Farine 1kg' ? 1500 : 500)} FCFA)
                  </Button>
                )}
              </div>
            )}
          </Card>

          {/* Quick Lineage Scan for Complaints */}
          <Card variant="glass" className="p-5 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-2xl bg-plantation-700 text-white flex items-center justify-center">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Remontée de Traçabilité Client (Scan QR)
                </h3>
                <p className="text-xs text-slate-500">
                  Le client ou le livreur scanne le paquet : la cause remonte jusqu'au bloc
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              Chaque produit vendu comporte un code QR cryptographique unique. En cas de réclamation ou pour inspection qualité, scanner le code révèle l'intégralité du cycle de vie du produit.
            </p>

            <div className="space-y-2 pt-2">
              <Button
                variant="primary"
                className="w-full"
                onClick={onOpenScannerModal}
                leftIcon={<QrCode className="w-4 h-4" />}
              >
                Ouvrir la Caméra pour Scanner un Paquet
              </Button>

              <div className="pt-3.5 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
                <span className="font-semibold text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                  Échantillons du stock pour test :
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    onClick={() => onScanQR('GF-LF001-B07-001')}
                    className="px-3 py-2 rounded-xl text-left hover:bg-slate-100/70 dark:hover:bg-slate-800/70 border border-slate-200/60 dark:border-slate-700/60 transition-colors flex items-center justify-between text-xs group"
                  >
                    <span className="truncate text-slate-700 dark:text-slate-300">Farine 1kg · <strong className="font-mono text-slate-900 dark:text-white">LF-001</strong></span>
                    <span className="text-[10px] font-bold text-plantation-600 dark:text-plantation-400 group-hover:translate-x-0.5 transition-transform ml-1">B07 →</span>
                  </button>
                  <button
                    onClick={() => onScanQR('GF-LC001-B03-001')}
                    className="px-3 py-2 rounded-xl text-left hover:bg-slate-100/70 dark:hover:bg-slate-800/70 border border-slate-200/60 dark:border-slate-700/60 transition-colors flex items-center justify-between text-xs group"
                  >
                    <span className="truncate text-slate-700 dark:text-slate-300">Chips 250g · <strong className="font-mono text-slate-900 dark:text-white">LC-001</strong></span>
                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 group-hover:translate-x-0.5 transition-transform ml-1">B03 →</span>
                  </button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Subtab 2: Commandes List */}
      {activeSubTab === 'commandes' && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Carnet des Commandes & Bons de Livraison ({orders.length})
          </h3>

          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800/80 shadow-sm">
            {orders.map((ord) => (
              <div
                key={ord.orderId}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-850/50 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-extrabold text-sm text-slate-900 dark:text-white whitespace-nowrap">
                      {ord.orderId}
                    </span>
                    <Badge variant="blue" size="sm">
                      {ord.deliveryNoteNumber || 'BL-N/A'}
                    </Badge>
                    <Badge variant="emerald" size="sm" dot>
                      {ord.deliveryStatus}
                    </Badge>
                  </div>
                  <h4 className="font-semibold text-xs text-slate-700 dark:text-slate-300">
                    {ord.clientName} ({ord.deliveryCity})
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {ord.orderDate} · WhatsApp: {ord.whatsappContact}
                  </p>
                  {ord.notes && <p className="text-xs text-slate-400 mt-1 italic">« {ord.notes} »</p>}
                </div>

                <div className="text-right sm:self-center shrink-0">
                  <span className="text-base font-extrabold text-slate-900 dark:text-white block tabular-nums">
                    {ord.totalAmountFcfa?.toLocaleString()} FCFA
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Lots: {ord.assignedLotIds?.join(', ') || 'N/A'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Subtab 3: Niveaux de Stocks */}
      {activeSubTab === 'stocks' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card variant="glass" className="p-5 space-y-3">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center justify-between">
              <span>Farine de Plantain 1kg</span>
              <Badge variant="emerald">{flourInStock} en stock</Badge>
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Stock disponible à la vente</span>
                <span className="font-bold">{flourInStock} sachets</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Stock réservé (Commandes confirmées)</span>
                <span className="font-bold text-amber-600">{flourReserved} sachets</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Valeur marchande unitaire</span>
                <span className="font-bold">1 500 FCFA</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Valeur totale stock Farine</span>
                <span className="font-bold text-plantation-700 dark:text-plantation-400">
                  {((flourInStock + flourReserved) * 1500).toLocaleString()} FCFA
                </span>
              </div>
            </div>
          </Card>

          <Card variant="glass" className="p-5 space-y-3">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center justify-between">
              <span>Chips de Plantain 250g</span>
              <Badge variant="amber">{chipsInStock} en stock</Badge>
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Stock disponible à la vente</span>
                <span className="font-bold">{chipsInStock} paquets</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Stock réservé</span>
                <span className="font-bold text-amber-600">{chipsReserved} paquets</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Valeur marchande unitaire</span>
                <span className="font-bold">500 FCFA</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Valeur totale stock Chips</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">
                  {((chipsInStock + chipsReserved) * 500).toLocaleString()} FCFA
                </span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Subtab 4: Réclamations Traçabilité */}
      {activeSubTab === 'reclamations' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
              Registre des Réclamations & Résolution Racine ({complaints.length})
            </h3>
            <Button size="sm" variant="glass" onClick={onOpenScannerModal} leftIcon={<QrCode className="w-3.5 h-3.5" />}>
              Scanner Nouveau QR
            </Button>
          </div>

          {complaints.length === 0 ? (
            <Card variant="subtle" className="text-center p-8 text-xs text-slate-500">
              Aucune réclamation enregistrée. Tous les lots livrés sont conformes aux normes sanitaires.
            </Card>
          ) : (
            <div className="space-y-3">
              {complaints.map((c) => (
                <div
                  key={c.complaintId}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-red-200/60 dark:border-red-950/60 shadow-subtle-card space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-red-600 dark:text-red-400">
                        {c.complaintId}
                      </span>
                      <span className="text-xs font-mono text-slate-500">{c.qrCodeHash}</span>
                    </div>
                    <Badge variant={c.resolvedBlocId ? 'purple' : 'slate'} size="sm">
                      {c.resolvedBlocId ? `Racine: Bloc ${c.resolvedBlocId}` : 'En cours d\'analyse'}
                    </Badge>
                  </div>

                  <p className="text-xs text-slate-800 dark:text-slate-200 font-medium">
                    « {c.issueDescription} »
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span>Signalé le {new Date(c.createdAt).toLocaleDateString('fr-FR')}</span>
                    {c.clientContact && <span>Client: {c.clientContact}</span>}
                    <button
                      onClick={() => onScanQR(c.qrCodeHash)}
                      className="text-plantation-700 dark:text-plantation-400 font-bold hover:underline"
                    >
                      Revoir la généalogie complète →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
