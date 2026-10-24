
CREATE EXTENSION IF NOT EXISTS pgcrypto;


-- =====================================================================
-- 1. INSTITUTIONS
-- =====================================================================
CREATE TABLE institutions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(200) NOT NULL,
    institution_code VARCHAR(50) NOT NULL UNIQUE,
    state           VARCHAR(100) NOT NULL,
    district        VARCHAR(100) NOT NULL,
    type            VARCHAR(100) NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_institutions_status
        CHECK (status IN ('ACTIVE', 'INACTIVE'))
);


-- =====================================================================
-- 2. BUREAUS
--    Examples: Regulation Bureau, Approval Division,
--              Finance Bureau, Legal Cell
-- =====================================================================
CREATE TABLE bureaus (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(150) NOT NULL UNIQUE,
    description TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- =====================================================================
-- 3. USERS
--    Roles: CITIZEN, OFFICER, BUREAU_HEAD, ADMIN
-- =====================================================================
CREATE TABLE users (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name           VARCHAR(150) NOT NULL,
    email          VARCHAR(255) NOT NULL UNIQUE,
    password_hash  TEXT NOT NULL,
    role           VARCHAR(20) NOT NULL,
    institution_id UUID REFERENCES institutions (id) ON DELETE SET NULL,
    bureau_id      UUID REFERENCES bureaus (id) ON DELETE SET NULL,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_users_role
        CHECK (role IN ('CITIZEN', 'OFFICER', 'BUREAU_HEAD', 'ADMIN')),
    CONSTRAINT chk_users_name_not_empty
        CHECK (length(trim(name)) > 0),
    CONSTRAINT chk_users_email_format
        CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);


-- =====================================================================
-- 4. COMPLAINTS
-- =====================================================================
CREATE TABLE complaints (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_number    VARCHAR(20) NOT NULL UNIQUE,
    user_id             UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    institution_id      UUID NOT NULL REFERENCES institutions (id) ON DELETE RESTRICT,
    title               VARCHAR(255) NOT NULL,
    description         TEXT NOT NULL,
    category            VARCHAR(30) NOT NULL,
    priority            VARCHAR(20) NOT NULL,
    status              VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    assigned_bureau_id  UUID REFERENCES bureaus (id) ON DELETE SET NULL,
    assigned_officer_id UUID REFERENCES users (id) ON DELETE SET NULL,
    sla_days            INTEGER,
    sla_due_at          TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    resolved_at         TIMESTAMPTZ,

    CONSTRAINT chk_complaints_number_format
        CHECK (complaint_number ~ '^CMP-[0-9]{5}$'),
    CONSTRAINT chk_complaints_category
        CHECK (category IN
               ('FEE', 'ACADEMIC', 'APPROVAL', 'INFRASTRUCTURE',
                'LEGAL', 'ADMINISTRATION', 'OTHER')),
    CONSTRAINT chk_complaints_priority
        CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    CONSTRAINT chk_complaints_status
        CHECK (status IN ('PENDING', 'IN_PROGRESS', 'ESCALATED',
                          'RESOLVED', 'CLOSED')),
    CONSTRAINT chk_complaints_title_not_empty
        CHECK (length(trim(title)) > 0),
    CONSTRAINT chk_complaints_description_not_empty
        CHECK (length(trim(description)) > 0),
    CONSTRAINT chk_complaints_sla_days_positive
        CHECK (sla_days IS NULL OR sla_days > 0)
);


-- =====================================================================
-- 5. COMPLAINT HISTORY  (powers the complaint timeline)
--    Actions: SUBMITTED, REVIEWED, ASSIGNED, STATUS_CHANGED,
--             ESCALATED, COMMENT_ADDED, RESOLVED, CLOSED
-- =====================================================================
CREATE TABLE complaint_history (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id UUID NOT NULL REFERENCES complaints (id) ON DELETE CASCADE,
    action       VARCHAR(30) NOT NULL,
    performed_by UUID REFERENCES users (id) ON DELETE SET NULL,
    old_status   VARCHAR(20),
    new_status   VARCHAR(20),
    comment      TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_history_action
        CHECK (action IN ('SUBMITTED', 'REVIEWED', 'ASSIGNED',
                          'STATUS_CHANGED', 'ESCALATED', 'COMMENT_ADDED',
                          'RESOLVED', 'CLOSED')),
    CONSTRAINT chk_history_old_status
        CHECK (old_status IS NULL OR old_status IN
               ('PENDING', 'IN_PROGRESS', 'ESCALATED', 'RESOLVED', 'CLOSED')),
    CONSTRAINT chk_history_new_status
        CHECK (new_status IS NULL OR new_status IN
               ('PENDING', 'IN_PROGRESS', 'ESCALATED', 'RESOLVED', 'CLOSED'))
);


-- =====================================================================
-- 6. COMPLAINT ATTACHMENTS
--    Actual files will later be stored in Supabase Storage;
--    file_url will hold the public/signable object URL.
-- =====================================================================
CREATE TABLE complaint_attachments (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id UUID NOT NULL REFERENCES complaints (id) ON DELETE CASCADE,
    file_name    VARCHAR(255) NOT NULL,
    file_url     TEXT NOT NULL,
    file_type    VARCHAR(100),
    file_size    BIGINT,
    uploaded_by  UUID REFERENCES users (id) ON DELETE SET NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_attachment_size_positive
        CHECK (file_size IS NULL OR file_size >= 0)
);


-- =====================================================================
-- 7. NOTIFICATIONS
--    Types: COMPLAINT_ASSIGNED, STATUS_CHANGED, SLA_WARNING,
--           SLA_BREACH, ESCALATION, RESOLUTION
-- =====================================================================
CREATE TABLE notifications (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    title        VARCHAR(200) NOT NULL,
    message      TEXT NOT NULL,
    type         VARCHAR(30) NOT NULL,
    is_read      BOOLEAN NOT NULL DEFAULT FALSE,
    complaint_id UUID REFERENCES complaints (id) ON DELETE CASCADE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_notifications_type
        CHECK (type IN ('COMPLAINT_ASSIGNED', 'STATUS_CHANGED',
                        'SLA_WARNING', 'SLA_BREACH', 'ESCALATION',
                        'RESOLUTION'))
);


-- =====================================================================
-- 8. ESCALATIONS
-- =====================================================================
CREATE TABLE escalations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id    UUID NOT NULL REFERENCES complaints (id) ON DELETE CASCADE,
    escalated_by    UUID REFERENCES users (id) ON DELETE SET NULL,
    escalated_to    UUID REFERENCES users (id) ON DELETE SET NULL,
    reason          TEXT,
    previous_status VARCHAR(20),
    status          VARCHAR(20) NOT NULL DEFAULT 'ESCALATED',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    resolved_at     TIMESTAMPTZ,

    CONSTRAINT chk_escalations_previous_status
        CHECK (previous_status IS NULL OR previous_status IN
               ('PENDING', 'IN_PROGRESS', 'ESCALATED', 'RESOLVED', 'CLOSED')),
    CONSTRAINT chk_escalations_status
        CHECK (status IN ('PENDING', 'IN_PROGRESS', 'ESCALATED',
                          'RESOLVED', 'CLOSED'))
);


