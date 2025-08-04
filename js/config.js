/**
 * Configuration file for TVRI World Digital Equipment Management System
 * Update the GAS_WEB_APP_URL with your deployed Google Apps Script URL
 */

const CONFIG = {
    // Google Apps Script Web App URL
    // Replace this with your actual deployed web app URL
    GAS_WEB_APP_URL: 'https://script.google.com/macros/s/AKfycbzVz623jcBaN3H5mPsfnwA-0h53JoxP4yXsx14th0ed_3mclsRImaHwm_9-JcHb1qL5tQ/exec',
    
    // Demo mode - set to true for offline demo without Google Apps Script
    DEMO_MODE: true,
    
    // Spreadsheet configuration
    SPREADSHEET_ID: '1-o0sHPnNiJkBQrM2ZZlotVXwZiEy2lTu-ShcvXfbvxo',
    
    // Cache configuration
    CACHE_DURATION: 5 * 60 * 1000, // 5 minutes in milliseconds
    CACHE_KEYS: {
        INVENTORY: 'tvri_inventory_data',
        LAST_UPDATE: 'tvri_last_update',
        BORROWED_ITEMS: 'tvri_borrowed_items',
        STATS: 'tvri_stats'
    },
    
    // UI configuration
    AUTO_REFRESH_INTERVAL: 30 * 1000, // 30 seconds
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 2000, // 2 seconds
    
    // Form validation
    VALIDATION: {
        MIN_NAME_LENGTH: 2,
        MIN_EVENT_NAME_LENGTH: 3,
        MAX_NOTES_LENGTH: 500
    },
    
    // Equipment type mapping with Indonesian labels
    EQUIPMENT_TYPES: {
        'camera': {
            label: '📷 Kamera',
            icon: 'fas fa-camera'
        },
        'laptop': {
            label: '💻 Laptop',
            icon: 'fas fa-laptop'
        },
        'projector': {
            label: '📽️ Proyektor',
            icon: 'fas fa-video'
        },
        'microphone': {
            label: '🎤 Mikropon',
            icon: 'fas fa-microphone'
        },
        'speaker': {
            label: '🔊 Speaker',
            icon: 'fas fa-volume-up'
        },
        'tablet': {
            label: '📱 Tablet',
            icon: 'fas fa-tablet-alt'
        },
        'monitor': {
            label: '🖥️ Monitor',
            icon: 'fas fa-desktop'
        },
        'printer': {
            label: '🖨️ Printer',
            icon: 'fas fa-print'
        },
        'other': {
            label: '🔧 Lainnya',
            icon: 'fas fa-tools'
        }
    },
    
    // Condition mapping
    CONDITIONS: {
        'excellent': {
            label: '⭐ Sangat Baik',
            class: 'condition-excellent'
        },
        'good': {
            label: '✅ Baik',
            class: 'condition-good'
        },
        'fair': {
            label: '⚠️ Cukup',
            class: 'condition-fair'
        },
        'poor': {
            label: '❌ Kurang',
            class: 'condition-poor'
        },
        'damaged': {
            label: '💥 Rusak',
            class: 'condition-damaged'
        }
    },
    
    // Status mapping
    STATUSES: {
        'available': {
            label: 'Tersedia',
            class: 'status-available',
            icon: 'fas fa-check-circle'
        },
        'borrowed': {
            label: 'Dipinjam',
            class: 'status-borrowed',
            icon: 'fas fa-hand-holding'
        }
    },
    
    // Messages
    MESSAGES: {
        SUCCESS: {
            BORROW: 'Peminjaman alat berhasil dicatat! Data telah tersimpan di spreadsheet.',
            RETURN: 'Pengembalian alat berhasil dicatat! Status inventaris telah diperbarui.',
            DATA_REFRESH: 'Data inventaris berhasil diperbarui dari spreadsheet.'
        },
        ERROR: {
            NETWORK: 'Gagal terhubung ke server. Periksa koneksi internet Anda.',
            VALIDATION: 'Mohon lengkapi semua field yang wajib diisi.',
            DUPLICATE: 'Alat yang dipilih sudah dipinjam oleh orang lain.',
            NOT_FOUND: 'Alat yang dicari tidak ditemukan dalam sistem.',
            GENERAL: 'Terjadi kesalahan sistem. Silakan coba lagi.',
            CONFIG: 'URL Google Apps Script belum dikonfigurasi. Silakan hubungi administrator.'
        },
        WARNING: {
            CACHE_EXPIRED: 'Data cache sudah kadaluarsa. Sedang memuat data terbaru...',
            OFFLINE: 'Anda sedang offline. Data yang ditampilkan mungkin tidak terbaru.'
        },
        INFO: {
            LOADING: 'Sedang memuat data dari spreadsheet...',
            NO_DATA: 'Belum ada data inventaris yang tersedia.',
            EMPTY_CATEGORY: 'Tidak ada alat tersedia untuk kategori ini.'
        }
    }
};

// Validate configuration on load
(function validateConfig() {
    if (CONFIG.DEMO_MODE) {
        console.log('🎭 Demo mode enabled - using offline sample data');
    } else if (CONFIG.GAS_WEB_APP_URL.includes('YOUR_SCRIPT_ID_HERE')) {
        console.warn('⚠️ Google Apps Script URL belum dikonfigurasi! Silakan update CONFIG.GAS_WEB_APP_URL di js/config.js');
    }
    
    console.log('✅ TVRI Equipment Management System Config Loaded');
    console.log('📊 Spreadsheet ID:', CONFIG.SPREADSHEET_ID);
    console.log('🔄 Cache Duration:', CONFIG.CACHE_DURATION / 1000, 'seconds');
    console.log('🎯 Demo Mode:', CONFIG.DEMO_MODE);
})();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
