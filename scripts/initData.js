const fs = require('fs').promises;
const path = require('path');
const { generateMockEvents } = require('../utils/dataGenerator');

async function initializeData() {
    try {
        console.log('🔄 Initializing data...');
        
        // Генерируем тестовые данные
        const mockEvents = generateMockEvents(20);
        
        const eventsData = {
            lastUpdated: new Date().toISOString(),
            events: mockEvents
        };
        
        // Сохраняем events.json
        await fs.writeFile(
            path.join(__dirname, '../data/events.json'),
            JSON.stringify(eventsData, null, 2)
        );
        
        // Обновляем категории
        const categories = [
            { id: "all", name: "Все категории", count: mockEvents.length },
            { id: "concert", name: "Концерты", count: mockEvents.filter(e => e.category === 'concert').length },
            { id: "theatre", name: "Театры", count: mockEvents.filter(e => e.category === 'theatre').length },
            { id: "festival", name: "Фестивали", count: mockEvents.filter(e => e.category === 'festival').length },
            { id: "exhibition", name: "Выставки", count: mockEvents.filter(e => e.category === 'exhibition').length },
            { id: "sport", name: "Спорт", count: mockEvents.filter(e => e.category === 'sport').length },
            { id: "standup", name: "Стендап", count: mockEvents.filter(e => e.category === 'standup').length },
            { id: "kids", name: "Детские", count: mockEvents.filter(e => e.category === 'kids').length }
        ];
        
        await fs.writeFile(
            path.join(__dirname, '../data/categories.json'),
            JSON.stringify(categories, null, 2)
        );
        
        console.log('✅ Data initialized successfully!');
        console.log(`📊 Generated ${mockEvents.length} events`);
        console.log(`🗂 Created ${categories.length} categories`);
        
    } catch (error) {
        console.error('❌ Error initializing data:', error);
    }
}

// Запуск если файл вызван напрямую
if (require.main === module) {
    initializeData();
}

module.exports = initializeData;