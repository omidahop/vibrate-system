// offline-manager.js
class OfflineManager {
  constructor() {
    this.isOnline = navigator.onLine;
    this.dbName = 'VibrateOfflineDB';
    this.dbVersion = 1;
    this.db = null;
    this.pendingSync = new Set();
    
    this.initialize();
    this.setupEventListeners();
  }

  async initialize() {
    try {
      await this.initializeDB();
      this.updateOnlineStatus();
      console.log('Offline Manager initialized');
    } catch (error) {
      console.error('Failed to initialize Offline Manager:', error);
    }
  }

  async initializeDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Offline vibrate data
        if (!db.objectStoreNames.contains('vibrate_data_offline')) {
          const vibrateStore = db.createObjectStore('vibrate_data_offline', {
            keyPath: 'id',
            autoIncrement: true
          });
          vibrateStore.createIndex('timestamp', 'timestamp');
          vibrateStore.createIndex('unit', 'unit');
          vibrateStore.createIndex('equipment', 'equipment');
        }
        
        // Offline settings
        if (!db.objectStoreNames.contains('user_settings_offline')) {
          const settingsStore = db.createObjectStore('user_settings_offline', {
            keyPath: 'id',
            autoIncrement: true
          });
          settingsStore.createIndex('user_id', 'user_id');
        }
        
        // Cache for online data
        if (!db.objectStoreNames.contains('cached_data')) {
          const cacheStore = db.createObjectStore('cached_data', {
            keyPath: 'key'
          });
          cacheStore.createIndex('timestamp', 'timestamp');
        }
        
