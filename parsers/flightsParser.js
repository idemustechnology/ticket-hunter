const axios = require('axios');
const cheerio = require('cheerio');

class FlightsParser {
    async searchFlights(params) {
        try {
            const { from, to, date } = params;
            
            // Парсим Aviasales
            const aviasalesTickets = await this.parseAviasales(from, to, date);
            
            // Парсим Яндекс Путешествия
            const yandexTickets = await this.parseYandexTravel(from, to, date);
            
            const allTickets = [...aviasalesTickets, ...yandexTickets];
            
            // Если не нашли билетов, возвращаем демо-данные
            return allTickets.length > 0 ? allTickets : this.generateDemoTickets(params);
            
        } catch (error) {
            console.error('Flights parsing error:', error);
            return this.generateDemoTickets(params);
        }
    }

    async parseAviasales(from, to, date) {
        try {
            const url = `https://www.aviasales.ru/search/${from}${to}${date.replace(/-/g, '')}1`;
            
            const response = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                },
                timeout: 15000
            });

            const $ = cheerio.load(response.data);
            const tickets = [];

            // Парсим билеты с Aviasales
            $('.ticket, [class*="ticket"]').each((i, elem) => {
                const $elem = $(elem);
                const priceText = $elem.find('.price').first().text().trim();
                const airline = $elem.find('.airline').first().text().trim();
                
                if (priceText) {
                    const priceMatch = priceText.match(/(\d[\d\s]*)/);
                    if (priceMatch) {
                        const price = parseInt(priceMatch[1].replace(/\s/g, '')) || 0;
                        if (price > 0) {
                            tickets.push({
                                id: `aviasales_${i}`,
                                airline: airline || 'Авиакомпания не указана',
                                price: price,
                                route: `${from} → ${to}`,
                                date: date,
                                time: this.generateRandomTime(),
                                duration: '2ч 30м',
                                stops: 0,
                                baggage: '1 место',
                                class: 'economy',
                                platform: 'Aviasales',
                                url: url
                            });
                        }
                    }
                }
            });

            return tickets.slice(0, 8);
        } catch (error) {
            console.error('Aviasales parsing failed:', error.message);
            return [];
        }
    }

    async parseYandexTravel(from, to, date) {
        try {
            const url = `https://travel.yandex.ru/flights/${from}-${to}/`;
            
            const response = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                },
                timeout: 15000
            });

            const $ = cheerio.load(response.data);
            const tickets = [];

            $('.flight-card, [class*="ticket"]').each((i, elem) => {
                const $elem = $(elem);
                const priceText = $elem.find('.price').first().text().trim();
                const airline = $elem.find('.airline').first().text().trim();
                
                if (priceText) {
                    const priceMatch = priceText.match(/(\d[\d\s]*)/);
                    if (priceMatch) {
                        const price = parseInt(priceMatch[1].replace(/\s/g, '')) || 0;
                        if (price > 0) {
                            tickets.push({
                                id: `yandex_${i}`,
                                airline: airline || 'Авиакомпания не указана',
                                price: price,
                                route: `${from} → ${to}`,
                                date: date,
                                time: this.generateRandomTime(),
                                duration: '2ч 15м',
                                stops: Math.random() > 0.8 ? 1 : 0,
                                baggage: '1 место',
                                class: 'economy',
                                platform: 'Яндекс.Путешествия',
                                url: url
                            });
                        }
                    }
                }
            });

            return tickets.slice(0, 8);
        } catch (error) {
            console.error('Yandex Travel parsing failed:', error.message);
            return [];
        }
    }

    generateRandomTime() {
        const hours = Math.floor(Math.random() * 24).toString().padStart(2, '0');
        const minutes = Math.floor(Math.random() * 60).toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    }

    generateDemoTickets(params) {
        const { from, to, date } = params;
        const airlines = ['Аэрофлот', 'S7 Airlines', 'UTair', 'Уральские авиалинии', 'Победа'];
        
        return Array.from({ length: 6 }, (_, i) => ({
            id: `demo_${i}`,
            airline: airlines[Math.floor(Math.random() * airlines.length)],
            price: Math.floor(Math.random() * 15000) + 5000,
            route: `${from} → ${to}`,
            date: date,
            time: this.generateRandomTime(),
            duration: `${Math.floor(Math.random() * 3) + 1}ч ${Math.floor(Math.random() * 60)}м`,
            stops: Math.random() > 0.7 ? 1 : 0,
            baggage: '1 место',
            class: ['economy', 'comfort', 'business'][Math.floor(Math.random() * 3)],
            platform: 'Демо данные',
            url: '#'
        }));
    }
}

module.exports = new FlightsParser();