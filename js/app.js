/**
 * Main Application Controller for TVRI Equipment Management System
 */

class TVRIEquipmentApp {
    constructor() {
        this.currentInventory = {};
        this.isLoading = false;
        this.autoRefreshInterval = null;
        
        this.init();
    }

    /**
     * Initialize the application
     */
    async init() {
        console.log('🚀 Initializing TVRI Equipment Management System...');
        
        try {
            // Show loading overlay
            this.showLoadingOverlay(true);
            
            // Show demo mode indicator if enabled
            if (CONFIG.DEMO_MODE) {
                document.getElementById('demoModeIndicator').style.display = 'inline-flex';
                console.log('🎭 Running in demo mode');
            }
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Test connection and load initial data
            await this.testConnection();
            await this.loadInventoryData();
            
            // Set up auto-refresh
            this.setupAutoRefresh();
            
            // Set default dates
            this.setDefaultDates();
            
            console.log('✅ Application initialized successfully');
            
        } catch (error) {
            console.error('❌ Failed to initialize application:', error);
            this.showMessage('danger', `Gagal menginisialisasi aplikasi: ${error.message}`);
        } finally {
            this.showLoadingOverlay(false);
        }
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Form submissions
        document.getElementById('borrowForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleBorrowSubmit(e);
        });

