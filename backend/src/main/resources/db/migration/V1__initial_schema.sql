-- =============================================================
-- THULIRIX V1 — Initial Schema
-- PostgreSQL 16+
-- =============================================================

-- ─── USERS ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email               VARCHAR(320) NOT NULL,
    display_name        VARCHAR(200) NOT NULL,
    password_hash       VARCHAR(255),
    azure_oid           VARCHAR(100),
    salesforce_user_id  VARCHAR(100),
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at       TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by          UUID,
    updated_by          UUID,
    CONSTRAINT uq_users_email    UNIQUE (email),
    CONSTRAINT uq_users_azure_oid UNIQUE (azure_oid)
);

CREATE TABLE IF NOT EXISTS user_roles (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role    VARCHAR(50) NOT NULL,
    PRIMARY KEY (user_id, role)
);

-- ─── PROJECTS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS projects (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(200) NOT NULL,
    slug        VARCHAR(100) NOT NULL,
    description TEXT,
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by  UUID REFERENCES users(id),
    updated_by  UUID REFERENCES users(id),
    CONSTRAINT uq_projects_slug UNIQUE (slug)
);

CREATE TABLE IF NOT EXISTS user_project_roles (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    role        VARCHAR(50) NOT NULL,
    granted_by  UUID REFERENCES users(id),
    granted_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by  UUID,
    updated_by  UUID,
    CONSTRAINT uq_user_project_role UNIQUE (user_id, project_id, role)
);

-- ─── TEST CASES ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS test_cases (
    id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id             UUID NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
    tc_key                 VARCHAR(50) NOT NULL,
    title                  VARCHAR(500) NOT NULL,
    description            TEXT,
    objective              TEXT,
    preconditions          TEXT,
    postconditions         TEXT,
    status                 VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    priority               VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    automation_status      VARCHAR(30) NOT NULL DEFAULT 'NOT_AUTOMATED',
    automation_metadata    JSONB,
    estimated_duration_min INTEGER,
    external_tc_id         VARCHAR(200),
    current_version        INTEGER NOT NULL DEFAULT 1,
    is_deleted             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by             UUID REFERENCES users(id),
    updated_by             UUID REFERENCES users(id),
    CONSTRAINT uq_tc_key_project UNIQUE (project_id, tc_key)
);

CREATE INDEX IF NOT EXISTS idx_tc_project    ON test_cases(project_id);
CREATE INDEX IF NOT EXISTS idx_tc_status     ON test_cases(project_id, status);
CREATE INDEX IF NOT EXISTS idx_tc_priority   ON test_cases(project_id, priority);
CREATE INDEX IF NOT EXISTS idx_tc_external   ON test_cases(external_tc_id);
CREATE INDEX IF NOT EXISTS idx_tc_active     ON test_cases(project_id) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_tc_title_trgm ON test_cases USING gin(title gin_trgm_ops);

