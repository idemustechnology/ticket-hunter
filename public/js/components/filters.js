// Filters component
class FiltersComponent {
    static init() {
        this.loadCategories();
        this.setupEventListeners();
        this.loadFromURL();
        console.log('🎛️ Filters component initialized');
    }
    
    static async loadCategories() {
        try {
            const categories = await API.getCategories();
            this.populateCategoryFilter(categories);
        } catch (error) {
            console.error('Error loading categories:', error);
        }
    }
    
    static populateCategoryFilter(categories) {
        const categoryFilter = document.getElementById('categoryFilter');
        if (!categoryFilter) return;
        
        // Clear existing options except "All"
        categoryFilter.innerHTML = '<option value="all">Все категории</option>';
        
        categories.forEach(category => {
            if (category.id !== 'all') {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = `${category.name} (${category.count})`;
                categoryFilter.appendChild(option);
            }
        });
    }
    
    static setupEventListeners() {
        const categoryFilter = document.getElementById('categoryFilter');
        const cityFilter = document.getElementById('cityFilter');
        const dateFilter = document.getElementById('dateFilter');
        const clearFiltersBtn = document.getElementById('clearFilters');
        const sortSelect = document.getElementById('sortSelect');
        
        if (categoryFilter) {
            categoryFilter.addEventListener('change', () => this.applyFilters());
        }
        
        if (cityFilter) {
            cityFilter.addEventListener('change', () => this.applyFilters());
        }
        
        if (dateFilter) {
            dateFilter.addEventListener('change', () => this.applyFilters());
        }
        
        if (clearFiltersBtn) {
            clearFiltersBtn.addEventListener('click', () => this.clearFilters());
        }
        
        if (sortSelect) {
            sortSelect.addEventListener('change', () => this.applySorting());
        }
    }
    
    static applyFilters() {
        this.updateURL();
        EventsComponent.loadEvents(1);
    }
    
    static applySorting() {
        EventsComponent.loadEvents(1);
    }
    
    static clearFilters() {
        const categoryFilter = document.getElementById('categoryFilter');
        const cityFilter = document.getElementById('cityFilter');
        const dateFilter = document.getElementById('dateFilter');
        const sortSelect = document.getElementById('sortSelect');
        
        if (categoryFilter) categoryFilter.value = 'all';
        if (cityFilter) cityFilter.value = 'all';
        if (dateFilter) dateFilter.value = '';
        if (sortSelect) sortSelect.value = 'date';
        
        this.updateURL();
        EventsComponent.loadEvents(1);
    }
    
    static getFilters() {
        return {
            category: document.getElementById('categoryFilter')?.value || 'all',
            city: document.getElementById('cityFilter')?.value || 'all',
            date: document.getElementById('dateFilter')?.value || '',
            sort: document.getElementById('sortSelect')?.value || 'date'
        };
    }
    
    static updateURL() {
        const filters = this.getFilters();
        const url = new URL(window.location);
        
        // Update URL parameters
        if (filters.category !== 'all') {
            url.searchParams.set('category', filters.category);
        } else {
            url.searchParams.delete('category');
        }
        
        if (filters.city !== 'all') {
            url.searchParams.set('city', filters.city);
        } else {
            url.searchParams.delete('city');
        }
        
        if (filters.date) {
            url.searchParams.set('date', filters.date);
        } else {
            url.searchParams.delete('date');
        }
        
        if (filters.sort !== 'date') {
            url.searchParams.set('sort', filters.sort);
        } else {
            url.searchParams.delete('sort');
        }
        
        window.history.replaceState({}, '', url);
    }
    
    static loadFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        
        const category = urlParams.get('category');
        const city = urlParams.get('city');
        const date = urlParams.get('date');
        const sort = urlParams.get('sort');
        const search = urlParams.get('search');
        
        if (category) {
            const categoryFilter = document.getElementById('categoryFilter');
            if (categoryFilter) categoryFilter.value = category;
        }
        
        if (city) {
            const cityFilter = document.getElementById('cityFilter');
            if (cityFilter) cityFilter.value = city;
        }
        
        if (date) {
            const dateFilter = document.getElementById('dateFilter');
            if (dateFilter) dateFilter.value = date;
        }
        
        if (sort) {
            const sortSelect = document.getElementById('sortSelect');
            if (sortSelect) sortSelect.value = sort;
        }
        
        if (search) {
            SearchComponent.setSearchTerm(search);
        }
    }
}