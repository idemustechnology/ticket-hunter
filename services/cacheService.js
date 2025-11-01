class CacheService {
    constructor() {
        this.cache = new Map();
        this.cacheDuration = 15 * 60 * 1000; // 15 минут
    }

    set(key, value) {
        this.cache.set(key, {
            data: value,
            timestamp: Date.now()
        });
    }

    get(key) {
        const item = this.cache.get(key);
        if (!item) return null;

        // Проверяем не устарели ли данные
        if (Date.now() - item.timestamp > this.cacheDuration) {
            this.cache.delete(key);
            return null;
        }

        return item.data;
    }

    delete(key) {
        this.cache.delete(key);
    }

    clear() {
        this.cache.clear();
    }

    // Получение данных с кэшированием
    async getWithCache(key, fetchFunction) {
        const cached = this.get(key);
        if (cached) {
            console.log(`📦 Using cached data for: ${key}`);
            return cached;
        }

        console.log(`🔄 Fetching fresh data for: ${key}`);
        const data = await fetchFunction();
        this.set(key, data);
        return data;
    }
}

module.exports = new CacheService();