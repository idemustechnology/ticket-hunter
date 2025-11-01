const ParserService = require('../services/parserService');

async function testParser() {
    try {
        await ParserService.init();
        
        console.log('🧪 Testing parser...\n');
        
        const testQueries = ['концерт', 'театр', 'выставка', ''];
        
        for (const query of testQueries) {
            console.log(`🔍 Testing: "${query || 'popular events'}"`);
            const events = await ParserService.parseAllPlatforms(query);
            console.log(`✅ Found ${events.length} events\n`);
            
            events.slice(0, 3).forEach(event => {
                console.log(`   ${event.title}`);
                console.log(`   💰 Prices: ${event.prices.length} platforms`);
                console.log(`   📍 ${event.venue}`);
                console.log('   ---');
            });
            console.log('');
        }
        
        await ParserService.close();
        console.log('🎉 Parser test completed!');
        
    } catch (error) {
        console.error('❌ Parser test failed:', error);
    }
}

testParser();