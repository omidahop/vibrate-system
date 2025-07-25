// database.js
class DatabaseManager {
  constructor() {
    this.supabase = null;
    this.initialized = false;
  }

  async initialize(supabaseClient) {
    this.supabase = supabaseClient;
    this.initialized = true;
    console.log('Database Manager initialized');
  }

  // Vibrate Data Operations
  async saveVibrateData(data) {
    try {
      // Try online first
      if (offlineManager.isOnline) {
        const { data: result, error } = await this.supabase
          .from('vibrate_data')
          .insert({
            ...data,
            user_id: authManager.currentUser.id,
            created_at: new Date().toISOString()
          })
          .select()
          .single();

        if (!error) {
          console.log('Data saved online');
          return { data: result, offline: false };
        } else {
          console.error('Online save failed:', error);
          // Fall back to offline
        }
      }

      // Save offline
      const offlineData = await offlineManager.saveVibrateDataOffline(data);
      return { data: offlineData, offline: true };

    } catch (error) {
      console.error('Failed to save vibrate data:', error);
      throw error;
    }
  }

  async getVibrateData(filters = {}) {
    try {
      let onlineData = [];
      let offlineData = [];

      // Get online data if available
      if (offlineManager.isOnline) {
        const cacheKey = `vibrate_data_${JSON.stringify(filters)}`;
        const cachedData = await offlineManager.getCachedData(cacheKey);

        if (cachedData) {
          onlineData = cachedData;
        } else {
          const { data, error } = await this.queryVibrateData(filters);
          if (!error && data) {
            onlineData = data;
            await offlineManager.cacheData(cacheKey, data, 300000); // 5 minutes cache
          }
        }
      }

      // Get offline data
      offlineData = await offlineManager.getOfflineVibrateData(filters);

      // Merge and deduplicate
      const mergedData = this.mergeDataArrays(onlineData, offlineData);
      
      return {
        data: mergedData,
        online: onlineData.length,
        offline: offlineData.length,
        total: mergedData.length
      };

    } catch (error) {
      console.error('Failed to get vibrate data:', error);
      throw error;
    }
  }

  async queryVibrateData(filters) {
    let query = this.supabase
      .from('vibrate_data')
      .select(`
        *,
        profiles:user_id (
          full_name,
          unit
        )
      `)
      .order('date', { ascending: false });

    if (filters.unit) {
      query = query.eq('unit', filters.unit);
    }
    if (filters.equipment) {
      query = query.eq('equipment', filters.equipment);
    }
    if (filters.date) {
      query = query.eq('date', filters.date);
    }
    if (filters.dateFrom) {
      query = query.gte('date', filters.dateFrom);
    }
    if (filters.dateTo) {
      query = query.lte('date', filters.dateTo);
    }

    return await query;
  }

