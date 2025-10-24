// Events component
class EventsComponent {
    static currentEvents = [];
    
    static init() {
        console.log('🎭 Events component initialized');
    }
    
    static async loadEvents(page = 1) {
        if (window.ticketHunterApp) {
            window.ticketHunterApp.showLoading(true);
        }
        
        try {
            const searchTerm = SearchComponent.getSearchTerm();
            const filters = FiltersComponent.getFilters();
            
            const params = {
                page: page,
                limit: 12,
                search: searchTerm,
                category: filters.category !== 'all' ? filters.category : undefined,
                city: filters.city !== 'all' ? filters.city : undefined,
                date: filters.date || undefined
            };
            
            // Clean up undefined parameters
            Object.keys(params).forEach(key => {
                if (params[key] === undefined) {
                    delete params[key];
                }
            });
            
            const response = await API.getEvents(params);
            this.currentEvents = response.events || [];
            
            this.displayEvents(this.currentEvents);
            
            if (window.ticketHunterApp) {
                window.ticketHunterApp.updatePagination(
                    response.page || 1,
                    response.totalPages || 1,
                    response.total || 0
                );
            }
            
        } catch (error) {
            console.error('Error loading events:', error);
            this.showError('Не удалось загрузить мероприятия');
        } finally {
            if (window.ticketHunterApp) {
                window.ticketHunterApp.showLoading(false);
            }
        }
    }
    
    static displayEvents(events) {
        const eventsGrid = document.getElementById('eventsGrid');
        const noResults = document.getElementById('noResults');
        
        if (!eventsGrid) return;
        
        if (events.length === 0) {
            eventsGrid.innerHTML = '';
            if (noResults) noResults.style.display = 'block';
            return;
        }
        
        if (noResults) noResults.style.display = 'none';
        
        const filters = FiltersComponent.getFilters();
        let sortedEvents = [...events];
        
        // Apply sorting
        switch (filters.sort) {
            case 'price':
                sortedEvents.sort((a, b) => {
                    const aMin = Math.min(...a.prices.map(p => p.price + p.fee));
                    const bMin = Math.min(...b.prices.map(p => p.price + p.fee));
                    return aMin - bMin;
                });
                break;
            case 'name':
                sortedEvents.sort((a, b) => a.title.localeCompare(b.title));
                break;
            case 'date':
            default:
                sortedEvents.sort((a, b) => new Date(a.date) - new Date(b.date));
                break;
        }
        
        eventsGrid.innerHTML = sortedEvents.map(event => this.createEventCard(event)).join('');
    }
    
    static createEventCard(event) {
        const bestPrice = Helpers.getBestPrice(event.prices);
        const formattedDate = Helpers.formatDate(event.date);
        const formattedBestPrice = Helpers.formatPrice(bestPrice ? bestPrice.price + bestPrice.fee : 0);
        
        return `
            <div class="event-card" data-event-id="${event.id}">
                <div class="event-image" style="background-image: url('${event.image}')">
                    <div class="event-category">${Helpers.formatCategory(event.category)}</div>
                </div>
                <div class="event-info">
                    <h3 class="event-title">${Helpers.escapeHtml(event.title)}</h3>
                    <div class="event-details">
                        <div>
                            <i class="far fa-calendar"></i>
                            ${formattedDate} ${event.time ? `в ${event.time}` : ''}
                        </div>
                        <div>
                            <i class="far fa-building"></i>
                            ${Helpers.escapeHtml(event.venue)}
                        </div>
                        ${event.city ? `
                        <div>
                            <i class="fas fa-map-marker-alt"></i>
                            ${Helpers.escapeHtml(event.city)}
                        </div>
                        ` : ''}
                    </div>
                    <p>${Helpers.escapeHtml(event.description)}</p>
                    
                    <div class="price-comparison">
                        ${event.prices.map(price => {
                            const total = price.price + price.fee;
                            const isBest = price === bestPrice;
                            const formattedPrice = Helpers.formatPrice(total);
                            
                            return `
                                <div class="price-option ${isBest ? 'best-price' : ''}">
                                    <span>${Helpers.escapeHtml(price.platform)}</span>
                                    <span>
                                        ${formattedPrice}
                                        <small>(${Helpers.formatPrice(price.price)} + ${Helpers.formatPrice(price.fee)})</small>
                                    </span>
                                </div>
                            `;
                        }).join('')}
                        
                        ${bestPrice ? `
                        <a href="${bestPrice.url}" target="_blank" rel="noopener noreferrer" class="buy-btn btn btn-primary">
                            Купить за ${formattedBestPrice}
                            <small> - лучшая цена</small>
                        </a>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }
    
    static showError(message) {
        const eventsGrid = document.getElementById('eventsGrid');
        if (eventsGrid) {
            eventsGrid.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>${message}</h3>
                    <button onclick="EventsComponent.loadEvents()" class="btn-primary">
                        <i class="fas fa-redo"></i> Попробовать снова
                    </button>
                </div>
            `;
        }
    }
    
    static getEventById(id) {
        return this.currentEvents.find(event => event.id === id);
    }
}