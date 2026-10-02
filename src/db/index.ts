import Dexie, { type Table } from 'dexie';
import type {
  Bloc,
  SanitaryLog,
  Harvest,
  ExternalSupplier,
  ProcessingLot,
  InventoryItem,
  Client,
  Order,
  Complaint,
  EnergyLog,
  PendingSyncItem
} from '../types';
import {
  INITIAL_BLOCS,
  INITIAL_SUPPLIERS,
  INITIAL_HARVESTS,
  INITIAL_LOTS,
  INITIAL_INVENTORY,
  INITIAL_CLIENTS,
  INITIAL_ORDERS,
  INITIAL_ENERGY
} from './seedData';

export class GreenfieldDatabase extends Dexie {
  blocs!: Table<Bloc, string>;
  sanitaryLogs!: Table<SanitaryLog, string>;
  harvests!: Table<Harvest, string>;
  suppliers!: Table<ExternalSupplier, string>;
  lots!: Table<ProcessingLot, string>;
  inventory!: Table<InventoryItem, string>;
  clients!: Table<Client, string>;
  orders!: Table<Order, string>;
  complaints!: Table<Complaint, string>;
  energyLogs!: Table<EnergyLog, string>;
  pendingSync!: Table<PendingSyncItem, string>;

  constructor() {
    super('GreenfieldDB');

    // Version 1 (legacy schema)
    this.version(1).stores({
      blocs: 'id, status, plantationDate',
      sanitaryLogs: 'id, blocId, date, severity, syncStatus',
      harvests: 'harvestId, blocId, supplierId, harvestDate, syncStatus',
      suppliers: 'supplierId, name',
      lots: 'lotId, type, sourceHarvestId, qcStatus',
      inventory: 'productId, lotId, qrCodeHash, stockStatus, packageType',
      clients: 'clientId, whatsappContact, name',
      orders: 'orderId, clientId, deliveryStatus, orderDate',
      complaints: 'complaintId, qrCodeHash, resolvedBlocId, status',
      energyLogs: 'id, date',
      pendingSync: 'id, entityType, timestamp'
    });

    // Version 2 (includes createdAt indexes and performance enhancements)
    this.version(2).stores({
      blocs: 'id, status, plantationDate',
      sanitaryLogs: 'id, blocId, date, severity, syncStatus, createdAt',
      harvests: 'harvestId, blocId, supplierId, harvestDate, syncStatus, createdAt',
      suppliers: 'supplierId, name',
      lots: 'lotId, type, sourceHarvestId, qcStatus, createdAt',
      inventory: 'productId, lotId, qrCodeHash, stockStatus, packageType, createdAt',
      clients: 'clientId, whatsappContact, name',
      orders: 'orderId, clientId, deliveryStatus, orderDate',
      complaints: 'complaintId, qrCodeHash, resolvedBlocId, status, createdAt',
      energyLogs: 'id, date',
      pendingSync: 'id, entityType, timestamp'
    });
  }

  async seedIfEmpty() {
    try {
      const blocCount = await this.blocs.count();
      if (blocCount === 0) {
        console.log('[GreenField DB] Seeding initial plantation, factory & commerce records...');
        await this.blocs.bulkPut(INITIAL_BLOCS);
        await this.suppliers.bulkPut(INITIAL_SUPPLIERS);
        await this.harvests.bulkPut(INITIAL_HARVESTS);
        await this.lots.bulkPut(INITIAL_LOTS);
        await this.inventory.bulkPut(INITIAL_INVENTORY);
        await this.clients.bulkPut(INITIAL_CLIENTS);
        await this.orders.bulkPut(INITIAL_ORDERS);
        await this.energyLogs.bulkPut(INITIAL_ENERGY);

        // Seed initial sanitary log
        await this.sanitaryLogs.put({
          id: 'SAN-B07-01',
          blocId: 'B07',
          date: '2026-11-03',
          stage: 'MATURITE',
          observation: 'Excellente vigueur foliaire, aucun symptôme de cercosporiose noire. Régimes bien calibrés (12-14 mains).',
          severity: 'NORMAL',
          loggedBy: 'Dr. Mbarga (Ingénieur Agronome)',
          syncStatus: 'SYNCED',
          createdAt: Date.now() - 4 * 86400000
        });
      }
    } catch (err) {
      console.warn('[GreenField DB] Seed warning:', err);
    }
  }

  // --------------------------------------------------------------------------
  // TRACEABILITY RESOLVER ENGINE (QR Hash -> Lineage)
  // --------------------------------------------------------------------------
  async resolveTraceabilityByHash(qrHash: string) {
    const cleanHash = qrHash.trim();
    const inventoryItem = await this.inventory.where('qrCodeHash').equals(cleanHash).first();

    if (!inventoryItem) {
      const lotDirect = await this.lots.where('lotId').equals(cleanHash).first();
      if (lotDirect) {
        return this.buildLineageFromLot(lotDirect, null);
      }
      return null;
    }

    const lot = await this.lots.get(inventoryItem.lotId);
    if (!lot) return null;

    return this.buildLineageFromLot(lot, inventoryItem);
  }

  private async buildLineageFromLot(lot: ProcessingLot, inventoryItem: InventoryItem | null) {
    const harvest = await this.harvests.get(lot.sourceHarvestId);
    let bloc: Bloc | undefined = undefined;
    let supplier: ExternalSupplier | undefined = undefined;
    let sanitaryObservations: SanitaryLog[] = [];

    if (harvest) {
      if (harvest.blocId) {
        bloc = await this.blocs.get(harvest.blocId);
        if (bloc) {
          sanitaryObservations = await this.sanitaryLogs.where('blocId').equals(bloc.id).toArray();
        }
      } else if (harvest.supplierId) {
        supplier = await this.suppliers.get(harvest.supplierId);
      }
    }

    return {
      package: inventoryItem,
      lot,
      harvest: harvest || null,
      origin: {
        isInternal: Boolean(bloc),
        bloc: bloc || null,
        supplier: supplier || null,
        sanitaryObservations
      }
    };
  }
}

export const db = new GreenfieldDatabase();
db.seedIfEmpty().catch((err) => console.error('[GreenField DB] Init failed:', err));
