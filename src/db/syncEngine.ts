import { useState, useEffect, useCallback } from 'react';
import { db } from './index';

export interface SyncEngineStatus {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncTime: string | null;
  syncError: string | null;
}

export function useSyncEngine() {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(
    localStorage.getItem('gf_last_sync_time') || '2026-11-07 18:30'
  );
  const [syncError, setSyncError] = useState<string | null>(null);

  // Refresh pending count
  const refreshPendingCount = useCallback(async () => {
    try {
      const count = await db.pendingSync.count();
      setPendingCount(count);
    } catch {
      // Ignore initial race
    }
  }, []);

  useEffect(() => {
    refreshPendingCount();

    const handleOnline = () => {
      setIsOnline(true);
      // Auto-trigger sync when returning online
      triggerSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Periodic check
    const interval = setInterval(refreshPendingCount, 5000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [refreshPendingCount]);

  // Synchronize queued mutations with central backend
  const triggerSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    setSyncError(null);

    try {
      const queue = await db.pendingSync.toArray();

      if (queue.length > 0) {
        // Simulate robust HTTPS upload to Supabase / Central Node.js API
        await new Promise((resolve) => setTimeout(resolve, 800));

        // Mark items as synced
        await db.transaction('rw', [db.sanitaryLogs, db.harvests, db.lots, db.orders, db.pendingSync], async () => {
          for (const item of queue) {
            if (item.entityType === 'SANITARY_LOG') {
              await db.sanitaryLogs.update(item.payload.id, { syncStatus: 'SYNCED' });
            } else if (item.entityType === 'HARVEST') {
              await db.harvests.update(item.payload.harvestId, { syncStatus: 'SYNCED' });
            }
          }
          await db.pendingSync.clear();
        });
      }

      const nowStr = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setLastSyncTime(nowStr);
      localStorage.setItem('gf_last_sync_time', nowStr);
      setPendingCount(0);
    } catch (err: any) {
      console.error('[SyncEngine] Synchronization failure:', err);
      setSyncError('Erreur de transmission réseau. Les données restent sécurisées en local.');
    } finally {
      setIsSyncing(false);
    }
  };

  // Allow manual toggle for demonstration of field conditions (e.g. inside plantation without 4G)
  const toggleSimulatedOffline = () => {
    setIsOnline((prev) => !prev);
  };

  return {
    isOnline,
    isSyncing,
    pendingCount,
    lastSyncTime,
    syncError,
    triggerSync,
    refreshPendingCount,
    toggleSimulatedOffline
  };
}

// Global enqueue helper for offline mutation logging
export async function enqueueOfflineMutation(
  entityType: 'SANITARY_LOG' | 'HARVEST' | 'LOT' | 'ORDER' | 'COMPLAINT',
  action: 'CREATE' | 'UPDATE',
  payload: any
) {
  const item = {
    id: `sync_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    entityType,
    action,
    payload,
    timestamp: Date.now()
  };

  await db.pendingSync.add(item);
}

