// Utility helper functions
class Helpers {
    static formatPrice(price) {
        return new Intl.NumberFormat('ru-RU', {
            style: 'currency',
            currency: 'RUB',
            minimumFractionDigits: 0
        }).format(price);
    }
    
    static formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    }
    
    static formatTime(timeString) {
        if (!timeString) return '';
        return timeString;
    }
    
    static getBestPrice(prices) {
        if (!prices || prices.length === 0) return null;
        
        return prices.reduce((best, current) => {
            const currentTotal = current.price + current.fee;
            const bestTotal = best.price + best.fee;
            return currentTotal < bestTotal ? current : best;
        });
    }
    
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    static formatCategory(category) {
        const categoryMap = {
            'concert': 'Концерты',
            'theatre': 'Театры',
            'festival': 'Фестивали',
            'exhibition': 'Выставки',
            'sport': 'Спорт',
            'standup': 'Стендап',
            'kids': 'Детские',
            'other': 'Другое'
        };
        
        return categoryMap[category] || category;
    }
    
    static escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
    
    static validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
    
    static generateEventImage(title) {
        // In a real app, this would generate or fetch actual images
        const colors = ['6a11cb', '2575fc', 'ff6b6b', '27ae60', 'f39c12'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        return `https://via.placeholder.com/300x180/${color}/ffffff?text=${encodeURIComponent(title)}`;
    }
}