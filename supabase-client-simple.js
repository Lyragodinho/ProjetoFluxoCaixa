// Supabase Configuration
const SUPABASE_URL = 'https://casaxluielarrbfwbdmr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNhc2F4bHVpZWxhcnJiZndiZG1yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxMTAxNjcsImV4cCI6MjA4MjY4NjE2N30.C-NOwIO4O0FEl5Q4YfY975uJWqRfqNA2NuRQ_LMnhOY';

// Simple Supabase client for demo
class SimpleSupabaseClient {
    constructor() {
        this.url = SUPABASE_URL;
        this.key = SUPABASE_ANON_KEY;
        this.userEmail = 'demo@feedis.com';
    }

    // Generic fetch method
    async fetch(path, options = {}) {
        const url = `${this.url}/rest/v1/${path}`;
        const headers = {
            'apikey': this.key,
            'Authorization': `Bearer ${this.key}`,
            'Content-Type': 'application/json',
            ...options.headers
        };

        const response = await fetch(url, {
            ...options,
            headers
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        return response.json();
    }

    // Initialize
    async init() {
        try {
            console.log('Initializing Supabase...');
            
            // Test connection
            await this.fetch('users?limit=1');
            
            // Ensure demo user exists
            await this.ensureUser();
            
            console.log('✅ Supabase initialized successfully');
            return true;
        } catch (error) {
            console.error('❌ Supabase initialization failed:', error.message);
            return false;
        }
    }

    // Ensure demo user exists
    async ensureUser() {
        try {
            // Check if user exists
            const users = await this.fetch(`users?email=eq.${this.userEmail}`);
            
            if (users.length === 0) {
                // Create demo user
                await this.fetch('users', {
                    method: 'POST',
                    body: JSON.stringify({
                        email: this.userEmail,
                        name: 'Demo User'
                    })
                });
                console.log('Demo user created');
            }
        } catch (error) {
            console.warn('Failed to ensure user exists:', error.message);
        }
    }

    // Save all data
    async saveAllData(appData) {
        try {
            console.log('💾 Saving data to Supabase...');
            
            // Save user settings
            await this.saveUserSettings(appData.startDate);
            
            // Save each data type
            await this.saveDataType('balances', appData.balances);
            await this.saveDataType('revenues', appData.revenues);
            await this.saveDataType('receipts', appData.receipts);
            await this.saveDataType('suppliers', appData.suppliers);
            await this.saveDataType('outflows', appData.outflows);
            
            console.log('✅ All data saved successfully');
            return { success: true, message: 'Dados salvos com sucesso!' };
        } catch (error) {
            console.error('❌ Save failed:', error.message);
            throw error;
        }
    }

    // Load all data
    async loadAllData() {
        try {
            console.log('📥 Loading data from Supabase...');
            
            const result = {
                startDate: new Date().toISOString().split('T')[0],
                balances: [],
                revenues: [],
                receipts: [],
                suppliers: [],
                outflows: []
            };

            // Load user settings
            const settings = await this.loadUserSettings();
            if (settings) {
                result.startDate = settings.start_date;
            }

            // Load each data type
            result.balances = await this.loadDataType('balances');
            result.revenues = await this.loadDataType('revenues');
            result.receipts = await this.loadDataType('receipts');
            result.suppliers = await this.loadDataType('suppliers');
            result.outflows = await this.loadDataType('outflows');

            console.log('✅ Data loaded successfully');
            return result;
        } catch (error) {
            console.error('❌ Load failed:', error.message);
            return {
                startDate: new Date().toISOString().split('T')[0],
                balances: [],
                revenues: [],
                receipts: [],
                suppliers: [],
                outflows: []
            };
        }
    }

    // Save user settings
    async saveUserSettings(startDate) {
        try {
            // Delete existing settings
            await this.fetch(`user_settings?user_id=eq.${this.userEmail}`, {
                method: 'DELETE'
            });

            // Insert new settings
            await this.fetch('user_settings', {
                method: 'POST',
                body: JSON.stringify({
                    user_id: this.userEmail,
                    start_date: startDate,
                    preferences: {}
                })
            });
        } catch (error) {
            console.warn('Failed to save user settings:', error.message);
        }
    }

    // Load user settings
    async loadUserSettings() {
        try {
            const settings = await this.fetch(`user_settings?user_id=eq.${this.userEmail}`);
            return settings[0] || null;
        } catch (error) {
            console.warn('Failed to load user settings:', error.message);
            return null;
        }
    }

    // Save data type
    async saveDataType(dataType, items) {
        try {
            if (!items || items.length === 0) return;

            // Delete existing data
            await this.fetch(`cash_flow_data?user_id=eq.${this.userEmail}&data_type=eq.${dataType}`, {
                method: 'DELETE'
            });

            // Insert new data
            const dataToInsert = items.map(item => ({
                user_id: this.userEmail,
                data_type: dataType,
                item_id: item.id?.toString() || Date.now().toString(),
                item_data: item
            }));

            await this.fetch('cash_flow_data', {
                method: 'POST',
                body: JSON.stringify(dataToInsert)
            });

            console.log(`✅ ${dataType}: ${items.length} items saved`);
        } catch (error) {
            console.warn(`Failed to save ${dataType}:`, error.message);
        }
    }

    // Load data type
    async loadDataType(dataType) {
        try {
            const data = await this.fetch(`cash_flow_data?user_id=eq.${this.userEmail}&data_type=eq.${dataType}`);
            return data.map(item => item.item_data);
        } catch (error) {
            console.warn(`Failed to load ${dataType}:`, error.message);
            return [];
        }
    }

    // Export data
    async exportData() {
        try {
            const data = await this.loadAllData();
            const dataStr = JSON.stringify(data, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `feedis_data_${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            URL.revokeObjectURL(url);
            
            return { success: true, message: 'Dados exportados com sucesso!' };
        } catch (error) {
            throw new Error(`Failed to export data: ${error.message}`);
        }
    }
}

// Create global instance
window.supabaseClient = new SimpleSupabaseClient();
