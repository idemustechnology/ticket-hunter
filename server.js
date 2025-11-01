require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');

// Создаем экземпляр приложения
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}));
app.use(compression());
app.use(morgan('combined'));
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

// Basic routes for testing
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

// Serve static pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/flights', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'flights.html'));
});

app.get('/about', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'about.html'));
});

// Basic flights API endpoint
app.get('/api/flights/search', async (req, res) => {
    try {
        const { from, to, date, passengers = 1 } = req.query;
        
        if (!from || !to || !date) {
            return res.status(400).json({
                error: 'Missing required parameters',
                message: 'Необходимо указать: from (откуда), to (куда), date (дата)'
            });
        }

        // Генерируем демо-данные
        const demoData = generateDemoFlights({ from, to, date, passengers });
        
        res.json({
            tickets: demoData.tickets,
            total: demoData.tickets.length,
            page: 1,
            totalPages: 1,
            hasMore: false,
            searchParams: { from, to, date, passengers },
            lastUpdated: new Date().toISOString(),
            stats: demoData.stats
        });
        
    } catch (error) {
        console.error('Error in flights search:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: 'Не удалось выполнить поиск авиабилетов'
        });
    }
});

app.get('/api/flights/popular-routes', (req, res) => {
    const popularRoutes = [
        { from: 'MOW', to: 'LED', name: 'Москва -> Санкт-Петербург' },
        { from: 'MOW', to: 'SVX', name: 'Москва -> Екатеринбург' },
        { from: 'MOW', to: 'KRR', name: 'Москва -> Краснодар' },
        { from: 'MOW', to: 'SOF', name: 'Москва -> Сочи' },
        { from: 'LED', to: 'MOW', name: 'Санкт-Петербург -> Москва' },
        { from: 'MOW', to: 'AYT', name: 'Москва -> Анталья' },
        { from: 'MOW', to: 'IST', name: 'Москва -> Стамбул' }
    ];
    res.json(popularRoutes);
});

app.get('/api/flights/airlines', (req, res) => {
    const airlines = [
        { code: 'SU', name: 'Аэрофлот' },
        { code: 'S7', name: 'S7 Airlines' },
        { code: 'UT', name: 'UTair' },
        { code: 'U6', name: 'Уральские авиалинии' },
        { code: 'DP', name: 'Победа' }
    ];
    res.json(airlines);
});

// Функция для генерации демо-данных
function generateDemoFlights(params) {
    const airlines = ['Аэрофлот', 'S7 Airlines', 'UTair', 'Уральские авиалинии', 'Победа'];
    const platforms = ['Aviasales', 'Яндекс.Путешествия', 'Ozon Travel'];
    
    const tickets = [];
    const basePrice = Math.floor(Math.random() * 15000) + 5000;
    
    for (let i = 0; i < 12; i++) {
        const variance = Math.floor(Math.random() * 4000) - 2000;
        const price = Math.max(3000, basePrice + variance);
        const airline = airlines[Math.floor(Math.random() * airlines.length)];
        const flightClass = ['economy', 'comfort', 'business'][Math.floor(Math.random() * 3)];
        
        const ticket = {
            id: `ticket_${i}`,
            airline: airline,
            route: `${params.from} -> ${params.to}`,
            date: params.date,
            time: generateRandomTime(),
            duration: `${Math.floor(Math.random() * 3) + 1}ч ${Math.floor(Math.random() * 60)}м`,
            stops: Math.random() > 0.7 ? 1 : 0,
            baggage: '1 место',
            class: flightClass,
            flightNumber: generateFlightNumber(airline),
            prices: []
        };
        
        // Добавляем цены с разных платформ
        platforms.forEach(platform => {
            const platformVariance = Math.floor(Math.random() * 1000) - 500;
            ticket.prices.push({
                platform: platform,
                price: Math.max(2000, price + platformVariance),
                url: `https://${platform.toLowerCase().replace('.', '').replace(' ', '')}.ru/search`
            });
        });
        
        tickets.push(ticket);
    }
    
    // Находим минимальную цену
    const minPrice = Math.min(...tickets.flatMap(t => t.prices.map(p => p.price)));
    const airlinesCount = new Set(tickets.map(t => t.airline)).size;
    const directFlights = tickets.filter(t => t.stops === 0).length;
    
    return {
        tickets: tickets,
        stats: {
            minPrice: minPrice,
            maxPrice: minPrice + 8000,
            airlines: airlinesCount,
            directFlights: directFlights
        }
    };
}

function generateRandomTime() {
    const hours = Math.floor(Math.random() * 24).toString().padStart(2, '0');
    const minutes = Math.floor(Math.random() * 60).toString().padStart(2, '0');
    return `${hours}:${minutes}`;
}

function generateFlightNumber(airline) {
    const airlineCodes = {
        'Аэрофлот': 'SU',
        'S7 Airlines': 'S7', 
        'UTair': 'UT',
        'Уральские авиалинии': 'U6',
        'Победа': 'DP'
    };
    const code = airlineCodes[airline] || 'SU';
    const number = Math.floor(Math.random() * 9000) + 1000;
    return `${code}${number}`;
}

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ 
        error: 'Internal Server Error',
        message: 'Something went wrong'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Запуск сервера
app.listen(PORT, () => {
    console.log('Server running on http://localhost:' + PORT);
    console.log('Aviation search available at http://localhost:' + PORT + '/flights');
    console.log('Health check: http://localhost:' + PORT + '/api/health');
    console.log('TicketHunter is ready to use!');
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('Shutting down gracefully...');
    process.exit(0);
});