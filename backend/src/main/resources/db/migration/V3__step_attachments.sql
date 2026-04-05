CREATE TABLE IF NOT EXISTS step_attachments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_step_id    UUID NOT NULL REFERENCES test_steps(id) ON DELETE CASCADE,
    original_name   VARCHAR(255) NOT NULL,
    stored_name     VARCHAR(255) NOT NULL,
    mime_type       VARCHAR(128),
    file_size       BIGINT,
    uploaded_by     UUID REFERENCES users(id),
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sa_test_step ON step_attachments(test_step_id);
