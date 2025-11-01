const axios = require('axios');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');
const UserAgent = require('user-agents');
const PLATFORMS = require('../config/aviationPlatforms');

class AviationParserService {
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

    // Парсинг Aviasales
    async parseAviasales(params) {
        try {
            const { from, to, date, passengers = 1 } = params;
            const url = `https://www.aviasales.ru/search/${from}${to}${date.replace(/-/g, '')}${passengers}`;

            const page = await this.browser.newPage();
            await page.setUserAgent(this.userAgent.toString());
            await page.setViewport({ width: 1920, height: 1080 });

            await page.setRequestInterception(true);
            page.on('request', (req) => {
                if (['image', 'stylesheet', 'font'].includes(req.resourceType())) {
                    req.abort();
                } else {
                    req.continue();
                }
            });

            await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
            await page.waitForSelector('.ticket, .ticket-item, [class*="ticket"]', { timeout: 15000 });

            const tickets = await page.evaluate(() => {
                const results = [];
                const ticketSelectors = [
                    '.ticket',
                    '.ticket-item',
                    '.ticket-card',
                    '[class*="ticket"]',
                    '[class*="flight"]'
                ];

                ticketSelectors.forEach(selector => {
                    document.querySelectorAll(selector).forEach(ticket => {
                        try {
                            const airlineElem = ticket.querySelector('.airline, .carrier, [class*="airline"]');
                            const priceElem = ticket.querySelector('.price, .cost, [class*="price"]');
                            const timeElem = ticket.querySelector('.time, .duration, [class*="time"]');
                            const routeElem = ticket.querySelector('.route, .path, [class*="route"]');
                            const linkElem = ticket.querySelector('a');

                            if (priceElem && priceElem.textContent.trim()) {
                                const ticketData = {
                                    airline: airlineElem ? airlineElem.textContent.trim() : 'Авиакомпания не указана',
                                    price: priceElem.textContent.trim(),
                                    time: timeElem ? timeElem.textContent.trim() : '',
                                    route: routeElem ? routeElem.textContent.trim() : '',
                                    url: linkElem ? linkElem.href : '',
                                    platform: 'Aviasales'
                                };
                                results.push(ticketData);
                            }
                        } catch (e) {
                            console.log('Error parsing ticket:', e);
                        }
                    });
                });

                return results;
            });

            await page.close();
            return this.normalizeTickets(tickets, 'Aviasales', params);

        } catch (error) {
            console.error('Error parsing Aviasales:', error);
            return [];
        }
    }

    // Парсинг Яндекс.Путешествия
    async parseYandexTravel(params) {
        try {
            const { from, to, date } = params;
            const url = `https://travel.yandex.ru/flights/${from}-${to}/${date}/`;

            const response = await axios.get(url, {
                headers: {
                    'User-Agent': this.userAgent.toString(),
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                },
                timeout: 15000
            });

            const $ = cheerio.load(response.data);
            const tickets = [];

            $('.flight-card, .ticket, [class*="flight"]').each((i, elem) => {
                const $card = $(elem);
                
                const airline = $card.find('.airline, .carrier').first().text().trim();
                const price = $card.find('.price, .cost').first().text().trim();
                const time = $card.find('.time, .duration').first().text().trim();
                const route = $card.find('.route, .path').first().text().trim();
                const url = $card.find('a').first().attr('href');

                if (price && price.length > 0) {
                    tickets.push({
                        airline: airline || 'Авиакомпания не указана',
                        price: price,
                        time: time || '',
                        route: route || '',
                        url: url ? `https://travel.yandex.ru${url}` : '',
                        platform: 'Яндекс.Путешествия'
                    });
                }
            });

            return this.normalizeTickets(tickets, 'Яндекс.Путешествия', params);

        } catch (error) {
            console.error('Error parsing Yandex Travel:', error);
            return [];
        }
    }

    // Парсинг Ozon Travel
    async parseOzonTravel(params) {
        try {
            const { from, to, date } = params;
            const url = `https://www.ozon.ru/travel/flights/${from}/${to}/${date}/`;

            const page = await this.browser.newPage();
            await page.setUserAgent(this.userAgent.toString());
            
            await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

            const tickets = await page.evaluate(() => {
                const results = [];
                const selectors = [
                    '.ticket',
                    '.flight-card',
                    '.offer-card',
                    '[class*="ticket"]',
                    '[class*="flight"]'
                ];

                selectors.forEach(selector => {
                    document.querySelectorAll(selector).forEach(ticket => {
                        try {
                            const airlineElem = ticket.querySelector('.airline, .carrier, [class*="airline"]');
                            const priceElem = ticket.querySelector('.price, .cost, [class*="price"]');
                            const timeElem = ticket.querySelector('.time, .duration, [class*="time"]');
                            const routeElem = ticket.querySelector('.route, .path, [class*="route"]');
                            const linkElem = ticket.querySelector('a');

                            if (priceElem && priceElem.textContent.trim()) {
                                const ticketData = {
                                    airline: airlineElem ? airlineElem.textContent.trim() : 'Авиакомпания не указана',
                                    price: priceElem.textContent.trim(),
                                    time: timeElem ? timeElem.textContent.trim() : '',
                                    route: routeElem ? routeElem.textContent.trim() : '',
                                    url: linkElem ? linkElem.href : '',
                                    platform: 'Ozon Travel'
                                };
                                results.push(ticketData);
                            }
                        } catch (e) {
                            console.log('Error parsing ticket:', e);
                        }
                    });
                });

                return results;
            });

            await page.close();
            return this.normalizeTickets(tickets, 'Ozon Travel', params);

        } catch (error) {
            console.error('Error parsing Ozon Travel:', error);
            return [];
        }
    }

