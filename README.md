<p align="center">
  <img width="140px" src="./public/images/logo.png">
  
  <h2 align="center">Orcha Portal</h2>
  <p align="center">
    A visual workflow automation platform that connects services and orchestrates complex processes without heavy code.
  </p>
</p>

---

## Overview

**Orcha Portal** is a workflow automation engine that connects APIs, services, and internal tools into visual, event-driven flows. It lets teams orchestrate complex processes with modular nodes, custom logic, and integrations, all without heavy scripting. Designed for scale and extensibility, it streamlines data movement, task automation, and service coordination across your stack.

## Technology Stack

- **Framework**: Remix (React-based full-stack web framework)
- **Frontend**: React 18 with TypeScript
- **Styling**: TailwindCSS with custom design system
- **UI Components**: Radix UI primitives with custom components
- **Authentication**: Auth0 (OAuth 2.0 / OpenID Connect)
- **Validation**: Zod for schema validation
- **Data Tables**: TanStack Table for advanced table functionality
- **Icons**: Lucide React and Font Awesome
- **Build Tool**: Vite with TypeScript
- **Code Quality**: ESLint, Prettier

## Getting Started

### Prerequisites

- **Node.js**: Version 20.0.0 or higher
- **Package Manager**: bun 1.2.13

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/tesserahq/orcha-portal.git
   cd orcha-portal
   ```

2. **Set up environment variables**

   Create a `.env` file in the root directory with the following variables:

   ```env
   # Auth0 Configuration
   AUTH0_CLIENT_ID=your_auth0_client_id
   AUTH0_DOMAIN=your_auth0_domain
   AUTH0_AUDIENCE=your_auth0_audience
   AUTH0_ORGANIZATION_ID=your_auth0_organization_id

   # Application Configuration
   NODE_ENV=development
   SESSION_SECRET=SECRET_EXAMPLE
   HOST_URL=http://localhost:3000
   API_URL=https://api.example.com
   IDENTIES_API_URL=https://identies-api.example.com
   ```

3. **Run the development server**

   ```bash
   bun install
   ```

   ```bash
   bun run dev
   ```

4. **Open your browser**

   Navigate to [http://localhost:3000](http://localhost:3000) to view the application.

### Available Scripts

- `dev` - Start the development server
- `build` - Build the application for production
- `start` - Start the production server
- `lint` - Run ESLint for code linting
- `typecheck` - Run TypeScript type checking
- `format` - Format code with Prettier

### Production Build

1. **Build the application**

   ```bash
   bun run build
   ```

2. **Start the production server**
   ```bash
   bun run start
   ```

### Development Notes

- The application uses Vite for fast development builds and hot module replacement
- TypeScript is configured for strict type checking
- ESLint and Prettier are configured for consistent code formatting
- The app includes internationalization support with i18next
- Authentication is handled through Auth0 integration
