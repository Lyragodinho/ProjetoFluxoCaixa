// Supabase Configuration
const SUPABASE_URL = 'https://casaxluielarrbfwbdmr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNhc2F4bHVpZWxhcnJiZndiZG1yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxMTAxNjcsImV4cCI6MjA4MjY4NjE2N30.C-NOwIO4O0FEl5Q4YfY975uJWqRfqNA2NuRQ_LMnhOY';

// Create Supabase client
class SupabaseClient {
    constructor() {
        this.url = SUPABASE_URL;
        this.key = SUPABASE_ANON_KEY;
        this.user = null;
    }

    // Initialize client
    async init() {
        try {
            // For demo purposes, we'll use a fixed user ID
            // This allows us to work without proper authentication
            const userEmail = this.getUserEmail();
            console.log('Initializing Supabase with user:', userEmail);
            
            // Ensure user exists in database
            await this.ensureUserExists(userEmail);
            
            this.user = { email: userEmail };
            console.log('Supabase initialized successfully');
        } catch (error) {
            console.warn('Supabase initialization:', error.message);
        }
    }

    // Get user email (for demo, using a simple approach)
    getUserEmail() {
        // In production, this would come from proper authentication
        return localStorage.getItem('feedis_user_email') || 'demo@feedis.com';
    }

