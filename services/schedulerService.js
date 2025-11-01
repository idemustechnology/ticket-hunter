const cron = require('node-cron');
const ParserService = require('./parserService');
const CacheService = require('./cacheService');

class SchedulerService {
    init() {
        // Обновляем кэш каждые 15 минут
        cron.schedule('*/15 * * * *', async () => {
            console.log('🔄 Scheduled cache refresh started');
            try {
                // Очищаем старый кэш
                CacheService.clear();
                
                // Парсим популярные запросы для предзагрузки
                await ParserService.parseAllPlatforms('');
                await ParserService.parseAllPlatforms('концерт');
                await ParserService.parseAllPlatforms('театр');
                
                console.log('✅ Scheduled cache refresh completed');
            } catch (error) {
                console.error('❌ Scheduled cache refresh failed:', error);
            }
        });

        // Полное обновление каждый час
        cron.schedule('0 * * * *', async () => {
            console.log('🔄 Full data refresh started');
            // Можно добавить дополнительную логику обновления
        });
    }
}

module.exports = new SchedulerService();