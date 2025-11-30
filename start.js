// Smart entry point that runs different services based on environment variable
const SERVICE_TYPE = process.env.SERVICE_TYPE || 'bot';

console.log(`🚀 Starting service type: ${SERVICE_TYPE}`);

if (SERVICE_TYPE === 'spa') {
    console.log('📱 Starting SPA server...');
    require('./server.js');
} else {
    console.log('🤖 Starting Discord bot...');
    require('./index.js');
}