  async updateVibrateData(id, updates) {
    try {
      if (offlineManager.isOnline) {
        const { data, error } = await this.supabase
          .from('vibrate_data')
          .update({
            ...updates,
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .select()
          .single();

        if (!error) {
          console.log('Data updated online');
          return { data, offline: false };
        }
      }

      // Handle offline update
      throw new Error('Offline updates not implemented yet');

    } catch (error) {
      console.error('Failed to update vibrate data:', error);
      throw error;
    }
  }

  // Settings Operations
  async saveUserSettings(settings) {
    try {
      if (offlineManager.isOnline) {
        const { data, error } = await this.supabase
          .from('user_settings')
          .upsert({
            user_id: authManager.currentUser.id,
            ...settings,
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (!error) {
          console.log('Settings saved online');
          return { data, offline: false };
        }
      }

      // Save offline
      const offlineSettings = await offlineManager.saveSettingsOffline({
        user_id: authManager.currentUser.id,
        ...settings
      });
      
      return { data: offlineSettings, offline: true };

    } catch (error) {
      console.error('Failed to save settings:', error);
      throw error;
    }
  }

  async getUserSettings(userId) {
    try {
      if (offlineManager.isOnline) {
        const cacheKey = `settings_${userId}`;
        const cachedSettings = await offlineManager.getCachedData(cacheKey);

        if (cachedSettings) {
          return { data: cachedSettings, offline: false };
        }

        const { data, error } = await this.supabase
          .from('user_settings')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (!error && data) {
          await offlineManager.cacheData(cacheKey, data, 3600000); // 1 hour
          return { data, offline: false };
        }
      }

      // Return default settings if no online data
      return { 
        data: this.getDefaultSettings(), 
        offline: true 
      };

    } catch (error) {
      console.error('Failed to get settings:', error);
      return { 
        data: this.getDefaultSettings(), 
        offline: true 
      };
    }
  }

  getDefaultSettings() {
    return {
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
  }

  // Profile Operations
  async getUserProfile(userId) {
    try {
      if (!offlineManager.isOnline) {
        throw new Error('Profile requires online connection');
      }

      const cacheKey = `profile_${userId}`;
      const cachedProfile = await offlineManager.getCachedData(cacheKey);

      if (cachedProfile) {
        return { data: cachedProfile };
      }

      const { data, error } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (!error && data) {
        await offlineManager.cacheData(cacheKey, data, 1800000); // 30 minutes
      }

      return { data, error };

    } catch (error) {
      console.error('Failed to get profile:', error);
      throw error;
    }
  }

  async updateUserProfile(userId, updates) {
    try {
      if (!offlineManager.isOnline) {
        throw new Error('Profile updates require online connection');
      }

      const { data, error } = await this.supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (!error && data) {
        // Update cache
        const cacheKey = `profile_${userId}`;
        await offlineManager.cacheData(cacheKey, data, 1800000);
      }

      return { data, error };

    } catch (error) {
      console.error('Failed to update profile:', error);
      throw error;
    }
  }

  // Statistics
  async getDataStats() {
    try {
      if (!offlineManager.isOnline) {
        return await this.getOfflineStats();
      }

      const cacheKey = 'data_stats';
      const cachedStats = await offlineManager.getCachedData(cacheKey);

      if (cachedStats) {
        return { data: cachedStats };
      }

      const { data, error } = await this.supabase
        .from('data_stats')
        .select('*');

      if (!error && data) {
        await offlineManager.cacheData(cacheKey, data, 600000); // 10 minutes
      }

      return { data, error };

    } catch (error) {
      console.error('Failed to get stats:', error);
      throw error;
    }
  }

  async getOfflineStats() {
    try {
      const offlineData = await offlineManager.getAllFromStore('vibrate_data_offline');
      
      // Generate basic stats from offline data
      const stats = [];
      const groupedData = {};

      offlineData.forEach(item => {
        const key = `${item.unit}_${item.user_id}`;
        if (!groupedData[key]) {
          groupedData[key] = {
            unit: item.unit,
            user_name: 'کاربر آفلاین',
            total_records: 0,
            total_days: new Set(),
            total_equipments: new Set(),
            first_entry: item.date,
            last_entry: item.date
          };
        }

        const group = groupedData[key];
        group.total_records++;
        group.total_days.add(item.date);
        group.total_equipments.add(item.equipment);
        
        if (item.date < group.first_entry) group.first_entry = item.date;
        if (item.date > group.last_entry) group.last_entry = item.date;
      });

      Object.values(groupedData).forEach(group => {
        stats.push({
          ...group,
          total_days: group.total_days.size,
          total_equipments: group.total_equipments.size
        });
      });

      return { data: stats };

    } catch (error) {
      console.error('Failed to get offline stats:', error);
      return { data: [] };
    }
  }

  // Admin Operations
  async getAllProfiles() {
    if (!offlineManager.isOnline) {
      throw new Error('Admin features require online connection');
    }

    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    return { data, error };
  }

  async approveUser(userId) {
    if (!offlineManager.isOnline) {
      throw new Error('User management requires online connection');
    }

    const { data, error } = await this.supabase
      .from('profiles')
      .update({ 
        is_approved: true, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', userId)
      .select()
      .single();

    return { data, error };
  }

  async rejectUser(userId) {
    if (!offlineManager.isOnline) {
      throw new Error('User management requires online connection');
    }

    const { data, error } = await this.supabase
      .from('profiles')
      .update({ 
        is_approved: false, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', userId)
      .select()
      .single();

    return { data, error };
  }

  // Utility methods
  mergeDataArrays(onlineData, offlineData) {
    const merged = [...onlineData];
    const onlineKeys = new Set(onlineData.map(item => `${item.unit}_${item.equipment}_${item.date}`));

    offlineData.forEach(item => {
      const key = `${item.unit}_${item.equipment}_${item.date}`;
      if (!onlineKeys.has(key)) {
        merged.push({
          ...item,
          offline: true,
          profiles: {
            full_name: 'کاربر آفلاین',
            unit: item.unit
          }
        });
      }
    });

    return merged.sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  async clearCache() {
    try {
      await offlineManager.clearStore('cached_data');
      console.log('Cache cleared');
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }
}

// Initialize Database Manager
let dbManager;
if (typeof window !== 'undefined') {
  dbManager = new DatabaseManager();
}