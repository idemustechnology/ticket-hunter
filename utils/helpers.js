function formatPrice(price) {
    return new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB',
        minimumFractionDigits: 0
    }).format(price);
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
}

function getBestPrice(prices) {
    if (!prices || prices.length === 0) return null;
    
    return prices.reduce((best, current) => {
        const currentTotal = current.price + current.fee;
        const bestTotal = best.price + best.fee;
        return currentTotal < bestTotal ? current : best;
    });
}

function validateEventData(event) {
    const required = ['title', 'date', 'venue', 'category', 'prices'];
    const missing = required.filter(field => !event[field]);
    
    if (missing.length > 0) {
        throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }
    
    if (!Array.isArray(event.prices) || event.prices.length === 0) {
        throw new Error('Event must have at least one price');
    }
    
    return true;
}

module.exports = {
    formatPrice,
    formatDate,
    getBestPrice,
    validateEventData
};