// Events component
class EventsComponent {
    static createEventCard(event) {
    const bestPrice = Helpers.getBestPrice(event.prices);
    const formattedDate = Helpers.formatDate(event.date);

    return `
        <div class="event-card" data-event-id="${event.id}">
            <div class="event-image" style="background-image: url('${event.image}')">
                <div class="event-category">${Helpers.formatCategory(event.category)}</div>
                <div class="event-platform">${event.platform}</div>
            </div>
            <div class="event-info">
                <h3 class="event-title">${Helpers.escapeHtml(event.title)}</h3>
                <div class="event-details">
                    <div><i class="far fa-calendar"></i> ${formattedDate}</div>
                    <div><i class="far fa-building"></i> ${Helpers.escapeHtml(event.venue)}</div>
                    <div><i class="fas fa-map-marker-alt"></i> ${Helpers.escapeHtml(event.city)}</div>
                </div>
                
                <div class="price-comparison">
                    ${event.prices.map(price => {
                        const total = price.price + price.fee;
                        const isBest = price === bestPrice;
                        const formattedPrice = price.price > 0 ? 
                            Helpers.formatPrice(total) : 'Цена не указана';
                        
                        return `
                            <div class="price-option ${isBest ? 'best-price' : ''}">
                                <span>${Helpers.escapeHtml(price.platform)}</span>
                                <span>${formattedPrice}</span>
                            </div>
                        `;
                    }).join('')}
                    
                    ${bestPrice && bestPrice.url ? `
                    <a href="${bestPrice.url}" target="_blank" rel="noopener noreferrer" 
                       class="buy-btn btn btn-primary" onclick="trackPurchase('${event.id}')">
                        ${bestPrice.price > 0 ? `Купить за ${Helpers.formatPrice(bestPrice.price + bestPrice.fee)}` : 'Узнать цену'}
                        ${bestPrice.price > 0 ? '<small> - лучшая цена</small>' : ''}
                    </a>
                    ` : ''}
                </div>
                
                <div class="event-footer">
                    <small class="text-muted">
                        Обновлено: ${new Date().toLocaleTimeString('ru-RU')}
                    </small>
                </div>
            </div>
        </div>
    `;
}
}