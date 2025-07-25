// sw.js
const CACHE_NAME = 'vibrate-system-v1.0.0';
const OFFLINE_URL = '/offline.html';

// Assets to cache
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/auth.js',
  '/database.js',
  '/offline-manager.js',
  '/sw-register.js',
  '/manifest.json',
  '/offline.html',
  // External dependencies
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.min.js',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.39.0/dist/umd/supabase.js',
  'https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;500;600;700&display=swap'
];

// Network-first resources (API calls)
const NETWORK_FIRST = [
  '/api/',
  '/auth/',
  'supabase.co'
];

// Cache-first resources (static assets)
const CACHE_FIRST = [
  '/styles.css',
  '/app.js',
  '/icons/',
  'cdnjs.cloudflare.com',
  'fonts.googleapis.com',
  'fonts.gstatic.com'
];

// Install event
self.addEventListener('install', event => {
  console.log('[SW] Installing Service Worker');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Static assets cached');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('[SW] Error caching static assets:', error);
      })
  );
});

// Activate event
self.addEventListener('activate', event => {
  console.log('[SW] Activating Service Worker');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName => cacheName !== CACHE_NAME)
            .map(cacheName => {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('[SW] Service Worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip Chrome extension requests
  if (url.protocol === 'chrome-extension:') {
    return;
  }
  
  // Network-first strategy for API calls
  if (NETWORK_FIRST.some(pattern => url.href.includes(pattern))) {
    event.respondWith(networkFirst(request));
    return;
  }
  
  // Cache-first strategy for static assets
  if (CACHE_FIRST.some(pattern => url.href.includes(pattern))) {
    event.respondWith(cacheFirst(request));
    return;
  }
  
  // Stale-while-revalidate for HTML pages
  if (request.destination === 'document') {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }
  
  // Default strategy
  event.respondWith(networkFirst(request));
});

// Network-first strategy
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url);
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page for navigation requests
    if (request.destination === 'document') {
      return caches.match(OFFLINE_URL);
    }
    
    throw error;
  }
}

// Cache-first strategy
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    // Update cache in background
    fetch(request)
      .then(response => {
        if (response.ok) {
          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, response);
          });
        }
      })
      .catch(() => {});
    
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[SW] Cache-first failed:', error);
    throw error;
  }
}

// Stale-while-revalidate strategy
async function staleWhileRevalidate(request) {
  const cachedResponse = await caches.match(request);
  
  const fetchPromise = fetch(request)
    .then(response => {
      if (response.ok) {
        const cache = caches.open(CACHE_NAME);
        cache.then(c => c.put(request, response.clone()));
      }
      return response;
    })
    .catch(() => cachedResponse);
  
  return cachedResponse || fetchPromise;
}

// Background sync for offline data
self.addEventListener('sync', event => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'vibrate-data-sync') {
    event.waitUntil(syncVibrateData());
  }
  
  if (event.tag === 'settings-sync') {
    event.waitUntil(syncSettings());
  }
});

// Sync offline vibrate data
async function syncVibrateData() {
  try {
    console.log('[SW] Syncing offline vibrate data');
    
    // Get offline data from IndexedDB
    const offlineData = await getOfflineData('vibrate_data_offline');
    
    if (offlineData.length === 0) {
      console.log('[SW] No offline data to sync');
      return;
    }
    
    // Send to Supabase
    for (const item of offlineData) {
      try {
        await syncSingleVibrateData(item);
        await removeOfflineData('vibrate_data_offline', item.id);
        console.log('[SW] Synced offline data:', item.id);
      } catch (error) {
        console.error('[SW] Failed to sync item:', item.id, error);
      }
    }
    
    // Notify clients
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_COMPLETE',
        data: { synced: offlineData.length }
      });
    });
    
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

// Sync settings
async function syncSettings() {
  try {
    console.log('[SW] Syncing offline settings');
    
    const offlineSettings = await getOfflineData('user_settings_offline');
    
    for (const item of offlineSettings) {
      try {
        await syncSingleSettings(item);
        await removeOfflineData('user_settings_offline', item.id);
      } catch (error) {
        console.error('[SW] Failed to sync settings:', error);
      }
    }
    
  } catch (error) {
    console.error('[SW] Settings sync failed:', error);
  }
}

// Helper functions for IndexedDB operations
async function getOfflineData(storeName) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('VibrateOfflineDB', 1);
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const getAll = store.getAll();
      
      getAll.onsuccess = () => resolve(getAll.result);
      getAll.onerror = () => reject(getAll.error);
    };
    
    request.onerror = () => reject(request.error);
  });
}

async function removeOfflineData(storeName, id) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('VibrateOfflineDB', 1);
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const deleteReq = store.delete(id);
      
      deleteReq.onsuccess = () => resolve();
      deleteReq.onerror = () => reject(deleteReq.error);
    };
    
    request.onerror = () => reject(request.error);
  });
}

// Push notification event
self.addEventListener('push', event => {
  if (!event.data) return;
  
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/'
    },
    actions: [
      {
        action: 'open',
        title: 'باز کردن',
        icon: '/icons/icon-72x72.png'
      },
      {
        action: 'close',
        title: 'بستن'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click event
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.action === 'close') {
    return;
  }
  
  const url = event.notification.data.url || '/';
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window' })
      .then(clients => {
        for (const client of clients) {
          if (client.url === url && 'focus' in client) {
            return client.focus();
          }
        }
        
        if (self.clients.openWindow) {
          return self.clients.openWindow(url);
        }
      })
  );
});

// Message event for communication with main thread
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});