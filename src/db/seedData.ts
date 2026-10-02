import type { Bloc, Harvest, ExternalSupplier, ProcessingLot, InventoryItem, Client, Order, EnergyLog } from '../types';

// Coordinates centered around Bertoua / East Cameroon agricultural belt
const BASE_LAT = 4.578;
const BASE_LNG = 13.684;

export const INITIAL_BLOCS: Bloc[] = Array.from({ length: 16 }, (_, i) => {
  const num = (i + 1).toString().padStart(2, '0');
  const id = `B${num}`;
  const row = Math.floor(i / 4);
  const col = i % 4;
  const lat = BASE_LAT + row * 0.0035;
  const lng = BASE_LNG + col * 0.0045;

  const varieties = ['Plantain Bâtard', 'French Sombre', 'Big Ebanga', 'Essong'];
  const variety = varieties[i % varieties.length];

  const statuses: Array<Bloc['status']> = [
    'EN_RECOLTE',
    'RECOLTE_IMMINENTE',
    'FLORAISON',
    'CROISSANCE',
    'CROISSANCE',
    'FLORAISON',
    'EN_RECOLTE', // B07: active lot LF-001
    'CROISSANCE',
    'RECOLTE_IMMINENTE',
    'CROISSANCE',
    'FLORAISON',
    'REPOS',
    'CROISSANCE',
    'CROISSANCE',
    'FLORAISON',
    'RECOLTE_IMMINENTE',
  ];

  return {
    id,
    name: `Bloc ${num} - Parcelle ${variety}`,
    surfaceHa: 1.25,
    plantationDate: '2025-04-15',
    fertilizerDate: '2026-08-20',
    plantCount: 1500,
    variety,
    expectedHarvestDate: i === 6 ? '2026-11-05' : '2026-12-10',
    status: statuses[i],
    geoCoordinates: {
      center: { lat, lng, label: `Bloc ${num}` },
      polygon: [
        { lat: lat - 0.0012, lng: lng - 0.0015 },
        { lat: lat + 0.0012, lng: lng - 0.0015 },
        { lat: lat + 0.0012, lng: lng + 0.0015 },
        { lat: lat - 0.0012, lng: lng + 0.0015 },
      ]
    },
    notes: i === 6 ? 'Bloc de référence haute vigueur. Utilisé pour le lot pilote LF-001.' : undefined
  };
});

export const INITIAL_SUPPLIERS: ExternalSupplier[] = [
  {
    supplierId: 'SUP-01',
    name: 'Coopérative Agro-Forestière du Lom (Bertoua)',
    phone: '+237 677 441 200',
    region: 'Lom-et-Djerem',
    volumeKg: 3200,
    pricePerKg: 180,
    externalLotId: 'EXT-LOM-2026-08',
    createdAt: '2026-11-02'
  },
  {
    supplierId: 'SUP-02',
    name: 'GIC Planteurs Unis de Belabo',
    phone: '+237 699 883 145',
    region: 'Belabo',
    volumeKg: 1850,
    pricePerKg: 175,
    externalLotId: 'EXT-BEL-2026-14',
    createdAt: '2026-11-04'
  }
];

export const INITIAL_HARVESTS: Harvest[] = [
  {
    harvestId: 'R-001',
    blocId: 'B07',
    bunchCount: 120,
    totalWeightKg: 1440,
    fieldToFactoryLossKg: 14.5,
    harvestDate: '2026-11-04',
    operatorId: 'M. Jean-Paul Mbarga (Chef d\'équipe)',
    destinationLotId: 'LF-001',
    syncStatus: 'SYNCED',
    createdAt: Date.now() - 3 * 86400000
  },
  {
    harvestId: 'R-002',
    blocId: 'B03',
    bunchCount: 95,
    totalWeightKg: 1180,
    fieldToFactoryLossKg: 11.2,
    harvestDate: '2026-11-05',
    operatorId: 'M. Fabrice Ondoa',
    destinationLotId: 'LC-001',
    syncStatus: 'SYNCED',
    createdAt: Date.now() - 2 * 86400000
  },
  {
    harvestId: 'R-003',
    blocId: 'B01',
    bunchCount: 110,
    totalWeightKg: 1320,
    fieldToFactoryLossKg: 13.0,
    harvestDate: '2026-11-06',
    operatorId: 'M. Jean-Paul Mbarga',
    syncStatus: 'SYNCED',
    createdAt: Date.now() - 1 * 86400000
  }
];

