class FlightsApp {
    constructor() {
        this.currentSearch = null;
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.loadPopularRoutes();
        this.setDefaultDate();
        
        console.log('✈️ Flights app initialized');
    }

    setupEventListeners() {
        // Поиск билетов
        document.getElementById('flightSearchForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.searchFlights();
        });

        // Фильтры
        document.getElementById('sortSelect').addEventListener('change', () => {
            if (this.currentSearch) {
                this.searchFlights();
            }
        });

        document.getElementById('filterDirect').addEventListener('change', () => {
            this.filterTickets();
        });

        document.getElementById('filterBaggage').addEventListener('change', () => {
            this.filterTickets();
        });
    }

    async searchFlights() {
        const formData = new FormData(document.getElementById('flightSearchForm'));
        const searchParams = {
            from: formData.get('from').toUpperCase(),
            to: formData.get('to').toUpperCase(),
            date: formData.get('date'),
            passengers: formData.get('passengers'),
            sort: document.getElementById('sortSelect').value
        };

        this.currentSearch = searchParams;
        this.showLoading(true);

        try {
            const queryString = new URLSearchParams(searchParams).toString();
            const response = await fetch(`/api/flights/search?${queryString}`);
            const data = await response.json();

            if (response.ok) {
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
        this.updateStats(data.stats, data.total);
        this.displayTickets(data.tickets);
    }

    updateStats(stats, total) {
        document.getElementById('ticketsCount').textContent = total;
        document.getElementById('minPrice').textContent = this.formatPrice(stats.minPrice);
        document.getElementById('airlinesCount').textContent = stats.airlines;
        document.getElementById('statsBar').style.display = 'grid';
    }

    displayTickets(tickets) {
        const container = document.getElementById('ticketsGrid');
        const noResults = document.getElementById('noResults');

        if (tickets.length === 0) {
            container.innerHTML = '';
            noResults.style.display = 'block';
            return;
        }

        noResults.style.display = 'none';
        
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
                        <div class="ticket-route-main">${ticket.from} → ${ticket.to}</div>
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

    async loadPopularRoutes() {
        try {
            const response = await fetch('/api/flights/popular-routes');
            const routes = await response.json();
            
            const container = document.getElementById('popularRoutes');
            container.innerHTML = routes.map(route => `
                <a href="#" class="popular-route" data-from="${route.from}" data-to="${route.to}">
                    ${route.name}
                </a>
            `).join('');

            // Добавляем обработчики для популярных маршрутов
            container.querySelectorAll('.popular-route').forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    document.getElementById('from').value = link.dataset.from;
                    document.getElementById('to').value = link.dataset.to;
                    this.searchFlights();
                });
            });

        } catch (error) {
            console.error('Error loading popular routes:', error);
        }
    }

    filterTickets() {
        // Здесь можно добавить фильтрацию уже загруженных билетов
        if (this.currentSearch) {
            this.searchFlights();
        }
    }

    setDefaultDate() {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        document.getElementById('date').value = tomorrow.toISOString().split('T')[0];
    }

    // Вспомогательные методы
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
        const loading = document.getElementById('loadingIndicator');
        const results = document.getElementById('ticketsGrid');
        
        if (show) {
            loading.style.display = 'flex';
            results.style.display = 'none';
        } else {
            loading.style.display = 'none';
            results.style.display = 'flex';
        }
    }

    showError(message) {
        const container = document.getElementById('ticketsGrid');
        container.innerHTML = `
            <div class="no-results">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>${message}</h3>
                <button onclick="flightsApp.searchFlights()" class="btn-primary">
                    <i class="fas fa-redo"></i> Попробовать снова
                </button>
            </div>
        `;
    }
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', () => {
    window.flightsApp = new FlightsApp();
});