-- ─── TEST STEPS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS test_steps (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_case_id        UUID NOT NULL REFERENCES test_cases(id) ON DELETE CASCADE,
    step_order          INTEGER NOT NULL,
    action              TEXT NOT NULL,
    expected_result     TEXT NOT NULL,
    test_data           TEXT,
    is_shared_step      BOOLEAN NOT NULL DEFAULT FALSE,
    shared_step_ref_id  UUID REFERENCES test_steps(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by          UUID REFERENCES users(id),
    updated_by          UUID REFERENCES users(id),
    CONSTRAINT chk_step_order_positive CHECK (step_order > 0)
);

CREATE INDEX IF NOT EXISTS idx_ts_test_case ON test_steps(test_case_id, step_order);

-- ─── TEST CASE VERSIONS ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS test_case_versions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_case_id    UUID NOT NULL REFERENCES test_cases(id) ON DELETE CASCADE,
    version_number  INTEGER NOT NULL,
    title           VARCHAR(500) NOT NULL,
    objective       TEXT,
    preconditions   TEXT,
    postconditions  TEXT,
    status          VARCHAR(30) NOT NULL,
    priority        VARCHAR(20) NOT NULL,
    steps_snapshot  JSONB NOT NULL DEFAULT '[]',
    change_summary  TEXT,
    created_by      UUID NOT NULL REFERENCES users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_tc_version UNIQUE (test_case_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_tcv_test_case ON test_case_versions(test_case_id);

-- ─── TEST SUITES ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS test_suites (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
    parent_suite_id UUID REFERENCES test_suites(id) ON DELETE RESTRICT,
    name            VARCHAR(300) NOT NULL,
    description     TEXT,
    suite_order     INTEGER NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by      UUID REFERENCES users(id),
    updated_by      UUID REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_suite_project ON test_suites(project_id);
CREATE INDEX IF NOT EXISTS idx_suite_parent  ON test_suites(parent_suite_id);

CREATE TABLE IF NOT EXISTS test_suite_cases (
    suite_id        UUID NOT NULL REFERENCES test_suites(id) ON DELETE CASCADE,
    test_case_id    UUID NOT NULL REFERENCES test_cases(id) ON DELETE CASCADE,
    case_order      INTEGER NOT NULL DEFAULT 0,
    added_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    added_by        UUID REFERENCES users(id),
    PRIMARY KEY (suite_id, test_case_id)
);

-- ─── TAGS ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tags (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name        VARCHAR(100) NOT NULL,
    color_hex   CHAR(7),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by  UUID REFERENCES users(id),
    updated_by  UUID REFERENCES users(id),
    CONSTRAINT uq_tag_name_project UNIQUE (project_id, name)
);

CREATE TABLE IF NOT EXISTS test_case_tags (
    test_case_id UUID NOT NULL REFERENCES test_cases(id) ON DELETE CASCADE,
    tag_id       UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (test_case_id, tag_id)
);

-- ─── REQUIREMENTS (RTM) ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS requirements (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id   UUID NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
    req_key      VARCHAR(100) NOT NULL,
    title        VARCHAR(500) NOT NULL,
    description  TEXT,
    source_type  VARCHAR(50) NOT NULL,
    external_id  VARCHAR(300),
    external_url TEXT,
    priority     VARCHAR(50),
    is_active    BOOLEAN NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by   UUID REFERENCES users(id),
    updated_by   UUID REFERENCES users(id),
    CONSTRAINT uq_req_key_project UNIQUE (project_id, req_key)
);

CREATE INDEX IF NOT EXISTS idx_req_project  ON requirements(project_id);
CREATE INDEX IF NOT EXISTS idx_req_external ON requirements(external_id);

CREATE TABLE IF NOT EXISTS test_case_requirements (
    test_case_id    UUID NOT NULL REFERENCES test_cases(id) ON DELETE CASCADE,
    requirement_id  UUID NOT NULL REFERENCES requirements(id) ON DELETE CASCADE,
    notes           TEXT,
    PRIMARY KEY (test_case_id, requirement_id)
);

-- ─── TEST PLANS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS test_plans (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id    UUID NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
    name          VARCHAR(300) NOT NULL,
    description   TEXT,
    status        VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    start_date    DATE,
    end_date      DATE,
    environment   VARCHAR(200),
    build_version VARCHAR(200),
    ado_plan_id   VARCHAR(100),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by    UUID REFERENCES users(id),
    updated_by    UUID REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_plan_project ON test_plans(project_id);

CREATE TABLE IF NOT EXISTS test_plan_cases (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id      UUID NOT NULL REFERENCES test_plans(id) ON DELETE CASCADE,
    test_case_id UUID NOT NULL REFERENCES test_cases(id) ON DELETE RESTRICT,
    assigned_to  UUID REFERENCES users(id),
    tc_version   INTEGER NOT NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by   UUID,
    updated_by   UUID,
    CONSTRAINT uq_plan_case UNIQUE (plan_id, test_case_id)
);

-- ─── TEST RUNS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS test_runs (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id       UUID NOT NULL REFERENCES test_plans(id) ON DELETE RESTRICT,
    name          VARCHAR(300) NOT NULL,
    trigger_type  VARCHAR(30) NOT NULL DEFAULT 'MANUAL',
    environment   VARCHAR(200),
    build_version VARCHAR(200),
    started_at    TIMESTAMPTZ,
    completed_at  TIMESTAMPTZ,
    total_count   INTEGER NOT NULL DEFAULT 0,
    passed_count  INTEGER NOT NULL DEFAULT 0,
    failed_count  INTEGER NOT NULL DEFAULT 0,
    blocked_count INTEGER NOT NULL DEFAULT 0,
    skipped_count INTEGER NOT NULL DEFAULT 0,
    ado_run_id    VARCHAR(100),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by    UUID REFERENCES users(id),
    updated_by    UUID REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_run_plan    ON test_runs(plan_id);
CREATE INDEX IF NOT EXISTS idx_run_created ON test_runs(created_at DESC);

-- ─── EXECUTIONS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS executions (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id            UUID NOT NULL REFERENCES test_runs(id) ON DELETE CASCADE,
    test_case_id      UUID NOT NULL REFERENCES test_cases(id) ON DELETE RESTRICT,
    tc_version        INTEGER NOT NULL,
    assigned_to       UUID REFERENCES users(id),
    result            VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    started_at        TIMESTAMPTZ,
    completed_at      TIMESTAMPTZ,
    duration_ms       INTEGER,
    environment       VARCHAR(200),
    notes             TEXT,
    defect_ids        JSONB,
    is_automated      BOOLEAN NOT NULL DEFAULT FALSE,
    automation_tool   VARCHAR(100),
    automation_output TEXT,
    ado_result_id     VARCHAR(100),
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by        UUID REFERENCES users(id),
    updated_by        UUID REFERENCES users(id),
    CONSTRAINT uq_exec_run_tc UNIQUE (run_id, test_case_id)
);

CREATE INDEX IF NOT EXISTS idx_exec_run     ON executions(run_id);
CREATE INDEX IF NOT EXISTS idx_exec_tc      ON executions(test_case_id);
CREATE INDEX IF NOT EXISTS idx_exec_result  ON executions(result);
CREATE INDEX IF NOT EXISTS idx_exec_created ON executions(created_at DESC);

CREATE TABLE IF NOT EXISTS execution_steps (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    execution_id    UUID NOT NULL REFERENCES executions(id) ON DELETE CASCADE,
    step_id         UUID,
    step_order      INTEGER NOT NULL,
    action          TEXT NOT NULL,
    expected_result TEXT NOT NULL,
    actual_result   TEXT,
    result          VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    screenshot_url  TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by      UUID,
    updated_by      UUID
);

CREATE INDEX IF NOT EXISTS idx_exec_steps ON execution_steps(execution_id);

-- ─── INTEGRATION ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS integration_configs (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id       UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    integration_type VARCHAR(50) NOT NULL,
    name             VARCHAR(200) NOT NULL,
    is_enabled       BOOLEAN NOT NULL DEFAULT TRUE,
    config_json      JSONB NOT NULL DEFAULT '{}',
    last_sync_at     TIMESTAMPTZ,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by       UUID REFERENCES users(id),
    updated_by       UUID REFERENCES users(id),
    CONSTRAINT uq_integration_project_type UNIQUE (project_id, integration_type)
);

CREATE TABLE IF NOT EXISTS integration_field_mappings (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    integration_id  UUID NOT NULL REFERENCES integration_configs(id) ON DELETE CASCADE,
    thulirix_field  VARCHAR(200) NOT NULL,
    external_field  VARCHAR(200) NOT NULL,
    transform_expr  TEXT,
    sync_direction  VARCHAR(20) NOT NULL DEFAULT 'BIDIRECTIONAL',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by      UUID,
    updated_by      UUID,
    CONSTRAINT uq_field_mapping UNIQUE (integration_id, thulirix_field, external_field)
);

CREATE TABLE IF NOT EXISTS sync_states (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    integration_id      UUID NOT NULL REFERENCES integration_configs(id) ON DELETE CASCADE,
    entity_type         VARCHAR(50) NOT NULL,
    thulirix_id         UUID NOT NULL,
    external_id         VARCHAR(200) NOT NULL,
    external_revision   INTEGER,
    last_pushed_at      TIMESTAMPTZ,
    last_pulled_at      TIMESTAMPTZ,
    sync_status         VARCHAR(30) NOT NULL DEFAULT 'SYNCED',
    conflict_data       JSONB,
    error_message       TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by          UUID,
    updated_by          UUID,
    CONSTRAINT uq_sync_entity UNIQUE (integration_id, entity_type, thulirix_id)
);

CREATE INDEX IF NOT EXISTS idx_sync_status ON sync_states(sync_status);
CREATE INDEX IF NOT EXISTS idx_sync_type   ON sync_states(entity_type, integration_id);

-- ─── BULK IMPORT ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bulk_import_jobs (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id       UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    uploaded_by      UUID NOT NULL REFERENCES users(id),
    file_name        VARCHAR(500) NOT NULL,
    file_type        VARCHAR(10) NOT NULL,
    status           VARCHAR(30) NOT NULL DEFAULT 'QUEUED',
    total_records    INTEGER,
    imported_count   INTEGER NOT NULL DEFAULT 0,
    skipped_count    INTEGER NOT NULL DEFAULT 0,
    error_count      INTEGER NOT NULL DEFAULT 0,
    error_detail     JSONB,
    idempotency_key  VARCHAR(200),
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by       UUID,
    updated_by       UUID,
    completed_at     TIMESTAMPTZ,
    CONSTRAINT uq_import_idempotency UNIQUE (project_id, idempotency_key)
);

-- ─── AUDIT LOG ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_log (
    id             BIGSERIAL PRIMARY KEY,
    entity_type    VARCHAR(100) NOT NULL,
    entity_id      UUID NOT NULL,
    action         VARCHAR(50) NOT NULL,
    actor_id       UUID REFERENCES users(id),
    actor_email    VARCHAR(320),
    changed_fields JSONB,
    ip_address     VARCHAR(45),
    user_agent     TEXT,
    occurred_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_entity   ON audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_actor    ON audit_log(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_occurred ON audit_log(occurred_at DESC);
