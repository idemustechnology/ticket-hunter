const axios = require('axios');
const cheerio = require('cheerio');

class EventsParser {
    async searchEvents(query = '') {
        try {
            // Парсим Яндекс Афишу
            const yandexEvents = await this.parseYandexAfisha(query);
            
            // Парсим Kassir.ru
            const kassirEvents = await this.parseKassir(query);
            
            const allEvents = [...yandexEvents, ...kassirEvents];
            
            // Если не нашли событий, возвращаем демо-данные
            return allEvents.length > 0 ? allEvents : this.generateDemoEvents(query);
            
        } catch (error) {
            console.error('Events parsing error:', error);
            return this.generateDemoEvents(query);
        }
    }

    async parseYandexAfisha(query) {
        try {
            const url = query 
                ? `https://afisha.yandex.ru/search?text=${encodeURIComponent(query)}`
                : 'https://afisha.yandex.ru/moscow';
            
            const response = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                },
                timeout: 10000
            });

            const $ = cheerio.load(response.data);
            const events = [];

            $('.event, .card').each((i, elem) => {
                const $elem = $(elem);
                const title = $elem.find('h3, .title').first().text().trim();
                const price = $elem.find('.price').first().text().trim();
                const date = $elem.find('.date').first().text().trim();
                const venue = $elem.find('.place').first().text().trim();
                const url = $elem.find('a').first().attr('href');

                if (title && title.length > 3) {
                    events.push({
                        id: `yandex_${i}`,
                        title: title,
                        price: price || 'Цена не указана',
                        date: date || 'Дата не указана',
                        venue: venue || 'Место не указано',
                        url: url ? `https://afisha.yandex.ru${url}` : '',
                        platform: 'Яндекс.Афиша',
                        category: this.detectCategory(title)
                    });
                }
            });

            return events.slice(0, 10);
        } catch (error) {
            console.error('Yandex Afisha parsing failed:', error.message);
            return [];
        }
    }

    async parseKassir(query) {
        try {
            const url = query
                ? `https://www.kassir.ru/search?text=${encodeURIComponent(query)}`
                : 'https://www.kassir.ru/';
            
            const response = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                },
                timeout: 10000
            });

            const $ = cheerio.load(response.data);
            const events = [];

            $('.event-card, .ticket-item').each((i, elem) => {
                const $elem = $(elem);
                const title = $elem.find('.title, h3').first().text().trim();
                const price = $elem.find('.price, .cost').first().text().trim();
                const date = $elem.find('.date').first().text().trim();
                const venue = $elem.find('.venue, .place').first().text().trim();

                if (title && title.length > 3) {
                    events.push({
                        id: `kassir_${i}`,
                        title: title,
                        price: price || 'Цена не указана',
                        date: date || 'Дата не указана',
                        venue: venue || 'Место не указано',
                        url: 'https://www.kassir.ru',
                        platform: 'Kassir.ru',
                        category: this.detectCategory(title)
                    });
                }
            });

            return events.slice(0, 10);
        } catch (error) {
            console.error('Kassir parsing failed:', error.message);
            return [];
        }
    }

    detectCategory(title) {
        const lowerTitle = title.toLowerCase();
        if (lowerTitle.includes('концерт') || lowerTitle.includes('concert')) return 'concert';
        if (lowerTitle.includes('спектакль') || lowerTitle.includes('театр')) return 'theatre';
        if (lowerTitle.includes('выставка')) return 'exhibition';
        if (lowerTitle.includes('фестиваль')) return 'festival';
        if (lowerTitle.includes('кино') || lowerTitle.includes('фильм')) return 'cinema';
        return 'other';
    }

    generateDemoEvents(query) {
        const events = [
            {
                id: 'demo1',
                title: 'Концерт группы Ленинград',
                price: 'от 1500 ₽',
                date: '15 ноября 2024',
                venue: 'Стадион Лужники, Москва',
                platform: 'Демо данные',
                category: 'concert'
            },
            {
                id: 'demo2',
                title: 'Спектакль "Евгений Онегин"',
                price: 'от 2000 ₽',
                date: '20 ноября 2024',
                venue: 'Большой театр, Москва',
                platform: 'Демо данные',
                category: 'theatre'
            },
            {
                id: 'demo3',
                title: 'Выставка современного искусства',
                price: 'от 500 ₽',
                date: '25 ноября 2024',
                venue: 'Третьяковская галерея, Москва',
                platform: 'Демо данные',
                category: 'exhibition'
            },
            {
                id: 'demo4',
                title: 'Фестиваль "Усадьба Jazz"',
                price: 'от 3000 ₽',
                date: '30 ноября 2024',
                venue: 'Парк Коломенское, Москва',
                platform: 'Демо данные',
                category: 'festival'
            }
        ];

        return query ? events.filter(event => 
            event.title.toLowerCase().includes(query.toLowerCase())
        ) : events;
    }
}

module.exports = new EventsParser();