# TicketHunter 🎫

Агрегатор цен на билеты для мероприятий. Сравнивайте цены со всех популярных площадок в одном месте.

## 🚀 Быстрый старт

```bash
# Установка зависимостей
npm install

# Запуск сервера
npm start

# Запуск в режиме разработки
npm run dev

### Cтруктура проекта

ticket-hunter/
├── public/          # Статические файлы
├── controllers/     # Логика обработки запросов
├── routes/          # Маршруты API
├── middleware/      # Промежуточное ПО
├── data/           # Данные мероприятий
└── config/         # Конфигурации

###Лицензия


**5. config/constants.js**
```javascript
module.exports = {
    PLATFORMS: {
        TICKETLAND: 'Ticketland',
        KASSIR: 'Kassir.ru',
        YANDEX_AFISHA: 'Яндекс.Афиша',
        PARTER: 'Parter.ru',
        TICKETNET: 'Ticketnet.ru'
    },
    
    CATEGORIES: {
        CONCERT: 'concert',
        THEATRE: 'theatre',
        FESTIVAL: 'festival',
        EXHIBITION: 'exhibition',
        SPORT: 'sport',
        STANDUP: 'standup',
        KIDS: 'kids',
        OTHER: 'other'
    },
    
    CITIES: {
        MOSCOW: 'Москва',
        SPB: 'Санкт-Петербург',
        EKATERINBURG: 'Екатеринбург',
        NOVOSIBIRSK: 'Новосибирск',
        KAZAN: 'Казань'
    },
    
    CACHE_DURATION: 15 * 60 * 1000,
    MAX_SEARCH_RESULTS: 100,
    DEFAULT_PAGE_SIZE: 20
};