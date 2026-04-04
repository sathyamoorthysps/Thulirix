# Thulirix

Enterprise Test Case Repository Platform

Thulirix is a comprehensive platform for managing test cases, executions, and reporting in enterprise environments. It supports manual and automated testing, integrates with Azure DevOps and Salesforce, and provides requirement traceability (RTM), dashboards, and analytics.

## Features

- **Test Case Management**: CRUD operations, versioning, bulk import/export (Excel), tagging
- **Execution Tracking**: Manual and automated test runs, result tracking, status updates
- **Integrations**: Azure DevOps (ADO), Salesforce
- **Reporting & Analytics**: Dashboards with charts (pass rates, trends), metrics
- **Security**: JWT-based authentication, role-based access control (RBAC)
- **API**: RESTful API with OpenAPI/Swagger documentation
- **Async Processing**: Bulk operations, integrations via async tasks
- **Caching**: Redis for session and data caching

## Tech Stack

### Backend
- Java 21
- Spring Boot 3.2.4
- PostgreSQL 16
- Redis 7
- Maven
- JWT (JJWT 0.12.5)
- Flyway (10.8.1) for migrations
- SpringDoc OpenAPI (2.3.0) for API docs
- Apache POI (5.2.5) for Excel import/export
- Lombok (1.18.32)
- MapStruct (1.5.5.Final)
- Testcontainers (1.19.7) for testing

### Frontend
- React 18.2.0
- TypeScript 5.4.5
- Vite 5.2.8
- Tailwind CSS 3.4.3
- React Query (@tanstack/react-query 5.28.4)
- Zustand 4.5.2 (state management)
- Recharts 2.12.3 (charts)
- React Hook Form 7.51.1 with Zod 3.22.4 (forms/validation)
- Axios 1.6.8 (HTTP client)
- Lucide React (icons)
- React Hot Toast (notifications)

### Infrastructure
- Docker & Docker Compose
- Nginx (reverse proxy with rate limiting)
- GitHub Actions (CI/CD - assumed from structure)

## Prerequisites

- Docker & Docker Compose (v3.9+)
- Java 21 (for local backend development)
- Node.js 18+ & npm (for local frontend development)
- PostgreSQL & Redis (via Docker or local)

## Quick Start

### Using Docker Compose (Recommended)

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd thulirix
   ```

2. Start all services:
   ```bash
   docker-compose up --build
   ```

   - Backend: http://localhost:6001
   - Frontend: http://localhost:6000
   - API Docs: http://localhost:6003/swagger-ui.html
   - Nginx Gateway: http://localhost:6003 (proxies to frontend/backend)

### Local Development

#### Backend
1. Ensure PostgreSQL and Redis are running (use Docker Compose for DB only):
   ```bash
   docker-compose up postgres redis
   ```

2. Set environment variables (create `backend/.env`):
   ```env
   DB_HOST=localhost
   DB_PORT=6004
   DB_NAME=thulirix
   DB_USER=thulirix_user
   DB_PASS=thulirix_pass
   REDIS_HOST=localhost
   REDIS_PORT=6005
   REDIS_PASSWORD=thulirix_redis_pass
   JWT_SECRET=your-secret-key
   SERVER_PORT=6001
   ```

3. Run the backend:
   ```bash
   cd backend
   mvn spring-boot:run
   ```

#### Frontend
1. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```

2. Set environment variables (create `frontend/.env`):
   ```env
   VITE_API_BASE_URL=http://localhost:6001/api/v1
   ```

3. Start the dev server:
   ```bash
   npm run dev
   ```

## Configuration

### Environment Variables

