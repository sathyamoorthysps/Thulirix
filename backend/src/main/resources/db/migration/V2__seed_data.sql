-- =============================================================
-- THULIRIX V2 — Seed Data (dev/stage only)
-- =============================================================

-- ─── System Admin User ────────────────────────────────────────
-- Password: Admin@123 (BCrypt hash — change in production)
INSERT INTO users (id, email, display_name, password_hash, is_active)
VALUES (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'admin@thulirix.io',
    'System Administrator',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeVtEbqCXEQ7y7Uwu',
    TRUE
) ON CONFLICT (email) DO NOTHING;

INSERT INTO user_roles (user_id, role)
VALUES ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'SYSTEM_ADMIN')
ON CONFLICT DO NOTHING;

-- ─── Demo QA Lead ────────────────────────────────────────────
-- Password: Test@123
INSERT INTO users (id, email, display_name, password_hash, is_active)
VALUES (
    'b2c3d4e5-f6a7-8901-bcde-f12345678901',
    'qalead@thulirix.io',
    'QA Lead Demo',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeVtEbqCXEQ7y7Uwu',
    TRUE
) ON CONFLICT (email) DO NOTHING;

INSERT INTO user_roles (user_id, role)
VALUES ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'TEST_LEAD')
ON CONFLICT DO NOTHING;

-- ─── Demo Project ─────────────────────────────────────────────
INSERT INTO projects (id, name, slug, description, created_by)
VALUES (
    'c3d4e5f6-a7b8-9012-cdef-123456789012',
    'Payments Platform QA',
    'payments-platform-qa',
    'End-to-end QA for the Payments Platform microservices',
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
) ON CONFLICT (slug) DO NOTHING;

