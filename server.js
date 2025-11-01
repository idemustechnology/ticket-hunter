const AviationParserService = require('./services/aviationParserService');

// Добавляем роуты
app.use('/api/flights', require('./routes/flights'));

// Инициализация авиа-парсера
async function initializeAviationParser() {
    try {
        await AviationParserService.init();
        console.log('✅ Aviation parser service initialized');
    } catch (error) {
        console.error('❌ Failed to initialize aviation parser:', error);
    }
}

initializeAviationParser();