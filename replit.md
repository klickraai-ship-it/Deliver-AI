# DeliverAI Mail Dashboard

## Overview

DeliverAI Mail is an AI-powered email deliverability platform that provides real-time insights into email campaign performance, compliance monitoring, and provider-specific analytics. The application helps users optimize their email sending reputation across major mailbox providers (Gmail, Yahoo, Outlook) by tracking key deliverability metrics, enforcing authentication standards (SPF, DKIM, DMARC), and providing AI-driven recommendations for improving inbox placement rates.

The platform combines a React-based dashboard with a PostgreSQL database backend, offering features for managing email campaigns, templates, subscriber lists, and comprehensive deliverability analytics.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack**: React 19 with TypeScript, served via Vite development server

**Key Design Decisions**:
- **Component-based UI**: Modular React components for dashboard widgets, charts, lists, and forms
- **Single Page Application (SPA)**: Client-side routing managed through state (`currentPage`) rather than a routing library, keeping the architecture simple for a dashboard-focused application
- **Tailwind CSS for Styling**: Utility-first CSS framework with custom configuration for brand colors and design tokens, augmented with shadcn/ui component patterns
- **CDN-delivered Dependencies**: Major libraries (React, Recharts, Lucide icons) loaded via importmap from aistudiocdn.com, reducing bundle size and leveraging browser caching

**Rationale**: This architecture provides fast development velocity and a responsive UI without the overhead of a full routing framework. The component structure separates concerns (KPI tiles, charts, lists) making it easy to iterate on individual features.

**Trade-offs**: 
- Pros: Simple mental model, fast hot-reload during development, minimal build complexity
- Cons: Manual state management for navigation, potential prop-drilling as app grows

### Data Visualization

**Recharts Library**: Used for deliverability metrics visualization (bar charts, radial gauges)

**Key Components**:
- `SpamRateGauge`: Radial chart showing Gmail spam rates with color-coded thresholds (green <0.10%, yellow 0.10-0.30%, red >0.30%)
- `DomainPerformanceChart`: Bar chart comparing delivery, complaint, and spam rates across email providers
- Custom tooltips and styling to match dark mode UI theme

**Rationale**: Recharts provides responsive, accessible charts with minimal configuration while maintaining visual consistency with the dashboard's design system.

### Backend Architecture

**Technology Stack**: Express.js server with TypeScript, running on Node.js

**API Structure**: RESTful endpoints organized by resource type:
- `/api/subscribers` - Subscriber management (CRUD operations)
- `/api/templates` - Email template management
- `/api/campaigns` - Campaign creation and monitoring
- `/api/settings` - SMTP and sender configuration
- `/api/analytics` - Deliverability metrics and reporting

**Request/Response Flow**:
1. Client components fetch data via standard `fetch()` API calls
2. Express routes validate requests and interact with database via Drizzle ORM
3. Responses return JSON data conforming to TypeScript interfaces defined in `types.ts` and `shared/schema.ts`

**Rationale**: Express provides a lightweight, flexible foundation for API development. The RESTful design makes the API intuitive and easy to extend. TypeScript ensures type safety across the client-server boundary.

**Trade-offs**:
- Pros: Simple to understand, extensive ecosystem, minimal magic
- Cons: No built-in validation layer (relies on Zod schemas), manual error handling patterns

### Database Layer

**ORM**: Drizzle ORM with PostgreSQL dialect

**Database Schema** (defined in `shared/schema.ts`):

**Core Tables**:
1. **subscribers**: Email addresses with status tracking (active, unsubscribed, bounced, complained), list memberships, and custom metadata
2. **emailTemplates**: Reusable HTML/text email templates with subject lines
3. **campaigns**: Email sending campaigns linked to templates and subscriber lists
4. **campaignSubscribers**: Junction table tracking which subscribers received which campaigns
5. **campaignAnalytics**: Per-campaign metrics (opens, clicks, bounces, complaints)
6. **settings**: Key-value store for SMTP configuration and application settings

**Schema Validation**: Drizzle-Zod integration generates Zod schemas from database schema definitions, ensuring runtime validation matches database constraints

**Connection Management**: 
- Uses `@neondatabase/serverless` driver with connection pooling
- WebSocket-based connections configured via `neonConfig.webSocketConstructor`

**Rationale**: Drizzle offers a type-safe, SQL-like query builder that feels familiar to developers while preventing common SQL injection vulnerabilities. The serverless driver enables efficient connection pooling for Neon's PostgreSQL service.

**Trade-offs**:
- Pros: Excellent TypeScript integration, migrations managed via drizzle-kit, lightweight compared to Prisma
- Cons: Smaller community than alternatives, fewer built-in helpers for complex queries

### AI Integration

