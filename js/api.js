/**
 * API Manager for TVRI Equipment Management System
 * Handles communication with Google Apps Script backend
 */

class APIManager {
    constructor() {
        this.baseURL = CONFIG.GAS_WEB_APP_URL;
        this.retryAttempts = CONFIG.RETRY_ATTEMPTS;
        this.retryDelay = CONFIG.RETRY_DELAY;
        this.requestQueue = [];
        this.isOnline = navigator.onLine;
        
        // Listen for online/offline events
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.updateConnectionStatus(true);
            this.processQueue();
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.updateConnectionStatus(false);
        });
    }

    /**
     * Make API request with retry logic
     */
    async makeRequest(data, attempt = 1) {
        // Use demo mode if enabled
        if (CONFIG.DEMO_MODE) {
            return this.handleDemoRequest(data);
        }

        if (!this.isOnline) {
            throw new Error('Tidak ada koneksi internet');
        }

        if (this.baseURL.includes('YOUR_SCRIPT_ID_HERE')) {
            throw new Error(CONFIG.MESSAGES.ERROR.CONFIG);
        }

        try {
            console.log(`📡 API Request (attempt ${attempt}):`, data);
            
            const response = await fetch(this.baseURL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
                mode: 'cors'
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            console.log('📡 API Response:', result);

            if (!result.success) {
                throw new Error(result.error || 'Unknown server error');
            }

            this.updateConnectionStatus(true);
            return result;

        } catch (error) {
            console.error(`❌ API Error (attempt ${attempt}):`, error);

            // Retry logic
            if (attempt < this.retryAttempts) {
                console.log(`🔄 Retrying in ${this.retryDelay}ms...`);
                await this.delay(this.retryDelay);
                return this.makeRequest(data, attempt + 1);
            }

            this.updateConnectionStatus(false);
            throw error;
        }
    }

    /**
     * Get inventory data
     */
    async getInventory() {
        try {
            // Check cache first
            const cachedData = cacheManager.get(CONFIG.CACHE_KEYS.INVENTORY);
            if (cachedData) {
                console.log('📦 Using cached inventory data');
                return cachedData;
            }

            console.log('🔄 Fetching fresh inventory data...');
            const response = await this.makeRequest({
                action: 'get_inventory'
            });

            const inventoryData = response.result || {};
            
            // Cache the data
            cacheManager.set(CONFIG.CACHE_KEYS.INVENTORY, inventoryData);
            cacheManager.set(CONFIG.CACHE_KEYS.LAST_UPDATE, new Date().toISOString());

            return inventoryData;

        } catch (error) {
            console.error('❌ Failed to get inventory:', error);
            
            // Try to use cached data as fallback
            const cachedData = cacheManager.get(CONFIG.CACHE_KEYS.INVENTORY);
            if (cachedData) {
                console.log('⚠️ Using stale cached data due to error');
                this.showMessage('warning', 'Menggunakan data cache karena gagal terhubung ke server');
                return cachedData;
            }
            
            throw error;
        }
    }

    /**
     * Record equipment borrowing
     */
    async recordBorrow(borrowData) {
        try {
            const response = await this.makeRequest({
                action: 'borrow',
                ...borrowData
            });

            // Clear cache to force refresh
            this.clearInventoryCache();
            
            return response;

        } catch (error) {
            console.error('❌ Failed to record borrow:', error);
            throw error;
        }
    }

    /**
     * Record equipment return
     */
    async recordReturn(returnData) {
        try {
            const response = await this.makeRequest({
                action: 'return',
                ...returnData
            });

            // Clear cache to force refresh
            this.clearInventoryCache();
            
            return response;

        } catch (error) {
            console.error('❌ Failed to record return:', error);
            throw error;
        }
    }

    /**
     * Get borrowed equipment for return form
     */
    async getBorrowedEquipment() {
        try {
            const inventory = await this.getInventory();
            const borrowedItems = [];

            Object.entries(inventory).forEach(([type, items]) => {
                items.forEach(item => {
                    if (item.status === 'borrowed') {
                        borrowedItems.push({
                            name: item.name,
                            type: type,
                            borrower: item.borrower || 'Unknown'
                        });
                    }
                });
            });

            return borrowedItems;

        } catch (error) {
            console.error('❌ Failed to get borrowed equipment:', error);
            throw error;
        }
    }

    /**
     * Test connection to GAS
     */
    async testConnection() {
        try {
            // Use demo mode if enabled
            if (CONFIG.DEMO_MODE) {
                console.log('🎭 Demo mode: Connection test (always successful)');
                this.updateConnectionStatus(true);
                return true;
            }

            const response = await fetch(this.baseURL, {
                method: 'GET',
                mode: 'cors'
            });

            const result = await response.json();
            console.log('🔗 Connection test result:', result);
            
            this.updateConnectionStatus(true);
            return true;

        } catch (error) {
            console.error('❌ Connection test failed:', error);
            this.updateConnectionStatus(false);
            return false;
        }
    }

    /**
     * Queue request for later processing (when offline)
     */
    queueRequest(data) {
        this.requestQueue.push({
            data: data,
            timestamp: Date.now()
        });
        console.log('📋 Request queued:', data);
    }

    /**
     * Process queued requests when back online
     */
    async processQueue() {
        if (!this.isOnline || this.requestQueue.length === 0) {
            return;
        }

        console.log(`🔄 Processing ${this.requestQueue.length} queued requests...`);
        
        const queue = [...this.requestQueue];
        this.requestQueue = [];

        for (const queuedRequest of queue) {
            try {
                await this.makeRequest(queuedRequest.data);
                console.log('✅ Queued request processed successfully');
            } catch (error) {
                console.error('❌ Failed to process queued request:', error);
                // Re-queue failed requests
                this.requestQueue.push(queuedRequest);
            }
        }
    }

    /**
     * Clear inventory cache
     */
    clearInventoryCache() {
        cacheManager.remove(CONFIG.CACHE_KEYS.INVENTORY);
        cacheManager.remove(CONFIG.CACHE_KEYS.BORROWED_ITEMS);
        cacheManager.remove(CONFIG.CACHE_KEYS.STATS);
        console.log('🧹 Inventory cache cleared');
    }

    /**
     * Update connection status UI
     */
    updateConnectionStatus(isConnected) {
        const statusElement = document.getElementById('connectionStatus');
        if (statusElement) {
            const icon = statusElement.querySelector('i');
            const text = statusElement.querySelector('span');
            
            if (isConnected) {
                icon.className = 'fas fa-circle text-success';
                text.textContent = 'Terhubung';
                statusElement.title = 'Terhubung ke Google Spreadsheet';
            } else {
                icon.className = 'fas fa-circle text-danger';
                text.textContent = 'Terputus';
                statusElement.title = 'Tidak dapat terhubung ke server';
            }
        }
    }

    /**
     * Show message to user
     */
    showMessage(type, message) {
        const event = new CustomEvent('showMessage', {
            detail: { type, message }
        });
        document.dispatchEvent(event);
    }

    /**
     * Delay utility for retry logic
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Get API statistics
     */
    getStats() {
        return {
            baseURL: this.baseURL,
            isOnline: this.isOnline,
            queuedRequests: this.requestQueue.length,
            retryAttempts: this.retryAttempts,
            retryDelay: this.retryDelay
        };
    }

    /**
     * Force refresh all data
     */
    async forceRefresh() {
        this.clearInventoryCache();
        return await this.getInventory();
    }

    /**
     * Handle demo requests (offline mode)
     */
    async handleDemoRequest(data) {
        console.log('🎭 Demo mode: Handling request', data);
        
        // Simulate network delay
        await this.delay(500 + Math.random() * 1000);
        
        switch (data.action) {
            case 'get_inventory':
                return {
                    success: true,
                    result: this.getDemoInventoryData(),
                    message: 'Demo data loaded successfully'
                };
                
            case 'borrow':
                return this.handleDemoBorrow(data);
                
            case 'return':
                return this.handleDemoReturn(data);
                
            default:
                throw new Error(`Demo mode: Action '${data.action}' not supported`);
        }
    }

    /**
     * Get demo inventory data
     */
    getDemoInventoryData() {
        // Get existing demo data from cache or create new
        let demoData = cacheManager.get('demo_inventory_data');
        
        if (!demoData) {
            demoData = {
                camera: [
                    { name: 'Canon EOS R6', status: 'available', condition: 'excellent', borrower: '', lastUpdate: new Date().toISOString(), totalBorrows: 0 },
                    { name: 'Sony A7 III', status: 'available', condition: 'good', borrower: '', lastUpdate: new Date().toISOString(), totalBorrows: 0 },
                    { name: 'Nikon D850', status: 'borrowed', condition: 'excellent', borrower: 'Ahmad Rizki', lastUpdate: new Date().toISOString(), totalBorrows: 2 },
                    { name: 'Canon 5D Mark IV', status: 'available', condition: 'good', borrower: '', lastUpdate: new Date().toISOString(), totalBorrows: 1 },
                    { name: 'Fujifilm X-T4', status: 'borrowed', condition: 'excellent', borrower: 'Sari Dewi', lastUpdate: new Date().toISOString(), totalBorrows: 3 }
                ],
                laptop: [
                    { name: 'MacBook Pro 16" M1', status: 'available', condition: 'excellent', borrower: '', lastUpdate: new Date().toISOString(), totalBorrows: 0 },
                    { name: 'MacBook Air 13" M2', status: 'borrowed', condition: 'good', borrower: 'Budi Santoso', lastUpdate: new Date().toISOString(), totalBorrows: 1 },
                    { name: 'Dell XPS 15', status: 'available', condition: 'good', borrower: '', lastUpdate: new Date().toISOString(), totalBorrows: 0 },
                    { name: 'ThinkPad X1 Carbon', status: 'available', condition: 'excellent', borrower: '', lastUpdate: new Date().toISOString(), totalBorrows: 0 },
                    { name: 'Surface Laptop 5', status: 'borrowed', condition: 'good', borrower: 'Lisa Permata', lastUpdate: new Date().toISOString(), totalBorrows: 2 }
                ],
                projector: [
                    { name: 'Epson EB-X05', status: 'available', condition: 'good', borrower: '', lastUpdate: new Date().toISOString(), totalBorrows: 0 },
                    { name: 'BenQ MH535FHD', status: 'available', condition: 'excellent', borrower: '', lastUpdate: new Date().toISOString(), totalBorrows: 0 },
                    { name: 'Sony VPL-EX315', status: 'borrowed', condition: 'good', borrower: 'Andi Pratama', lastUpdate: new Date().toISOString(), totalBorrows: 1 },
                    { name: 'Canon LV-X420', status: 'available', condition: 'good', borrower: '', lastUpdate: new Date().toISOString(), totalBorrows: 0 }
                ],
                microphone: [
                    { name: 'Shure SM58', status: 'available', condition: 'excellent', borrower: '', lastUpdate: new Date().toISOString(), totalBorrows: 0 },
                    { name: 'Audio-Technica AT2020', status: 'borrowed', condition: 'good', borrower: 'Rina Handayani', lastUpdate: new Date().toISOString(), totalBorrows: 1 },
                    { name: 'Rode PodMic', status: 'available', condition: 'excellent', borrower: '', lastUpdate: new Date().toISOString(), totalBorrows: 0 },
                    { name: 'Blue Yeti', status: 'available', condition: 'good', borrower: '', lastUpdate: new Date().toISOString(), totalBorrows: 0 },
                    { name: 'Sennheiser e935', status: 'borrowed', condition: 'excellent', borrower: 'Dedi Kurniawan', lastUpdate: new Date().toISOString(), totalBorrows: 2 }
                ],
                speaker: [
                    { name: 'JBL Xtreme 3', status: 'available', condition: 'good', borrower: '', lastUpdate: new Date().toISOString(), totalBorrows: 0 },
                    { name: 'Bose SoundLink', status: 'available', condition: 'excellent', borrower: '', lastUpdate: new Date().toISOString(), totalBorrows: 0 },
                    { name: 'Harman Kardon Onyx', status: 'borrowed', condition: 'good', borrower: 'Fajar Nugroho', lastUpdate: new Date().toISOString(), totalBorrows: 1 },
                    { name: 'Sony SRS-XB43', status: 'available', condition: 'good', borrower: '', lastUpdate: new Date().toISOString(), totalBorrows: 0 }
                ],
                tablet: [
                    { name: 'iPad Pro 12.9"', status: 'available', condition: 'excellent', borrower: '', lastUpdate: new Date().toISOString(), totalBorrows: 0 },
                    { name: 'iPad Air 5', status: 'borrowed', condition: 'good', borrower: 'Maya Sari', lastUpdate: new Date().toISOString(), totalBorrows: 1 },
                    { name: 'Samsung Galaxy Tab S8', status: 'available', condition: 'good', borrower: '', lastUpdate: new Date().toISOString(), totalBorrows: 0 },
                    { name: 'Surface Pro 9', status: 'available', condition: 'excellent', borrower: '', lastUpdate: new Date().toISOString(), totalBorrows: 0 }
                ],
                monitor: [
                    { name: 'Dell UltraSharp 27"', status: 'available', condition: 'excellent', borrower: '', lastUpdate: new Date().toISOString(), totalBorrows: 0 },
                    { name: 'LG 4K 32"', status: 'borrowed', condition: 'good', borrower: 'Rudi Setiawan', lastUpdate: new Date().toISOString(), totalBorrows: 1 },
                    { name: 'Samsung Odyssey G7', status: 'available', condition: 'good', borrower: '', lastUpdate: new Date().toISOString(), totalBorrows: 0 },
                    { name: 'ASUS ProArt 24"', status: 'available', condition: 'excellent', borrower: '', lastUpdate: new Date().toISOString(), totalBorrows: 0 }
                ],
                printer: [
                    { name: 'HP LaserJet Pro', status: 'available', condition: 'good', borrower: '', lastUpdate: new Date().toISOString(), totalBorrows: 0 },
                    { name: 'Canon Pixma Pro', status: 'available', condition: 'excellent', borrower: '', lastUpdate: new Date().toISOString(), totalBorrows: 0 },
                    { name: 'Epson EcoTank', status: 'borrowed', condition: 'good', borrower: 'Indah Lestari', lastUpdate: new Date().toISOString(), totalBorrows: 1 },
                    { name: 'Brother HL-L2350DW', status: 'available', condition: 'good', borrower: '', lastUpdate: new Date().toISOString(), totalBorrows: 0 }
                ],
                other: [
                    { name: 'Tripod Manfrotto', status: 'available', condition: 'good', borrower: '', lastUpdate: new Date().toISOString(), totalBorrows: 0 },
                    { name: 'Gimbal DJI OM5', status: 'borrowed', condition: 'excellent', borrower: 'Toni Wijaya', lastUpdate: new Date().toISOString(), totalBorrows: 1 },
                    { name: 'Power Bank Anker', status: 'available', condition: 'good', borrower: '', lastUpdate: new Date().toISOString(), totalBorrows: 0 },
                    { name: 'External SSD 1TB', status: 'available', condition: 'excellent', borrower: '', lastUpdate: new Date().toISOString(), totalBorrows: 0 }
                ]
            };
            
            // Cache demo data
            cacheManager.set('demo_inventory_data', demoData, 24 * 60 * 60 * 1000); // 24 hours
        }
        
        return demoData;
    }

    /**
     * Handle demo borrow request
     */
    async handleDemoBorrow(data) {
        const inventory = this.getDemoInventoryData();
        const { equipmentType, equipmentName, borrowerName, borrowCondition } = data;
        
        // Find and update the equipment
        const equipmentList = inventory[equipmentType];
        if (!equipmentList) {
            throw new Error(`Jenis alat '${equipmentType}' tidak ditemukan`);
        }
        
        const equipment = equipmentList.find(item => item.name === equipmentName);
        if (!equipment) {
            throw new Error(`Alat '${equipmentName}' tidak ditemukan`);
        }
        
        if (equipment.status === 'borrowed') {
            throw new Error(`Alat '${equipmentName}' sedang dipinjam oleh ${equipment.borrower}`);
        }
        
        // Update equipment status
        equipment.status = 'borrowed';
        equipment.borrower = borrowerName;
        equipment.condition = borrowCondition;
        equipment.lastUpdate = new Date().toISOString();
        equipment.totalBorrows = (equipment.totalBorrows || 0) + 1;
        
        // Save updated data
        cacheManager.set('demo_inventory_data', inventory, 24 * 60 * 60 * 1000);
        
        // Log demo transaction
        this.logDemoTransaction('BORROW', data);
        
        return {
            success: true,
            result: {
                action: 'borrow',
                equipment: equipmentName,
                borrower: borrowerName
            }
        };
    }

    /**
     * Handle demo return request
     */
    async handleDemoReturn(data) {
        const inventory = this.getDemoInventoryData();
        const { returnEquipmentName, returnBorrowerName, returnCondition } = data;
        
        // Find the equipment across all types
        let foundEquipment = null;
        let foundType = null;
        
        for (const [type, equipmentList] of Object.entries(inventory)) {
            const equipment = equipmentList.find(item => item.name === returnEquipmentName);
            if (equipment) {
                foundEquipment = equipment;
                foundType = type;
                break;
            }
        }
        
        if (!foundEquipment) {
            throw new Error(`Alat '${returnEquipmentName}' tidak ditemukan`);
        }
        
        if (foundEquipment.status !== 'borrowed') {
            throw new Error(`Alat '${returnEquipmentName}' tidak sedang dipinjam`);
        }
        
        // Update equipment status
        foundEquipment.status = 'available';
        foundEquipment.borrower = '';
        foundEquipment.condition = returnCondition;
        foundEquipment.lastUpdate = new Date().toISOString();
        
        // Save updated data
        cacheManager.set('demo_inventory_data', inventory, 24 * 60 * 60 * 1000);
        
        // Log demo transaction
        this.logDemoTransaction('RETURN', data);
        
        return {
            success: true,
            result: {
                action: 'return',
                equipment: returnEquipmentName,
                returnedBy: returnBorrowerName
            }
        };
    }

    /**
     * Log demo transactions
     */
    logDemoTransaction(type, data) {
        let transactions = cacheManager.get('demo_transactions') || [];
        
        transactions.push({
            id: `${type}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            type: type,
            timestamp: new Date().toISOString(),
            data: data,
            user: 'Demo User'
        });
        
        // Keep only last 100 transactions
        if (transactions.length > 100) {
            transactions = transactions.slice(-100);
        }
        
        cacheManager.set('demo_transactions', transactions, 24 * 60 * 60 * 1000);
        console.log(`📝 Demo transaction logged: ${type}`, data);
    }
}

// Create global API instance
const apiManager = new APIManager();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APIManager;
}
