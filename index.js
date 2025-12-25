#!/usr/bin/env node

/**
 * CyberSakhi Project Entry Point
 * 
 * This is a multi-service project with:
 * - Frontend (React/Vite) in ./frontend/
 * - Backend (Node.js/Express) in ./backend/
 * - AI Services (Python/Flask) in ./ai_services/
 * 
 * To run the project:
 * npm run dev        - Start all services
 * npm run frontend   - Start only frontend
 * npm run backend    - Start only backend  
 * npm run ai         - Start only AI services
 */

const path = require('path');
const { spawn } = require('child_process');

// Project configuration
const PROJECT_CONFIG = {
  name: 'CyberSakhi',
  version: require('./package.json').version,
  services: {
    frontend: {
      port: 3000,
      path: './frontend',
      command: 'npm run dev'
    },
    backend: {
      port: 5000,
      path: './backend', 
      command: 'npm start'
    },
    ai: {
      port: 8000,
      path: './ai_services',
      command: 'python server.py'
    }
  }
};

function showHelp() {
  console.log(`
🛡️  CyberSakhi - AI-Powered Safety Platform
===========================================

Available Commands:
📦 npm run dev        - Start all services
🌐 npm run frontend   - Start React frontend (port 3000)
⚙️  npm run backend    - Start Node.js backend (port 5000)
🤖 npm run ai         - Start Python AI services (port 8000)
🏗️  npm run build      - Build frontend for production
📋 npm run install-all - Install all dependencies

For individual service management, navigate to respective directories:
- cd frontend && npm run dev
- cd backend && npm start  
- cd ai_services && python server.py

Happy coding! 🚀
`);
}

// Main function
function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    return;
  }
  
  if (args.includes('--version') || args.includes('-v')) {
    console.log(`CyberSakhi v${PROJECT_CONFIG.version}`);
    return;
  }
  
  // Default behavior - show help
  showHelp();
  console.log('\n💡 Tip: Use "npm run dev" to start all services together!\n');
}

// If run directly, execute main function
if (require.main === module) {
  main();
}

// Export configuration for other modules
module.exports = PROJECT_CONFIG;