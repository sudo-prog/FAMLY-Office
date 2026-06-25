const CACHE_NAME = 'family-office-v2';
const STATIC_CACHE = 'fo-static-v2';
const API_CACHE = 'fo-api-v2';
const INDEXED_DB_NAME = 'family-office-db';
const INDEXED_DB_VERSION = 1;

// Install: pre-cache essential static assets
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(function(cache) {
      return cache.addAll([
        '/',
        '/index.html',
        '/manifest.webmanifest',
        '/favicon.svg',
      ]);
    }).then(function() { return self.skipWaiting(); })
  );
});

// Activate: clean old caches
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys
          .filter(function(k) { return !k.endsWith('v2'); })
          .map(function(k) { return caches.delete(k); })
      );
    }).then(function() { return self.clients.claim(); })
  );
});

// IndexedDB helpers for offline data storage
function openDB() {
  return new Promise(function(resolve, reject) {
    var req = indexedDB.open(INDEXED_DB_NAME, INDEXED_DB_VERSION);
    req.onupgradeneeded = function() {
      var db = req.result;
      if (!db.objectStoreNames.contains('offlineData')) {
        db.createObjectStore('offlineData', { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains('syncQueue')) {
        db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
      }
    };
    req.onsuccess = function() { resolve(req.result); };
    req.onerror = function() { reject(req.error); };
  });
}

function getOfflineData(key) {
  return openDB().then(function(db) {
    return new Promise(function(resolve, reject) {
      var tx = db.transaction('offlineData', 'readonly');
      var store = tx.objectStore('offlineData');
      var req = store.get(key);
      req.onsuccess = function() { resolve(req.result ? req.result.value : null); };
      req.onerror = function() { reject(req.error); };
    });
  });
}

function setOfflineData(key, value) {
  return openDB().then(function(db) {
    return new Promise(function(resolve, reject) {
      var tx = db.transaction('offlineData', 'readwrite');
      var store = tx.objectStore('offlineData');
      store.put({ key: key, value: value, timestamp: Date.now() });
      tx.oncomplete = function() { resolve(); };
      tx.onerror = function() { reject(tx.error); };
    });
  });
}

function addToSyncQueue(operation) {
  return openDB().then(function(db) {
    return new Promise(function(resolve, reject) {
      var tx = db.transaction('syncQueue', 'readwrite');
      var store = tx.objectStore('syncQueue');
      store.add(Object.assign({}, operation, { timestamp: Date.now(), synced: false }));
      tx.oncomplete = function() { resolve(); };
      tx.onerror = function() { reject(tx.error); };
    });
  });
}

// Fetch strategy: network-first for API, cache-first for static
self.addEventListener('fetch', function(event) {
  var request = event.request;
  var url = new URL(request.url);

  // API requests: network-first with offline fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then(function(response) {
          if (request.method === 'GET' && response.ok) {
            var clone = response.clone();
            caches.open(API_CACHE).then(function(cache) {
              cache.put(request, clone);
            });
          }
          return response;
        })
        .catch(function() {
          return caches.match(request).then(function(cached) {
            if (cached) return cached;
            return getOfflineData('api:' + url.pathname).then(function(offline) {
              if (offline) {
                return new Response(JSON.stringify(offline.data), {
                  headers: { 'Content-Type': 'application/json', 'X-Offline': 'true' },
                });
              }
              return new Response(JSON.stringify({ error: 'offline', message: 'You are offline. Data will sync when connection is restored.' }), {
                status: 503,
                headers: { 'Content-Type': 'application/json' },
              });
            });
          });
        })
    );
    return;
  }

  // Navigation: network-first with offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(function() {
        return caches.match('/').then(function(cached) {
          return cached || new Response('Offline', { status: 503 });
        });
      })
    );
    return;
  }

  // Static assets: cache-first with network fallback
  event.respondWith(
    caches.match(request).then(function(cached) {
      if (cached) return cached;
      return fetch(request).then(function(response) {
        if (response.ok && request.method === 'GET') {
          var clone = response.clone();
          caches.open(STATIC_CACHE).then(function(cache) {
            cache.put(request, clone);
          });
        }
        return response;
      }).catch(function() {
        return new Response('', { status: 503 });
      });
    })
  );
});

// Background sync for queued mutations
self.addEventListener('sync', function(event) {
  if (event.tag === 'sync-queue') {
    event.waitUntil(syncQueue());
  }
});

function syncQueue() {
  return openDB().then(function(db) {
    var tx = db.transaction('syncQueue', 'readonly');
    var store = tx.objectStore('syncQueue');
    var req = store.getAll();
    return new Promise(function(resolve) {
      req.onsuccess = function() {
        var items = req.result.filter(function(item) { return !item.synced; });
        var chain = Promise.resolve();
        items.forEach(function(item) {
          chain = chain.then(function() {
            return fetch(item.url, {
              method: item.method,
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(item.body),
            }).then(function() {
              var writeTx = db.transaction('syncQueue', 'readwrite');
              var writeStore = writeTx.objectStore('syncQueue');
              writeStore.put(Object.assign({}, item, { synced: true }));
            }).catch(function() { throw new Error('stop'); });
          });
        });
        chain.then(resolve).catch(resolve);
      };
      req.onerror = function() { resolve(); };
    });
  });
}

// Listen for messages from the client
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'CACHE_API_DATA') {
    setOfflineData(event.data.key, event.data.data);
  }
});
