const ParserService = require('../services/parserService');
const CacheService = require('../services/cacheService');

class EventsController {
    async getAllEvents(req, res) {
        try {
            const { search, category, city, page = 1, limit = 20 } = req.query;
            
            // Генерируем ключ для кэша
            const cacheKey = `events_${search || ''}_${category || ''}_${city || ''}_${page}`;
            
            const eventsData = await CacheService.getWithCache(cacheKey, async () => {
                // Парсим реальные данные
                const parsedEvents = await ParserService.parseAllPlatforms(search);
                
                return {
                    events: parsedEvents,
                    total: parsedEvents.length,
                    lastUpdated: new Date().toISOString()
                };
            });

            // Применяем фильтры
            let filteredEvents = eventsData.events;
            
            if (category && category !== 'all') {
                filteredEvents = filteredEvents.filter(event => 
                    event.category === category
                );
            }
            
            if (city && city !== 'all') {
                filteredEvents = filteredEvents.filter(event => 
                    event.city === city
                );
            }

            // Пагинация
            const startIndex = (page - 1) * limit;
            const endIndex = startIndex + parseInt(limit);
            const paginatedEvents = filteredEvents.slice(startIndex, endIndex);
            
            res.json({
                events: paginatedEvents,
                total: filteredEvents.length,
                page: parseInt(page),
                totalPages: Math.ceil(filteredEvents.length / limit),
                hasMore: endIndex < filteredEvents.length,
                lastUpdated: eventsData.lastUpdated
            });
            
        } catch (error) {
            console.error('Error getting events:', error);
            res.status(500).json({ 
                error: 'Internal server error',
                message: 'Не удалось загрузить мероприятия. Попробуйте позже.'
            });
        }
    }

    // Остальные методы остаются без изменений...
}