// auth.js - Authentication management with PWA support
class AuthManager {
    constructor() {
        this.supabase = null;
        this.currentUser = null;
        this.userProfile = null;
        this.isInitialized = false;
    }

    async initialize() {
        try {
            // Initialize Supabase
            this.supabase = supabase.createClient(
                'YOUR_SUPABASE_URL',
                'YOUR_SUPABASE_ANON_KEY'
            );

            // Initialize Database Manager
            await dbManager.initialize(this.supabase);

            // Check for existing session
            const { data: { session } } = await this.supabase.auth.getSession();
            
            if (session?.user) {
                await this.handleUserSession(session.user);
            } else {
                this.showAuthModal();
            }

            // Listen for auth changes
            this.supabase.auth.onAuthStateChange(async (event, session) => {
                console.log('Auth state changed:', event);
                
                switch (event) {
                    case 'SIGNED_IN':
                        if (session?.user) {
                            await this.handleUserSession(session.user);
                        }
                        break;
                    case 'SIGNED_OUT':
                        this.handleSignOut();
                        break;
                    case 'TOKEN_REFRESHED':
                        console.log('Token refreshed');
                        break;
                }
            });

            this.isInitialized = true;
            console.log('Auth Manager initialized');

        } catch (error) {
            console.error('Failed to initialize Auth Manager:', error);
            this.showAuthModal();
        }
    }

    async handleUserSession(user) {
        try {
            this.currentUser = user;
            
            // Get user profile
            const { data: profile, error } = await dbManager.getUserProfile(user.id);
            
            if (error || !profile) {
                console.error('Error fetching profile:', error);
                this.showAuthModal();
                return;
            }

            this.userProfile = profile;

            // Check if user is approved
            if (!profile.is_approved) {
                this.showPendingApprovalModal();
                return;
            }

            // Load user settings
            await this.loadUserSettings();
            
            // Hide auth modals and show main app
            this.hideAuthModal();
            this.hidePendingApprovalModal();
            this.showMainApp();
            this.updateUserDisplay();

            // Setup PWA features for authenticated users
            await this.setupPWAFeatures();

        } catch (error) {
            console.error('Error handling user session:', error);
            this.showAuthModal();
        }
    }

    async setupPWAFeatures() {
        try {
            // Subscribe to push notifications if supported
            if ('Notification' in window && swManager) {
                const permission = await Notification.requestPermission();
                if (permission === 'granted') {
                    await swManager.subscribeToPush();
                }
            }

            // Register for background sync
            if (swManager) {
                await swManager.registerBackgroundSync('vibrate-data-sync');
                await swManager.registerBackgroundSync('settings-sync');
            }

        } catch (error) {
            console.error('Error setting up PWA features:', error);
        }
    }

    handleSignOut() {
        this.currentUser = null;
        this.userProfile = null;
        this.hideMainApp();
        this.showAuthModal();
        
        // Clear offline data for security
        if (offlineManager) {
            offlineManager.clearStore('cached_data');
        }
    }

    showAuthModal() {
        const authModal = document.getElementById('authModal');
        if (authModal) {
            authModal.classList.add('active');
        }
        
        const mainApp = document.querySelector('.main-app');
        if (mainApp) {
            mainApp.style.display = 'none';
        }
    }

    hideAuthModal() {
        const authModal = document.getElementById('authModal');
        if (authModal) {
            authModal.classList.remove('active');
        }
    }

    showPendingApprovalModal() {
        const modal = document.getElementById('pendingApprovalModal');
        if (modal) {
            modal.classList.add('active');
        }
    }

    hidePendingApprovalModal() {
        const modal = document.getElementById('pendingApprovalModal');
        if (modal) {
            modal.classList.remove('active');
        }
    }

    showMainApp() {
        const mainApp = document.querySelector('.main-app');
        if (mainApp) {
            mainApp.style.display = 'block';
        }
        
        // Show user management for admin
        if (this.userProfile?.role === 'admin') {
            this.showUserManagement();
        }

        // Initialize app sections
        this.initializeAppSections();
    }

    hideMainApp() {
        const mainApp = document.querySelector('.main-app');
        if (mainApp) {
            mainApp.style.display = 'none';
        }
    }

