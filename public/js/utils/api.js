// API utility functions
class API {
    static baseURL = '/api';
    
    static async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };
        
        try {
            const response = await fetch(url, config);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error(`API request failed for ${endpoint}:`, error);
            throw error;
        }
    }
    
    // Events endpoints
    static async getEvents(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return await this.request(`/events?${queryString}`);
    }
    
    static async getEventById(id) {
        return await this.request(`/events/${id}`);
    }
    
    static async getCategories() {
        return await this.request('/events/categories');
    }
    
    static async getStats() {
        return await this.request('/events/stats');
    }
    
    // System endpoints
    static async healthCheck() {
        return await this.request('/health');
    }
    
    static async getPlatforms() {
        return await this.request('/platforms');
    }
}