const eventsData = require('../data/events.json');

class ApiController {
    getPlatforms(req, res) {
        const platforms = [
            { id: 'ticketland', name: 'Ticketland', url: 'https://ticketland.ru' },
            { id: 'kassir', name: 'Kassir.ru', url: 'https://kassir.ru' },
            { id: 'yandex', name: 'Яндекс.Афиша', url: 'https://afisha.yandex.ru' },
            { id: 'parter', name: 'Parter.ru', url: 'https://parter.ru' }
        ];
        
        res.json(platforms);
    }
    
    healthCheck(req, res) {
        res.json({ 
            status: 'OK', 
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            environment: process.env.NODE_ENV || 'development'
        });
    }
}

module.exports = new ApiController();