-- Assign admin + QA lead to project
INSERT INTO user_project_roles (user_id, project_id, role, granted_by)
VALUES
    ('a1b2c3d4-e5f6-7890-abcd-ef1234567890',
     'c3d4e5f6-a7b8-9012-cdef-123456789012', 'PROJECT_ADMIN',
     'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
    ('b2c3d4e5-f6a7-8901-bcde-f12345678901',
     'c3d4e5f6-a7b8-9012-cdef-123456789012', 'TEST_LEAD',
     'a1b2c3d4-e5f6-7890-abcd-ef1234567890')
ON CONFLICT DO NOTHING;

-- ─── Sample Tags ─────────────────────────────────────────────
INSERT INTO tags (project_id, name, color_hex, created_by)
VALUES
    ('c3d4e5f6-a7b8-9012-cdef-123456789012', 'smoke',       '#FF5733', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
    ('c3d4e5f6-a7b8-9012-cdef-123456789012', 'regression',  '#3498DB', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
    ('c3d4e5f6-a7b8-9012-cdef-123456789012', 'api',         '#2ECC71', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
    ('c3d4e5f6-a7b8-9012-cdef-123456789012', 'ui',          '#9B59B6', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
    ('c3d4e5f6-a7b8-9012-cdef-123456789012', 'release-1.0', '#F39C12', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890')
ON CONFLICT DO NOTHING;

-- ─── Sample Requirements ──────────────────────────────────────
INSERT INTO requirements (project_id, req_key, title, source_type, priority, created_by)
VALUES
    ('c3d4e5f6-a7b8-9012-cdef-123456789012',
     'REQ-001', 'User can process credit card payment', 'MANUAL', 'CRITICAL',
     'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
    ('c3d4e5f6-a7b8-9012-cdef-123456789012',
     'REQ-002', 'System sends payment confirmation email', 'MANUAL', 'HIGH',
     'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
    ('c3d4e5f6-a7b8-9012-cdef-123456789012',
     'REQ-003', 'Payment refund within 5 business days', 'MANUAL', 'MEDIUM',
     'a1b2c3d4-e5f6-7890-abcd-ef1234567890')
ON CONFLICT DO NOTHING;

-- ─── Sample Test Cases ────────────────────────────────────────
INSERT INTO test_cases (
    id, project_id, tc_key, title, objective, preconditions,
    status, priority, automation_status, current_version, created_by, updated_by
) VALUES
    ('d4e5f6a7-b8c9-0123-defa-234567890123',
     'c3d4e5f6-a7b8-9012-cdef-123456789012',
     'TC-0001',
     'Verify successful credit card payment',
     'Ensure a user can complete a payment using a valid credit card',
     'User is logged in. Cart has at least one item. Valid credit card available.',
     'READY', 'CRITICAL', 'AUTOMATED', 1,
     'b2c3d4e5-f6a7-8901-bcde-f12345678901',
     'b2c3d4e5-f6a7-8901-bcde-f12345678901'),

    ('e5f6a7b8-c9d0-1234-efab-345678901234',
     'c3d4e5f6-a7b8-9012-cdef-123456789012',
     'TC-0002',
     'Verify payment failure with invalid card',
     'Ensure system gracefully handles payment failure with an invalid card',
     'User is logged in. Cart has items. Invalid/expired card ready.',
     'READY', 'HIGH', 'AUTOMATED', 1,
     'b2c3d4e5-f6a7-8901-bcde-f12345678901',
     'b2c3d4e5-f6a7-8901-bcde-f12345678901'),

    ('f6a7b8c9-d0e1-2345-fabc-456789012345',
     'c3d4e5f6-a7b8-9012-cdef-123456789012',
     'TC-0003',
     'Verify payment confirmation email',
     'Confirm that payment confirmation email is sent within 2 minutes',
     'SMTP service is running. Valid email address configured for user.',
     'READY', 'HIGH', 'NOT_AUTOMATED', 1,
     'b2c3d4e5-f6a7-8901-bcde-f12345678901',
     'b2c3d4e5-f6a7-8901-bcde-f12345678901')
ON CONFLICT DO NOTHING;

-- ─── Sample Test Steps ────────────────────────────────────────
INSERT INTO test_steps (test_case_id, step_order, action, expected_result, created_by, updated_by)
VALUES
    ('d4e5f6a7-b8c9-0123-defa-234567890123', 1,
     'Navigate to checkout page', 'Checkout page loads with order summary',
     'b2c3d4e5-f6a7-8901-bcde-f12345678901',
     'b2c3d4e5-f6a7-8901-bcde-f12345678901'),
    ('d4e5f6a7-b8c9-0123-defa-234567890123', 2,
     'Enter valid credit card: 4111111111111111, Exp: 12/26, CVV: 123',
     'Card details accepted without validation error',
     'b2c3d4e5-f6a7-8901-bcde-f12345678901',
     'b2c3d4e5-f6a7-8901-bcde-f12345678901'),
    ('d4e5f6a7-b8c9-0123-defa-234567890123', 3,
     'Click "Pay Now" button',
     'Loading spinner shown, payment processes in under 5 seconds',
     'b2c3d4e5-f6a7-8901-bcde-f12345678901',
     'b2c3d4e5-f6a7-8901-bcde-f12345678901'),
    ('d4e5f6a7-b8c9-0123-defa-234567890123', 4,
     'Verify confirmation page',
     'Success page shown with Order ID. Status = CONFIRMED.',
     'b2c3d4e5-f6a7-8901-bcde-f12345678901',
     'b2c3d4e5-f6a7-8901-bcde-f12345678901'),

    ('e5f6a7b8-c9d0-1234-efab-345678901234', 1,
     'Navigate to checkout page', 'Checkout page loads',
     'b2c3d4e5-f6a7-8901-bcde-f12345678901',
     'b2c3d4e5-f6a7-8901-bcde-f12345678901'),
    ('e5f6a7b8-c9d0-1234-efab-345678901234', 2,
     'Enter expired card: 4111111111111111, Exp: 01/20, CVV: 123',
     'Card details accepted without client-side error',
     'b2c3d4e5-f6a7-8901-bcde-f12345678901',
     'b2c3d4e5-f6a7-8901-bcde-f12345678901'),
    ('e5f6a7b8-c9d0-1234-efab-345678901234', 3,
     'Click "Pay Now"',
     'Error message: "Payment declined. Card expired." shown in red.',
     'b2c3d4e5-f6a7-8901-bcde-f12345678901',
     'b2c3d4e5-f6a7-8901-bcde-f12345678901')
ON CONFLICT DO NOTHING;
