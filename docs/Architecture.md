# Architecture Overview

Thulirix is built as a microservices-inspired monolith with clear separation of concerns, designed for scalability and maintainability.

## System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web Browser   │────│     Nginx       │────│   React SPA     │
│                 │    │  (Reverse Proxy)│    │   (Frontend)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   REST API      │────│  Spring Boot    │────│   PostgreSQL    │
│   (Swagger)     │    │   (Backend)     │    │   (Database)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                │
                       ┌─────────────────┐
                       │     Redis       │
                       │   (Cache)       │
                       └─────────────────┘
```

## Component Details

### Frontend (React/TypeScript)

**Technology Stack:**
- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- React Query for server state management
- Zustand for client state
- React Router for navigation

**Architecture:**
- **Pages**: Route-based components (Dashboard, Projects, Test Cases, etc.)
- **Components**: Reusable UI components (Charts, Forms, Layout)
- **Hooks**: Custom React hooks for data fetching and business logic
- **API Layer**: Axios-based clients for backend communication
- **State Management**: Zustand stores for global state (auth, projects)
- **Forms**: React Hook Form with Zod validation

**Key Features:**
- Single Page Application (SPA) with client-side routing
- Responsive design with mobile support
- Real-time updates via polling/React Query
- Offline-capable forms with validation
- Accessible UI components

### Backend (Spring Boot)

**Technology Stack:**
- Spring Boot 3.2.4 (Java 21)
- Spring Web MVC for REST API
- Spring Data JPA for data access
- Spring Security for authentication/authorization
- Spring Cache with Redis
- Spring AOP for cross-cutting concerns

**Architecture:**
- **Controllers**: REST endpoints with OpenAPI documentation
- **Services**: Business logic layer
- **Repositories**: Data access layer (JPA)
- **Domain**: Entities, value objects, enums
- **DTOs**: Request/response objects
- **Mappers**: Object mapping (MapStruct)
- **Config**: Security, CORS, OpenAPI, etc.
- **Exception Handling**: Global exception handlers
- **Events**: Async event processing

**Key Features:**
- JWT-based authentication with refresh tokens
- Role-based access control (RBAC)
- Async processing for bulk operations
- Integration clients (ADO, Salesforce)
- Caching for performance
- Comprehensive logging and monitoring

### Database (PostgreSQL)

**Schema Design:**
- Normalized relational schema
- Flyway-managed migrations
- Indexes for performance
- Constraints for data integrity

**Key Tables:**
- `projects`: Project metadata
- `test_cases`: Test case definitions
- `executions`: Test run instances
- `execution_results`: Individual test results
- `tags`: Test case categorization
- `users`: User accounts and roles
- `integrations`: External system configs

**Features:**
- JSONB columns for flexible data
- Full-text search capabilities
- Audit logging via triggers
- Partitioning for large tables (future)

### Cache (Redis)

**Usage:**
- Session storage
- API response caching
- Rate limiting data
- Temporary data for async operations

**Configuration:**
- Connection pooling
- TTL-based expiration
- Serialization with Jackson

### Infrastructure

**Docker Compose:**
- Multi-container development environment
- Service orchestration
- Volume management for persistence
- Health checks and dependencies

**Nginx:**
- Reverse proxy for API and static content
- Load balancing (future)
- Rate limiting
- SSL termination (production)
- Static file serving

## Data Flow

### User Authentication
1. User submits credentials via login form
2. Frontend sends POST to `/api/v1/auth/login`
3. Backend validates credentials against database
4. JWT tokens generated and returned
5. Tokens stored in localStorage and Zustand store
6. Subsequent requests include Bearer token

### Test Case Creation
1. User fills form in frontend
2. Form validation with Zod schemas
3. POST to `/api/v1/projects/{id}/test-cases`
4. Backend validates request, maps to entity
5. Saves to database with audit info
6. Returns created test case
7. Frontend updates UI optimistically

### Test Execution
1. User initiates execution from UI
2. Frontend creates execution record
3. Async processing updates test results
4. Real-time updates via polling/React Query
5. Dashboard reflects current status

### Integration Sync
1. User configures integration (ADO/Salesforce)
2. Credentials stored securely
3. Scheduled/async sync jobs run
4. Data mapped and imported
5. Notifications sent on completion

## Security Architecture

### Authentication
- JWT access tokens (24h expiry)
- Refresh tokens (7d expiry)
- Password hashing with BCrypt
- Account lockout after failed attempts

### Authorization
- Role-based permissions
- Method-level security
- Data-level filtering
- API key support for integrations

### Data Protection
- TLS/SSL for all communications
- Database encryption at rest
- Sensitive data masking in logs
- CORS configuration

### Security Headers
- Content Security Policy (CSP)
- X-Frame-Options
- X-Content-Type-Options
- HSTS

## Performance Considerations

### Backend Optimization
- Connection pooling (HikariCP)
- Query optimization and indexing
- Caching layers (Redis)
- Async processing for heavy operations
- Pagination for large datasets

### Frontend Optimization
- Code splitting with Vite
- Lazy loading of routes
- Image optimization
- Bundle analysis and tree shaking
- Service worker for caching (future)

### Database Optimization
- Proper indexing strategy
- Query optimization
- Connection pooling
- Read replicas (future scaling)

## Scalability

### Horizontal Scaling
- Stateless backend services
- Database read replicas
- Redis clustering
- Load balancer for multiple instances

### Vertical Scaling
- Container resource limits
- Database instance sizing
- Cache memory allocation

### Microservices Migration Path
- API-first design
- Service boundaries identified
- Event-driven communication ready
- Database per service possible

## Monitoring & Observability

### Application Metrics
- Spring Boot Actuator endpoints
- Custom business metrics
- JVM and system metrics

### Logging
- Structured logging with SLF4J
- Log levels by environment
- Centralized log aggregation
- Error tracking and alerting

### Tracing
- Request tracing with correlation IDs
- Performance monitoring
- Dependency tracking

### Health Checks
- Application health endpoints
- Database connectivity checks
- External service availability
- Automated recovery actions

## Development Workflow

### Local Development
- Docker Compose for full stack
- Hot reload for frontend/backend
- Database migrations on startup
- Debug configurations for IDE

### CI/CD Pipeline
- Automated testing (unit, integration)
- Code quality checks (linting, security)
- Container image building
- Deployment to staging/production
- Rollback capabilities

### Testing Strategy
- Unit tests for business logic
- Integration tests with Testcontainers
- E2E tests with Cypress (future)
- Performance testing with JMeter
- Security testing with OWASP tools

## Future Enhancements

### Planned Features
- Real-time notifications with WebSockets
- Advanced reporting with BI tools
- Mobile app companion
- AI-powered test case generation
- Advanced analytics and ML insights

### Architecture Evolution
- Event sourcing for audit trails
- CQRS for complex queries
- GraphQL API alongside REST
- Service mesh with Istio
- Multi-cloud deployment support</content>
<parameter name="filePath">c:\Users\sathy\thulirix\docs\Architecture.md