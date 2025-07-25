// app.js - Main application logic with PWA support
// ==================== APPLICATION CONSTANTS ====================
const APP_CONFIG = {
    version: '3.0.0-pwa',
    cacheName: 'vibrate-system-cache',
    
    // Equipment data - same as before
    equipments: [
        { id: 'GB-cp48A', name: 'گیربکس کمپرسور 48A', code: 'GB-cp 48A', icon: 'fas fa-cog', color: '#8b5cf6' },
        { id: 'CP-cp48A', name: 'کمپرسور 48A', code: 'CP-cp 48A', icon: 'fas fa-compress', color: '#06b6d4' },
        { id: 'GB-cp48B', name: 'گیربکس کمپرسور 48B', code: 'GB-cp 48B', icon: 'fas fa-cog', color: '#8b5cf6' },
        { id: 'CP-cp48B', name: 'کمپرسور 48B', code: 'CP-cp 48B', icon: 'fas fa-compress', color: '#06b6d4' },
        { id: 'GB-cp51', name: 'گیربکس کمپرسور 51', code: 'GB-cp 51', icon: 'fas fa-cog', color: '#8b5cf6' },
        { id: 'CP-cp51', name: 'کمپرسور 51', code: 'CP-cp 51', icon: 'fas fa-compress', color: '#06b6d4' },
        { id: 'GB-cp71', name: 'گیربکس کمپرسور 71', code: 'GB-cp 71', icon: 'fas fa-cog', color: '#8b5cf6' },
        { id: 'CP-cp71', name: 'کمپرسور 71', code: 'CP-cp 71', icon: 'fas fa-compress', color: '#06b6d4' },
        { id: 'CP-cpSGC', name: 'کمپرسور سیل گس', code: 'CP-cp SGC', icon: 'fas fa-compress', color: '#06b6d4' },
        { id: 'FN-fnESF', name: 'فن استک', code: 'FN-fn ESF', icon: 'fas fa-fan', color: '#10b981' },
        { id: 'FN-fnAUX', name: 'فن اگزیلاری', code: 'FN-fn AUX', icon: 'fas fa-fan', color: '#10b981' },
        { id: 'FN-fnMAB', name: 'فن هوای اصلی', code: 'FN-fn MAB', icon: 'fas fa-fan', color: '#10b981' }
    ],
    
    // Parameter data - same as before  
    parameters: [
        { id: 'V1', name: 'سرعت عمودی متصل', code: 'V1', icon: 'fas fa-arrow-up', color: '#ec4899', type: 'velocity', category: 'connected', maxValue: 20, order: 1 },
        { id: 'GV1', name: 'شتاب عمودی متصل', code: 'GV1', icon: 'fas fa-arrow-up', color: '#f59e0b', type: 'acceleration', category: 'connected', maxValue: 2, order: 2 },
        { id: 'H1', name: 'سرعت افقی متصل', code: 'H1', icon: 'fas fa-arrow-right', color: '#ec4899', type: 'velocity', category: 'connected', maxValue: 20, order: 3 },
        { id: 'GH1', name: 'شتاب افقی متصل', code: 'GH1', icon: 'fas fa-arrow-right', color: '#f59e0b', type: 'acceleration', category: 'connected', maxValue: 2, order: 4 },
        { id: 'A1', name: 'سرعت محوری متصل', code: 'A1', icon: 'fas fa-arrows-alt', color: '#ec4899', type: 'velocity', category: 'connected', maxValue: 20, order: 5 },
        { id: 'GA1', name: 'شتاب محوری متصل', code: 'GA1', icon: 'fas fa-arrows-alt', color: '#f59e0b', type: 'acceleration', category: 'connected', maxValue: 2, order: 6 },
        { id: 'V2', name: 'سرعت عمودی آزاد', code: 'V2', icon: 'fas fa-arrow-up', color: '#6366f1', type: 'velocity', category: 'free', maxValue: 20, order: 7 },
        { id: 'GV2', name: 'شتاب عمودی آزاد', code: 'GV2', icon: 'fas fa-arrow-up', color: '#8b5cf6', type: 'acceleration', category: 'free', maxValue: 2, order: 8 },
        { id: 'H2', name: 'سرعت افقی آزاد', code: 'H2', icon: 'fas fa-arrow-right', color: '#6366f1', type: 'velocity', category: 'free', maxValue: 20, order: 9 },
        { id: 'GH2', name: 'شتاب افقی آزاد', code: 'GH2', icon: 'fas fa-arrow-right', color: '#8b5cf6', type: 'acceleration', category: 'free', maxValue: 2, order: 10 },
        { id: 'A2', name: 'سرعت محوری آزاد', code: 'A2', icon: 'fas fa-arrows-alt', color: '#6366f1', type: 'velocity', category: 'free', maxValue: 20, order: 11 },
        { id: 'GA2', name: 'شتاب محوری آزاد', code: 'GA2', icon: 'fas fa-arrows-alt', color: '#8b5cf6', type: 'acceleration', category: 'free', maxValue: 2, order: 12 }
    ],
    
    // Units
    units: [
        { id: 'DRI1', name: 'واحد احیا مستقیم 1', code: 'DRI 1', color: '#3b82f6' },
        { id: 'DRI2', name: 'واحد احیا مستقیم 2', code: 'DRI 2', color: '#ef4444' }
    ]
};

