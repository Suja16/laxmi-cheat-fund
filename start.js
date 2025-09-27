#!/usr/bin/env node

// Simple JavaScript entry point for ES modules
import('./src/index.js').catch(error => {
    console.error('Failed to start application:', error.message);
    console.log('\n💡 Try running: npm run build && npm start');
    process.exit(1);
});