        document.getElementById('returnForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleReturnSubmit(e);
        });

        // Equipment type change
        document.getElementById('equipmentType').addEventListener('change', (e) => {
            this.loadEquipmentByType(e.target.value);
        });

        // Tab changes
        document.getElementById('mainTabs').addEventListener('shown.bs.tab', (e) => {
            const targetTab = e.target.getAttribute('data-bs-target');
            if (targetTab === '#inventory') {
                this.refreshInventoryTable();
            } else if (targetTab === '#return') {
                this.loadBorrowedEquipment();
            }
        });

        // Inventory filters
        document.getElementById('inventoryFilter').addEventListener('change', () => {
            this.filterInventoryTable();
        });

        document.getElementById('statusFilter').addEventListener('change', () => {
            this.filterInventoryTable();
        });

        // Custom message listener
        document.addEventListener('showMessage', (e) => {
            this.showMessage(e.detail.type, e.detail.message);
        });

        // Form validation
        this.setupFormValidation();

        console.log('📋 Event listeners configured');
    }

    /**
     * Set up form validation
     */
    setupFormValidation() {
        const forms = document.querySelectorAll('.needs-validation');
        forms.forEach(form => {
            form.addEventListener('submit', (e) => {
                if (!form.checkValidity()) {
                    e.preventDefault();
                    e.stopPropagation();
                }
                form.classList.add('was-validated');
            });
        });
    }

    /**
     * Test connection to Google Apps Script
     */
    async testConnection() {
        try {
            const isConnected = await apiManager.testConnection();
            if (!isConnected) {
                throw new Error('Gagal terhubung ke Google Apps Script');
            }
            console.log('✅ Connection test successful');
        } catch (error) {
            console.error('❌ Connection test failed:', error);
            this.showMessage('warning', 'Peringatan: Koneksi ke server tidak stabil. Beberapa fitur mungkin tidak berfungsi.');
        }
    }

    /**
     * Load inventory data from API
     */
    async loadInventoryData() {
        try {
            this.isLoading = true;
            console.log('📦 Loading inventory data...');

            const inventory = await apiManager.getInventory();
            this.currentInventory = inventory;

            // Update UI components
            this.updateStatistics();
            this.updateEquipmentDropdowns();
            this.refreshInventoryTable();
            this.loadBorrowedEquipment();

            cacheManager.set(CONFIG.CACHE_KEYS.LAST_UPDATE, new Date().toISOString());
            this.updateLastUpdateTime();

            console.log('✅ Inventory data loaded successfully');

        } catch (error) {
            console.error('❌ Failed to load inventory data:', error);
            this.showMessage('danger', `Gagal memuat data inventaris: ${error.message}`);
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Update statistics cards
     */
    updateStatistics() {
        let totalEquipment = 0;
        let availableEquipment = 0;
        let borrowedEquipment = 0;

        Object.values(this.currentInventory).forEach(items => {
            items.forEach(item => {
                totalEquipment++;
                if (item.status === 'available') {
                    availableEquipment++;
                } else if (item.status === 'borrowed') {
                    borrowedEquipment++;
                }
            });
        });

        document.getElementById('totalEquipment').textContent = totalEquipment;
        document.getElementById('availableEquipment').textContent = availableEquipment;
        document.getElementById('borrowedEquipment').textContent = borrowedEquipment;

        // Cache stats
        cacheManager.set(CONFIG.CACHE_KEYS.STATS, {
            total: totalEquipment,
            available: availableEquipment,
            borrowed: borrowedEquipment
        });
    }

    /**
     * Update equipment dropdowns
     */
    updateEquipmentDropdowns() {
        const typeSelect = document.getElementById('equipmentType');
        const equipmentSelect = document.getElementById('equipmentName');

        // Clear current equipment options
        equipmentSelect.innerHTML = '<option value="">Pilih jenis alat terlebih dahulu...</option>';
        equipmentSelect.disabled = true;

        // If no type selected, return
        if (!typeSelect.value) return;

        const selectedType = typeSelect.value;
        const availableItems = this.currentInventory[selectedType]?.filter(item => 
            item.status === 'available'
        ) || [];

        if (availableItems.length === 0) {
            equipmentSelect.innerHTML = '<option value="">Tidak ada alat tersedia untuk kategori ini</option>';
            return;
        }

        // Populate equipment options
        equipmentSelect.innerHTML = '<option value="">Pilih alat yang tersedia...</option>';
        availableItems.forEach(item => {
            const option = document.createElement('option');
            option.value = item.name;
            option.textContent = item.name;
            equipmentSelect.appendChild(option);
        });

        equipmentSelect.disabled = false;
    }

    /**
     * Load equipment by type
     */
    loadEquipmentByType(type) {
        if (!type) {
            const equipmentSelect = document.getElementById('equipmentName');
            equipmentSelect.innerHTML = '<option value="">Pilih jenis alat terlebih dahulu...</option>';
            equipmentSelect.disabled = true;
            return;
        }

        this.updateEquipmentDropdowns();
    }

    /**
     * Load borrowed equipment for return form
     */
    loadBorrowedEquipment() {
        const returnSelect = document.getElementById('returnEquipmentName');
        returnSelect.innerHTML = '<option value="">Memuat alat yang dipinjam...</option>';

        const borrowedItems = [];
        Object.entries(this.currentInventory).forEach(([type, items]) => {
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

        if (borrowedItems.length === 0) {
            returnSelect.innerHTML = '<option value="">Tidak ada alat yang sedang dipinjam</option>';
            return;
        }

        returnSelect.innerHTML = '<option value="">Pilih alat yang dikembalikan...</option>';
        borrowedItems.forEach(item => {
            const option = document.createElement('option');
            option.value = item.name;
            option.textContent = `${item.name} (${CONFIG.EQUIPMENT_TYPES[item.type]?.label})`;
            returnSelect.appendChild(option);
        });
    }

    /**
     * Refresh inventory table
     */
    refreshInventoryTable() {
        const tableBody = document.getElementById('inventoryTableBody');
        
        // Clear existing rows
        tableBody.innerHTML = '';

        const allItems = [];
        Object.entries(this.currentInventory).forEach(([type, items]) => {
            items.forEach(item => {
                allItems.push({
                    ...item,
                    type: type
                });
            });
        });

        if (allItems.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center py-4">
                        <i class="fas fa-inbox fa-2x text-muted mb-2"></i>
                        <p class="text-muted mb-0">Belum ada data inventaris</p>
                    </td>
                </tr>
            `;
            return;
        }

        // Sort items by name
        allItems.sort((a, b) => a.name.localeCompare(b.name));

        allItems.forEach(item => {
            const row = this.createInventoryRow(item);
            tableBody.appendChild(row);
        });

        // Apply current filters
        this.filterInventoryTable();
    }

    /**
     * Create inventory table row
     */
    createInventoryRow(item) {
        const row = document.createElement('tr');
        row.className = 'fade-in';
        
        const statusConfig = CONFIG.STATUSES[item.status] || CONFIG.STATUSES.available;
        const conditionConfig = CONFIG.CONDITIONS[item.condition?.toLowerCase()] || CONFIG.CONDITIONS.good;
        const typeConfig = CONFIG.EQUIPMENT_TYPES[item.type] || CONFIG.EQUIPMENT_TYPES.other;

        row.innerHTML = `
            <td>
                <strong>${item.name}</strong>
            </td>
            <td>
                <i class="${typeConfig.icon}"></i>
                ${typeConfig.label}
            </td>
            <td>
                <span class="status-badge ${statusConfig.class}">
                    <i class="${statusConfig.icon}"></i>
                    ${statusConfig.label}
                </span>
            </td>
            <td>
                <span class="condition-badge ${conditionConfig.class}">
                    ${conditionConfig.label}
                </span>
            </td>
            <td>
                ${item.borrower || '-'}
            </td>
            <td>
                <small class="text-muted">
                    ${item.lastUpdate ? new Date(item.lastUpdate).toLocaleString('id-ID') : '-'}
                </small>
            </td>
        `;

        // Add data attributes for filtering
        row.setAttribute('data-type', item.type);
        row.setAttribute('data-status', item.status);

        return row;
    }

    /**
     * Filter inventory table
     */
    filterInventoryTable() {
        const typeFilter = document.getElementById('inventoryFilter').value;
        const statusFilter = document.getElementById('statusFilter').value;
        const rows = document.querySelectorAll('#inventoryTableBody tr');

        let visibleCount = 0;

        rows.forEach(row => {
            const rowType = row.getAttribute('data-type');
            const rowStatus = row.getAttribute('data-status');
            
            const typeMatch = !typeFilter || rowType === typeFilter;
            const statusMatch = !statusFilter || rowStatus === statusFilter;
            
            if (typeMatch && statusMatch) {
                row.style.display = '';
                visibleCount++;
            } else {
                row.style.display = 'none';
            }
        });

        // Show no results message if needed
        if (visibleCount === 0 && rows.length > 0) {
            const noResultsRow = document.createElement('tr');
            noResultsRow.innerHTML = `
                <td colspan="6" class="text-center py-4">
                    <i class="fas fa-search fa-2x text-muted mb-2"></i>
                    <p class="text-muted mb-0">Tidak ada data yang sesuai dengan filter</p>
                </td>
            `;
            document.getElementById('inventoryTableBody').appendChild(noResultsRow);
        }
    }

    /**
     * Handle borrow form submission
     */
    async handleBorrowSubmit(e) {
        const form = e.target;
        
        if (!form.checkValidity()) {
            return;
        }

        try {
            this.setFormLoading(form, true);

            const formData = new FormData(form);
            const borrowData = {
                borrowerName: formData.get('borrowerName'),
                eventName: formData.get('eventName'),
                equipmentType: formData.get('equipmentType'),
                equipmentName: formData.get('equipmentName'),
                pickupDate: formData.get('pickupDate'),
                pickupTime: formData.get('pickupTime'),
                expectedReturnDate: formData.get('expectedReturnDate'),
                borrowCondition: formData.get('borrowCondition'),
                borrowNotes: formData.get('borrowNotes')
            };

            console.log('📤 Submitting borrow data:', borrowData);

            const response = await apiManager.recordBorrow(borrowData);
            
            this.showMessage('success', CONFIG.MESSAGES.SUCCESS.BORROW);
            form.reset();
            form.classList.remove('was-validated');
            
            // Refresh data
            await this.loadInventoryData();

        } catch (error) {
            console.error('❌ Borrow submission failed:', error);
            this.showMessage('danger', `Gagal mencatat peminjaman: ${error.message}`);
        } finally {
            this.setFormLoading(form, false);
        }
    }

    /**
     * Handle return form submission
     */
    async handleReturnSubmit(e) {
        const form = e.target;
        
        if (!form.checkValidity()) {
            return;
        }

        try {
            this.setFormLoading(form, true);

            const formData = new FormData(form);
            const returnData = {
                returnBorrowerName: formData.get('returnBorrowerName'),
                returnEquipmentName: formData.get('returnEquipmentName'),
                returnDate: formData.get('returnDate'),
                returnTime: formData.get('returnTime'),
                returnCondition: formData.get('returnCondition'),
                returnNotes: formData.get('returnNotes')
            };

            console.log('📥 Submitting return data:', returnData);

            const response = await apiManager.recordReturn(returnData);
            
            this.showMessage('success', CONFIG.MESSAGES.SUCCESS.RETURN);
            form.reset();
            form.classList.remove('was-validated');
            
            // Refresh data
            await this.loadInventoryData();

        } catch (error) {
            console.error('❌ Return submission failed:', error);
            this.showMessage('danger', `Gagal mencatat pengembalian: ${error.message}`);
        } finally {
            this.setFormLoading(form, false);
        }
    }

    /**
     * Set form loading state
     */
    setFormLoading(form, isLoading) {
        const submitButton = form.querySelector('button[type="submit"]');
        const inputs = form.querySelectorAll('input, select, textarea');

        if (isLoading) {
            submitButton.disabled = true;
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...';
            inputs.forEach(input => input.disabled = true);
        } else {
            submitButton.disabled = false;
            const originalText = submitButton.getAttribute('data-original-text') || 
                               (form.id === 'borrowForm' ? 
                                '<i class="fas fa-hand-holding"></i> Catat Peminjaman' : 
                                '<i class="fas fa-undo"></i> Catat Pengembalian');
            submitButton.innerHTML = originalText;
            inputs.forEach(input => input.disabled = false);
        }
    }

    /**
     * Show loading overlay
     */
    showLoadingOverlay(show) {
        const overlay = document.getElementById('loadingOverlay');
        if (show) {
            overlay.classList.remove('hidden');
        } else {
            overlay.classList.add('hidden');
        }
    }

    /**
     * Show message to user
     */
    showMessage(type, message) {
        const container = document.getElementById('alertContainer');
        
        // Remove existing alerts
        container.innerHTML = '';
        
        const alert = document.createElement('div');
        alert.className = `alert alert-${type} alert-dismissible fade show`;
        alert.innerHTML = `
            <i class="fas fa-${this.getMessageIcon(type)}"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        container.appendChild(alert);
        
        // Auto-dismiss after 5 seconds for success messages
        if (type === 'success') {
            setTimeout(() => {
                const alert = container.querySelector('.alert');
                if (alert) {
                    alert.remove();
                }
            }, 5000);
        }
    }

    /**
     * Get icon for message type
     */
    getMessageIcon(type) {
        const icons = {
            'success': 'check-circle',
            'danger': 'exclamation-circle',
            'warning': 'exclamation-triangle',
            'info': 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    /**
     * Set default dates
     */
    setDefaultDates() {
        const today = new Date();
        const todayString = today.toISOString().split('T')[0];
        const timeString = today.toTimeString().split(' ')[0].substring(0, 5);

        // Set pickup date to today
        document.getElementById('pickupDate').value = todayString;
        document.getElementById('pickupTime').value = timeString;

        // Set return date to today
        document.getElementById('returnDate').value = todayString;
        document.getElementById('returnTime').value = timeString;

        // Set expected return to tomorrow
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        document.getElementById('expectedReturnDate').value = tomorrow.toISOString().split('T')[0];
    }

    /**
     * Update last update time
     */
    updateLastUpdateTime() {
        const lastUpdate = cacheManager.get(CONFIG.CACHE_KEYS.LAST_UPDATE);
        const element = document.getElementById('lastUpdate');
        
        if (lastUpdate && element) {
            const updateTime = new Date(lastUpdate);
            const now = new Date();
            const diffMinutes = Math.floor((now - updateTime) / (1000 * 60));
            
            if (diffMinutes < 1) {
                element.textContent = 'Baru saja';
            } else if (diffMinutes < 60) {
                element.textContent = `${diffMinutes}m`;
            } else {
                element.textContent = updateTime.toLocaleTimeString('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit'
                });
            }
        }
    }

    /**
     * Set up auto-refresh
     */
    setupAutoRefresh() {
        // Clear existing interval
        if (this.autoRefreshInterval) {
            clearInterval(this.autoRefreshInterval);
        }

        // Set up new interval
        this.autoRefreshInterval = setInterval(async () => {
            try {
                await this.loadInventoryData();
                console.log('🔄 Auto-refresh completed');
            } catch (error) {
                console.error('❌ Auto-refresh failed:', error);
            }
        }, CONFIG.AUTO_REFRESH_INTERVAL);

        console.log(`⏰ Auto-refresh set to ${CONFIG.AUTO_REFRESH_INTERVAL / 1000}s interval`);
    }

    /**
     * Manual refresh data
     */
    async refreshData() {
        try {
            this.showLoadingOverlay(true);
            
            // Force refresh (bypass cache)
            await apiManager.forceRefresh();
            await this.loadInventoryData();
            
            this.showMessage('success', CONFIG.MESSAGES.SUCCESS.DATA_REFRESH);
            
        } catch (error) {
            console.error('❌ Manual refresh failed:', error);
            this.showMessage('danger', `Gagal refresh data: ${error.message}`);
        } finally {
            this.showLoadingOverlay(false);
        }
    }

    /**
     * Get application statistics
     */
    getStats() {
        return {
            inventory: Object.keys(this.currentInventory).length,
            isLoading: this.isLoading,
            cache: cacheManager.getStats(),
            api: apiManager.getStats()
        };
    }
}

// Global refresh function
window.refreshData = function() {
    if (window.tvriApp) {
        window.tvriApp.refreshData();
    }
};

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.tvriApp = new TVRIEquipmentApp();
});

// Export for debugging
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TVRIEquipmentApp;
}