// ==================== GLOBAL VARIABLES ====================
let currentSettings = {
    theme: 'light',
    primary_color: '#2563eb',
    dri1_color: '#3b82f6',
    dri2_color: '#ef4444',
    equipment_priority: {},
    parameter_priority: {},
    parameter_mode: 'default',
    data_entry_equipment_priority: {},
    data_entry_parameter_priority: {},
    data_entry_parameter_mode: 'default',
    analysis_threshold: 20,
    analysis_time_range: 7,
    analysis_comparison_days: 1
};

let dataEntryState = {
    mode: 'new',
    selectedUnit: null,
    currentEquipmentIndex: 0,
    currentParameterIndex: 0,
    currentData: {},
    dateData: {},
    editSelectedUnit: null,
    editSelectedEquipment: null,
    editSelectedParameter: null,
    editCurrentValue: null,
    currentEquipmentNote: ''
};

let slideshowState = {
    isRunning: false,
    isPaused: false,
    currentDate: null,
    currentEquipmentIndex: 0,
    currentParameterIndex: 0,
    interval: null,
    speed: 3000,
    data: {},
    isFullscreen: false,
    currentValueColor: '#3b82f6'
};

let chartInstance = null;

// ==================== UTILITY FUNCTIONS ====================
function getCurrentDate() {
    const now = new Date();
    return now.toISOString().split('T')[0];
}

