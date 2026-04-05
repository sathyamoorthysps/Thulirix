import type { TestCaseSummaryResponse, TestCaseResponse, CreateTestCaseRequest, Priority, TestCaseStatus, AutomationStatus } from '@/types';

// ── CSV helpers ──────────────────────────────────────────────────────────────

const CSV_HEADERS = [
  'title', 'description', 'objective', 'preconditions', 'postconditions',
  'priority', 'status', 'automationStatus', 'tags', 'steps',
];

function escapeCell(value: unknown): string {
  const str = value == null ? '' : String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      cells.push(current); current = '';
    } else {
      current += ch;
    }
  }
  cells.push(current);
  return cells;
}

// ── Export ───────────────────────────────────────────────────────────────────

export function exportToCsv(testCases: TestCaseResponse[]): void {
  const rows = [CSV_HEADERS.join(',')];
  for (const tc of testCases) {
    const stepsJson = JSON.stringify(
      tc.steps.map((s) => ({ action: s.action, expectedResult: s.expectedResult || '', testData: s.testData || '' }))
    );
    const tagNames = tc.tags.map((t) => t.name).join(';');
    const row = [
      tc.title, tc.description || '', tc.objective || '',
      tc.preconditions || '', tc.postconditions || '',
      tc.priority, tc.status, tc.automationStatus,
      tagNames, stepsJson,
    ].map(escapeCell).join(',');
    rows.push(row);
  }
  downloadText(rows.join('\r\n'), 'test-cases.csv', 'text/csv');
}

export function exportToJson(testCases: TestCaseResponse[]): void {
  const payload = testCases.map((tc) => ({
    title: tc.title,
    description: tc.description || '',
    objective: tc.objective || '',
    preconditions: tc.preconditions || '',
    postconditions: tc.postconditions || '',
    priority: tc.priority,
    status: tc.status,
    automationStatus: tc.automationStatus,
    tags: tc.tags.map((t) => t.name),
    steps: tc.steps.map((s) => ({
      action: s.action,
      expectedResult: s.expectedResult || '',
      testData: s.testData || '',
    })),
  }));
  downloadText(JSON.stringify(payload, null, 2), 'test-cases.json', 'application/json');
}

function downloadText(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Import row type ───────────────────────────────────────────────────────────

export interface ImportRow {
  title: string;
  description: string;
  objective: string;
  preconditions: string;
  postconditions: string;
  priority: Priority;
  status: TestCaseStatus;
  automationStatus: AutomationStatus;
  tagNames: string[];
  steps: { action: string; expectedResult: string; testData: string }[];
  _error?: string;
}

const VALID_PRIORITIES = new Set(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);
const VALID_STATUSES = new Set(['DRAFT', 'READY', 'ARCHIVED', 'DEPRECATED']);
const VALID_AUTOMATION = new Set(['NOT_AUTOMATED', 'AUTOMATION_CANDIDATE', 'AUTOMATED', 'AUTOMATION_BROKEN']);

function validateRow(row: Partial<ImportRow>): string | undefined {
  if (!row.title?.trim()) return 'Title is required';
  if (row.priority && !VALID_PRIORITIES.has(row.priority)) return `Invalid priority: ${row.priority}`;
  if (row.status && !VALID_STATUSES.has(row.status)) return `Invalid status: ${row.status}`;
  if (row.automationStatus && !VALID_AUTOMATION.has(row.automationStatus)) return `Invalid automationStatus: ${row.automationStatus}`;
  return undefined;
}

// ── Parse CSV ─────────────────────────────────────────────────────────────────

export function parseCsv(text: string): ImportRow[] {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(Boolean);
  if (lines.length < 2) return [];
  const headers = parseCsvLine(lines[0]).map((h) => h.trim().toLowerCase());
  return lines.slice(1).map((line) => {
    const cells = parseCsvLine(line);
    const get = (key: string) => (cells[headers.indexOf(key)] ?? '').trim();

    let steps: ImportRow['steps'] = [];
    try {
      const raw = get('steps');
      if (raw) steps = JSON.parse(raw);
    } catch { steps = []; }

    const row: ImportRow = {
      title: get('title'),
      description: get('description'),
      objective: get('objective'),
      preconditions: get('preconditions'),
      postconditions: get('postconditions'),
      priority: (get('priority').toUpperCase() || 'MEDIUM') as Priority,
      status: (get('status').toUpperCase() || 'DRAFT') as TestCaseStatus,
      automationStatus: (get('automationstatus').toUpperCase() || 'NOT_AUTOMATED') as AutomationStatus,
      tagNames: get('tags') ? get('tags').split(';').map((t) => t.trim()).filter(Boolean) : [],
      steps,
    };
    row._error = validateRow(row);
    return row;
  });
}

// ── Parse JSON ────────────────────────────────────────────────────────────────

export function parseJson(text: string): ImportRow[] {
  let arr: any[];
  try { arr = JSON.parse(text); } catch { return []; }
  if (!Array.isArray(arr)) return [];
  return arr.map((item) => {
    const row: ImportRow = {
      title: item.title ?? '',
      description: item.description ?? '',
      objective: item.objective ?? '',
      preconditions: item.preconditions ?? '',
      postconditions: item.postconditions ?? '',
      priority: (String(item.priority ?? 'MEDIUM').toUpperCase()) as Priority,
      status: (String(item.status ?? 'DRAFT').toUpperCase()) as TestCaseStatus,
      automationStatus: (String(item.automationStatus ?? 'NOT_AUTOMATED').toUpperCase()) as AutomationStatus,
      tagNames: Array.isArray(item.tags) ? item.tags.map(String) : [],
      steps: Array.isArray(item.steps) ? item.steps.map((s: any) => ({
        action: s.action ?? '',
        expectedResult: s.expectedResult ?? '',
        testData: s.testData ?? '',
      })) : [],
    };
    row._error = validateRow(row);
    return row;
  });
}

// ── Convert ImportRow → CreateTestCaseRequest ─────────────────────────────────

export function toCreateRequest(row: ImportRow, tagIds: string[] = []): CreateTestCaseRequest {
  return {
    title: row.title,
    description: row.description,
    objective: row.objective,
    preconditions: row.preconditions,
    postconditions: row.postconditions,
    priority: row.priority,
    status: row.status,
    automationStatus: row.automationStatus,
    tagIds,
    steps: row.steps.map((s, i) => ({
      stepNumber: i + 1,
      action: s.action,
      expectedResult: s.expectedResult,
      testData: s.testData,
    })),
  };
}

// ── Template download ─────────────────────────────────────────────────────────

export function downloadCsvTemplate(): void {
  const sample = [
    CSV_HEADERS.join(','),
    [
      'Login with valid credentials',
      'Verify user can login',
      'Test the login flow',
      'User is registered',
      'User is logged in',
      'HIGH', 'DRAFT', 'NOT_AUTOMATED',
      'smoke;regression',
      JSON.stringify([{ action: 'Navigate to /login', expectedResult: 'Login page loads', testData: '' }]),
    ].map(escapeCell).join(','),
  ];
  downloadText(sample.join('\r\n'), 'test-cases-template.csv', 'text/csv');
}
