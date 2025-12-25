# 🛡️ CyberSakhi - AI-Powered Safety Platform

A comprehensive multi-service safety platform combining React frontend, Node.js backend, and Python AI services.

## 🏗️ Project Structure

```
CyberSakhi/
├── frontend/          # React + Vite frontend (Port 3000)
├── backend/           # Node.js + Express API (Port 5000)  
├── ai_services/       # Python + Flask AI services (Port 8000)
├── index.js           # Project manager & help utility
└── package.json       # Root project configuration
```

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- Python 3.8+
- npm 8+

### Installation & Setup
```bash
# Clone the repository
git clone https://github.com/Sunil-Gurav/cybersakhi.git
cd cybersakhi

# Install all dependencies
npm run install-all

# Start all services
npm run dev
```

## 📦 Available Commands

### Root Level Commands
```bash
npm run dev          # Start all services concurrently
npm run frontend     # Start only React frontend
npm run backend      # Start only Node.js backend  
npm run ai           # Start only Python AI services
npm run build        # Build frontend for production
npm run install-all  # Install all dependencies
npm start            # Show project help
```

### Individual Service Commands
```bash
# Frontend (React + Vite)
cd frontend
npm run dev          # Development server
npm run build        # Production build
npm run preview      # Preview production build

# Backend (Node.js + Express)
cd backend  
npm start            # Start with nodemon

# AI Services (Python + Flask)
cd ai_services
python server.py     # Start AI server
```

## 🌐 Service URLs

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000  
- **AI Services**: http://localhost:8000

## 🔧 Development

This is a **multi-service project** - not a single Express application. Each service runs independently:

- **Frontend**: React application with Vite bundler
- **Backend**: Express.js REST API with MongoDB
- **AI Services**: Python Flask server with ML models

## 📝 Notes

- The root `index.js` is a project manager utility, not an Express server
- Each service has its own package.json and dependencies
- Use `npm run dev` to start all services together
- Individual services can be run separately from their directories

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes  
4. Push to the branch
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.