**Google Generative AI (Gemini)**: Powers the AI Assistant feature

**Implementation** (`components/AIAssistant.tsx`):
- Uses Gemini 1.5 Flash model for fast, cost-effective responses
- System instruction configures the AI as a deliverability expert with context about the user's current metrics
- Markdown-formatted responses rendered via `marked` library
- Suggested prompts guide users toward actionable deliverability improvements

**API Key Management**: Gemini API key loaded from environment variables and exposed to client via Vite's `define` configuration

**Rationale**: Gemini provides strong performance for conversational AI at a lower cost than alternatives. The streaming response capability (not currently implemented) allows for future UX improvements.

**Trade-offs**:
- Pros: Powerful language understanding, good at technical explanations, affordable
- Cons: API key exposed to client (security consideration), no built-in conversation memory

### Authentication & Authorization

**Current State**: No authentication implemented

**Architectural Gap**: The application currently lacks user authentication, session management, or role-based access control. All API endpoints are publicly accessible.

**Future Considerations**: Would require adding:
- Authentication middleware (e.g., JWT, session cookies)
- User table in database schema
- Protected routes on both frontend and backend
- Multi-tenancy support to isolate customer data

### Compliance Monitoring System

**Compliance Checklist Feature**: Real-time validation of email authentication protocols

**Monitored Standards**:
- SPF (Sender Policy Framework) alignment
- DKIM (DomainKeys Identified Mail) signatures
- DMARC (Domain-based Message Authentication) policy
- One-Click Unsubscribe headers (List-Unsubscribe)
- TLS encryption for mail transport
- Feedback Loop (FBL) configuration

**Status Indicators**: Pass/warn/fail states with actionable remediation links

**Rationale**: Email deliverability heavily depends on proper authentication configuration. The checklist provides at-a-glance validation of critical infrastructure, helping users maintain high sender reputation.

**Current Implementation**: Mock data in frontend; backend implementation would require integrating with DNS lookup services and SMTP testing tools.

## External Dependencies

### Third-Party Services

**Neon Database**: 
- Serverless PostgreSQL hosting
- Configured via `DATABASE_URL` environment variable
- WebSocket-based connections for serverless compatibility

**Google Generative AI (Gemini)**:
- AI-powered deliverability assistant
- Requires `GEMINI_API_KEY` environment variable
- Uses Gemini 1.5 Flash model

**CDN Services**:
- aistudiocdn.com: Delivers React, React DOM, Recharts, Lucide icons, and Gemini SDK
- Google Fonts: Inter font family for typography
- Tailwind CSS CDN: Development-time styling (production should use built CSS)

### NPM Dependencies

**Core Framework**:
- `react` & `react-dom` (19.2.0): UI framework
- `vite` (6.2.0): Build tool and development server
- `express` (5.1.0): Web server framework
- `typescript` (5.8.2): Type safety

**Database & ORM**:
- `drizzle-orm` (0.44.7): Type-safe ORM
- `drizzle-kit` (0.31.6): Schema migrations
- `@neondatabase/serverless` (1.0.2): PostgreSQL driver
- `drizzle-zod` (0.8.3): Schema validation

**UI & Visualization**:
- `recharts` (3.3.0): Data visualization charts
- `lucide-react` (0.548.0): Icon library
- `tailwindcss` (4.1.17): Utility-first CSS framework
- `tailwindcss-animate` (1.0.7): Animation utilities

**AI & Utilities**:
- `@google/generative-ai` (0.21.0): Gemini API client
- `marked` (13.0.3): Markdown parsing for AI responses
- `zod` (4.1.12): Runtime schema validation
- `ws` (8.18.3): WebSocket library for database connections

**Build Tools**:
- `@vitejs/plugin-react` (5.0.0): React integration for Vite
- `autoprefixer` (10.4.22): CSS vendor prefixing
- `tsx` (4.20.6): TypeScript execution

### API Integrations

**Current Integrations**: None beyond Gemini AI

**Potential Future Integrations**:
- **SMTP Providers**: SendGrid, Mailgun, Amazon SES for actual email sending
- **DNS Lookup Services**: For validating SPF/DKIM/DMARC records
- **Email Verification**: Services like ZeroBounce or NeverBounce for list hygiene
- **Analytics Providers**: For tracking email opens/clicks (currently stub data)
- **Feedback Loop Services**: Yahoo CFL, Gmail Postmaster Tools API

### Environment Variables

Required configuration:
- `DATABASE_URL`: PostgreSQL connection string (Neon database)
- `GEMINI_API_KEY`: Google Generative AI API key

Optional future variables:
- `SMTP_*`: SMTP server credentials for sending emails
- `JWT_SECRET`: Session signing key (when auth is added)