-- =====================================================================
-- INDEXES  (frequently queried fields)
-- =====================================================================
CREATE INDEX idx_complaints_number          ON complaints (complaint_number);
CREATE INDEX idx_complaints_status          ON complaints (status);
CREATE INDEX idx_complaints_priority        ON complaints (priority);
CREATE INDEX idx_complaints_category        ON complaints (category);
CREATE INDEX idx_complaints_institution     ON complaints (institution_id);
CREATE INDEX idx_complaints_officer         ON complaints (assigned_officer_id);
CREATE INDEX idx_complaints_created_at      ON complaints (created_at DESC);
CREATE INDEX idx_complaints_sla_due_at      ON complaints (sla_due_at);

CREATE INDEX idx_history_complaint_id       ON complaint_history (complaint_id);

CREATE INDEX idx_notifications_user_id      ON notifications (user_id);
CREATE INDEX idx_notifications_is_read      ON notifications (is_read);

CREATE INDEX idx_escalations_complaint_id   ON escalations (complaint_id);


-- =====================================================================
-- UPDATED_AT HANDLING
-- Simple trigger: bump updated_at to now() on every UPDATE.
-- =====================================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_institutions_updated_at
    BEFORE UPDATE ON institutions
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_bureaus_updated_at
    BEFORE UPDATE ON bureaus
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_complaints_updated_at
    BEFORE UPDATE ON complaints
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
