// Main application entry point
class TicketHunterApp {
    constructor() {
        this.currentPage = 1;
        this.currentLimit = 12;
        this.totalPages = 1;
        this.isLoading = false;
        
        this.init();
    }

    async init() {
        try {
            // Initialize components
            await SearchComponent.init();
            await FiltersComponent.init();
            await EventsComponent.init();
            
            // Load initial data
            await this.loadInitialData();
            
            // Set up global event listeners
            this.setupEventListeners();
            
            console.log('🎫 TicketHunter app initialized successfully');
        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.showError('Не удалось загрузить приложение');
        }
    }

    async loadInitialData() {
        this.showLoading(true);
        
        try {
            // Load events
            await EventsComponent.loadEvents();
            
            // Update stats
            await this.updateStats();
            
        } catch (error) {
            console.error('Error loading initial data:', error);
            this.showError('Ошибка загрузки данных');
        } finally {
            this.showLoading(false);
        }
    }

    setupEventListeners() {
        // Global keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Ctrl+K or Cmd+K for search focus
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                document.getElementById('searchInput').focus();
            }
        });

        // Reset search button
        document.getElementById('resetSearch')?.addEventListener('click', () => {
            SearchComponent.clearSearch();
            FiltersComponent.clearFilters();
            EventsComponent.loadEvents();
        });

        // Pagination
        document.getElementById('prevPage')?.addEventListener('click', () => {
            if (this.currentPage > 1) {
                this.currentPage--;
                EventsComponent.loadEvents(this.currentPage);
            }
        });

        document.getElementById('nextPage')?.addEventListener('click', () => {
            if (this.currentPage < this.totalPages) {
                this.currentPage++;
                EventsComponent.loadEvents(this.currentPage);
            }
        });
    }

    async updateStats() {
        try {
            const stats = await API.getStats();
            if (stats) {
                document.getElementById('eventsCount').textContent = stats.totalEvents || 0;
                document.getElementById('platformsCount').textContent = stats.totalPlatforms || 0;
            }
        } catch (error) {
            console.error('Error updating stats:', error);
        }
    }

    showLoading(show) {
        const loadingElement = document.getElementById('loadingIndicator');
        const eventsGrid = document.getElementById('eventsGrid');
        
        if (show) {
            loadingElement.style.display = 'flex';
            eventsGrid.style.display = 'none';
            this.isLoading = true;
        } else {
            loadingElement.style.display = 'none';
            eventsGrid.style.display = 'grid';
            this.isLoading = false;
        }
    }

    showError(message) {
        const eventsGrid = document.getElementById('eventsGrid');
        eventsGrid.innerHTML = `
            <div class="no-results">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>${message}</h3>
                <p>Попробуйте обновить страницу</p>
                <button onclick="location.reload()" class="btn-primary">
                    <i class="fas fa-redo"></i> Обновить страницу
                </button>
            </div>
        `;
    }

    updatePagination(currentPage, totalPages, totalEvents) {
        const paginationElement = document.getElementById('pagination');
        const pageInfoElement = document.getElementById('pageInfo');
        const prevButton = document.getElementById('prevPage');
        const nextButton = document.getElementById('nextPage');
        
        if (totalPages <= 1) {
            paginationElement.style.display = 'none';
            return;
        }
        
        paginationElement.style.display = 'flex';
        pageInfoElement.textContent = `Страница ${currentPage} из ${totalPages}`;
        
        prevButton.disabled = currentPage <= 1;
        nextButton.disabled = currentPage >= totalPages;
        
        this.currentPage = currentPage;
        this.totalPages = totalPages;
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.ticketHunterApp = new TicketHunterApp();
});