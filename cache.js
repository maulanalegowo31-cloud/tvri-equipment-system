/**
 * Cache Manager for TVRI Equipment Management System
 * Handles local storage operations and data persistence
 */

class CacheManager {
    constructor() {
        this.isLocalStorageAvailable = this.checkLocalStorageAvailability();
        this.fallbackCache = new Map();
    }

    /**
     * Check if localStorage is available
     */
    checkLocalStorageAvailability() {
        try {
            const test = '__localStorage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            console.warn('LocalStorage tidak tersedia, menggunakan fallback cache');
            return false;
        }
    }

    /**
     * Set data in cache with expiration
     */
    set(key, data, expirationMs = CONFIG.CACHE_DURATION) {
        const cacheItem = {
            data: data,
            timestamp: Date.now(),
            expiration: Date.now() + expirationMs
        };

        try {
            if (this.isLocalStorageAvailable) {
                localStorage.setItem(key, JSON.stringify(cacheItem));
            } else {
                this.fallbackCache.set(key, cacheItem);
            }
            
            console.log(`📦 Cache set: ${key}`, { 
                size: JSON.stringify(data).length,
                expiresIn: Math.round(expirationMs / 1000) + 's'
            });
        } catch (error) {
            console.error('Cache set error:', error);
            // Fallback to memory cache
            this.fallbackCache.set(key, cacheItem);
        }
    }

    /**
     * Get data from cache
     */
    get(key) {
        try {
            let cacheItem;
            
            if (this.isLocalStorageAvailable) {
                const stored = localStorage.getItem(key);
                if (stored) {
                    cacheItem = JSON.parse(stored);
                }
            } else {
                cacheItem = this.fallbackCache.get(key);
            }

            if (!cacheItem) {
                console.log(`📦 Cache miss: ${key}`);
                return null;
            }

            // Check if cache has expired
            if (Date.now() > cacheItem.expiration) {
                console.log(`⏰ Cache expired: ${key}`);
                this.remove(key);
                return null;
            }

            console.log(`📦 Cache hit: ${key}`, {
                age: Math.round((Date.now() - cacheItem.timestamp) / 1000) + 's',
                expiresIn: Math.round((cacheItem.expiration - Date.now()) / 1000) + 's'
            });

            return cacheItem.data;
        } catch (error) {
            console.error('Cache get error:', error);
            return null;
        }
    }

    /**
     * Remove item from cache
     */
    remove(key) {
        try {
            if (this.isLocalStorageAvailable) {
                localStorage.removeItem(key);
            } else {
                this.fallbackCache.delete(key);
            }
            console.log(`🗑️ Cache removed: ${key}`);
        } catch (error) {
            console.error('Cache remove error:', error);
        }
    }

    /**
     * Clear all cache items
     */
    clear() {
        try {
            if (this.isLocalStorageAvailable) {
                // Only remove TVRI cache items
                Object.values(CONFIG.CACHE_KEYS).forEach(key => {
                    localStorage.removeItem(key);
                });
            } else {
                this.fallbackCache.clear();
            }
            console.log('🧹 Cache cleared');
        } catch (error) {
            console.error('Cache clear error:', error);
        }
    }

    /**
     * Check if cache item exists and is valid
     */
    has(key) {
        return this.get(key) !== null;
    }

    /**
     * Get cache statistics
     */
    getStats() {
        const stats = {
            available: this.isLocalStorageAvailable,
            items: 0,
            totalSize: 0,
            fallbackUsed: !this.isLocalStorageAvailable
        };

        try {
            if (this.isLocalStorageAvailable) {
                Object.values(CONFIG.CACHE_KEYS).forEach(key => {
                    const item = localStorage.getItem(key);
                    if (item) {
                        stats.items++;
                        stats.totalSize += item.length;
                    }
                });
            } else {
                stats.items = this.fallbackCache.size;
                this.fallbackCache.forEach(value => {
                    stats.totalSize += JSON.stringify(value).length;
                });
            }
        } catch (error) {
            console.error('Cache stats error:', error);
        }

        return stats;
    }

    /**
     * Update cache timestamp without changing data
     */
    touch(key) {
        const data = this.get(key);
        if (data !== null) {
            this.set(key, data);
        }
    }

    /**
     * Set cache data with custom expiration
     */
    setWithCustomExpiration(key, data, customExpirationMs) {
        this.set(key, data, customExpirationMs);
    }

    /**
     * Get cache item with metadata
     */
    getWithMetadata(key) {
        try {
            let cacheItem;
            
            if (this.isLocalStorageAvailable) {
                const stored = localStorage.getItem(key);
                if (stored) {
                    cacheItem = JSON.parse(stored);
                }
            } else {
                cacheItem = this.fallbackCache.get(key);
            }

            if (!cacheItem) {
                return null;
            }

            const now = Date.now();
            const isExpired = now > cacheItem.expiration;
            
            return {
                data: cacheItem.data,
                timestamp: cacheItem.timestamp,
                expiration: cacheItem.expiration,
                age: now - cacheItem.timestamp,
                timeUntilExpiration: cacheItem.expiration - now,
                isExpired: isExpired,
                isValid: !isExpired
            };
        } catch (error) {
            console.error('Cache getWithMetadata error:', error);
            return null;
        }
    }

    /**
     * Batch operations
     */
    setMultiple(items) {
        Object.entries(items).forEach(([key, data]) => {
            this.set(key, data);
        });
    }

    getMultiple(keys) {
        const result = {};
        keys.forEach(key => {
            result[key] = this.get(key);
        });
        return result;
    }

    /**
     * Cache maintenance - remove expired items
     */
    cleanup() {
        let removedCount = 0;
        
        try {
            if (this.isLocalStorageAvailable) {
                Object.values(CONFIG.CACHE_KEYS).forEach(key => {
                    const item = this.getWithMetadata(key);
                    if (item && item.isExpired) {
                        this.remove(key);
                        removedCount++;
                    }
                });
            } else {
                const expiredKeys = [];
                this.fallbackCache.forEach((value, key) => {
                    if (Date.now() > value.expiration) {
                        expiredKeys.push(key);
                    }
                });
                expiredKeys.forEach(key => {
                    this.fallbackCache.delete(key);
                    removedCount++;
                });
            }
            
            if (removedCount > 0) {
                console.log(`🧹 Cache cleanup: removed ${removedCount} expired items`);
            }
        } catch (error) {
            console.error('Cache cleanup error:', error);
        }
        
        return removedCount;
    }
}

// Create global cache instance
const cacheManager = new CacheManager();

// Auto cleanup every 5 minutes
setInterval(() => {
    cacheManager.cleanup();
}, 5 * 60 * 1000);

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CacheManager;
}