        // Sync queue
        if (!db.objectStoreNames.contains('sync_queue')) {
          const syncStore = db.createObjectStore('sync_queue', {
            keyPath: 'id',
            autoIncrement: true
          });
          syncStore.createIndex('type', 'type');
          syncStore.createIndex('priority', 'priority');
        }
      };
    });
  }

  setupEventListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.updateOnlineStatus();
      this.syncOfflineData();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.updateOnlineStatus();
    });

    // Periodic sync when online
    setInterval(() => {
      if (this.isOnline) {
        this.syncOfflineData();
      }
    }, 30000); // Every 30 seconds
  }

  updateOnlineStatus() {
    const statusIndicator = document.getElementById('onlineStatus');
    if (statusIndicator) {
      statusIndicator.className = this.isOnline ? 'online' : 'offline';
      statusIndicator.innerHTML = this.isOnline 
        ? '<i class="fas fa-wifi"></i> آنلاین'
        : '<i class="fas fa-wifi-slash"></i> آفلاین';
    }

    // Update UI elements
    const offlineIndicators = document.querySelectorAll('.offline-indicator');
    offlineIndicators.forEach(indicator => {
      indicator.style.display = this.isOnline ? 'none' : 'block';
    });

    // Show/hide sync buttons
    const syncButtons = document.querySelectorAll('.sync-btn');
    syncButtons.forEach(btn => {
      btn.style.display = this.isOnline && this.hasPendingData() ? 'block' : 'none';
    });
  }

  // Save vibrate data offline
  async saveVibrateDataOffline(data) {
    try {
      const offlineData = {
        ...data,
        timestamp: new Date().toISOString(),
        synced: false
      };

      await this.addToStore('vibrate_data_offline', offlineData);
      this.pendingSync.add('vibrate_data');
      
      console.log('Vibrate data saved offline');
      showNotification('داده آفلاین ذخیره شد', 'info');
      
      return offlineData;
    } catch (error) {
      console.error('Failed to save offline:', error);
      throw error;
    }
  }

  // Save settings offline
  async saveSettingsOffline(settings) {
    try {
      const offlineSettings = {
        ...settings,
        timestamp: new Date().toISOString(),
        synced: false
      };

      await this.addToStore('user_settings_offline', offlineSettings);
      this.pendingSync.add('settings');
      
      console.log('Settings saved offline');
      showNotification('تنظیمات آفلاین ذخیره شد', 'info');
      
      return offlineSettings;
    } catch (error) {
      console.error('Failed to save settings offline:', error);
      throw error;
    }
  }

  // Cache online data
  async cacheData(key, data, ttl = 3600000) { // 1 hour default TTL
    try {
      const cacheEntry = {
        key,
        data,
        timestamp: Date.now(),
        ttl
      };

      await this.addToStore('cached_data', cacheEntry);
      console.log('Data cached:', key);
    } catch (error) {
      console.error('Failed to cache data:', error);
    }
  }

  // Get cached data
  async getCachedData(key) {
    try {
      const cacheEntry = await this.getFromStore('cached_data', key);
      
      if (!cacheEntry) {
        return null;
      }

      // Check if expired
      if (Date.now() - cacheEntry.timestamp > cacheEntry.ttl) {
        await this.removeFromStore('cached_data', key);
        return null;
      }

      return cacheEntry.data;
    } catch (error) {
      console.error('Failed to get cached data:', error);
      return null;
    }
  }

  // Sync offline data when online
  async syncOfflineData() {
    if (!this.isOnline) {
      return;
    }

    try {
      // Sync vibrate data
      if (this.pendingSync.has('vibrate_data')) {
        await this.syncVibrateData();
      }

      // Sync settings
      if (this.pendingSync.has('settings')) {
        await this.syncSettings();
      }

      // Register background sync
      if ('serviceWorker' in navigator && swManager) {
        await swManager.registerBackgroundSync('vibrate-data-sync');
        await swManager.registerBackgroundSync('settings-sync');
      }

    } catch (error) {
      console.error('Sync failed:', error);
    }
  }

  async syncVibrateData() {
    try {
      const offlineData = await this.getAllFromStore('vibrate_data_offline');
      
      if (offlineData.length === 0) {
        this.pendingSync.delete('vibrate_data');
        return;
      }

      let synced = 0;
      for (const item of offlineData) {
        try {
          // Remove offline-specific fields
          const { id, timestamp, synced: syncFlag, ...dataToSync } = item;
          dataToSync.user_id = authManager.currentUser.id;

          const { error } = await supabase
            .from('vibrate_data')
            .insert(dataToSync);

          if (!error) {
            await this.removeFromStore('vibrate_data_offline', id);
            synced++;
          } else {
            console.error('Failed to sync item:', error);
          }
        } catch (error) {
          console.error('Error syncing item:', error);
        }
      }

      if (synced > 0) {
        showNotification(`${synced} داده همگام‌سازی شد`, 'success');
      }

      // Check if all synced
      const remaining = await this.getAllFromStore('vibrate_data_offline');
      if (remaining.length === 0) {
        this.pendingSync.delete('vibrate_data');
      }

    } catch (error) {
      console.error('Failed to sync vibrate data:', error);
    }
  }

  async syncSettings() {
    try {
      const offlineSettings = await this.getAllFromStore('user_settings_offline');
      
      if (offlineSettings.length === 0) {
        this.pendingSync.delete('settings');
        return;
      }

      for (const item of offlineSettings) {
        try {
          const { id, timestamp, synced: syncFlag, ...settingsToSync } = item;
          settingsToSync.user_id = authManager.currentUser.id;

          const { error } = await supabase
            .from('user_settings')
            .upsert(settingsToSync);

          if (!error) {
            await this.removeFromStore('user_settings_offline', id);
          }
        } catch (error) {
          console.error('Error syncing settings:', error);
        }
      }

      this.pendingSync.delete('settings');
      showNotification('تنظیمات همگام‌سازی شد', 'success');

    } catch (error) {
      console.error('Failed to sync settings:', error);
    }
  }

  // Get offline data for display
  async getOfflineVibrateData(filters = {}) {
    try {
      let data = await this.getAllFromStore('vibrate_data_offline');
      
      // Apply filters
      if (filters.unit) {
        data = data.filter(item => item.unit === filters.unit);
      }
      if (filters.equipment) {
        data = data.filter(item => item.equipment === filters.equipment);
      }
      if (filters.date) {
        data = data.filter(item => item.date === filters.date);
      }

      return data;
    } catch (error) {
      console.error('Failed to get offline data:', error);
      return [];
    }
  }

  // Check if has pending data
  hasPendingData() {
    return this.pendingSync.size > 0;
  }

  // Get pending sync count
  async getPendingSyncCount() {
    try {
      const vibrateCount = (await this.getAllFromStore('vibrate_data_offline')).length;
      const settingsCount = (await this.getAllFromStore('user_settings_offline')).length;
      
      return {
        vibrate: vibrateCount,
        settings: settingsCount,
        total: vibrateCount + settingsCount
      };
    } catch (error) {
      return { vibrate: 0, settings: 0, total: 0 };
    }
  }

  // Database operations
  async addToStore(storeName, data) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.add(data);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getFromStore(storeName, key) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllFromStore(storeName) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async removeFromStore(storeName, key) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clearStore(storeName) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

// Initialize Offline Manager
let offlineManager;
if (typeof window !== 'undefined') {
  offlineManager = new OfflineManager();
}