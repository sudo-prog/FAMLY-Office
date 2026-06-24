import { useState, useEffect, useCallback } from 'react';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    function handleOnline() { setIsOnline(true); }
    function handleOffline() { setIsOnline(false); }
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

export function useOfflineSync() {
  const [queueCount, setQueueCount] = useState(0);
  const isOnline = useOnlineStatus();

  const enqueue = useCallback(async function(method: string, url: string, body: any) {
    const db = await openSyncDB();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction('syncQueue', 'readwrite');
      const store = tx.objectStore('syncQueue');
      store.add({ method, url, body, timestamp: Date.now(), synced: false });
      tx.oncomplete = () => { setQueueCount(c => c + 1); resolve(); };
      tx.onerror = () => reject(tx.error);
    });
  }, []);

  const flushQueue = useCallback(async function() {
    if (!isOnline) return;
    const db = await openSyncDB();
    const tx = db.transaction('syncQueue', 'readonly');
    const store = tx.objectStore('syncQueue');
    const req = store.getAll();

    return new Promise<void>((resolve) => {
      req.onsuccess = async () => {
        const items = req.result.filter((item: any) => !item.synced);
        for (const item of items) {
          try {
            await fetch(item.url, {
              method: item.method,
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(item.body),
            });
            const writeTx = db.transaction('syncQueue', 'readwrite');
            const writeStore = writeTx.objectStore('syncQueue');
            writeStore.put({ ...item, synced: true });
          } catch { break; }
        }
        setQueueCount(0);
        resolve();
      };
      req.onerror = () => resolve();
    });
  }, [isOnline]);

  useEffect(() => {
    if (isOnline && queueCount > 0) {
      flushQueue();
    }
  }, [isOnline, queueCount > 0, flushQueue]);

  return { enqueue, flushQueue, queueCount, isOnline };
}

function openSyncDB() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open('family-office-db', 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('offlineData')) {
        db.createObjectStore('offlineData', { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains('syncQueue')) {
        db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
