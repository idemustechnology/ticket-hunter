const express = require('express');
const router = express.Router();
const ParserService = require('../services/parserService');
const CacheService = require('../services/cacheService');

router.post('/refresh', async (req, res) => {
    try {
        const { search } = req.body;
        
        // Очищаем кэш для этого запроса
        const cacheKey = `events_${search || ''}___1`;
        CacheService.delete(cacheKey);
        
        // Парсим свежие данные
        const events = await ParserService.parseAllPlatforms(search);
        
        res.json({
            success: true,
            message: `Data refreshed successfully. Found ${events.length} events.`,
            eventsCount: events.length
        });
        
    } catch (error) {
        console.error('Error refreshing data:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to refresh data'
        });
    }
});

router.get('/status', (req, res) => {
    res.json({
        status: 'active',
        platforms: ['Kassir.ru', 'Яндекс.Афиша', 'Ticketland', 'Parter.ru'],
        cacheSize: CacheService.cache.size,
        lastUpdate: new Date().toISOString()
    });
});

module.exports = router;