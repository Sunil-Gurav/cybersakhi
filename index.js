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

// If run directly, show help
if (require.main === module) {
  console.log('\n💡 Tip: Use "npm run dev" to start all services together!\n');
}

module.exports = {
  name: 'CyberSakhi',
  version: require('./package.json').version,
  services: {
    frontend: 'http://localhost:3000',
    backend: 'http://localhost:5000', 
    ai: 'http://localhost:8000'
  }
};