    // Generic fetch method for Supabase REST API
    async fetch(path, options = {}) {
        const url = `${this.url}/rest/v1/${path}`;
        const headers = {
            'apikey': this.key,
            'Authorization': `Bearer ${this.key}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal',
            ...options.headers
        };

        try {
            console.log('Supabase fetch:', url, options.method || 'GET');
            
            const response = await fetch(url, {
                ...options,
                headers
            });

            console.log('Supabase response status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Supabase error response:', errorText);
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            const data = await response.json();
            console.log('Supabase response data:', data);
            return data;
        } catch (error) {
            console.error('Supabase fetch error:', error);
            throw error;
        }
    }

    // Save user settings
    async saveUserSettings(settings) {
        try {
            const userEmail = this.getUserEmail();
            
            // First, ensure user exists
            await this.ensureUserExists(userEmail);

            // Upsert user settings using POST with ON CONFLICT
            const response = await this.fetch('user_settings', {
                method: 'POST',
                headers: {
                    'Prefer': 'resolution=merge-duplicates'
                },
                body: JSON.stringify({
                    user_id: userEmail,
                    start_date: settings.startDate,
                    preferences: settings.preferences || {}
                })
            });

            return response;
        } catch (error) {
            throw new Error(`Failed to save user settings: ${error.message}`);
        }
    }

    // Load user settings
    async loadUserSettings() {
        try {
            const userEmail = this.getUserEmail();
            const response = await this.fetch(`user_settings?user_id=eq.${userEmail}`);
            return response[0] || null;
        } catch (error) {
            console.warn('Failed to load user settings:', error.message);
            return null;
        }
    }

    // Save cash flow data
    async saveCashFlowData(dataType, items) {
        try {
            const userEmail = this.getUserEmail();
            
            // Ensure user exists
            await this.ensureUserExists(userEmail);

            console.log(`Saving ${dataType} data:`, items.length, 'items');

            // Delete existing data for this type
            await this.fetch(`cash_flow_data?user_id=eq.${userEmail}&data_type=eq.${dataType}`, {
                method: 'DELETE'
            });

            // Insert new data in batches if needed
            if (items && items.length > 0) {
                const dataToInsert = items.map(item => ({
                    user_id: userEmail,
                    data_type: dataType,
                    item_id: item.id?.toString() || Date.now().toString(),
                    item_data: item
                }));

                console.log('Inserting data:', dataToInsert);

                await this.fetch('cash_flow_data', {
                    method: 'POST',
                    headers: {
                        'Prefer': 'return=minimal'
                    },
                    body: JSON.stringify(dataToInsert)
                });
            }

            return { success: true };
        } catch (error) {
            throw new Error(`Failed to save ${dataType}: ${error.message}`);
        }
    }

    // Load cash flow data
    async loadCashFlowData(dataType) {
        try {
            const userEmail = this.getUserEmail();
            const response = await this.fetch(`cash_flow_data?user_id=eq.${userEmail}&data_type=eq.${dataType}`);
            return response.map(item => item.item_data);
        } catch (error) {
            console.warn(`Failed to load ${dataType}:`, error.message);
            return [];
        }
    }

    // Load all cash flow data
    async loadAllCashFlowData() {
        try {
            const userEmail = this.getUserEmail();
            const response = await this.fetch(`cash_flow_data?user_id=eq.${userEmail}`);
            
            const result = {
                balances: [],
                revenues: [],
                receipts: [],
                suppliers: [],
                outflows: []
            };

            response.forEach(item => {
                if (result[item.data_type]) {
                    result[item.data_type].push(item.item_data);
                }
            });

            return result;
        } catch (error) {
            console.warn('Failed to load all cash flow data:', error.message);
            return {
                balances: [],
                revenues: [],
                receipts: [],
                suppliers: [],
                outflows: []
            };
        }
    }

    // Save all app data
    async saveAllData(appData) {
        try {
            console.log('Saving all data to Supabase...');
            
            const results = await Promise.allSettled([
                this.saveUserSettings({ startDate: appData.startDate }),
                this.saveCashFlowData('balances', appData.balances),
                this.saveCashFlowData('revenues', appData.revenues),
                this.saveCashFlowData('receipts', appData.receipts),
                this.saveCashFlowData('suppliers', appData.suppliers),
                this.saveCashFlowData('outflows', appData.outflows)
            ]);

            const errors = results.filter(result => result.status === 'rejected');
            if (errors.length > 0) {
                console.error('Some operations failed:', errors);
                throw new Error(`Some operations failed: ${errors.map(e => e.reason.message).join(', ')}`);
            }

            console.log('All data saved successfully');
            return { success: true, message: 'Todos os dados salvos com sucesso!' };
        } catch (error) {
            console.error('Failed to save all data:', error);
            throw new Error(`Failed to save all data: ${error.message}`);
        }
    }

    // Load all app data
    async loadAllData() {
        try {
            console.log('Loading all data from Supabase...');
            
            const [settings, cashFlowData] = await Promise.allSettled([
                this.loadUserSettings(),
                this.loadAllCashFlowData()
            ]);

            const result = {
                startDate: new Date().toISOString().split('T')[0],
                balances: [],
                revenues: [],
                receipts: [],
                suppliers: [],
                outflows: []
            };

            if (settings.status === 'fulfilled' && settings.value) {
                result.startDate = settings.value.start_date;
            }

            if (cashFlowData.status === 'fulfilled') {
                Object.assign(result, cashFlowData.value);
            }

            console.log('Data loaded successfully:', result);
            return result;
        } catch (error) {
            console.warn('Failed to load all data:', error.message);
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

    // Ensure user exists in users table
    async ensureUserExists(email) {
        try {
            console.log('Ensuring user exists:', email);
            
            // Check if user exists
            const users = await this.fetch(`users?email=eq.${email}`);
            
            if (users.length === 0) {
                // Create user
                console.log('Creating new user:', email);
                await this.fetch('users', {
                    method: 'POST',
                    headers: {
                        'Prefer': 'return=minimal'
                    },
                    body: JSON.stringify({
                        email: email,
                        name: email.split('@')[0]
                    })
                });
                console.log('User created successfully');
            } else {
                console.log('User already exists');
            }
        } catch (error) {
            console.warn('Failed to ensure user exists:', error.message);
            // Don't throw error, continue with demo mode
        }
    }

    // Export data to JSON
    async exportData() {
        try {
            const data = await this.loadAllData();
            const dataStr = JSON.stringify(data, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `feedis_supabase_data_${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            URL.revokeObjectURL(url);
            
            return { success: true, message: 'Dados exportados com sucesso!' };
        } catch (error) {
            throw new Error(`Failed to export data: ${error.message}`);
        }
    }
}

// Create global instance
window.supabaseClient = new SupabaseClient();
