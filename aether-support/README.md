# Aether Foundation - SaaS Communication Platform

A comprehensive SaaS communication platform that provides embeddable widgets for text chat and voice calls, with AI-powered chatbots, intelligent routing workflows, and a complete call center dashboard for agents.

![Platform Screenshot](https://img.shields.io/badge/Platform-SaaS-blue)
![Tech Stack](https://img.shields.io/badge/Stack-React%20%7C%20tRPC%20%7C%20Socket.io-green)
![Status](https://img.shields.io/badge/Status-Production%20Ready-success)

## 🚀 Features

### Core Platform
- **Embeddable Widgets**: JavaScript widget for websites, native SDKs for iOS/Android
- **Real-time Chat**: Bidirectional messaging with Socket.io
- **AI Chatbots**: Multiple AI agents with RAG knowledge bases and MCP integration
- **Intelligent Routing**: Visual workflow builder for dynamic chatbot handoffs
- **Agent Dashboard**: Real-time session management with filtering and analytics
- **VoIP Integration**: Twilio-ready infrastructure for voice calling
- **Analytics**: Comprehensive metrics and performance tracking

### AI & Automation
- 8 pre-built AI prompt templates (Support, Sales, Technical, etc.)
- RAG knowledge base integration (documents, URLs, text)
- MCP server integration for external data sources
- Visual routing workflows with condition-based handoffs
- Canned responses/quick replies system
- Browser notifications with sound alerts

## 🛠️ Technology Stack

**Frontend**
- React 19 + TypeScript
- Tailwind CSS 4
- shadcn/ui components
- React Flow (workflow builder)
- Socket.io client

**Backend**
- Node.js + Express 4
- tRPC 11 (type-safe API)
- Socket.io server
- Drizzle ORM
- MySQL/TiDB

**AI & Services**
- Manus LLM API
- Twilio SDK (VoIP)
- S3 storage
- Manus OAuth

## 📦 Installation

### Prerequisites
- Node.js 22+
- pnpm (package manager)
- MySQL 8+ or TiDB database
- S3-compatible storage

### Setup Steps

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd saas-communication-platform
```

2. **Install dependencies**
```bash
pnpm install
```

3. **Configure environment variables**

Create a `.env` file in the root directory with the following variables:

```env
# Database
DATABASE_URL=mysql://user:password@host:3306/database

# Authentication
JWT_SECRET=your-secret-key
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://auth.manus.im
VITE_APP_ID=your-app-id
OWNER_OPEN_ID=your-owner-id
OWNER_NAME=Your Name

# LLM & AI
BUILT_IN_FORGE_API_URL=https://forge.manus.im
BUILT_IN_FORGE_API_KEY=your-api-key
VITE_FRONTEND_FORGE_API_KEY=your-frontend-key
VITE_FRONTEND_FORGE_API_URL=https://forge.manus.im

# Application
VITE_APP_TITLE=Aether Foundation
VITE_APP_LOGO=/aether-logo-full.png

# Analytics (optional)
VITE_ANALYTICS_ENDPOINT=https://analytics.example.com
VITE_ANALYTICS_WEBSITE_ID=your-website-id
```

4. **Run database migrations**
```bash
pnpm db:push
```

5. **Start development server**
```bash
pnpm dev
```

The application will be available at `http://localhost:3000`

## 🏗️ Project Structure

```
saas-communication-platform/
├── client/                 # Frontend React application
│   ├── public/            # Static assets and widget script
│   └── src/
│       ├── pages/         # Page components
│       ├── components/    # Reusable UI components
│       └── lib/           # tRPC client and utilities
├── server/                # Backend Node.js application
│   ├── _core/             # Core server functionality
│   ├── routers.ts         # tRPC API routes
│   ├── db.ts              # Database helpers
│   └── socket.ts          # Socket.io event handlers
├── drizzle/               # Database schema and migrations
├── shared/                # Shared types and constants
└── PROJECT_DOCUMENTATION.md  # Complete documentation
```

## 📖 Documentation

For comprehensive documentation including:
- Architecture overview
- Database schema
- API endpoints
- AI & automation systems
- Integration guides
- Deployment instructions

See [PROJECT_DOCUMENTATION.md](./PROJECT_DOCUMENTATION.md)

## 🎨 Branding

The platform follows **Aether Foundation** brand guidelines:
- **Deep Blue** (#003251) - Primary backgrounds
- **Teal** (#05B3B4) - CTAs and interactive elements
- **Vibrant Orange** (#FF7A11) - Accent color
- **Raleway** font family

## 🔧 Development

### Available Scripts

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm db:push      # Push database schema changes
pnpm test         # Run tests (framework ready)
```

### Database Management

```bash
# Generate migration
pnpm drizzle-kit generate

# Apply migration
pnpm db:push

# View database in browser
pnpm drizzle-kit studio
```

## 🚢 Deployment

### Production Build

```bash
pnpm build
pnpm start
```

### Recommended Platforms
- **Vercel** (recommended)
- Railway
- Docker
- Any Node.js hosting

See [PROJECT_DOCUMENTATION.md](./PROJECT_DOCUMENTATION.md) for detailed deployment instructions.

## 🎯 Roadmap

### High Priority
- [ ] Complete voice call UI integration
- [ ] Connect chatbots to widget customizer
- [ ] Build automation workflow engine

### Medium Priority
- [ ] Routing analytics dashboard
- [ ] Advanced agent features (transfer, notes)
- [ ] Enhanced knowledge base with vector search

### Future
- [ ] Native mobile agent app
- [ ] Customer portal
- [ ] Integrations marketplace
- [ ] White-label solution

## 📝 License

MIT License - feel free to use this project for your own purposes.

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📧 Support

For questions or support:
- Open an issue on GitHub
- Check the [PROJECT_DOCUMENTATION.md](./PROJECT_DOCUMENTATION.md)
- Contact the development team

---

**Built with ❤️ using React, tRPC, and Socket.io**
