const { PLATFORMS, CATEGORIES, CITIES } = require('../config/constants');

function generateMockEvents(count = 50) {
    const events = [];
    const venues = [
        'Стадион Лужники', 'Крокус Сити Холл', 'Олимпийский', 'Главclub',
        'Adrenaline Stadium', 'Известия Hall', 'Arena Moscow', 'Главclub Green Concert'
    ];
    
    const titles = [
        'Концерт Группы Ленинград', 'Спектакль "Евгений Онегин"', 'Фестиваль "Усадьба Jazz"',
        'Выставка "Импрессионисты"', 'Стендап комик Иван Иванов', 'Мюзикл "Кошки"',
        'Балет "Лебединое озеро"', 'Рок-фестиваль "Нашествие"', 'КВН Высшая лига',
        'Концерт Би-2', 'Шоу "Танцы"', 'Выставка "Автомир"'
    ];
    
    for (let i = 1; i <= count; i++) {
        const category = Object.values(CATEGORIES)[Math.floor(Math.random() * Object.values(CATEGORIES).length)];
        const city = Object.values(CITIES)[Math.floor(Math.random() * Object.values(CITIES).length)];
        
        const event = {
            id: i,
            title: titles[Math.floor(Math.random() * titles.length)] + ` #${i}`,
            date: generateFutureDate(),
            time: '19:00',
            venue: venues[Math.floor(Math.random() * venues.length)],
            city: city,
            category: category,
            image: '/images/placeholder.jpg',
            description: `Описание мероприятия "${titles[Math.floor(Math.random() * titles.length)]}". Увлекательное шоу для всей семьи.`,
            prices: generatePrices()
        };
        
        events.push(event);
    }
    
    return events;
}

function generateFutureDate() {
    const date = new Date();
    date.setDate(date.getDate() + Math.floor(Math.random() * 90) + 1);
    return date.toISOString().split('T')[0];
}

function generatePrices() {
    const platforms = Object.values(PLATFORMS);
    const count = Math.floor(Math.random() * 3) + 2; // 2-4 платформы
    
    const selectedPlatforms = [];
    while (selectedPlatforms.length < count) {
        const platform = platforms[Math.floor(Math.random() * platforms.length)];
        if (!selectedPlatforms.includes(platform)) {
            selectedPlatforms.push(platform);
        }
    }
    
    return selectedPlatforms.map(platform => {
        const basePrice = Math.floor(Math.random() * 5000) + 1000;
        const fee = Math.floor(Math.random() * 500) + 100;
        
        return {
            platform: platform,
            price: basePrice,
            fee: fee,
            url: `https://${platform.toLowerCase().replace('.', '')}.ru/event`
        };
    });
}

module.exports = { generateMockEvents };