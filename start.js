// Smart entry point that runs different services based on environment variable
const SERVICE_TYPE = process.env.SERVICE_TYPE || 'bot';
const { spawn } = require('child_process');

console.log(`🚀 Starting service type: ${SERVICE_TYPE}`);

if (SERVICE_TYPE === 'spa') {
    console.log('📱 Starting SPA server...');
    require('./server.js');
} else {
    console.log('🤖 Starting Discord bot...');
    // Bot needs Node.js flags (--openssl-legacy-provider --no-deprecation)
    // Use spawn to run node with the required flags
    const botProcess = spawn('node', [
        '--openssl-legacy-provider',
        '--no-deprecation',
        'index.js'
    ], {
        stdio: 'inherit',
        cwd: process.cwd()
    });
    
    botProcess.on('error', (error) => {
        console.error('Failed to start bot:', error);
        process.exit(1);
    });
    
    botProcess.on('exit', (code, signal) => {
        if (code !== null) {
            process.exit(code);
        } else if (signal) {
            console.error(`Bot process killed by signal: ${signal}`);
            process.exit(1);
        }
    });
}