    // Парсинг S7 Airlines
    async parseS7Airlines(params) {
        try {
            const { from, to, date } = params;
            const url = `https://www.s7.ru/booking/search?departureCity=${from}&arrivalCity=${to}&departureDate=${date}`;

            const response = await axios.get(url, {
                headers: {
                    'User-Agent': this.userAgent.toString(),
                },
                timeout: 15000
            });

            const $ = cheerio.load(response.data);
            const tickets = [];

            $('.flight, .ticket, .offer').each((i, elem) => {
                const $elem = $(elem);
                
                const price = $elem.find('.price, .cost').first().text().trim();
                const time = $elem.find('.time, .duration').first().text().trim();
                const flightNumber = $elem.find('.flight-number').first().text().trim();

                if (price) {
                    tickets.push({
                        airline: 'S7 Airlines',
                        price: price,
                        time: time || '',
                        route: `${from} - ${to}`,
                        flightNumber: flightNumber || '',
                        url: `https://www.s7.ru/booking`,
                        platform: 'S7 Airlines'
                    });
                }
            });

            return this.normalizeTickets(tickets, 'S7 Airlines', params);

        } catch (error) {
            console.error('Error parsing S7 Airlines:', error);
            return [];
        }
    }

    // Парсинг Аэрофлот
    async parseAeroflot(params) {
        try {
            const { from, to, date } = params;
            const url = `https://www.aeroflot.ru/ru-ru/booking?origin=${from}&destination=${to}&departureDate=${date}`;

            const page = await this.browser.newPage();
            await page.setUserAgent(this.userAgent.toString());
            
            await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

            const tickets = await page.evaluate(() => {
                const results = [];
                const flightElements = document.querySelectorAll('.flight, .ticket, [class*="flight"]');

                flightElements.forEach(flight => {
                    try {
                        const priceElem = flight.querySelector('.price, .cost, [class*="price"]');
                        const timeElem = flight.querySelector('.time, .duration');
                        const flightNumberElem = flight.querySelector('.flight-number');

                        if (priceElem) {
                            results.push({
                                airline: 'Аэрофлот',
                                price: priceElem.textContent.trim(),
                                time: timeElem ? timeElem.textContent.trim() : '',
                                route: 'Маршрут Аэрофлот',
                                flightNumber: flightNumberElem ? flightNumberElem.textContent.trim() : '',
                                url: window.location.href,
                                platform: 'Аэрофлот'
                            });
                        }
                    } catch (e) {
                        console.log('Error parsing Aeroflot flight:', e);
                    }
                });

                return results;
            });

            await page.close();
            return this.normalizeTickets(tickets, 'Аэрофлот', params);

        } catch (error) {
            console.error('Error parsing Aeroflot:', error);
            return [];
        }
    }

    // Нормализация данных билетов
    normalizeTickets(tickets, platform, params) {
        return tickets
            .filter(ticket => {
                return ticket.price && 
                       ticket.price.length > 0 && 
                       !ticket.price.includes('undefined');
            })
            .map(ticket => {
                // Извлекаем числовое значение цены
                let priceValue = 0;
                if (ticket.price) {
                    const priceMatch = ticket.price.match(/(\d+[\s\d]*)/);
                    if (priceMatch) {
                        priceValue = parseInt(priceMatch[1].replace(/\s/g, '')) || 0;
                    }
                }

                // Определяем класс перелета
                const flightClass = this.detectFlightClass(ticket.airline, ticket.price);

                return {
                    id: this.generateTicketId(ticket.airline + ticket.price + platform),
                    airline: ticket.airline,
                    price: priceValue,
                    originalPrice: ticket.price,
                    time: ticket.time,
                    route: ticket.route || `${params.from} - ${params.to}`,
                    flightNumber: ticket.flightNumber || '',
                    class: flightClass,
                    date: params.date,
                    from: params.from,
                    to: params.to,
                    passengers: params.passengers || 1,
                    platform: platform,
                    url: ticket.url,
                    duration: this.calculateDuration(ticket.time),
                    stops: this.detectStops(ticket.route),
                    baggage: this.detectBaggage(flightClass)
                };
            })
            .slice(0, 15); // Ограничиваем количество
    }

