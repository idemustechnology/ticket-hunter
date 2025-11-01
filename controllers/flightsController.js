const AviationParserService = require('../services/aviationParserService');
const CacheService = require('../services/cacheService');

class FlightsController {
    async searchFlights(req, res) {
        try {
            const { 
                from, 
                to, 
                date, 
                passengers = 1,
                sort = 'price',
                page = 1,
                limit = 20
            } = req.query;

            // Валидация параметров
            if (!from || !to || !date) {
                return res.status(400).json({
                    error: 'Missing required parameters',
                    message: 'Необходимо указать: from (откуда), to (куда), date (дата)'
                });
            }

            // Генерируем ключ для кэша
            const cacheKey = `flights_${from}_${to}_${date}_${passengers}_${page}`;
            
            const flightsData = await CacheService.getWithCache(cacheKey, async () => {
                // Парсим реальные данные
                const parsedTickets = await AviationParserService.parseAllPlatforms({
                    from: from.toUpperCase(),
                    to: to.toUpperCase(),
                    date: date,
                    passengers: parseInt(passengers)
                });
                
                return {
                    tickets: parsedTickets,
                    total: parsedTickets.length,
                    searchParams: { from, to, date, passengers },
                    lastUpdated: new Date().toISOString()
                };
            });

            // Применяем сортировку
            let sortedTickets = [...flightsData.tickets];
            
            switch (sort) {
                case 'price':
                    sortedTickets.sort((a, b) => {
                        const aMin = Math.min(...a.prices.map(p => p.price));
                        const bMin = Math.min(...b.prices.map(p => p.price));
                        return aMin - bMin;
                    });
                    break;
                case 'duration':
                    sortedTickets.sort((a, b) => {
                        const aDuration = this.parseDuration(a.duration);
                        const bDuration = this.parseDuration(b.duration);
                        return aDuration - bDuration;
                    });
                    break;
                case 'stops':
                    sortedTickets.sort((a, b) => a.stops - b.stops);
                    break;
                case 'airline':
                    sortedTickets.sort((a, b) => a.airline.localeCompare(b.airline));
                    break;
            }

            // Пагинация
            const startIndex = (page - 1) * limit;
            const endIndex = startIndex + parseInt(limit);
            const paginatedTickets = sortedTickets.slice(startIndex, endIndex);
            
            res.json({
                tickets: paginatedTickets,
                total: sortedTickets.length,
                page: parseInt(page),
                totalPages: Math.ceil(sortedTickets.length / limit),
                hasMore: endIndex < sortedTickets.length,
                searchParams: flightsData.searchParams,
                lastUpdated: flightsData.lastUpdated,
                stats: {
                    minPrice: this.getMinPrice(sortedTickets),
                    maxPrice: this.getMaxPrice(sortedTickets),
                    airlines: this.getAirlinesCount(sortedTickets),
                    directFlights: this.getDirectFlightsCount(sortedTickets)
                }
            });
            
        } catch (error) {
            console.error('Error searching flights:', error);
            res.status(500).json({ 
                error: 'Internal server error',
                message: 'Не удалось выполнить поиск авиабилетов. Попробуйте позже.'
            });
        }
    }

    async getPopularRoutes(req, res) {
        try {
            const routes = await AviationParserService.getPopularRoutes();
            res.json(routes);
        } catch (error) {
            console.error('Error getting popular routes:', error);
            res.status(500).json({ error: 'Failed to get popular routes' });
        }
    }

    async getAirlines(req, res) {
        try {
            const airlines = await AviationParserService.getAirlines();
            res.json(airlines);
        } catch (error) {
            console.error('Error getting airlines:', error);
            res.status(500).json({ error: 'Failed to get airlines' });
        }
    }

    // Вспомогательные методы
    parseDuration(duration) {
        if (!duration) return 120; // 2 часа по умолчанию
        const match = duration.match(/(\d+)/);
        return match ? parseInt(match[1]) * 60 : 120;
    }

    getMinPrice(tickets) {
        if (tickets.length === 0) return 0;
        return Math.min(...tickets.map(t => Math.min(...t.prices.map(p => p.price))));
    }

    getMaxPrice(tickets) {
        if (tickets.length === 0) return 0;
        return Math.max(...tickets.map(t => Math.max(...t.prices.map(p => p.price))));
    }

    getAirlinesCount(tickets) {
        const airlines = new Set(tickets.map(t => t.airline));
        return airlines.size;
    }

    getDirectFlightsCount(tickets) {
        return tickets.filter(t => t.stops === 0).length;
    }
}

module.exports = new FlightsController();