// sw-register.js
class ServiceWorkerManager {
  constructor() {
    this.registration = null;
    this.updateAvailable = false;
    this.initialize();
  }

  async initialize() {
    if ('serviceWorker' in navigator) {
      try {
        this.registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        });

        console.log('Service Worker registered successfully');
        this.setupUpdateHandling();
        this.setupMessageHandling();
        
        // Check for updates
        this.registration.addEventListener('updatefound', () => {
          this.handleUpdate();
        });

      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    } else {
      console.log('Service Worker not supported');
    }
  }

  setupUpdateHandling() {
    if (this.registration.waiting) {
      this.showUpdatePrompt();
    }

    this.registration.addEventListener('updatefound', () => {
      const newWorker = this.registration.installing;
      
      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed') {
          if (navigator.serviceWorker.controller) {
            this.showUpdatePrompt();
          }
        }
      });
    });
  }

  setupMessageHandling() {
    navigator.serviceWorker.addEventListener('message', event => {
      if (event.data.type === 'SYNC_COMPLETE') {
        this.handleSyncComplete(event.data.data);
      }
    });
  }

  showUpdatePrompt() {
    this.updateAvailable = true;
    
    const updateBanner = document.createElement('div');
    updateBanner.id = 'updateBanner';
    updateBanner.className = 'update-banner';
    updateBanner.innerHTML = `
      <div class="update-content">
        <div class="update-message">
          <i class="fas fa-download"></i>
          <span>نسخه جدید در دسترس است</span>
        </div>
        <div class="update-actions">
          <button class="btn btn-primary btn-sm" onclick="swManager.applyUpdate()">
            <i class="fas fa-refresh"></i>
            به‌روزرسانی
          </button>
          <button class="btn btn-secondary btn-sm" onclick="swManager.dismissUpdate()">
            <i class="fas fa-times"></i>
            بعداً
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(updateBanner);
    
    setTimeout(() => {
      updateBanner.classList.add('show');
    }, 100);
  }

  async applyUpdate() {
    if (this.registration.waiting) {
      this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
    
    window.location.reload();
  }

  dismissUpdate() {
    const banner = document.getElementById('updateBanner');
    if (banner) {
      banner.remove();
    }
  }

  handleSyncComplete(data) {
    if (data.synced > 0) {
      showNotification(`${data.synced} آیتم آفلاین همگام‌سازی شد`, 'success');
    }
  }

  // Background sync registration
  async registerBackgroundSync(tag) {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      try {
        await this.registration.sync.register(tag);
        console.log('Background sync registered:', tag);
        return true;
      } catch (error) {
        console.error('Background sync registration failed:', error);
        return false;
      }
    }
    return false;
  }

  // Push notification subscription
  async subscribeToPush() {
    if (!('Notification' in window)) {
      console.log('Notifications not supported');
      return null;
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('Notification permission denied');
      return null;
    }

    try {
      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });

      console.log('Push subscription created');
      return subscription;
    } catch (error) {
      console.error('Push subscription failed:', error);
      return null;
    }
  }

  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
}

// Initialize Service Worker Manager
let swManager;
if (typeof window !== 'undefined') {
  swManager = new ServiceWorkerManager();
}