function formatDate(dateString) {
    if (!dateString) return '--';
    const date = new Date(dateString);
    return date.toLocaleDateString('fa-IR');
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--success-color);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        z-index: 10000;
        box-shadow: var(--shadow-lg);
        transform: translateX(100%);
        transition: transform 0.3s ease;
        max-width: 350px;
        word-wrap: break-word;
    `;
    
    if (type === 'error') {
        notification.style.background = 'var(--error-color)';
    } else if (type === 'warning') {
        notification.style.background = 'var(--warning-color)';
    } else if (type === 'info') {
        notification.style.background = 'var(--info-color)';
    }
    
    const iconMap = {
        'success': 'check-circle',
        'error': 'exclamation-circle', 
        'warning': 'exclamation-triangle',
        'info': 'info-circle'
    };
    
    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.5rem;">
            <i class="fas fa-${iconMap[type] || 'info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 4000);
}

function validateValue(value, parameterId) {
    const num = parseFloat(value);
    
    if (isNaN(num) || num < 0) return false;
    
    const parameter = APP_CONFIG.parameters.find(p => p.id === parameterId);
    if (!parameter) return false;
    
    const maxValue = parameter.type === 'velocity' ? 20 : 2;
    const decimalPlaces = (num.toString().split('.')[1] || '').length;
    
    return decimalPlaces <= 2 && num <= maxValue;
}

function getParameterMaxValue(parameterId) {
    const parameter = APP_CONFIG.parameters.find(p => p.id === parameterId);
    return parameter?.maxValue || 20;
}

function getParameterType(parameterId) {
    const parameter = APP_CONFIG.parameters.find(p => p.id === parameterId);
    return parameter?.type || 'velocity';
}

// ==================== THEME FUNCTIONS ====================
function toggleTheme() {
    currentSettings.theme = currentSettings.theme === 'light' ? 'dark' : 'light';
    applyTheme();
    updateThemeIcon();
    
    // Save to both local storage and database
    if (authManager.currentUser) {
        authManager.saveUserSettings(currentSettings);
    }
}

function applyTheme() {
    document.documentElement.setAttribute('data-theme', currentSettings.theme);
    
    const root = document.documentElement;
    root.style.setProperty('--primary-color', currentSettings.primary_color);
    root.style.setProperty('--dri1-color', currentSettings.dri1_color);
    root.style.setProperty('--dri2-color', currentSettings.dri2_color);
}

function updateThemeIcon() {
    const themeIcon = document.querySelector('.theme-toggle i');
    if (themeIcon) {
        themeIcon.className = currentSettings.theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
    }
}

// ==================== NAVIGATION FUNCTIONS ====================
function showSection(sectionId) {
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => section.classList.remove('active'));
    
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    const navTabs = document.querySelectorAll('.nav-tab');
    navTabs.forEach(tab => tab.classList.remove('active'));
    
    const activeTab = document.querySelector(`.nav-tab[onclick*="${sectionId}"]`);
    if (activeTab) {
        activeTab.classList.add('active');
    }
    
    // Initialize section-specific functionality
    switch(sectionId) {
        case 'data-entry':
            initDataEntry();
            break;
        case 'view-data':
            initViewData();
            break;
        case 'charts':
            initCharts();
            break;
        case 'analysis':
            initAnalysis();
            break;
        case 'slideshow':
            initSlideshow();
            break;
        case 'database':
            loadDatabaseStats();
            break;
        case 'settings':
            initSettings();
            break;
        case 'user-management':
            if (authManager.userProfile?.role === 'admin') {
                authManager.loadUserManagement();
            }
            break;
    }
}

// ==================== DATA ENTRY FUNCTIONS ====================
async function initDataEntry() {
    // Setup input event listeners
    setupDataEntryEventListeners();
    
    // Update current date display
    const currentDateDisplay = document.getElementById('currentDateDisplay');
    if (currentDateDisplay) {
        currentDateDisplay.textContent = formatDate(getCurrentDate());
    }
    
    // Check for offline data to sync
    updateSyncStatus();
}

function setupDataEntryEventListeners() {
    const dataInput = document.getElementById('dataInput');
    if (dataInput) {
        const newInput = dataInput.cloneNode(true);
        dataInput.parentNode.replaceChild(newInput, dataInput);
        
        newInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleDataInput();
            }
        });
        
        newInput.addEventListener('input', (e) => {
            validateInputRealTime(e.target);
        });
    }
    
    const editInput = document.getElementById('editDataInput');
    if (editInput) {
        editInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                saveEditedData();
            }
        });
        
        editInput.addEventListener('input', (e) => {
            validateInputRealTime(e.target);
        });
    }
}

function validateInputRealTime(input) {
    const value = input.value;
    const parameterId = getCurrentParameterId();
    
    if (parameterId && value && !validateValue(value, parameterId)) {
        input.classList.add('invalid');
        input.classList.remove('valid');
    } else {
        input.classList.remove('invalid');
        if (value) {
            input.classList.add('valid');
        } else {
            input.classList.remove('valid');
        }
    }
}

function getCurrentParameterId() {
    const parameters = getParametersByPriorityForDataEntry();
    return parameters[dataEntryState.currentParameterIndex]?.id || null;
}

// ==================== OFFLINE SYNC FUNCTIONS ====================
async function updateSyncStatus() {
    if (!offlineManager) return;
    
    try {
        const pendingCount = await offlineManager.getPendingSyncCount();
        const syncButton = document.querySelector('.sync-btn');
        const syncPending = document.getElementById('syncPending');
        
        if (pendingCount.total > 0) {
            if (syncButton) {
                syncButton.style.display = 'block';
                syncButton.innerHTML = `
                    <i class="fas fa-sync"></i>
                    همگام‌سازی (${pendingCount.total})
                `;
            }
            
            if (syncPending) {
                syncPending.style.display = 'inline-block';
                syncPending.innerHTML = `
                    <i class="fas fa-clock"></i>
                    ${pendingCount.total} در انتظار همگام‌سازی
                `;
            }
        } else {
            if (syncButton) {
                syncButton.style.display = 'none';
            }
            
            if (syncPending) {
                syncPending.style.display = 'none';
            }
        }
        
    } catch (error) {
        console.error('Error updating sync status:', error);
    }
}

async function forceSyncData() {
    if (!offlineManager || !authManager.currentUser) {
        showNotification('امکان همگام‌سازی وجود ندارد', 'error');
        return;
    }
    
    try {
        showNotification('در حال همگام‌سازی...', 'info');
        
        await offlineManager.syncOfflineData();
        await updateSyncStatus();
        
        showNotification('همگام‌سازی کامل شد', 'success');
        
    } catch (error) {
        console.error('Force sync failed:', error);
        showNotification('خطا در همگام‌سازی', 'error');
    }
}

async function showSyncStatus() {
    if (!offlineManager) return;
    
    try {
        const pendingCount = await offlineManager.getPendingSyncCount();
        const content = document.getElementById('syncStatusContent');
        
        if (content) {
            content.innerHTML = `
                <div class="sync-status-grid">
                    <div class="sync-status-item">
                        <div class="sync-status-number">${pendingCount.vibrate}</div>
                        <div class="sync-status-label">داده‌های ویبره</div>
                    </div>
                    <div class="sync-status-item">
                        <div class="sync-status-number">${pendingCount.settings}</div>
                        <div class="sync-status-label">تنظیمات</div>
                    </div>
                    <div class="sync-status-item">
                        <div class="sync-status-number">${pendingCount.total}</div>
                        <div class="sync-status-label">مجموع</div>
                    </div>
                </div>
                <div class="sync-status-info mt-3">
                    <p class="text-secondary">
                        ${pendingCount.total === 0 ? 
                            '✅ همه داده‌ها همگام‌سازی شده‌اند' : 
                            `⏳ ${pendingCount.total} آیتم در انتظار همگام‌سازی`
                        }
                    </p>
                    ${!offlineManager.isOnline ? '<p class="text-warning">⚠️ برای همگام‌سازی به اتصال اینترنت نیاز است</p>' : ''}
                </div>
            `;
        }
        
        showModal('syncStatusModal');
        
    } catch (error) {
        console.error('Error showing sync status:', error);
        showNotification('خطا در نمایش وضعیت همگام‌سازی', 'error');
    }
}

// ==================== STATISTICS FUNCTIONS ====================
async function loadDatabaseStats() {
    try {
        showNotification('در حال بارگذاری آمار...', 'info');
        
        const { data: stats, error } = await dbManager.getDataStats();
        
        if (error) {
            throw error;
        }

        renderOverallStats(stats);
        renderUnitStats(stats);
        renderUserStats(stats);
        renderOfflineStats();
        
        showNotification('آمار به‌روزرسانی شد', 'success');
        
    } catch (error) {
        console.error('Error loading stats:', error);
        showNotification('خطا در بارگذاری آمار', 'error');
    }
}

function renderOverallStats(stats) {
    const container = document.getElementById('overallStats');
    if (!container || !stats?.length) return;

    const totalRecords = stats.reduce((sum, stat) => sum + (stat.total_records || 0), 0);
    const totalDays = Math.max(...stats.map(stat => stat.total_days || 0), 0);
    const totalUsers = new Set(stats.map(stat => stat.user_name)).size;
    const dri1Records = stats.filter(s => s.unit === 'DRI1').reduce((sum, s) => sum + (s.total_records || 0), 0);
    const dri2Records = stats.filter(s => s.unit === 'DRI2').reduce((sum, s) => sum + (s.total_records || 0), 0);

    container.innerHTML = `
        <div class="stat-card">
            <div class="stat-number">${totalRecords.toLocaleString('fa-IR')}</div>
            <div class="stat-label">کل رکوردها</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${totalDays}</div>
            <div class="stat-label">تعداد روزها</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${totalUsers}</div>
            <div class="stat-label">کاربران فعال</div>
        </div>
        <div class="stat-card dri1-style">
            <div class="stat-number">${dri1Records.toLocaleString('fa-IR')}</div>
            <div class="stat-label">رکوردهای DRI1</div>
        </div>
        <div class="stat-card dri2-style">
            <div class="stat-number">${dri2Records.toLocaleString('fa-IR')}</div>
            <div class="stat-label">رکوردهای DRI2</div>
        </div>
    `;
}

function renderUnitStats(stats) {
    const container = document.getElementById('unitStats');
    if (!container) return;

    const unitGroups = {
        'DRI1': stats.filter(s => s.unit === 'DRI1'),
        'DRI2': stats.filter(s => s.unit === 'DRI2')
    };

    container.innerHTML = '';

    Object.entries(unitGroups).forEach(([unit, unitStats]) => {
        if (unitStats.length === 0) return;

        const unitCard = document.createElement('div');
        unitCard.className = `unit-stat-card ${unit.toLowerCase()}-style`;
        
        const totalRecords = unitStats.reduce((sum, s) => sum + (s.total_records || 0), 0);
        const avgDays = unitStats.length > 0 ? Math.round(unitStats.reduce((sum, s) => sum + (s.total_days || 0), 0) / unitStats.length) : 0;
        const activeUsers = unitStats.length;

        unitCard.innerHTML = `
            <div class="unit-stat-header">
                <h4>${unit === 'DRI1' ? 'واحد احیا مستقیم 1' : 'واحد احیا مستقیم 2'}</h4>
            </div>
            <div class="unit-stat-body grid grid-3">
                <div class="stat-item">
                    <div class="stat-number">${totalRecords.toLocaleString('fa-IR')}</div>
                    <div class="stat-label">کل رکوردها</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number">${avgDays}</div>
                    <div class="stat-label">میانگین روزهای ثبت</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number">${activeUsers}</div>
                    <div class="stat-label">کاربران فعال</div>
                </div>
            </div>
        `;
        
        container.appendChild(unitCard);
    });
}

function renderUserStats(stats) {
    const container = document.getElementById('userStats');
    if (!container) return;

    const sortedStats = [...stats].sort((a, b) => (b.total_records || 0) - (a.total_records || 0));

    container.innerHTML = '';

    sortedStats.forEach(stat => {
        const userCard = document.createElement('div');
        userCard.className = `user-stat-card ${(stat.unit || 'dri1').toLowerCase()}-style`;
        
        userCard.innerHTML = `
            <div class="user-stat-info">
                <div class="user-avatar">${(stat.user_name || 'نامشخص').charAt(0).toUpperCase()}</div>
                <div class="user-details">
                    <div class="user-name">${stat.user_name || 'نامشخص'}</div>
                    <div class="user-unit">${stat.unit === 'DRI1' ? 'واحد احیا مستقیم 1' : 'واحد احیا مستقیم 2'}</div>
                </div>
            </div>
            <div class="user-stat-numbers grid grid-4">
                <div class="stat-item">
                    <div class="stat-number">${(stat.total_records || 0).toLocaleString('fa-IR')}</div>
                    <div class="stat-label">رکوردها</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number">${stat.total_days || 0}</div>
                    <div class="stat-label">روزها</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number">${stat.total_equipments || 0}</div>
                    <div class="stat-label">تجهیزات</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number">${formatDate(stat.last_entry)}</div>
                    <div class="stat-label">آخرین ورود</div>
                </div>
            </div>
        `;
        
        container.appendChild(userCard);
    });
}

async function renderOfflineStats() {
    const container = document.getElementById('offlineStatsGrid');
    if (!container || !offlineManager) return;

    try {
        const pendingCount = await offlineManager.getPendingSyncCount();
        
        container.innerHTML = `
            <div class="stat-card">
                <div class="stat-number">${pendingCount.vibrate}</div>
                <div class="stat-label">داده‌های آفلاین</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${pendingCount.settings}</div>
                <div class="stat-label">تنظیمات آفلاین</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${offlineManager.isOnline ? 'متصل' : 'قطع'}</div>
                <div class="stat-label">وضعیت اتصال</div>
            </div>
        `;
        
    } catch (error) {
        console.error('Error rendering offline stats:', error);
        container.innerHTML = '<p class="text-error">خطا در بارگذاری آمار آفلاین</p>';
    }
}

// ==================== MODAL FUNCTIONS ====================
function showModal(modalId, message) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    
    modal.classList.add('active');
    
    if (message) {
        const messageElements = modal.querySelectorAll('#confirmMessage, #slideshowMessage');
        messageElements.forEach(element => {
            if (element) {
                element.textContent = message;
            }
        });
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    
    modal.classList.remove('active');
}

// ==================== ERROR HANDLING ====================
window.addEventListener('error', (event) => {
    console.error('Global error caught:', event.error);
    showNotification('خطای غیرمنتظره‌ای رخ داد', 'error');
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    showNotification('خطا در پردازش اطلاعات', 'error');
    event.preventDefault();
});

// ==================== APP INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('App initializing...');
    
    try {
        // Wait for auth manager to initialize
        if (!authManager.isInitialized) {
            let attempts = 0;
            while (!authManager.isInitialized && attempts < 50) {
                await new Promise(resolve => setTimeout(resolve, 100));
                attempts++;
            }
        }
        
        // Initialize default settings
        initializeDefaultPriorities();
        
        // Apply initial theme
        applyTheme();
        updateThemeIcon();
        
        // Setup global event listeners
        addGlobalEventListeners();
        
        console.log('App initialized successfully');
        
    } catch (error) {
        console.error('Error initializing app:', error);
        showNotification('خطا در راه‌اندازی برنامه', 'error');
    }
});

function initializeDefaultPriorities() {
    // Initialize default priorities if not set
    if (Object.keys(currentSettings.equipmentPriority).length === 0) {
        let priority = 1;
        ['DRI1', 'DRI2'].forEach(unit => {
            APP_CONFIG.equipments.forEach(equipment => {
                currentSettings.equipmentPriority[`${equipment.id}_${unit}`] = priority++;
            });
        });
    }
    
    if (Object.keys(currentSettings.parameterPriority).length === 0) {
        APP_CONFIG.parameters.forEach((parameter) => {
            currentSettings.parameterPriority[parameter.id] = parameter.order;
        });
    }

    if (Object.keys(currentSettings.dataEntryParameterPriority).length === 0) {
        APP_CONFIG.parameters.forEach((parameter) => {
            currentSettings.dataEntryParameterPriority[parameter.id] = parameter.order;
        });
    }
}

function addGlobalEventListeners() {
    // Modal backdrop clicks
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeModal(e.target.id);
        }
    }, { passive: true     });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Escape key closes modals and exits fullscreen
        if (e.key === 'Escape') {
            const activeModal = document.querySelector('.modal.active');
            if (activeModal) {
                closeModal(activeModal.id);
                return;
            }
            
            if (slideshowState.isFullscreen) {
                exitSlideshowFullscreen();
                return;
            }
            
            const fullscreenSection = document.querySelector('.section.fullscreen');
            if (fullscreenSection) {
                exitFullscreen(fullscreenSection.id);
            }
        }
        
        // Ctrl/Cmd + S saves current data entry
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            if (dataEntryState.selectedUnit) {
                saveCurrentData();
            }
        }
        
        // F5 forces sync when online
        if (e.key === 'F5' && offlineManager?.isOnline) {
            e.preventDefault();
            forceSyncData();
        }
    });
    
    // Window resize handler for charts
    let windowResizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(windowResizeTimeout);
        windowResizeTimeout = setTimeout(() => {
            if (chartInstance && typeof chartInstance.resize === 'function') {
                chartInstance.resize();
            }
            updateChartContainerSize();
        }, 250);
    }, { passive: true });
    
    // Setup navigation tabs
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            const onclick = tab.getAttribute('onclick');
            if (onclick) {
                const sectionMatch = onclick.match(/showSection\('([^']+)'\)/);
                if (sectionMatch) {
                    showSection(sectionMatch[1]);
                }
            }
        });
    });

    // Handle background sync completion messages
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.addEventListener('message', event => {
            if (event.data?.type === 'SYNC_COMPLETE') {
                updateSyncStatus();
                showNotification(`${event.data.data.synced} داده همگام‌سازی شد`, 'success');
            }
        });
    }
}

// ==================== PRIORITY FUNCTIONS ====================
function getEquipmentByPriorityForDataEntry() {
    if (!dataEntryState.selectedUnit) {
        return APP_CONFIG.equipments;
    }
    
    const unitId = dataEntryState.selectedUnit;
    
    if (Object.keys(currentSettings.dataEntryEquipmentPriority).length > 0) {
        const priorityEntries = Object.entries(currentSettings.dataEntryEquipmentPriority)
            .filter(([key]) => key.includes(unitId))
            .sort(([,a], [,b]) => a - b);
        
        if (priorityEntries.length > 0) {
            return priorityEntries.map(([key]) => {
                const equipmentId = key.replace(`_${unitId}`, '');
                return APP_CONFIG.equipments.find(e => e.id === equipmentId);
            }).filter(Boolean);
        }
    }
    
    return APP_CONFIG.equipments;
}

function getParametersByPriorityForDataEntry() {
    if (currentSettings.dataEntryParameterMode === 'default') {
        return APP_CONFIG.parameters.sort((a, b) => a.order - b.order);
    } else if (currentSettings.dataEntryParameterMode === 'velocity-first') {
        const velocityParams = APP_CONFIG.parameters.filter(p => p.type === 'velocity');
        const accelerationParams = APP_CONFIG.parameters.filter(p => p.type === 'acceleration');
        return [...velocityParams, ...accelerationParams];
    } else if (currentSettings.dataEntryParameterMode === 'custom' && Object.keys(currentSettings.dataEntryParameterPriority).length > 0) {
        return Object.entries(currentSettings.dataEntryParameterPriority)
            .sort(([,a], [,b]) => a - b)
            .map(([id]) => APP_CONFIG.parameters.find(p => p.id === id))
            .filter(Boolean);
    }
    
    return APP_CONFIG.parameters.sort((a, b) => a.order - b.order);
}

function getEquipmentByPriority() {
    if (Object.keys(currentSettings.equipmentPriority).length > 0) {
        return Object.entries(currentSettings.equipmentPriority)
            .sort(([,a], [,b]) => a - b)
            .map(([id]) => {
                const baseId = id.replace('_DRI1', '').replace('_DRI2', '');
                const equipment = APP_CONFIG.equipments.find(e => e.id === baseId);
                if (equipment) {
                    return {
                        ...equipment,
                        unit: id.includes('_DRI1') ? 'DRI1' : id.includes('_DRI2') ? 'DRI2' : null,
                        priorityId: id
                    };
                }
                return null;
            })
            .filter(Boolean);
    }
    
    return APP_CONFIG.equipments;
}

function getParametersByPriority() {
    if (currentSettings.parameterMode === 'default') {
        return APP_CONFIG.parameters.sort((a, b) => a.order - b.order);
    } else if (currentSettings.parameterMode === 'velocity-first') {
        const velocityParams = APP_CONFIG.parameters.filter(p => p.type === 'velocity');
        const accelerationParams = APP_CONFIG.parameters.filter(p => p.type === 'acceleration');
        return [...velocityParams, ...accelerationParams];
    } else if (currentSettings.parameterMode === 'custom' && Object.keys(currentSettings.parameterPriority).length > 0) {
        return Object.entries(currentSettings.parameterPriority)
            .sort(([,a], [,b]) => a - b)
            .map(([id]) => APP_CONFIG.parameters.find(p => p.id === id))
            .filter(Boolean);
    }
    
    return APP_CONFIG.parameters.sort((a, b) => a.order - b.order);
}

// ==================== DATA ENTRY CORE FUNCTIONS ====================
function switchDataEntryMode(mode) {
    dataEntryState.mode = mode;
    
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    const targetTab = document.getElementById(`${mode}EntryTab`);
    if (targetTab) {
        targetTab.classList.add('active');
    }
    
    const newEntryMode = document.getElementById('newEntryMode');
    const editMode = document.getElementById('editMode');
    
    if (mode === 'new') {
        if (newEntryMode) newEntryMode.classList.remove('d-none');
        if (editMode) editMode.classList.add('d-none');
    } else {
        if (newEntryMode) newEntryMode.classList.add('d-none');
        if (editMode) editMode.classList.remove('d-none');
    }
    
    resetDataEntryState();
}

function resetDataEntryState() {
    document.querySelectorAll('.unit-btn').forEach(btn => btn.classList.remove('selected'));
    document.querySelectorAll('.equipment-card').forEach(card => card.classList.remove('selected'));
    document.querySelectorAll('.parameter-card').forEach(card => card.classList.remove('selected'));
    
    const elementsToHide = [
        'entryHeader', 'inputArea', 'newEntryControls',
        'editEquipmentSection', 'editParameterSection', 
        'editInputArea', 'editControls'
    ];
    
    elementsToHide.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.classList.add('d-none');
        }
    });
    
    dataEntryState.selectedUnit = null;
    dataEntryState.currentEquipmentIndex = 0;
    dataEntryState.currentParameterIndex = 0;
    dataEntryState.dateData = {};
    dataEntryState.currentData = {};
    dataEntryState.editSelectedUnit = null;
    dataEntryState.editSelectedEquipment = null;
    dataEntryState.editSelectedParameter = null;
    dataEntryState.editCurrentValue = null;
    dataEntryState.currentEquipmentNote = '';
}

async function selectUnit(unitId) {
    const today = getCurrentDate();
    
    try {
        // Reset state
        dataEntryState = {
            ...dataEntryState,
            selectedUnit: null,
            currentEquipmentIndex: 0,
            currentParameterIndex: 0,
            dateData: {},
            currentData: {},
            currentEquipmentNote: ''
        };
        
        dataEntryState.selectedUnit = unitId;
        
        // Load today's data
        await loadTodayData();
        
        // Check if all equipment is completed
        const equipments = getEquipmentByPriorityForDataEntry();
        const parameters = getParametersByPriorityForDataEntry();
        let allCompleted = true;
        
        for (const equipment of equipments) {
            const equipmentData = dataEntryState.dateData[equipment.id];
            
            if (!equipmentData) {
                allCompleted = false;
                break;
            }
            
            for (const param of parameters) {
                const value = equipmentData[param.id];
                if (value === undefined || value === null || value === '' || 
                    isNaN(value) || value < 0 || value > (param.type === 'velocity' ? 20 : 2)) {
                    allCompleted = false;
                    break;
                }
            }
            
            if (!allCompleted) break;
        }
        
        if (allCompleted) {
            showNotification('تمام تجهیزات این واحد برای امروز تکمیل شده. به حالت ویرایش منتقل می‌شوید.', 'info');
            switchDataEntryMode('edit');
            selectEditUnit(unitId);
            return;
        }
        
        showEntryInterface(unitId);
        
    } catch (error) {
        console.error('Error selecting unit:', error);
        showNotification('خطا در انتخاب واحد', 'error');
    }
}

function showEntryInterface(unitId) {
    document.querySelectorAll('.unit-btn').forEach(btn => btn.classList.remove('selected'));
    const selectedBtn = document.querySelector(`.unit-btn.${unitId.toLowerCase()}`);
    if (selectedBtn) {
        selectedBtn.classList.add('selected');
    }
    
    const entryHeader = document.getElementById('entryHeader');
    if (entryHeader) {
        entryHeader.classList.remove('d-none');
        entryHeader.className = `data-entry-header ${unitId.toLowerCase()}`;
    }
    
    const elementsToShow = ['inputArea', 'newEntryControls'];
    elementsToShow.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.classList.remove('d-none');
        }
    });
    
    updateCurrentDisplay();
    
    setTimeout(() => {
        const dataInput = document.getElementById('dataInput');
        if (dataInput) {
            dataInput.focus();
        }
    }, 100);
}

async function loadTodayData() {
    try {
        const today = getCurrentDate();
        dataEntryState.dateData = {};
        
        const { data } = await dbManager.getVibrateData({ 
            unit: dataEntryState.selectedUnit, 
            date: today 
        });
        
        data.forEach(item => {
            dataEntryState.dateData[item.equipment] = { ...item.parameters };
        });
        
        await setNextIncompletePosition();
        
    } catch (error) {
        console.error('Error loading today data:', error);
        showNotification('خطا در بارگذاری داده‌ها', 'error');
    }
}

async function setNextIncompletePosition() {
    const equipments = getEquipmentByPriorityForDataEntry();
    const parameters = getParametersByPriorityForDataEntry();
    
    for (let i = 0; i < equipments.length; i++) {
        const equipment = equipments[i];
        const equipmentData = dataEntryState.dateData[equipment.id];
        
        if (!equipmentData) {
            dataEntryState.currentEquipmentIndex = i;
            dataEntryState.currentParameterIndex = 0;
            return;
        }
        
        const validParams = parameters.filter(param => 
            equipmentData[param.id] !== undefined && 
            equipmentData[param.id] !== null && 
            equipmentData[param.id] !== '' &&
            !isNaN(equipmentData[param.id]) &&
            equipmentData[param.id] >= 0 &&
            equipmentData[param.id] <= (param.type === 'velocity' ? 20 : 2)
        );
        
        if (validParams.length < parameters.length) {
            dataEntryState.currentEquipmentIndex = i;
            dataEntryState.currentParameterIndex = validParams.length;
            return;
        }
    }
    
    dataEntryState.currentEquipmentIndex = 0;
    dataEntryState.currentParameterIndex = 0;
}

function updateCurrentDisplay() {
    const equipments = getEquipmentByPriorityForDataEntry();
    const parameters = getParametersByPriorityForDataEntry();
    const currentEquipment = equipments[dataEntryState.currentEquipmentIndex];
    const currentParameter = parameters[dataEntryState.currentParameterIndex];
    
    if (!currentEquipment || !currentParameter) return;
    
    const unitInfo = APP_CONFIG.units.find(u => u.id === dataEntryState.selectedUnit);
    
    const currentUnitElement = document.getElementById('currentUnit');
    if (currentUnitElement) {
        currentUnitElement.textContent = unitInfo?.name || dataEntryState.selectedUnit;
    }
    
    const currentDateElement = document.getElementById('currentDate');
    if (currentDateElement) {
        currentDateElement.textContent = formatDate(getCurrentDate());
    }
    
    const equipmentElement = document.getElementById('currentEquipment');
    if (equipmentElement) {
        equipmentElement.innerHTML = `
            <i class="${currentEquipment.icon}" style="color: ${currentEquipment.color}"></i>
            ${currentEquipment.name}
        `;
    }
    
    const parameterElement = document.getElementById('currentParameter');
    if (parameterElement) {
        parameterElement.innerHTML = `
            <i class="${currentParameter.icon}" style="color: ${currentParameter.color}"></i>
            ${currentParameter.name} (${currentParameter.code})
        `;
    }
    
    // Update progress bar
    const totalParams = equipments.length * parameters.length;
    const currentProgress = (dataEntryState.currentEquipmentIndex * parameters.length) + dataEntryState.currentParameterIndex;
    const progressPercent = totalParams > 0 ? Math.round((currentProgress / totalParams) * 100) : 0;
    
    const progressFill = document.getElementById('progressFill');
    if (progressFill) {
        progressFill.style.width = `${progressPercent}%`;
    }
    
    // Update input field
    const existingValue = dataEntryState.dateData[currentEquipment.id]?.[currentParameter.id];
    const input = document.getElementById('dataInput');
    
    if (input) {
        if (existingValue !== undefined) {
            input.value = existingValue;
        } else {
            input.value = '';
        }
        
        const maxValue = currentParameter.type === 'velocity' ? 20 : 2;
        input.max = maxValue;
        input.setAttribute('data-parameter', currentParameter.id);
        
        // Update input class for styling
        input.className = input.className.replace(/parameter-\w+/g, '');
        input.classList.add(`parameter-${currentParameter.type}`);
    }
    
    // Update range info
    const rangeInfo = document.getElementById('rangeInfo');
    if (rangeInfo) {
        const maxValue = currentParameter.type === 'velocity' ? 20 : 2;
        rangeInfo.innerHTML = `
            <small class="range-info ${currentParameter.type}-range">
                <i class="fas fa-info-circle"></i>
                حداکثر مقدار: ${maxValue} | Enter برای ثبت
                ${!offlineManager.isOnline ? ' | <span class="offline-indicator">آفلاین</span>' : ''}
            </small>
        `;
    }
}

async function handleDataInput() {
    const input = document.getElementById('dataInput');
    if (!input) return;
    
    const value = input.value.trim();
    const equipments = getEquipmentByPriorityForDataEntry();
    const parameters = getParametersByPriorityForDataEntry();
    const currentParameter = parameters[dataEntryState.currentParameterIndex];
    const currentEquipment = equipments[dataEntryState.currentEquipmentIndex];
    
    if (!value || !validateValue(value, currentParameter.id)) {
        input.classList.add('shake');
        setTimeout(() => input.classList.remove('shake'), 500);
        const maxValue = currentParameter.type === 'velocity' ? 20 : 2;
        showNotification(`لطفاً مقدار صحیح (0-${maxValue}) وارد کنید`, 'error');
        return;
    }
    
    // Save parameter value
    if (!dataEntryState.dateData[currentEquipment.id]) {
        dataEntryState.dateData[currentEquipment.id] = {};
    }
    dataEntryState.dateData[currentEquipment.id][currentParameter.id] = parseFloat(value);
    
    // Move to next parameter
    dataEntryState.currentParameterIndex++;
    
    if (dataEntryState.currentParameterIndex >= parameters.length) {
        // Last parameter of this equipment - proceed to save
        const equipmentName = currentEquipment.name;
        await saveEquipmentData(currentEquipment.id, equipmentName);
    } else {
        // Continue with next parameter of same equipment
        updateCurrentDisplay();
        if (input) {
            input.value = '';
            input.focus();
        }
    }
}

async function saveEquipmentData(equipmentId, equipmentName) {
    try {
        const today = getCurrentDate();
        const equipmentData = dataEntryState.dateData[equipmentId];
        
        const data = {
            unit: dataEntryState.selectedUnit,
            equipment: equipmentId,
            date: today,
            parameters: equipmentData,
            notes: dataEntryState.currentEquipmentNote || ''
        };
        
        const result = await dbManager.saveVibrateData(data);
        
        if (result.offline) {
            showNotification(`${equipmentName} آفلاین ذخیره شد`, 'info');
        } else {
            showNotification(`${equipmentName} ذخیره شد`, 'success');
        }
        
        // Update sync status
        await updateSyncStatus();
        
        // Reset note for next equipment
        dataEntryState.currentEquipmentNote = '';
        
        // Continue to next equipment
        proceedToNextEquipment();
        
    } catch (error) {
        console.error('Error saving equipment data:', error);
        showNotification('خطا در ذخیره داده‌ها', 'error');
    }
}

function proceedToNextEquipment() {
    const equipments = getEquipmentByPriorityForDataEntry();
    
    dataEntryState.currentParameterIndex = 0;
    dataEntryState.currentEquipmentIndex++;
    
    if (dataEntryState.currentEquipmentIndex >= equipments.length) {
        // All equipment completed
        showNotification('تمام تجهیزات تکمیل شد!', 'success');
        dataEntryState.currentEquipmentIndex = 0;
        setTimeout(() => {
            switchDataEntryMode('edit');
            showNotification('اکنون می‌توانید داده‌ها را ویرایش کنید', 'info');
        }, 1000);
        return;
    }
    
    // Update display for next equipment
    updateCurrentDisplay();
    
    // Focus on input for next equipment
    const dataInput = document.getElementById('dataInput');
    if (dataInput) {
        dataInput.focus();
    }
}

function saveCurrentData() {
    const input = document.getElementById('dataInput');
    if (!input) return;
    
    const value = input.value.trim();
    const parameters = getParametersByPriorityForDataEntry();
    const currentParameter = parameters[dataEntryState.currentParameterIndex];
    
    if (value && validateValue(value, currentParameter.id)) {
        handleDataInput();
    } else {
        const maxValue = currentParameter.type === 'velocity' ? 20 : 2;
        showNotification(`لطفاً مقدار صحیح (0-${maxValue}) وارد کنید`, 'error');
    }
}

function resetEntry() {
    dataEntryState.currentEquipmentIndex = 0;
    dataEntryState.currentParameterIndex = 0;
    updateCurrentDisplay();
    const dataInput = document.getElementById('dataInput');
    if (dataInput) {
        dataInput.focus();
    }
}

// ==================== OFFLINE PAGE ====================
// offline.html (separate file)