export const INITIAL_LOTS: ProcessingLot[] = [
  {
    lotId: 'LF-001',
    type: 'FLOUR',
    sourceHarvestId: 'R-001',
    sourceBlocId: 'B07',
    inputWeightKg: 1440,
    peelWasteKg: 504,
    finalYieldKg: 288,
    yieldRatioPercent: 20.0,
    machineHours: 6.5,
    humidityPercent: 10.4,
    qcStatus: 'APPROVED',
    qcNotes: 'Farine fine, odeur douce, tamisage 120 mesh validé. Humidité 10.4% optimale.',
    qcPassedBy: 'Dr. Suzanne Kamga (Responsable Qualité)',
    packagingCount: 288,
    packageFormat: 'Farine 1kg',
    createdAt: '2026-11-05 14:30'
  },
  {
    lotId: 'LC-001',
    type: 'CHIPS',
    sourceHarvestId: 'R-002',
    sourceBlocId: 'B03',
    inputWeightKg: 1180,
    peelWasteKg: 413,
    finalYieldKg: 295,
    yieldRatioPercent: 25.0,
    machineHours: 4.8,
    oilTemp: 176.5,
    oilVolumeLiters: 42,
    qcStatus: 'APPROVED',
    qcNotes: 'Croustillance homogène, faible taux de brisures, friture à 176.5°C.',
    qcPassedBy: 'Dr. Suzanne Kamga',
    packagingCount: 1180,
    packageFormat: 'Chips 250g',
    createdAt: '2026-11-06 16:15'
  }
];

export const INITIAL_INVENTORY: InventoryItem[] = [
  ...Array.from({ length: 40 }, (_, idx) => {
    const seq = (idx + 1).toString().padStart(3, '0');
    return {
      productId: `PROD-LF001-${seq}`,
      lotId: 'LF-001',
      packageType: 'Farine 1kg',
      qrCodeHash: `GF-LF001-B07-${seq}`,
      stockStatus: (idx < 25 ? 'IN_STOCK' : idx < 35 ? 'RESERVED' : 'SOLD') as InventoryItem['stockStatus'],
      unitWeightKg: 1.0,
      unitPriceFcfa: 1500,
      reservedForOrderId: idx >= 25 && idx < 35 ? 'CMD-2026-042' : undefined,
      createdAt: '2026-11-05'
    };
  }),
  ...Array.from({ length: 50 }, (_, idx) => {
    const seq = (idx + 1).toString().padStart(3, '0');
    return {
      productId: `PROD-LC001-${seq}`,
      lotId: 'LC-001',
      packageType: 'Chips 250g',
      qrCodeHash: `GF-LC001-B03-${seq}`,
      stockStatus: (idx < 40 ? 'IN_STOCK' : 'RESERVED') as InventoryItem['stockStatus'],
      unitWeightKg: 0.25,
      unitPriceFcfa: 500,
      createdAt: '2026-11-06'
    };
  })
];

export const INITIAL_CLIENTS: Client[] = [
  {
    clientId: 'CLI-01',
    name: 'Supermarchés DOVV (Yaoundé Bastos)',
    category: 'SUPERMARCHE',
    city: 'Yaoundé',
    whatsappContact: '+237 699 234 501',
    creditBalanceFcfa: 450000
  },
  {
    clientId: 'CLI-02',
    name: 'Boulangerie Pâtisserie Acropole (Douala Bonanjo)',
    category: 'BOULANGERIE',
    city: 'Douala',
    whatsappContact: '+237 677 812 390',
    creditBalanceFcfa: 0
  },
  {
    clientId: 'CLI-03',
    name: 'Éco-Comptoir Gourmand (Bertoua Centre)',
    category: 'BOUTIQUE',
    city: 'Bertoua',
    whatsappContact: '+237 655 109 844',
    creditBalanceFcfa: 0
  }
];

export const INITIAL_ORDERS: Order[] = [
  {
    orderId: 'CMD-2026-042',
    clientId: 'CLI-01',
    clientName: 'Supermarchés DOVV (Yaoundé Bastos)',
    whatsappContact: '+237 699 234 501',
    orderDate: '2026-11-06 09:15',
    deliveryStatus: 'CONFIRMED',
    deliveryNoteNumber: 'BL-001',
    assignedLotIds: ['LF-001'],
    totalAmountFcfa: 150000,
    deliveryCity: 'Yaoundé',
    notes: 'Tournée hebdomadaire vendredi matin.',
    requestedItems: [
      {
        packageType: 'Farine 1kg',
        quantity: 100,
        unitPriceFcfa: 1500,
        allocatedProductIds: ['PROD-LF001-026', 'PROD-LF001-027']
      }
    ]
  }
];

export const INITIAL_ENERGY: EnergyLog[] = [
  { id: 'NRG-01', date: '2026-11-04', gridKWh: 82, biogasKWh: 15.5, peelWasteInputKg: 504, biogasPercentage: 15.9 },
  { id: 'NRG-02', date: '2026-11-05', gridKWh: 78, biogasKWh: 14.8, peelWasteInputKg: 413, biogasPercentage: 15.9 },
  { id: 'NRG-03', date: '2026-11-06', gridKWh: 80, biogasKWh: 16.0, peelWasteInputKg: 460, biogasPercentage: 16.6 }
];
