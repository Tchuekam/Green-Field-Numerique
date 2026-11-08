// ============================================================================
// GREENFIELD TRACEABILITY & MANAGEMENT DOMAIN TYPES
// ============================================================================

export type UserRole = 'EXPERT_AGRICOLE' | 'RESPONSABLE_USINE' | 'PORTEUR_PROJET';

export type ProductType = 'FLOUR' | 'CHIPS';

export type QCStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'QUARANTINED';

export type StockStatus = 'IN_STOCK' | 'RESERVED' | 'DISPATCHED' | 'SOLD' | 'DAMAGED';

export type OrderStatus = 'PENDING_STOCK_CHECK' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

export type SyncState = 'SYNCED' | 'PENDING_SYNC' | 'CONFLICT';

export interface GeoCoordinate {
  lat: number;
  lng: number;
  label?: string;
}

export interface Bloc {
  id: string; // 'B01' - 'B16'
  name: string;
  surfaceHa: number;
  plantationDate: string; // YYYY-MM-DD
  fertilizerDate: string; // YYYY-MM-DD
  plantCount: number;
  variety: string; // e.g. "Plantain Batard", "French Sombre", "Big Ebanga"
  expectedHarvestDate: string;
  geoCoordinates: {
    center: GeoCoordinate;
    polygon?: GeoCoordinate[];
  };
  notes?: string;
  status: 'CROISSANCE' | 'FLORAISON' | 'RECOLTE_IMMINENTE' | 'EN_RECOLTE' | 'REPOS';
}

export interface SanitaryLog {
  id: string;
  blocId: string; // 'B01' - 'B16'
  date: string;
  stage: 'VEGETATIF' | 'FLORAISON' | 'FRUCTIFICATION' | 'MATURITE';
  observation: string;
  severity: 'NORMAL' | 'ATTENTION' | 'ALERTE_MALADIE';
  actionTaken?: string;
  photoUrl?: string;
  loggedBy: string;
  syncStatus: SyncState;
  createdAt: number;
}

export interface Harvest {
  harvestId: string; // 'R-001', 'R-002'...
  blocId?: string; // B01-B16 (if internal)
  supplierId?: string; // If external partner
  supplierName?: string;
  bunchCount: number;
  totalWeightKg: number;
  fieldToFactoryLossKg: number; // e.g. 15 kg loss over 3km transport
  harvestDate: string;
  operatorId: string;
  destinationLotId?: string;
  syncStatus: SyncState;
  createdAt: number;
}

export interface ExternalSupplier {
  supplierId: string;
  name: string;
  phone: string;
  region: string;
  volumeKg: number;
  pricePerKg: number; // FCFA
  externalLotId: string;
  createdAt: string;
}

export interface ProcessingLot {
  lotId: string; // 'LF-001' (Farine) or 'LC-001' (Chips)
  type: ProductType;
  sourceHarvestId: string;
  sourceBlocId?: string;
  sourceSupplierName?: string;
  inputWeightKg: number; // Raw plantain entered
  peelWasteKg: number; // Weight sent to biogas digester
  finalYieldKg: number; // Final product kg
  yieldRatioPercent: number; // Actual yield vs target (Farine target ~20%, Chips ~25%)
  machineHours: number;
  oilTemp?: number; // Chips: e.g. 175°C
  oilVolumeLiters?: number; // Chips
  humidityPercent?: number; // Flour: target < 12%
  qcStatus: QCStatus;
  qcNotes?: string;
  qcPassedBy?: string;
  packagingCount: number; // e.g. 288 sachets of 1kg
  packageFormat: string; // '1kg', '500g', '250g'
  createdAt: string;
}

export interface InventoryItem {
  productId: string;
  lotId: string;
  packageType: string; // "Farine 1kg", "Chips 250g", etc.
  qrCodeHash: string;
  stockStatus: StockStatus;
  unitWeightKg: number;
  unitPriceFcfa: number;
  reservedForOrderId?: string;
  createdAt: string;
}

export interface Client {
  clientId: string;
  name: string;
  category: 'SUPERMARCHE' | 'BOULANGERIE' | 'BOUTIQUE' | 'PARTICULIER';
  city: string; // Bertoua, Yaoundé, Douala
  whatsappContact: string;
  creditBalanceFcfa: number;
}

export interface OrderItem {
  packageType: string;
  quantity: number;
  unitPriceFcfa: number;
  allocatedProductIds: string[];
}

export interface Order {
  orderId: string; // e.g. "CMD-2026-042"
  clientId: string;
  clientName: string;
  whatsappContact: string;
  orderDate: string;
  requestedItems: OrderItem[];
  deliveryStatus: OrderStatus;
  deliveryNoteNumber?: string; // "BL-001"
  assignedLotIds: string[];
  totalAmountFcfa: number;
  deliveryCity: string;
  notes?: string;
}

export interface Complaint {
  complaintId: string;
  qrCodeHash: string;
  clientContact?: string;
  clientName?: string;
  issueDescription: string;
  status: 'NOUVEAU' | 'EN_COURS' | 'TRAITE' | 'REJETE';
  resolvedBlocId?: string;
  resolvedHarvestId?: string;
  resolvedLotId?: string;
  createdAt: string;
  resolutionNotes?: string;
}

export interface EnergyLog {
  id: string;
  date: string;
  gridKWh: number;
  biogasKWh: number;
  peelWasteInputKg: number;
  biogasPercentage: number; // Target: 15%
}

export interface PendingSyncItem {
  id: string;
  entityType: 'SANITARY_LOG' | 'HARVEST' | 'LOT' | 'ORDER' | 'COMPLAINT';
  action: 'CREATE' | 'UPDATE';
  payload: any;
  timestamp: number;
}

