// Flights search JavaScript
class FlightsApp {
    constructor() {
        this.currentSearch = null;
        this.init();
    }

    init() {
        this.setDefaultDate();
        this.setupEventListeners();
        this.loadPopularRoutes();
        console.log('Flights app initialized');
    }

    setupEventListeners() {
        document.getElementById('flightSearchForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.searchFlights();
        });
    }

    async loadPopularRoutes() {
        try {
            const response = await fetch('/popular-routes');
            const routes = await response.json();
            
            // Можно добавить отображение популярных маршрутов на странице
            console.log('Popular routes loaded:', routes);
        } catch (error) {
            console.error('Error loading popular routes:', error);
        }
    }

    setDefaultDate() {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        document.getElementById('date').value = tomorrow.toISOString().split('T')[0];
    }

    async searchFlights() {
        const formData = new FormData(document.getElementById('flightSearchForm'));
        const searchParams = {
            from: formData.get('from').toUpperCase(),
            to: formData.get('to').toUpperCase(),
            date: formData.get('date'),
            passengers: formData.get('passengers')
        };

        this.currentSearch = searchParams;
        this.showLoading(true);

        try {
            const queryString = new URLSearchParams(searchParams).toString();
            const response = await fetch(`/search/flights?${queryString}`);
            const data = await response.json();

            if (data.success) {
                this.displayResults(data);
            } else {
                throw new Error(data.message || 'Search failed');
            }
        } catch (error) {
            console.error('Search error:', error);
            this.showError('Ошибка поиска. Попробуйте позже.');
        } finally {
            this.showLoading(false);
        }
    }

    displayResults(data) {
        this.displayTickets(data.tickets, data.total);
    }

    displayTickets(tickets, total) {
        const container = document.getElementById('ticketsGrid');
        const noResults = document.getElementById('noResults');
        const statsBar = document.getElementById('statsBar');

        if (tickets.length === 0) {
            container.innerHTML = '';
            noResults.style.display = 'block';
            statsBar.style.display = 'none';
            return;
        }

        noResults.style.display = 'none';
        statsBar.style.display = 'grid';
        
        document.getElementById('ticketsCount').textContent = total;
        document.getElementById('minPrice').textContent = this.formatPrice(this.getMinPrice(tickets));
        document.getElementById('airlinesCount').textContent = this.getAirlinesCount(tickets);
        
        container.innerHTML = tickets.map(ticket => this.createTicketCard(ticket)).join('');
    }

    createTicketCard(ticket) {
        const bestPrice = ticket.prices.reduce((best, current) => 
            current.price < best.price ? current : best
        );

        return `
            <div class="ticket-card">
                <div class="ticket-header">
                    <div class="ticket-airline">${this.escapeHtml(ticket.airline)}</div>
                    <div class="ticket-route">
                        <div class="ticket-route-main">${ticket.route}</div>
                        <div class="ticket-dates">${this.formatDate(ticket.date)}</div>
                    </div>
                    <span class="flight-class ${ticket.class}">${this.getClassLabel(ticket.class)}</span>
                </div>
                
                <div class="ticket-details">
                    <div class="detail-item">
                        <span class="detail-label">Время</span>
                        <span class="detail-value">${ticket.time || 'Не указано'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Пересадки</span>
                        <span class="detail-value">${this.getStopsLabel(ticket.stops)}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Багаж</span>
                        <span class="detail-value">${ticket.baggage}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Рейс</span>
                        <span class="detail-value">${ticket.flightNumber || 'Не указан'}</span>
                    </div>
                </div>
                
                <div class="ticket-prices">
                    ${ticket.prices.map(price => `
                        <div class="price-option ${price === bestPrice ? 'best-price' : ''}">
                            <span class="price-platform">${this.escapeHtml(price.platform)}</span>
                            <span class="price-amount">${this.formatPrice(price.price)}</span>
                            <a href="${price.url}" target="_blank" class="buy-btn">
                                ${price === bestPrice ? 'Купить' : 'Выбрать'}
                            </a>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    getMinPrice(tickets) {
        if (tickets.length === 0) return 0;
        return Math.min(...tickets.flatMap(t => t.prices.map(p => p.price)));
    }

    getAirlinesCount(tickets) {
        const airlines = new Set(tickets.map(t => t.airline));
        return airlines.size;
    }

    formatPrice(price) {
        return new Intl.NumberFormat('ru-RU', {
            style: 'currency',
            currency: 'RUB',
            minimumFractionDigits: 0
        }).format(price);
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    }

    getClassLabel(flightClass) {
        const labels = {
            'economy': 'Эконом',
            'comfort': 'Комфорт', 
            'business': 'Бизнес'
        };
        return labels[flightClass] || flightClass;
    }

    getStopsLabel(stops) {
        if (stops === 0) return 'Прямой рейс';
        if (stops === 1) return '1 пересадка';
        return `${stops} пересадки`;
    }

    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    showLoading(show) {
        document.getElementById('loadingIndicator').style.display = show ? 'block' : 'none';
    }

    showError(message) {
        const container = document.getElementById('ticketsGrid');
        container.innerHTML = `
            <div class="no-results">
                <h3>${message}</h3>
                <button onclick="flightsApp.searchFlights()" class="btn btn-primary">
                    Попробовать снова
                </button>
            </div>
        `;
    }
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', () => {
    window.flightsApp = new FlightsApp();
});