    initializeAppSections() {
        // Initialize the app with loaded data
        if (typeof initDataEntry === 'function') {
            initDataEntry();
        }
        
        // Load initial stats
        if (typeof loadDatabaseStats === 'function') {
            loadDatabaseStats();
        }
    }

    updateUserDisplay() {
        if (!this.userProfile) return;

        const elements = {
            'userName': this.userProfile.full_name,
            'userRole': this.getRoleName(this.userProfile.role),
            'currentUserDisplay': this.userProfile.full_name,
            'currentUserDisplayCharts': this.userProfile.full_name,
            'currentUserDisplayAnalysis': this.userProfile.full_name
        };
        
        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });

        // Update avatar
        const avatar = document.getElementById('userAvatar');
        if (avatar && this.userProfile.full_name) {
            avatar.textContent = this.userProfile.full_name.charAt(0).toUpperCase();
        }

        // Update unit-specific UI elements
        this.updateUnitSpecificUI();
    }

    updateUnitSpecificUI() {
        const userUnit = this.userProfile.unit;
        
        // Hide/show unit buttons based on user access
        const unitButtons = document.querySelectorAll('.unit-btn');
        unitButtons.forEach(btn => {
            const btnUnit = btn.textContent.includes('DRI 1') ? 'DRI1' : 'DRI2';
            
            if (userUnit === 'BOTH' || userUnit === btnUnit) {
                btn.style.display = 'flex';
            } else {
                btn.style.display = 'none';
            }
        });

        // Update navigation based on role
        this.updateNavigationForRole();
    }

    updateNavigationForRole() {
        const roleBasedSections = {
            'admin': ['user-management'],
            'supervisor': ['analysis', 'database'],
            'engineer': ['charts', 'analysis'],
            'technician': ['data-entry', 'view-data', 'charts'],
            'operator': ['data-entry', 'view-data']
        };

        const userRole = this.userProfile.role;
        const allowedSections = roleBasedSections[userRole] || ['data-entry'];
        
        // Show/hide navigation tabs
        const navTabs = document.querySelectorAll('.nav-tab');
        navTabs.forEach(tab => {
            const onclick = tab.getAttribute('onclick');
            if (onclick) {
                const sectionMatch = onclick.match(/showSection\('([^']+)'\)/);
                if (sectionMatch) {
                    const sectionId = sectionMatch[1];
                    
                    if (allowedSections.includes(sectionId)) {
                        tab.style.display = 'flex';
                    } else {
                        tab.style.display = 'none';
                    }
                }
            }
        });
    }

    async loadUserSettings() {
        try {
            const { data: settings } = await dbManager.getUserSettings(this.currentUser.id);
            
            if (settings) {
                // Apply settings to global currentSettings
                Object.assign(currentSettings, settings);
                applyTheme();
            }

        } catch (error) {
            console.error('Failed to load user settings:', error);
        }
    }

    async saveUserSettings(settings) {
        try {
            const { error } = await dbManager.saveUserSettings(settings);
            
            if (error) {
                throw error;
            }

            // Update global settings
            Object.assign(currentSettings, settings);
            showNotificationWithOfflineSupport('تنظیمات ذخیره شد', 'success');

        } catch (error) {
            console.error('Error saving settings:', error);
            showNotificationWithOfflineSupport('خطا در ذخیره تنظیمات', 'error');
        }
    }

    showUserManagement() {
        const userMgmtSection = document.getElementById('user-management');
        if (userMgmtSection) {
            userMgmtSection.style.display = 'block';
            this.addUserManagementTab();
            this.loadUserManagement();
        }
    }

    addUserManagementTab() {
        // Check if tab already exists
        if (document.querySelector('.nav-tab[onclick*="user-management"]')) {
            return;
        }

        const navTabs = document.querySelector('.nav-tabs');
        const userManagementTab = document.createElement('button');
        userManagementTab.className = 'nav-tab';
        userManagementTab.onclick = () => showSection('user-management');
        userManagementTab.innerHTML = `
            <i class="fas fa-users-cog"></i>
            مدیریت کاربران
        `;
        
        // Insert before settings tab
        const settingsTab = document.querySelector('.nav-tab[onclick*="settings"]');
        if (settingsTab) {
            navTabs.insertBefore(userManagementTab, settingsTab);
        } else {
            navTabs.appendChild(userManagementTab);
        }
    }

    async loadUserManagement() {
        try {
            if (!offlineManager.isOnline) {
                showNotificationWithOfflineSupport('مدیریت کاربران نیاز به اتصال آنلاین دارد', 'warning');
                return;
            }

            const { data: profiles, error } = await dbManager.getAllProfiles();
            
            if (error) {
                throw error;
            }

            const pendingUsers = profiles.filter(p => !p.is_approved);
            const approvedUsers = profiles.filter(p => p.is_approved);

            this.renderPendingUsers(pendingUsers);
            this.renderApprovedUsers(approvedUsers);

        } catch (error) {
            console.error('Error loading user management:', error);
            showNotificationWithOfflineSupport('خطا در بارگذاری کاربران', 'error');
        }
    }

    renderPendingUsers(users) {
        const container = document.getElementById('pendingUsersList');
        if (!container) return;

        container.innerHTML = '';

        if (users.length === 0) {
            container.innerHTML = '<p class="text-center text-secondary">کاربری در انتظار تایید نیست</p>';
            return;
        }

        users.forEach(user => {
            const userCard = document.createElement('div');
            userCard.className = 'user-card pending';
            userCard.innerHTML = `
                <div class="user-info">
                    <div class="user-avatar">${user.full_name.charAt(0).toUpperCase()}</div>
                    <div class="user-details">
                        <div class="user-name">${user.full_name}</div>
                        <div class="user-role">${this.getRoleName(user.role)} - ${this.getUnitName(user.unit)}</div>
                        <div class="user-date">درخواست: ${formatDate(user.created_at)}</div>
                    </div>
                </div>
                <div class="user-actions">
                    <button class="btn btn-success btn-sm" onclick="authManager.approveUser('${user.id}')">
                        <i class="fas fa-check"></i>
                        تایید
                    </button>
                    <button class="btn btn-error btn-sm" onclick="authManager.rejectUser('${user.id}')">
                        <i class="fas fa-times"></i>
                        رد
                    </button>
                </div>
            `;
            container.appendChild(userCard);
        });
    }

    renderApprovedUsers(users) {
        const container = document.getElementById('approvedUsersList');
        if (!container) return;

        container.innerHTML = '';

        users.forEach(user => {
            const userCard = document.createElement('div');
            userCard.className = 'user-card approved';
            userCard.innerHTML = `
                <div class="user-info">
                    <div class="user-avatar">${user.full_name.charAt(0).toUpperCase()}</div>
                    <div class="user-details">
                        <div class="user-name">${user.full_name}</div>
                        <div class="user-role">${this.getRoleName(user.role)} - ${this.getUnitName(user.unit)}</div>
                        <div class="user-date">عضویت: ${formatDate(user.created_at)}</div>
                    </div>
                </div>
                <div class="user-actions">
                    ${user.id !== this.currentUser.id ? `
                        <button class="btn btn-warning btn-sm" onclick="authManager.suspendUser('${user.id}')">
                            <i class="fas fa-ban"></i>
                            تعلیق
                        </button>
                    ` : `
                        <span class="badge badge-primary">شما</span>
                    `}
                </div>
            `;
            container.appendChild(userCard);
        });
    }

    async approveUser(userId) {
        try {
            const { error } = await dbManager.approveUser(userId);
            
            if (error) {
                throw error;
            }

            showNotificationWithOfflineSupport('کاربر تایید شد', 'success');
            await this.loadUserManagement();

        } catch (error) {
            console.error('Error approving user:', error);
            showNotificationWithOfflineSupport('خطا در تایید کاربر', 'error');
        }
    }

    async rejectUser(userId) {
        if (!confirm('آیا از رد این کاربر مطمئن هستید؟')) {
            return;
        }

        try {
            const { error } = await dbManager.rejectUser(userId);
            
            if (error) {
                throw error;
            }

            showNotificationWithOfflineSupport('کاربر رد شد', 'success');
            await this.loadUserManagement();

        } catch (error) {
            console.error('Error rejecting user:', error);
            showNotificationWithOfflineSupport('خطا در رد کاربر', 'error');
        }
    }

    async suspendUser(userId) {
        if (!confirm('آیا از تعلیق این کاربر مطمئن هستید؟')) {
            return;
        }

        try {
            const { error } = await dbManager.rejectUser(userId);
            
            if (error) {
                throw error;
            }

            showNotificationWithOfflineSupport('کاربر تعلیق شد', 'success');
            await this.loadUserManagement();

        } catch (error) {
            console.error('Error suspending user:', error);
            showNotificationWithOfflineSupport('خطا در تعلیق کاربر', 'error');
        }
    }

    getRoleName(role) {
        const roles = {
            'operator': 'اپراتور',
            'technician': 'تکنسین',
            'engineer': 'مهندس',
            'supervisor': 'سرپرست',
            'admin': 'مدیر'
        };
        return roles[role] || role;
    }

    getUnitName(unit) {
        const units = {
            'DRI1': 'واحد 1',
            'DRI2': 'واحد 2',
            'BOTH': 'هر دو واحد'
        };
        return units[unit] || unit;
    }
}

