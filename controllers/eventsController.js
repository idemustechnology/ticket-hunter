const eventsData = require('../data/events.json');
const categoriesData = require('../data/categories.json');
const { PLATFORMS, CATEGORIES } = require('../config/constants');

class EventsController {
    getAllEvents(req, res) {
        try {
            const { search, category, city, page = 1, limit = 20 } = req.query;
            
            let filteredEvents = eventsData.events;
            
            // Поиск
            if (search) {
                const searchTerm = search.toLowerCase();
                filteredEvents = filteredEvents.filter(event => 
                    event.title.toLowerCase().includes(searchTerm) ||
                    event.venue.toLowerCase().includes(searchTerm) ||
                    event.description.toLowerCase().includes(searchTerm)
                );
            }
            
            // Фильтр по категории
            if (category && category !== 'all') {
                filteredEvents = filteredEvents.filter(event => 
                    event.category === category
                );
            }
            
            // Фильтр по городу
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
                hasMore: endIndex < filteredEvents.length
            });
            
        } catch (error) {
            console.error('Error getting events:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    
    getEventById(req, res) {
        try {
            const eventId = parseInt(req.params.id);
            const event = eventsData.events.find(e => e.id === eventId);
            
            if (!event) {
                return res.status(404).json({ error: 'Event not found' });
            }
            
            res.json(event);
        } catch (error) {
            console.error('Error getting event:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    
    getCategories(req, res) {
        try {
            res.json(categoriesData);
        } catch (error) {
            console.error('Error getting categories:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    
    getStats(req, res) {
        try {
            const stats = {
                totalEvents: eventsData.events.length,
                totalPlatforms: Object.keys(PLATFORMS).length,
                lastUpdated: eventsData.lastUpdated,
                categories: categoriesData.length
            };
            
            res.json(stats);
        } catch (error) {
            console.error('Error getting stats:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}

module.exports = new EventsController();