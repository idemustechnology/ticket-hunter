// Events search JavaScript
class EventsApp {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
        console.log('Events app initialized');
        
        // Загружаем популярные мероприятия при загрузке
        this.searchEvents('');
    }

    setupEventListeners() {
        document.getElementById('eventsSearchForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const query = document.getElementById('eventsSearch').value.trim();
            this.searchEvents(query);
        });
    }

    async searchEvents(query) {
        this.showLoading(true);
        this.hideResults();

        try {
            const response = await fetch(`/search/events?query=${encodeURIComponent(query)}`);
            const data = await response.json();

            if (data.success) {
                this.displayResults(data.events, data.found);
            } else {
                throw new Error(data.error || 'Search failed');
            }
        } catch (error) {
            console.error('Search error:', error);
            this.showError('Ошибка поиска. Попробуйте позже.');
        } finally {
            this.showLoading(false);
        }
    }

    displayResults(events, count) {
        const container = document.getElementById('eventsGrid');
        const noResults = document.getElementById('noResults');

        if (events.length === 0) {
            container.innerHTML = '';
            noResults.style.display = 'block';
            return;
        }

        noResults.style.display = 'none';
        
        container.innerHTML = events.map(event => this.createEventCard(event)).join('');
    }

    createEventCard(event) {
        return `
            <div class="event-card">
                <h3 class="event-title">${this.escapeHtml(event.title)}</h3>
                <div class="event-price">${event.price}</div>
                <div class="event-details">
                    <div><strong>Дата:</strong> ${event.date}</div>
                    <div><strong>Место:</strong> ${this.escapeHtml(event.venue)}</div>
                    <div><strong>Категория:</strong> ${this.getCategoryLabel(event.category)}</div>
                </div>
                ${event.url ? `<a href="${event.url}" target="_blank" class="search-btn" style="display: inline-block; text-decoration: none;">Купить билет</a>` : ''}
                <div class="event-platform">${this.escapeHtml(event.platform)}</div>
            </div>
        `;
    }

    getCategoryLabel(category) {
        const labels = {
            'concert': 'Концерт',
            'theatre': 'Театр',
            'exhibition': 'Выставка',
            'festival': 'Фестиваль',
            'cinema': 'Кино',
            'other': 'Другое'
        };
        return labels[category] || category;
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

    hideResults() {
        document.getElementById('eventsGrid').innerHTML = '';
        document.getElementById('noResults').style.display = 'none';
    }

    showError(message) {
        const container = document.getElementById('eventsGrid');
        container.innerHTML = `
            <div class="no-results">
                <h3>${message}</h3>
            </div>
        `;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.eventsApp = new EventsApp();
});