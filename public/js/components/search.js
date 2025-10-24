// Search component
class SearchComponent {
    static init() {
        this.setupEventListeners();
        console.log('🔍 Search component initialized');
    }
    
    static setupEventListeners() {
        const searchInput = document.getElementById('searchInput');
        const searchButton = document.getElementById('searchButton');
        
        if (!searchInput || !searchButton) return;
        
        // Search on button click
        searchButton.addEventListener('click', () => {
            this.performSearch();
        });
        
        // Search on Enter key
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.performSearch();
            }
        });
        
        // Debounced search on input
        const debouncedSearch = Helpers.debounce(() => {
            this.performSearch();
        }, 500);
        
        searchInput.addEventListener('input', debouncedSearch);
    }
    
    static performSearch() {
        const searchInput = document.getElementById('searchInput');
        const searchTerm = searchInput.value.trim();
        
        // Update URL without page reload
        const url = new URL(window.location);
        if (searchTerm) {
            url.searchParams.set('search', searchTerm);
        } else {
            url.searchParams.delete('search');
        }
        window.history.replaceState({}, '', url);
        
        // Reload events with search
        EventsComponent.loadEvents(1);
    }
    
    static getSearchTerm() {
        const searchInput = document.getElementById('searchInput');
        return searchInput ? searchInput.value.trim() : '';
    }
    
    static clearSearch() {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.value = '';
        }
        
        // Update URL
        const url = new URL(window.location);
        url.searchParams.delete('search');
        window.history.replaceState({}, '', url);
    }
    
    static setSearchTerm(term) {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.value = term;
        }
    }
}