// Authentication API functions
async function handleLogin() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
        showNotificationWithOfflineSupport('لطفاً تمام فیلدها را پر کنید', 'error');
        return;
    }

    const loginBtn = document.getElementById('loginBtn');
    loginBtn.disabled = true;
    loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> در حال ورود...';

    try {
        const { error } = await authManager.supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            throw error;
        }

        // Success is handled by auth state change listener

    } catch (error) {
        console.error('Login error:', error);
        showNotificationWithOfflineSupport('خطا در ورود: ' + error.message, 'error');
        
        loginBtn.disabled = false;
        loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> ورود';
    }
}

async function handleRegister() {
    const fullName = document.getElementById('registerFullName').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    const role = document.getElementById('registerRole').value;
    const unit = document.getElementById('registerUnit').value;
    
    if (!fullName || !email || !password || !role || !unit) {
        showNotificationWithOfflineSupport('لطفاً تمام فیلدها را پر کنید', 'error');
        return;
    }

    if (password.length < 6) {
        showNotificationWithOfflineSupport('رمز عبور باید حداقل 6 کاراکتر باشد', 'error');
        return;
    }

    const registerBtn = document.getElementById('registerBtn');
    registerBtn.disabled = true;
    registerBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> در حال ثبت نام...';

    try {
        const { error } = await authManager.supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                    role: role,
                    unit: unit
                }
            }
        });

        if (error) {
            throw error;
        }

        showNotificationWithOfflineSupport('ثبت نام موفق! لطفاً ایمیل خود را بررسی کنید', 'success');
        switchToLogin();

    } catch (error) {
        console.error('Register error:', error);
        showNotificationWithOfflineSupport('خطا در ثبت نام: ' + error.message, 'error');
        
        registerBtn.disabled = false;
        registerBtn.innerHTML = '<i class="fas fa-user-plus"></i> ثبت نام';
    }
}

async function handleLogout() {
    try {
        await authManager.supabase.auth.signOut();
        // Success is handled by auth state change listener
    } catch (error) {
        console.error('Logout error:', error);
        showNotificationWithOfflineSupport('خطا در خروج', 'error');
    }
}

function switchToRegister() {
    document.getElementById('loginForm').classList.add('d-none');
    document.getElementById('registerForm').classList.remove('d-none');
    document.getElementById('authModalTitle').textContent = 'ثبت نام';
}

function switchToLogin() {
    document.getElementById('registerForm').classList.add('d-none');
    document.getElementById('loginForm').classList.remove('d-none');
    document.getElementById('authModalTitle').textContent = 'ورود به سیستم';
}

// Offline-aware notification function
function showNotificationWithOfflineSupport(message, type = 'info') {
    if (!offlineManager.isOnline) {
        message = `[آفلاین] ${message}`;
    }
    showNotification(message, type);
}

// Initialize Auth Manager
let authManager;
document.addEventListener('DOMContentLoaded', async () => {
    authManager = new AuthManager();
    await authManager.initialize();
});