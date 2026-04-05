// ── Auth ──
export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user?: UserResponse;
}

export interface UserResponse {
  id: string;
  email: string;
  displayName: string;
  roles: string[];
  active: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

// ── Projects ──
export interface ProjectResponse {
  id: string;
  name: string;
  slug: string;
  description: string;
  prefix: string;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectRequest {
  name: string;
  slug: string;
  description: string;
  prefix: string;
}

// ── Test Cases ──
export type TestCaseStatus = 'DRAFT' | 'READY' | 'ARCHIVED' | 'DEPRECATED';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type AutomationStatus = 'NOT_AUTOMATED' | 'AUTOMATION_CANDIDATE' | 'AUTOMATED' | 'AUTOMATION_BROKEN';

export interface StepAttachmentResponse {
  id: string;
  testStepId: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
  createdAt: string;
  downloadUrl: string;
}

export interface StepResponse {
  id: string;
  stepNumber: number;
  action: string;
  expectedResult: string;
  testData: string;
  attachments: StepAttachmentResponse[];
}

export interface TestCaseSummaryResponse {
  id: string;
  testCaseKey: string;
  title: string;
  priority: Priority;
  status: TestCaseStatus;
  automationStatus: AutomationStatus;
  tags: TagResponse[];
  updatedAt: string;
}

export interface TestCaseResponse {
  id: string;
  testCaseKey: string;
  title: string;
  description: string;
  objective: string;
  preconditions: string;
  postconditions: string;
  priority: Priority;
  status: TestCaseStatus;
  automationStatus: AutomationStatus;
  steps: StepResponse[];
  tags: TagResponse[];
  version: number;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTestCaseRequest {
  title: string;
  description: string;
  objective: string;
  preconditions: string;
  postconditions: string;
  priority: Priority;
  status: TestCaseStatus;
  automationStatus: AutomationStatus;
  tagIds: string[];
  steps: { stepNumber: number; action: string; expectedResult: string; testData: string }[];
}

// ── Executions ──
export type ExecutionResult = 'PASS' | 'FAIL' | 'BLOCKED' | 'SKIPPED' | 'PENDING';

export interface TestRunResponse {
  id: string;
  name: string;
  status: string;
  totalCases: number;
  passed: number;
  failed: number;
  blocked: number;
  skipped: number;
  pending: number;
  startedAt: string;
  completedAt: string | null;
}

export interface ExecutionResponse {
  id: string;
  testCaseKey: string;
  testCaseTitle: string;
  result: ExecutionResult;
  notes: string;
  executedAt: string;
  executedBy: string;
}

export interface TestPlanResponse {
  id: string;
  name: string;
  description: string;
  projectId: string;
  testCaseIds: string[];
  runs: TestRunResponse[];
  createdAt: string;
  updatedAt: string;
}

// ── Dashboard ──
export interface TrendPoint {
  date: string;
  passed: number;
  failed: number;
  total: number;
}

export interface DashboardResponse {
  totalTestCases: number;
  passRate: number;
  automatedPercentage: number;
  totalExecutions: number;
  statusBreakdown: Record<string, number>;
  trend: TrendPoint[];
  recentRuns: TestRunResponse[];
}

// ── Tags ──
export interface TagResponse {
  id: string;
  name: string;
  color: string;
}

export interface CreateTagRequest {
  name: string;
  color: string;
}

// ── Generic ──
export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface ApiError {
  status: number;
  message: string;
  errors?: Record<string, string>;
}