#### Backend
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASS`: PostgreSQL connection
- `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`: Redis connection
- `JWT_SECRET`: JWT signing key (256-bit)
- `JWT_EXPIRATION_MS`: Access token expiry (default 24h)
- `JWT_REFRESH_EXPIRATION_MS`: Refresh token expiry (default 7d)
- `SERVER_PORT`: Server port (default 6001, but 6001 in Docker)
- `APP_BASE_URL`: Base URL for integrations

#### Frontend
- `VITE_API_BASE_URL`: Backend API base URL

### Profiles
- `default`: Local development
- `docker`: Docker environment
- `prod`: Production (use `docker-compose.prod.yml`)

### Production Deployment

Use `docker-compose.prod.yml` for production:
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

This enables production configs like optimized builds, secrets, etc.

## API Documentation

Access Swagger UI at: http://localhost:6003/swagger-ui.html

Key endpoints:
- Auth: `/api/v1/auth/login`, `/api/v1/auth/refresh`
- Projects: `/api/v1/projects`
- Test Cases: `/api/v1/projects/{projectId}/test-cases`
- Executions: `/api/v1/projects/{projectId}/executions`
- Tags: `/api/v1/projects/{projectId}/tags`
- Dashboard: `/api/v1/projects/{projectId}/dashboard`
- Integrations: `/api/v1/integrations/ado`, `/api/v1/integrations/salesforce`
- Bulk Import: `/api/v1/projects/{projectId}/test-cases/import`

## Project Structure

```
thulirix/
├── backend/                 # Spring Boot application
│   ├── pom.xml
│   ├── Dockerfile           # Multi-stage build (assumed)
│   ├── src/main/java/com/thulirix/
│   │   ├── config/          # Security, OpenAPI, CORS, etc.
│   │   ├── controller/      # REST controllers
│   │   ├── service/         # Business logic, integrations
│   │   ├── repository/      # JPA repositories
│   │   ├── domain/          # Entities, enums
│   │   ├── dto/             # Request/Response DTOs
│   │   ├── mapper/          # MapStruct mappers
│   │   ├── exception/       # Global exception handling
│   │   ├── security/        # JWT, auth filters
│   │   ├── event/           # Async events
│   │   ├── integration/     # ADO, Salesforce clients
│   │   └── util/            # Utilities
│   ├── src/main/resources/
│   │   ├── application.yml  # Main config
│   │   ├── application-docker.yml  # Docker profile
│   │   ├── application-prod.yml    # Prod profile
│   │   └── db/migration/     # Flyway scripts
│   └── src/test/            # Unit/integration tests
├── frontend/                # React application
│   ├── package.json
│   ├── Dockerfile           # Nginx serve (assumed)
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── tsconfig.json
│   ├── src/
│   │   ├── main.tsx         # App entry
│   │   ├── App.tsx          # Main component
│   │   ├── index.css        # Global styles
│   │   ├── api/             # Axios clients (authApi, projectApi, etc.)
│   │   ├── components/      # Reusable components
│   │   │   ├── common/      # Badge, Modal, etc.
│   │   │   ├── charts/      # PassRateGauge, TrendChart
│   │   │   └── layout/      # Header, Sidebar, AppLayout
│   │   ├── hooks/           # React Query hooks
│   │   ├── pages/           # Page components
│   │   │   ├── auth/        # LoginPage
│   │   │   ├── dashboard/   # DashboardPage
│   │   │   ├── projects/    # ProjectsPage, etc.
│   │   │   └── ...
│   │   ├── store/           # Zustand stores (auth, project)
│   │   ├── types/           # TypeScript interfaces
│   │   └── utils/           # Helpers
│   └── public/              # Static assets
├── infrastructure/          # Infra configs
│   ├── nginx/
│   │   └── nginx.conf       # Reverse proxy config
│   └── scripts/
│       ├── init-db.sql      # DB init script
│       ├── mock-ado-db.json # Mock data
│       └── redis-mock-server.js
├── docker-compose.yml       # Dev setup
├── docker-compose.prod.yml  # Prod overrides
└── .gitignore
```

## Database Schema

- Uses Flyway for migrations (in `backend/src/main/resources/db/migration/`)
- Main tables: projects, test_cases, executions, tags, users, etc.
- Supports RTM (Requirement Traceability Matrix) via test case links

## Testing

### Backend
- Unit tests with JUnit 5
- Integration tests with Testcontainers (PostgreSQL)
- Run tests: `mvn test`

### Frontend
- ESLint for linting
- Run lint: `npm run lint`

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Make changes and add tests
4. Commit (`git commit -am 'Add new feature'`)
5. Push (`git push origin feature/new-feature`)
6. Create a Pull Request

### Code Style
- Backend: Follow Spring Boot conventions, use Lombok/MapStruct
- Frontend: Use TypeScript strict mode, ESLint rules

## Documentation

For detailed documentation, see the [docs/](docs/) directory:

- [API Documentation](docs/API.md)
- [Deployment Guide](docs/Deployment.md)
- [Architecture Overview](docs/Architecture.md)</content>
<parameter name="filePath">c:\Users\sathy\thulirix\README.md