    // Вспомогательные методы
    generateTicketId(str) {
        return Buffer.from(str).toString('base64').slice(0, 12);
    }

    detectFlightClass(airline, price) {
        const lowerAirline = airline.toLowerCase();
        const priceValue = parseInt(price.replace(/\D/g, '')) || 0;

        if (lowerAirline.includes('бизнес') || lowerAirline.includes('business')) {
            return 'business';
        }
        if (lowerAirline.includes('комфорт') || lowerAirline.includes('comfort')) {
            return 'comfort';
        }
        if (lowerAirline.includes('эконом') || lowerAirline.includes('economy')) {
            return 'economy';
        }
        
        // Эвристика по цене
        if (priceValue > 50000) return 'business';
        if (priceValue > 25000) return 'comfort';
        return 'economy';
    }

    calculateDuration(timeString) {
        if (!timeString) return '~2ч';
        
        const match = timeString.match(/(\d+)\s*ч/);
        if (match) {
            return `${match[1]}ч`;
        }
        return '~2ч';
    }

    detectStops(route) {
        if (!route) return 0;
        if (route.includes('прям')) return 0;
        if (route.includes('1 пересад')) return 1;
        if (route.includes('2 пересад')) return 2;
        
        const stops = route.split('-').length - 2;
        return Math.max(0, stops);
    }

    detectBaggage(flightClass) {
        switch (flightClass) {
            case 'business': return '2 места';
            case 'comfort': return '1 место';
            default: return '1 место';
        }
    }

    // Основной метод парсинга всех платформ
    async parseAllPlatforms(searchParams) {
        try {
            console.log(`🔄 Starting aviation parsing for: ${searchParams.from} → ${searchParams.to} on ${searchParams.date}`);
            
            const [aviasalesTickets, yandexTickets, ozonTickets, s7Tickets, aeroflotTickets] = await Promise.allSettled([
                this.parseAviasales(searchParams),
                this.parseYandexTravel(searchParams),
                this.parseOzonTravel(searchParams),
                this.parseS7Airlines(searchParams),
                this.parseAeroflot(searchParams)
            ]);

            const allTickets = [
                ...(aviasalesTickets.status === 'fulfilled' ? aviasalesTickets.value : []),
                ...(yandexTickets.status === 'fulfilled' ? yandexTickets.value : []),
                ...(ozonTickets.status === 'fulfilled' ? ozonTickets.value : []),
                ...(s7Tickets.status === 'fulfilled' ? s7Tickets.value : []),
                ...(aeroflotTickets.status === 'fulfilled' ? aeroflotTickets.value : [])
            ];

            console.log(`✅ Aviation parsing completed. Found ${allTickets.length} tickets`);
            return this.aggregateTickets(allTickets);

        } catch (error) {
            console.error('Error in parseAllPlatforms:', error);
            return [];
        }
    }

    // Агрегация билетов с разных платформ
    aggregateTickets(tickets) {
        const aggregated = {};
        
        tickets.forEach(ticket => {
            const key = `${ticket.airline}_${ticket.flightNumber}_${ticket.date}_${ticket.class}`;
            
            if (!aggregated[key]) {
                aggregated[key] = {
                    ...ticket,
                    prices: []
                };
                delete aggregated[key].price; // Удаляем оригинальное поле цены
            }
            
            // Добавляем цену с этой платформы
            aggregated[key].prices.push({
                platform: ticket.platform,
                price: ticket.price,
                originalPrice: ticket.originalPrice,
                url: ticket.url
            });
        });

        return Object.values(aggregated);
    }

    // Поиск популярных направлений
    async getPopularRoutes() {
        const popularRoutes = [
            { from: 'MOW', to: 'LED', name: 'Москва → Санкт-Петербург' },
            { from: 'MOW', to: 'SVX', name: 'Москва → Екатеринбург' },
            { from: 'MOW', to: 'KRR', name: 'Москва → Краснодар' },
            { from: 'MOW', to: 'SOF', name: 'Москва → Сочи' },
            { from: 'LED', to: 'MOW', name: 'Санкт-Петербург → Москва' },
            { from: 'MOW', to: 'AYT', name: 'Москва → Анталья' },
            { from: 'MOW', to: 'IST', name: 'Москва → Стамбул' }
        ];

        return popularRoutes;
    }

    // Получение авиакомпаний
    async getAirlines() {
        return [
            { code: 'SU', name: 'Аэрофлот' },
            { code: 'S7', name: 'S7 Airlines' },
            { code: 'UT', name: 'UTair' },
            { code: 'U6', name: 'Уральские авиалинии' },
            { code: 'FV', name: 'Россия' },
            { code: '6L', name: 'Азимут' },
            { code: 'N4', name: 'Нордстар' }
        ];
    }
}

module.exports = new AviationParserService();