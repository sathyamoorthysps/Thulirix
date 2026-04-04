# API Documentation

This document provides an overview of the Thulirix REST API.

## Base URL
- Development: `http://localhost:6001/api/v1`
- Production: `https://api.thulirix.io/api/v1`

## Authentication
All API requests require JWT authentication via Bearer token in the `Authorization` header.

### Login
```http
POST /auth/login
Content-Type: application/json

{
  "username": "user@example.com",
  "password": "password"
}
```

Response:
```json
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "tokenType": "Bearer",
  "expiresIn": 86400000
}
```

### Refresh Token
```http
POST /auth/refresh
Authorization: Bearer <refresh_token>
```

## Projects

### List Projects
```http
GET /projects
```

### Create Project
```http
POST /projects
Content-Type: application/json

{
  "name": "My Project",
  "description": "Project description"
}
```

### Get Project
```http
GET /projects/{projectId}
```

### Update Project
```http
PUT /projects/{projectId}
Content-Type: application/json

{
  "name": "Updated Name",
  "description": "Updated description"
}
```

### Delete Project
```http
DELETE /projects/{projectId}
```

## Test Cases

### List Test Cases
```http
GET /projects/{projectId}/test-cases?page=0&size=20&sort=createdAt,desc
```

Query params: `search`, `tag`, `priority`, `status`

### Create Test Case
```http
POST /projects/{projectId}/test-cases
Content-Type: application/json

{
  "title": "Test Case Title",
  "description": "Test description",
  "steps": ["Step 1", "Step 2"],
  "expectedResult": "Expected outcome",
  "priority": "HIGH",
  "tags": ["tag1", "tag2"]
}
```

### Bulk Import
```http
POST /projects/{projectId}/test-cases/import
Content-Type: multipart/form-data

file: <Excel file>
```

### Get Test Case
```http
GET /projects/{projectId}/test-cases/{testCaseId}
```

### Update Test Case
```http
PUT /projects/{projectId}/test-cases/{testCaseId}
```

### Delete Test Case
```http
DELETE /projects/{projectId}/test-cases/{testCaseId}
```

## Executions

### List Executions
```http
GET /projects/{projectId}/executions
```

### Create Execution
```http
POST /projects/{projectId}/executions
Content-Type: application/json

{
  "name": "Sprint 1 Execution",
  "testCaseIds": [1, 2, 3]
}
```

### Get Execution
```http
GET /projects/{projectId}/executions/{executionId}
```

### Update Test Result
```http
PUT /projects/{projectId}/executions/{executionId}/results/{testCaseId}
Content-Type: application/json

{
  "status": "PASSED",
  "notes": "Test passed successfully"
}
```

## Tags

### List Tags
```http
GET /projects/{projectId}/tags
```

### Create Tag
```http
POST /projects/{projectId}/tags
Content-Type: application/json

{
  "name": "Regression",
  "color": "#FF0000"
}
```

## Dashboard

### Get Dashboard Data
```http
GET /projects/{projectId}/dashboard
```

Response includes metrics, charts data, recent executions, etc.

## Integrations

### Azure DevOps
```http
POST /integrations/ado/sync
Content-Type: application/json

{
  "organization": "myorg",
  "project": "myproject",
  "pat": "personal_access_token"
}
```

### Salesforce
```http
POST /integrations/salesforce/sync
Content-Type: application/json

{
  "instanceUrl": "https://myinstance.salesforce.com",
  "username": "user@example.com",
  "password": "password",
  "securityToken": "token"
}
```

## Error Responses

All errors follow this format:
```json
{
  "timestamp": "2024-01-01T00:00:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "path": "/api/v1/projects"
}
```

## Rate Limiting

- API endpoints: 20 requests/second per IP
- Burst: 40 requests

## Pagination

List endpoints support pagination:
- `page`: Page number (0-based)
- `size`: Page size (default 20, max 100)
- `sort`: Sort field,direction (e.g., `createdAt,desc`)

Response includes:
```json
{
  "content": [...],
  "pageable": {...},
  "totalElements": 100,
  "totalPages": 5,
  "size": 20,
  "number": 0,
  "first": true,
  "last": false
}
```

## Webhooks

For integrations, webhooks are supported at `/webhooks/ado` and `/webhooks/salesforce`.

## Full API Spec

For complete OpenAPI specification, visit: http://localhost:6001/api-docs</content>
<parameter name="filePath">c:\Users\sathy\thulirix\docs\API.md