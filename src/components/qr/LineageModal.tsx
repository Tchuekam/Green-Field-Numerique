import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { db } from '../../db';
import { enqueueOfflineMutation } from '../../db/syncEngine';
import {
  Package,
  Factory,
  Sprout,
  Flame,
  Droplets,
  AlertTriangle,
  CheckCircle2,
  MapPin,
  MessageSquareWarning,
  Send
} from 'lucide-react';

interface LineageModalProps {
  isOpen: boolean;
  onClose: () => void;
  lineageData: any | null;
  onComplaintCreated?: () => void;
}

export const LineageModal: React.FC<LineageModalProps> = ({
  isOpen,
  onClose,
  lineageData,
  onComplaintCreated
}) => {
  const [complaintText, setComplaintText] = useState('');
  const [clientContact, setClientContact] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [complaintSuccess, setComplaintSuccess] = useState(false);

  if (!lineageData) return null;

  const { package: pkg, lot, harvest, origin } = lineageData;
  const isInternal = origin?.isInternal;
  const bloc = origin?.bloc;
  const supplier = origin?.supplier;

  // Anomaly checks
  const anomalies: string[] = [];
  if (lot.type === 'CHIPS' && lot.oilTemp && (lot.oilTemp < 165 || lot.oilTemp > 185)) {
    anomalies.push(`Température d'huile hors plage optimale (${lot.oilTemp}°C, cible: 170-180°C)`);
  }
  if (lot.type === 'FLOUR' && lot.humidityPercent && lot.humidityPercent > 12.0) {
    anomalies.push(`Humidité de farine élevée (${lot.humidityPercent}%, seuil max: 12.0%)`);
  }
  if (lot.peelWasteKg && lot.inputWeightKg) {
    const peelRatio = (lot.peelWasteKg / lot.inputWeightKg) * 100;
    if (peelRatio > 38) {
      anomalies.push(`Taux d'épluchures supérieur à la moyenne (${peelRatio.toFixed(1)}%, référence: 35%)`);
    }
  }

  const handleRegisterComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaintText.trim()) return;

    setIsSubmitting(true);
    try {
      const complaintId = `REC-${Date.now().toString().slice(-6)}`;
      const newComplaint = {
        complaintId,
        qrCodeHash: pkg?.qrCodeHash || lot.lotId,
        clientContact: clientContact.trim() || undefined,
        issueDescription: complaintText.trim(),
        status: 'EN_COURS' as const,
        resolvedBlocId: bloc?.id,
        resolvedLotId: lot.lotId,
        resolvedHarvestId: harvest?.harvestId,
        createdAt: new Date().toISOString()
      };

      await db.complaints.add(newComplaint);
      await enqueueOfflineMutation('COMPLAINT', 'CREATE', newComplaint);

      setComplaintSuccess(true);
      setComplaintText('');
      setClientContact('');
      if (onComplaintCreated) onComplaintCreated();
    } catch (err) {
      console.error('Failed to log complaint:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Traçabilité Complète du Produit"
      subtitle={`Code QR: ${pkg?.qrCodeHash || lot.lotId} · Fil conducteur de bout en bout`}
      maxWidth="xl"
    >
      <div className="space-y-6">
        {/* Step 1: Packaged SKU (Commercialization) */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-plantation-100 dark:bg-plantation-950 text-plantation-700 dark:text-plantation-300">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {pkg ? pkg.packageType : `Lot ${lot.lotId}`}
                </h4>
                <p className="text-xs text-slate-500 font-mono">
                  Hash: {pkg?.qrCodeHash || lot.lotId}
                </p>
              </div>
            </div>
            <Badge variant={pkg?.stockStatus === 'IN_STOCK' ? 'emerald' : 'amber'} dot>
              {pkg ? pkg.stockStatus : lot.qcStatus}
            </Badge>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Poids Unitaire</span>
              <span className="font-semibold">{pkg?.unitWeightKg || (lot.type === 'FLOUR' ? '1.0' : '0.25')} kg</span>
            </div>
            <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Format</span>
              <span className="font-semibold">{pkg?.packageType || lot.packageFormat}</span>
            </div>
            <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Prix Unitaire</span>
              <span className="font-semibold">{pkg?.unitPriceFcfa || (lot.type === 'FLOUR' ? '1 500' : '500')} FCFA</span>
            </div>
            <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Date Création</span>
              <span className="font-semibold">{pkg?.createdAt || lot.createdAt.split(' ')[0]}</span>
            </div>
          </div>
        </div>

        {/* Step 2: Transformation Lot (Factory) */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 relative">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                <Factory className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Lot de Transformation {lot.lotId} ({lot.type === 'FLOUR' ? 'Ligne Farine' : 'Ligne Chips'})
                </h4>
                <p className="text-xs text-slate-500">
                  Fabriqué le {lot.createdAt} · Contrôle qualité: {lot.qcStatus}
                </p>
              </div>
            </div>
            <Badge variant="blue">{lot.qcStatus}</Badge>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs mb-3">
            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Plantain Entré</span>
              <span className="font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                {lot.inputWeightKg.toLocaleString()} kg
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Rendement Obtenu</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                {lot.finalYieldKg} kg ({lot.yieldRatioPercent}%)
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Épluchures (Biogaz)</span>
              <span className="font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                {lot.peelWasteKg} kg envoyé au digesteur
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Heures Machine</span>
              <span className="font-bold tabular-nums">{lot.machineHours} h</span>
            </div>
            {lot.type === 'CHIPS' && (
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase font-bold flex items-center gap-1">
                  <Flame className="w-3 h-3 text-red-500" /> Huile & Température
                </span>
                <span className="font-bold tabular-nums">{lot.oilTemp}°C ({lot.oilVolumeLiters}L)</span>
              </div>
            )}
            {lot.type === 'FLOUR' && (
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase font-bold flex items-center gap-1">
                  <Droplets className="w-3 h-3 text-blue-500" /> Humidité Mesurée
                </span>
                <span className="font-bold tabular-nums">{lot.humidityPercent}% (Norme &lt; 12%)</span>
              </div>
            )}
            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Nombre de Paquets</span>
              <span className="font-bold tabular-nums">{lot.packagingCount} {lot.packageFormat}</span>
            </div>
          </div>

          {lot.qcNotes && (
            <p className="text-xs text-slate-600 dark:text-slate-300 italic bg-white/70 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-200/50 dark:border-slate-800">
              « {lot.qcNotes} » — Validé par {lot.qcPassedBy || 'Service Qualité'}
            </p>
          )}
        </div>

        {/* Step 3: Harvest & Origin Bloc */}
        <div className="p-4 rounded-2xl bg-plantation-50/60 dark:bg-plantation-950/40 border border-plantation-200/80 dark:border-plantation-800/80">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-plantation-700 text-white">
                <Sprout className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {isInternal ? `Parcelle d'Origine : Bloc ${bloc?.id}` : `Approvisionnement Partenaire : ${supplier?.name}`}
                </h4>
                <p className="text-xs text-plantation-700 dark:text-plantation-300">
                  Récolte #{harvest?.harvestId || 'N/A'} · Coupé le {harvest?.harvestDate || '2026-11-04'}
                </p>
              </div>
            </div>
            <Badge variant="emerald">{isInternal ? 'Culture GreenField 100%' : 'Partenaire Certifié'}</Badge>
          </div>

          {harvest && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs mb-3">
              <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-plantation-200/60 dark:border-plantation-900">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Nombre de Régimes</span>
                <span className="font-bold tabular-nums">{harvest.bunchCount} régimes</span>
              </div>
              <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-plantation-200/60 dark:border-plantation-900">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Poids Récolté</span>
                <span className="font-bold tabular-nums">{harvest.totalWeightKg.toLocaleString()} kg</span>
              </div>
              <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-plantation-200/60 dark:border-plantation-900">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Pertes Transport 3km</span>
                <span className="font-bold text-amber-600 tabular-nums">{harvest.fieldToFactoryLossKg} kg</span>
              </div>
              <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-plantation-200/60 dark:border-plantation-900">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Opérateur Récolte</span>
                <span className="font-semibold truncate">{harvest.operatorId}</span>
              </div>
            </div>
          )}

          {isInternal && bloc && (
            <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-plantation-200/60 dark:border-plantation-900 space-y-2 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {bloc.name} ({bloc.variety})
                </span>
                <span className="flex items-center gap-1 text-slate-500 font-mono text-[11px]">
                  <MapPin className="w-3 h-3 text-plantation-600" />
                  {bloc.geoCoordinates.center.lat.toFixed(4)}°N, {bloc.geoCoordinates.center.lng.toFixed(4)}°E
                </span>
              </div>

              <div className="flex flex-wrap gap-4 text-[11px] text-slate-600 dark:text-slate-400">
                <span>🌱 Plantation : <strong>{bloc.plantationDate}</strong></span>
                <span>🧪 Dernière fertilisation : <strong>{bloc.fertilizerDate}</strong></span>
                <span>🌿 Végétation : <strong>{bloc.plantCount} plants</strong></span>
              </div>

              {origin.sanitaryObservations?.length > 0 && (
                <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                    Dernières observations sanitaires :
                  </p>
                  <p className="text-xs text-slate-700 dark:text-slate-300 mt-1 italic">
                    « {origin.sanitaryObservations[0].observation} » ({origin.sanitaryObservations[0].loggedBy})
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Audit Alerts */}
        {anomalies.length > 0 && (
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-300">
              <AlertTriangle className="w-4 h-4" />
              <span>Points d'attention qualité détectés pour ce lot :</span>
            </div>
            <ul className="text-xs text-amber-700 dark:text-amber-300 list-disc list-inside space-y-0.5">
              {anomalies.map((ano, i) => (
                <li key={i}>{ano}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Complaint Logging Form */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquareWarning className="w-4 h-4 text-red-600" />
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Signaler une Réclamation Client sur ce Produit
            </h5>
          </div>
          <p className="text-xs text-slate-500 mb-3">
            Tout signalement relie immédiatement le problème client au Bloc {bloc?.id || 'd\'origine'} et à la récolte #{harvest?.harvestId || 'N/A'}.
          </p>

          {complaintSuccess ? (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Réclamation enregistrée avec succès et rattachée à l'historique du Bloc {bloc?.id} !</span>
            </div>
          ) : (
            <form onSubmit={handleRegisterComplaint} className="space-y-3">
              <Input
                label="Contact WhatsApp du Client (Optionnel)"
                placeholder="Ex: +237 699 123 456"
                value={clientContact}
                onChange={(e) => setClientContact(e.target.value)}
              />
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Description de l'incident constaté *
                </label>
                <textarea
                  required
                  rows={2}
                  className="w-full rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-3 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-plantation-500/20"
                  placeholder="Ex: Humidité résiduelle perçue au déballage du sachet, odeur inhabituelle..."
                  value={complaintText}
                  onChange={(e) => setComplaintText(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="submit"
                  size="sm"
                  variant="destructive"
                  isLoading={isSubmitting}
                  leftIcon={<Send className="w-3.5 h-3.5" />}
                >
                  Enregistrer la réclamation & Alerte Bloc
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </Modal>
  );
};
