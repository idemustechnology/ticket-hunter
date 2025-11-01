const axios = require('axios');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');
const UserAgent = require('user-agents');

class ParserService {
    constructor() {
        this.browser = null;
        this.userAgent = new UserAgent();
    }

    async init() {
        this.browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu'
            ]
        });
    }

    async close() {
        if (this.browser) {
            await this.browser.close();
        }
    }

    // Парсинг Kassir.ru
    async parseKassir(searchTerm = '') {
        try {
            const url = searchTerm 
                ? `https://www.kassir.ru/search?text=${encodeURIComponent(searchTerm)}`
                : 'https://www.kassir.ru/';

            const page = await this.browser.newPage();
            await page.setUserAgent(this.userAgent.toString());
            await page.setViewport({ width: 1920, height: 1080 });

            // Блокируем ненужные ресурсы для ускорения
            await page.setRequestInterception(true);
            page.on('request', (req) => {
                if (['image', 'stylesheet', 'font'].includes(req.resourceType())) {
                    req.abort();
                } else {
                    req.continue();
                }
            });

            await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

            // Ждем загрузки контента
            await page.waitForSelector('.event-list, .search-results, .container', { timeout: 10000 });

            const events = await page.evaluate(() => {
                const results = [];
                
                // Ищем карточки мероприятий
                const eventCards = document.querySelectorAll('.event-card, .event-item, .b-ticket-item, [class*="event"]');
                
                eventCards.forEach(card => {
                    try {
                        const titleElem = card.querySelector('.event-title, .title, h3, h4, [class*="title"]');
                        const priceElem = card.querySelector('.price, .cost, [class*="price"]');
                        const dateElem = card.querySelector('.date, .event-date, [class*="date"]');
                        const venueElem = card.querySelector('.venue, .place, [class*="venue"]');
                        const linkElem = card.querySelector('a');
                        
                        if (titleElem && titleElem.textContent.trim()) {
                            const event = {
                                title: titleElem.textContent.trim(),
                                price: priceElem ? priceElem.textContent.trim() : 'Цена не указана',
                                date: dateElem ? dateElem.textContent.trim() : '',
                                venue: venueElem ? venueElem.textContent.trim() : '',
                                url: linkElem ? linkElem.href : '',
                                platform: 'Kassir.ru'
                            };
                            
                            // Очистка и нормализация данных
                            event.price = event.price.replace(/\s+/g, ' ').replace(/[^\d\s]/g, '').trim();
                            event.date = event.date.replace(/\s+/g, ' ').trim();
                            
                            results.push(event);
                        }
                    } catch (e) {
                        console.log('Error parsing card:', e);
                    }
                });

                return results;
            });

            await page.close();
            return this.normalizeEvents(events, 'Kassir.ru');

        } catch (error) {
            console.error('Error parsing Kassir.ru:', error);
            return [];
        }
    }

    // Парсинг Яндекс.Афиши
    async parseYandexAfisha(searchTerm = '') {
        try {
            const url = searchTerm
                ? `https://afisha.yandex.ru/search?text=${encodeURIComponent(searchTerm)}`
                : 'https://afisha.yandex.ru/';

            const response = await axios.get(url, {
                headers: {
                    'User-Agent': this.userAgent.toString(),
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Language': 'ru-RU,ru;q=0.8,en-US;q=0.5,en;q=0.3',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'Connection': 'keep-alive',
                    'Upgrade-Insecure-Requests': '1',
                },
                timeout: 15000
            });

            const $ = cheerio.load(response.data);
            const events = [];

            // Парсим карточки мероприятий
            $('.event, .card, [class*="event"], [class*="card"]').each((i, elem) => {
                const $card = $(elem);
                
                const title = $card.find('.event__title, .card__title, h3, h4').first().text().trim();
                const price = $card.find('.price, .event__price, .card__price').first().text().trim();
                const date = $card.find('.date, .event__date, .card__date').first().text().trim();
                const venue = $card.find('.place, .event__place, .card__place').first().text().trim();
                const url = $card.find('a').first().attr('href');

                if (title && title.length > 5) {
                    events.push({
                        title: title,
                        price: price || 'Цена не указана',
                        date: date || '',
                        venue: venue || '',
                        url: url ? (url.startsWith('http') ? url : `https://afisha.yandex.ru${url}`) : '',
                        platform: 'Яндекс.Афиша'
                    });
                }
            });

            return this.normalizeEvents(events, 'Яндекс.Афиша');

        } catch (error) {
            console.error('Error parsing Yandex Afisha:', error);
            return [];
        }
    }

    // Парсинг Ticketland.ru
    async parseTicketland(searchTerm = '') {
        try {
            const url = searchTerm
                ? `https://www.ticketland.ru/search/?q=${encodeURIComponent(searchTerm)}`
                : 'https://www.ticketland.ru/';

            const page = await this.browser.newPage();
            await page.setUserAgent(this.userAgent.toString());
            
            await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

            const events = await page.evaluate(() => {
                const results = [];
                const selectors = [
                    '.event-item',
                    '.concert-item', 
                    '.show-item',
                    '.playbill-item',
                    '[class*="event"]',
                    '.item'
                ];

                selectors.forEach(selector => {
                    document.querySelectorAll(selector).forEach(card => {
                        try {
                            const titleElem = card.querySelector('h3, h4, .title, .name, [class*="title"]');
                            const priceElem = card.querySelector('.price, .cost, .ticket-price, [class*="price"]');
                            const dateElem = card.querySelector('.date, .event-date, [class*="date"]');
                            const venueElem = card.querySelector('.venue, .place, .location, [class*="venue"]');
                            const linkElem = card.querySelector('a');

                            if (titleElem && titleElem.textContent.trim().length > 5) {
                                const event = {
                                    title: titleElem.textContent.trim(),
                                    price: priceElem ? priceElem.textContent.trim() : 'Цена не указана',
                                    date: dateElem ? dateElem.textContent.trim() : '',
                                    venue: venueElem ? venueElem.textContent.trim() : '',
                                    url: linkElem ? linkElem.href : '',
                                    platform: 'Ticketland'
                                };
                                results.push(event);
                            }
                        } catch (e) {
                            console.log('Error parsing card:', e);
                        }
                    });
                });

                return results;
            });

            await page.close();
            return this.normalizeEvents(events, 'Ticketland');

        } catch (error) {
            console.error('Error parsing Ticketland:', error);
            return [];
        }
    }

    // Парсинг Parter.ru
    async parseParter(searchTerm = '') {
        try {
            const url = searchTerm
                ? `https://www.parter.ru/search/?query=${encodeURIComponent(searchTerm)}`
                : 'https://www.parter.ru/';

            const response = await axios.get(url, {
                headers: {
                    'User-Agent': this.userAgent.toString(),
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                },
                timeout: 15000
            });

            const $ = cheerio.load(response.data);
            const events = [];

            // Парсим различные селекторы, которые могут содержать мероприятия
            $('.event, .show, .concert, .performance, .item').each((i, elem) => {
                const $elem = $(elem);
                
                const title = $elem.find('.title, .name, h3, h4').first().text().trim();
                const price = $elem.find('.price, .cost').first().text().trim();
                const date = $elem.find('.date, .time').first().text().trim();
                const venue = $elem.find('.venue, .place, .theatre').first().text().trim();
                const url = $elem.find('a').first().attr('href');

                if (title && title.length > 5) {
                    events.push({
                        title: title,
                        price: price || 'Цена не указана',
                        date: date || '',
                        venue: venue || '',
                        url: url ? (url.startsWith('http') ? url : `https://www.parter.ru${url}`) : '',
                        platform: 'Parter.ru'
                    });
                }
            });

            return this.normalizeEvents(events, 'Parter.ru');

        } catch (error) {
            console.error('Error parsing Parter.ru:', error);
            return [];
        }
    }

    // Нормализация данных событий
    normalizeEvents(events, platform) {
        return events
            .filter(event => {
                // Фильтруем мусор
                return event.title && 
                       event.title.length > 5 && 
                       !event.title.includes('undefined') &&
                       !event.title.includes('null');
            })
            .map(event => {
                // Нормализуем цену
                let priceValue = 0;
                let fee = 0;
                
                if (event.price && event.price !== 'Цена не указана') {
                    const priceMatch = event.price.match(/(\d+[\s\d]*)/);
                    if (priceMatch) {
                        priceValue = parseInt(priceMatch[1].replace(/\s/g, '')) || 0;
                    }
                }

                // Нормализуем дату
                let dateObj = new Date();
                if (event.date) {
                    const dateMatch = event.date.match(/(\d{1,2}[\.\/]\d{1,2}[\.\/]\d{2,4})/);
                    if (dateMatch) {
                        dateObj = new Date(dateMatch[1].replace(/(\d{2})\.(\d{2})\.(\d{4})/, '$2/$1/$3'));
                    }
                }

                return {
                    id: this.generateId(event.title + event.date + platform),
                    title: event.title,
                    date: dateObj.toISOString().split('T')[0],
                    time: '19:00', // По умолчанию
                    venue: event.venue || 'Место не указано',
                    city: this.extractCity(event.venue),
                    category: this.detectCategory(event.title),
                    image: '/images/placeholder.jpg',
                    description: `Мероприятие "${event.title}" на площадке ${platform}`,
                    prices: [{
                        platform: platform,
                        price: priceValue,
                        fee: fee,
                        url: event.url
                    }],
                    platform: platform,
                    originalData: event
                };
            })
            .slice(0, 20); // Ограничиваем количество
    }

    // Вспомогательные методы
    generateId(str) {
        return Buffer.from(str).toString('base64').slice(0, 10);
    }

    extractCity(venue) {
        const cities = ['Москва', 'Санкт-Петербург', 'Екатеринбург', 'Новосибирск', 'Казань'];
        for (const city of cities) {
            if (venue && venue.includes(city)) {
                return city;
            }
        }
        return 'Москва';
    }

    detectCategory(title) {
        const lowerTitle = title.toLowerCase();
        if (lowerTitle.includes('концерт') || lowerTitle.includes('concert')) return 'concert';
        if (lowerTitle.includes('спектакль') || lowerTitle.includes('театр')) return 'theatre';
        if (lowerTitle.includes('фестиваль')) return 'festival';
        if (lowerTitle.includes('выставка')) return 'exhibition';
        if (lowerTitle.includes('спорт') || lowerTitle.includes('матч')) return 'sport';
        if (lowerTitle.includes('стендап') || lowerTitle.includes('юмор')) return 'standup';
        if (lowerTitle.includes('детск') || lowerTitle.includes('ребен')) return 'kids';
        return 'other';
    }

    // Основной метод парсинга всех платформ
    async parseAllPlatforms(searchTerm = '') {
        try {
            console.log(`🔄 Starting parsing for: "${searchTerm}"`);
            
            const [kassirEvents, yandexEvents, ticketlandEvents, parterEvents] = await Promise.allSettled([
                this.parseKassir(searchTerm),
                this.parseYandexAfisha(searchTerm),
                this.parseTicketland(searchTerm),
                this.parseParter(searchTerm)
            ]);

            const allEvents = [
                ...(kassirEvents.status === 'fulfilled' ? kassirEvents.value : []),
                ...(yandexEvents.status === 'fulfilled' ? yandexEvents.value : []),
                ...(ticketlandEvents.status === 'fulfilled' ? ticketlandEvents.value : []),
                ...(parterEvents.status === 'fulfilled' ? parterEvents.value : [])
            ];

            console.log(`✅ Parsing completed. Found ${allEvents.length} events`);
            return this.aggregateEvents(allEvents);

        } catch (error) {
            console.error('Error in parseAllPlatforms:', error);
            return [];
        }
    }

    // Агрегация событий с разных платформ
    aggregateEvents(events) {
        const aggregated = {};
        
        events.forEach(event => {
            const key = `${event.title}_${event.date}_${event.venue}`;
            
            if (!aggregated[key]) {
                aggregated[key] = {
                    ...event,
                    prices: []
                };
            }
            
            // Добавляем цену с этой платформы
            if (event.prices && event.prices.length > 0) {
                aggregated[key].prices.push(...event.prices);
            }
        });

        return Object.values(aggregated);
    }
}

module.exports = new ParserService();