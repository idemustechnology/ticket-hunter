const express = require('express');
const path = require('path');
const eventsParser = require('./parsers/eventsParser');
const flightsParser = require('./parsers/flightsParser');

const app = express();
const PORT = process.env.PORT || 3001; // Используем порт 3001

// Middleware
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

app.use(express.static('public'));
app.use(express.json());

// Главная страница - мероприятия
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Страница авиабилетов
app.get('/flights', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'flights.html'));
});

// Поиск мероприятий
app.get('/search/events', async (req, res) => {
    try {
        const { query = '' } = req.query;
        console.log('Searching events:', query);
        
        const events = await eventsParser.searchEvents(query);
        
        res.json({
            success: true,
            events: events,
            query: query,
            found: events.length
        });
    } catch (error) {
        console.error('Events search error:', error);
        res.json({
            success: false,
            events: [],
            error: 'Search failed'
        });
    }
});

// Поиск авиабилетов
app.get('/search/flights', async (req, res) => {
    try {
        const { from, to, date } = req.query;
        
        if (!from || !to || !date) {
            return res.json({
                success: false,
                error: 'Missing parameters'
            });
        }

        console.log('Searching flights:', from, to, date);
        
        const tickets = await flightsParser.searchFlights({ from, to, date });
        
        res.json({
            success: true,
            tickets: tickets,
            search: { from, to, date },
            found: tickets.length
        });
    } catch (error) {
        console.error('Flights search error:', error);
        res.json({
            success: false,
            tickets: [],
            error: 'Search failed'
        });
    }
});

// Популярные направления
app.get('/popular-routes', (req, res) => {
    const routes = [
        { from: 'MOW', to: 'LED', name: 'Москва → Санкт-Петербург' },
        { from: 'MOW', to: 'SVX', name: 'Москва → Екатеринбург' },
        { from: 'MOW', to: 'KRR', name: 'Москва → Краснодар' },
        { from: 'MOW', to: 'AER', name: 'Москва → Сочи' },
        { from: 'LED', to: 'MOW', name: 'Санкт-Петербург → Москва' }
    ];
    res.json(routes);
});

// Тестовый маршрут для проверки
app.get('/test', (req, res) => {
    res.json({ message: 'Server is working!', timestamp: new Date() });
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`✅ Test endpoint: http://localhost:${PORT}/test`);
    console.log(`✅ Events search: http://localhost:${PORT}/search/events?query=концерт`);
});