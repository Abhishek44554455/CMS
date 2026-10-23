-- =====================================================================
--  AICTE COMPLAINT MANAGEMENT SYSTEM (CMS)
--  Demo seed data  —  run AFTER schema.sql
-- ---------------------------------------------------------------------
--  * All names, emails and institutions below are FICTIONAL.
--    No real personal information is used.
--  * password_hash values are PLACEHOLDER STRINGS, not real hashes
--    and not credentials. Real hashes are produced by the API layer
--    later (bcrypt/argon2) and must never live in this file.
--  * No Supabase URL, keys or JWT secrets appear here.
--  * Safe to re-run: demo rows are deleted first, then inserted.
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- Cleanup of previous demo runs (only rows owned by this seed)
-- ---------------------------------------------------------------------
DELETE FROM complaint_history
 WHERE complaint_id IN (SELECT id FROM complaints
                         WHERE complaint_number IN
                          ('CMP-10241','CMP-10242','CMP-10243','CMP-10244',
                           'CMP-10245','CMP-10246','CMP-10247','CMP-10248',
                           'CMP-10249','CMP-10250'));

DELETE FROM escalations
 WHERE complaint_id IN (SELECT id FROM complaints
                         WHERE complaint_number IN
                          ('CMP-10241','CMP-10242','CMP-10243','CMP-10244',
                           'CMP-10245','CMP-10246','CMP-10247','CMP-10248',
                           'CMP-10249','CMP-10250'));

DELETE FROM notifications
 WHERE complaint_id IN (SELECT id FROM complaints
                         WHERE complaint_number IN
                          ('CMP-10241','CMP-10242','CMP-10243','CMP-10244',
                           'CMP-10245','CMP-10246','CMP-10247','CMP-10248',
                           'CMP-10249','CMP-10250'));

DELETE FROM complaints
 WHERE complaint_number IN
       ('CMP-10241','CMP-10242','CMP-10243','CMP-10244','CMP-10245',
        'CMP-10246','CMP-10247','CMP-10248','CMP-10249','CMP-10250');

DELETE FROM users
 WHERE email IN ('arjun.mehta@example.com','kavya.iyer@example.com',
                 'rohan.das@example.com','meera.joshi@example.com',
                 'ravi.kulkarni@example.com','sneha.pillai@example.com',
                 'amit.verma@example.com','neha.rane@example.com',
                 'vikram.singh@example.com','ananya.roy@example.com',
                 'demo.citizen1@example.com','demo.citizen2@example.com',
                 'demo.admin@example.com');

DELETE FROM institutions
 WHERE institution_code IN
       ('AICTE-DL-1042','AICTE-MH-2231','AICTE-KA-3187',
        'AICTE-TN-1455','AICTE-TS-2098');

DELETE FROM bureaus
 WHERE name IN ('Regulation Bureau','Approval Division','Finance Bureau');

-- ---------------------------------------------------------------------
-- 5 INSTITUTIONS
-- ---------------------------------------------------------------------
INSERT INTO institutions (id, name, institution_code, state, district, type, status)
VALUES
    ('a1000000-0000-4000-8000-000000000001', 'Delhi Institute of Technology',
     'AICTE-DL-1042', 'Delhi', 'New Delhi', 'Engineering College', 'ACTIVE'),
    ('a1000000-0000-4000-8000-000000000002', 'Mumbai College of Engineering',
     'AICTE-MH-2231', 'Maharashtra', 'Mumbai', 'Engineering College', 'ACTIVE'),
    ('a1000000-0000-4000-8000-000000000003', 'Bangalore Polytechnic Institute',
     'AICTE-KA-3187', 'Karnataka', 'Bengaluru', 'Polytechnic', 'ACTIVE'),
    ('a1000000-0000-4000-8000-000000000004', 'Chennai School of Management',
     'AICTE-TN-1455', 'Tamil Nadu', 'Chennai', 'Management Institute', 'ACTIVE'),
    ('a1000000-0000-4000-8000-000000000005', 'Hyderabad Institute of Pharmacy',
     'AICTE-TS-2098', 'Telangana', 'Hyderabad', 'Pharmacy College', 'ACTIVE')
ON CONFLICT (institution_code) DO NOTHING;

-- ---------------------------------------------------------------------
-- 3 BUREAUS
-- ---------------------------------------------------------------------
INSERT INTO bureaus (id, name, description)
VALUES
    ('b2000000-0000-4000-8000-000000000001', 'Regulation Bureau',
     'Handles compliance, recognition and regulation-related complaints.'),
    ('b2000000-0000-4000-8000-000000000002', 'Approval Division',
     'Handles affiliation, approval and sanction-related complaints.'),
    ('b2000000-0000-4000-8000-000000000003', 'Finance Bureau',
     'Handles fee, refund and finance-related complaints.')
ON CONFLICT (name) DO NOTHING;

-- ---------------------------------------------------------------------
-- USERS
--   3 demo citizens (complainants), 5 officers, 1 admin
--   password_hash = obviously fake placeholder text, NOT a credential
-- ---------------------------------------------------------------------
INSERT INTO users (id, name, email, password_hash, role, institution_id, bureau_id)
VALUES
    -- citizens
    ('c3000000-0000-4000-8000-000000000001', 'Aarav Sharma',
     'demo.citizen1@example.com', 'PLACEHOLDER_NOT_A_REAL_HASH', 'CITIZEN',
     'a1000000-0000-4000-8000-000000000001', NULL),
    ('c3000000-0000-4000-8000-000000000002', 'Diya Verma',
     'demo.citizen2@example.com', 'PLACEHOLDER_NOT_A_REAL_HASH', 'CITIZEN',
     'a1000000-0000-4000-8000-000000000002', NULL),
    -- admin
    ('c3000000-0000-4000-8000-000000000003', 'Admin User',
     'demo.admin@example.com', 'PLACEHOLDER_NOT_A_REAL_HASH', 'ADMIN',
     NULL, NULL),
    -- 5 officers
    ('c3000000-0000-4000-8000-000000000011', 'Ravi Kulkarni',
     'ravi.kulkarni@example.com', 'PLACEHOLDER_NOT_A_REAL_HASH', 'OFFICER',
     'a1000000-0000-4000-8000-000000000001', 'b2000000-0000-4000-8000-000000000001'),
    ('c3000000-0000-4000-8000-000000000012', 'Sneha Pillai',
     'sneha.pillai@example.com', 'PLACEHOLDER_NOT_A_REAL_HASH', 'OFFICER',
     'a1000000-0000-4000-8000-000000000002', 'b2000000-0000-4000-8000-000000000002'),
    ('c3000000-0000-4000-8000-000000000013', 'Amit Verma',
     'amit.verma@example.com', 'PLACEHOLDER_NOT_A_REAL_HASH', 'OFFICER',
     'a1000000-0000-4000-8000-000000000003', 'b2000000-0000-4000-8000-000000000001'),
    ('c3000000-0000-4000-8000-000000000014', 'Neha Rane',
     'neha.rane@example.com', 'PLACEHOLDER_NOT_A_REAL_HASH', 'OFFICER',
     'a1000000-0000-4000-8000-000000000004', 'b2000000-0000-4000-8000-000000000003'),
    ('c3000000-0000-4000-8000-000000000015', 'Vikram Singh',
     'vikram.singh@example.com', 'PLACEHOLDER_NOT_A_REAL_HASH', 'OFFICER',
     'a1000000-0000-4000-8000-000000000005', 'b2000000-0000-4000-8000-000000000003')
ON CONFLICT (email) DO NOTHING;

-- ---------------------------------------------------------------------
-- 10 COMPLAINTS
--   Mixed statuses, priorities, categories and SLA states:
--   * SLA running, * SLA due soon, * SLA breached (past due, unresolved),
--   * resolved within SLA, * closed.
-- ---------------------------------------------------------------------
INSERT INTO complaints (id, complaint_number, user_id, institution_id,
                        title, description, category, priority, status,
                        assigned_bureau_id, assigned_officer_id,
                        sla_days, sla_due_at, created_at, updated_at, resolved_at)
VALUES
    ('d4000000-0000-4000-8000-000000000001', 'CMP-10241',
     'c3000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000001',
     'Examination fee charged twice',
     'The examination fee for the current semester was debited twice from the student account.',
     'FEE', 'HIGH', 'IN_PROGRESS',
     'b2000000-0000-4000-8000-000000000003', 'c3000000-0000-4000-8000-000000000011',
     5, now() + interval '3 days',
     now() - interval '2 days', now() - interval '1 day', NULL),

    ('d4000000-0000-4000-8000-000000000002', 'CMP-10242',
     'c3000000-0000-4000-8000-000000000002', 'a1000000-0000-4000-8000-000000000002',
     'Lab equipment not functional',
     'Three of the physics lab workstations have been non-functional for over two weeks.',
     'INFRASTRUCTURE', 'MEDIUM', 'PENDING',
     NULL, NULL,
     10, now() + interval '8 days',
     now() - interval '2 days', now() - interval '2 days', NULL),

    ('d4000000-0000-4000-8000-000000000003', 'CMP-10243',
     'c3000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000001',
     'Affiliation approval delayed',
     'The renewal of affiliation approval has not been issued despite repeated submissions.',
     'APPROVAL', 'HIGH', 'ESCALATED',
     'b2000000-0000-4000-8000-000000000002', 'c3000000-0000-4000-8000-000000000012',
     5, now() - interval '2 days',
     now() - interval '12 days', now() - interval '1 day', NULL),

    ('d4000000-0000-4000-8000-000000000004', 'CMP-10244',
     'c3000000-0000-4000-8000-000000000002', 'a1000000-0000-4000-8000-000000000003',
     'Scholarship disbursement pending',
     'State scholarship amount for the previous academic year has not been credited.',
     'FEE', 'MEDIUM', 'IN_PROGRESS',
     'b2000000-0000-4000-8000-000000000003', 'c3000000-0000-4000-8000-000000000013',
     10, now() + interval '1 day',
     now() - interval '9 days', now() - interval '1 day', NULL),

    ('d4000000-0000-4000-8000-000000000005', 'CMP-10245',
     'c3000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000004',
     'Irregularities in fee refund process',
     'Refund requests submitted last month remain unprocessed beyond the stated timeline.',
     'LEGAL', 'CRITICAL', 'ESCALATED',
     'b2000000-0000-4000-8000-000000000001', 'c3000000-0000-4000-8000-000000000014',
     3, now() - interval '6 days',
     now() - interval '15 days', now() - interval '2 days', NULL),

    ('d4000000-0000-4000-8000-000000000006', 'CMP-10246',
     'c3000000-0000-4000-8000-000000000002', 'a1000000-0000-4000-8000-000000000005',
     'Hostel water supply interrupted',
     'Hostel blocks C and D have had intermittent water supply for the past week.',
     'INFRASTRUCTURE', 'LOW', 'PENDING',
     NULL, NULL,
     15, now() + interval '12 days',
     now() - interval '3 days', now() - interval '3 days', NULL),

    ('d4000000-0000-4000-8000-000000000007', 'CMP-10247',
     'c3000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000002',
     'Class schedule changed without notice',
     'The time-table for the current semester was revised without prior intimation to students.',
     'ACADEMIC', 'MEDIUM', 'RESOLVED',
     'b2000000-0000-4000-8000-000000000002', 'c3000000-0000-4000-8000-000000000012',
     10, now() - interval '1 day',
     now() - interval '8 days', now() - interval '1 day', now() - interval '1 day'),

    ('d4000000-0000-4000-8000-000000000008', 'CMP-10248',
     'c3000000-0000-4000-8000-000000000002', 'a1000000-0000-4000-8000-000000000003',
     'Convocation certificate error',
     'Name and branch printed on the degree certificate are incorrect.',
     'ADMINISTRATION', 'HIGH', 'RESOLVED',
     'b2000000-0000-4000-8000-000000000001', 'c3000000-0000-4000-8000-000000000013',
     5, now() - interval '4 days',
     now() - interval '10 days', now() - interval '4 days', now() - interval '4 days'),

    ('d4000000-0000-4000-8000-000000000009', 'CMP-10249',
     'c3000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000005',
     'Ambiguous admission guideline',
     'The published eligibility guideline conflicts with the prospectus wording.',
     'OTHER', 'LOW', 'CLOSED',
     'b2000000-0000-4000-8000-000000000002', 'c3000000-0000-4000-8000-000000000015',
     15, now() - interval '6 days',
     now() - interval '20 days', now() - interval '6 days', now() - interval '7 days'),

    ('d4000000-0000-4000-8000-000000000010', 'CMP-10250',
     'c3000000-0000-4000-8000-000000000002', 'a1000000-0000-4000-8000-000000000001',
     'Library access card not issued',
     'Identity cards for library access have not been issued to new students.',
     'ADMINISTRATION', 'MEDIUM', 'IN_PROGRESS',
     'b2000000-0000-4000-8000-000000000001', 'c3000000-0000-4000-8000-000000000011',
     10, now() + interval '5 days',
     now() - interval '5 days', now() - interval '2 days', NULL)
ON CONFLICT (complaint_number) DO NOTHING;

-- ---------------------------------------------------------------------
-- COMPLAINT HISTORY (timeline entries)
-- ---------------------------------------------------------------------
INSERT INTO complaint_history
    (id, complaint_id, action, performed_by, old_status, new_status, comment, created_at)
VALUES
    -- CMP-10241
    ('e5000000-0000-4000-8000-000000000001', 'd4000000-0000-4000-8000-000000000001',
     'SUBMITTED', 'c3000000-0000-4000-8000-000000000001', NULL, 'PENDING',
     'Complaint filed by the complainant.', now() - interval '2 days'),
    ('e5000000-0000-4000-8000-000000000002', 'd4000000-0000-4000-8000-000000000001',
     'ASSIGNED', 'c3000000-0000-4000-8000-000000000003', 'PENDING', 'IN_PROGRESS',
     'Forwarded to the Finance Bureau.', now() - interval '1 day'),
    -- CMP-10243
    ('e5000000-0000-4000-8000-000000000003', 'd4000000-0000-4000-8000-000000000003',
     'SUBMITTED', 'c3000000-0000-4000-8000-000000000001', NULL, 'PENDING',
     'Renewal approval delay reported.', now() - interval '12 days'),
    ('e5000000-0000-4000-8000-000000000004', 'd4000000-0000-4000-8000-000000000003',
     'REVIEWED', 'c3000000-0000-4000-8000-000000000012', 'PENDING', 'IN_PROGRESS',
     'Documents verified with the Approval Division.', now() - interval '9 days'),
    ('e5000000-0000-4000-8000-000000000005', 'd4000000-0000-4000-8000-000000000003',
     'ESCALATED', 'c3000000-0000-4000-8000-000000000003', 'IN_PROGRESS', 'ESCALATED',
     'No response from the institution within SLA; escalated.', now() - interval '1 day'),
    -- CMP-10245
    ('e5000000-0000-4000-8000-000000000006', 'd4000000-0000-4000-8000-000000000005',
     'SUBMITTED', 'c3000000-0000-4000-8000-000000000001', NULL, 'PENDING',
     'Refund irregularities reported with supporting details.', now() - interval '15 days'),
    ('e5000000-0000-4000-8000-000000000007', 'd4000000-0000-4000-8000-000000000005',
     'STATUS_CHANGED', 'c3000000-0000-4000-8000-000000000014', 'PENDING', 'IN_PROGRESS',
     'Case taken up by the Regulation Bureau.', now() - interval '11 days'),
    ('e5000000-0000-4000-8000-000000000008', 'd4000000-0000-4000-8000-000000000005',
     'COMMENT_ADDED', 'c3000000-0000-4000-8000-000000000001', 'IN_PROGRESS', 'IN_PROGRESS',
     'Complainant followed up for the third time.', now() - interval '4 days'),
    ('e5000000-0000-4000-8000-000000000009', 'd4000000-0000-4000-8000-000000000005',
     'ESCALATED', 'c3000000-0000-4000-8000-000000000003', 'IN_PROGRESS', 'ESCALATED',
     'SLA breached; escalated to the bureau head.', now() - interval '2 days'),
    -- CMP-10247
    ('e5000000-0000-4000-8000-000000000010', 'd4000000-0000-4000-8000-000000000007',
     'SUBMITTED', 'c3000000-0000-4000-8000-000000000001', NULL, 'PENDING',
     'Time-table revision reported.', now() - interval '8 days'),
    ('e5000000-0000-4000-8000-000000000011', 'd4000000-0000-4000-8000-000000000007',
     'RESOLVED', 'c3000000-0000-4000-8000-000000000012', 'IN_PROGRESS', 'RESOLVED',
     'Revised time-table published with prior notice to students.', now() - interval '1 day'),
    -- CMP-10249
    ('e5000000-0000-4000-8000-000000000012', 'd4000000-0000-4000-8000-000000000009',
     'SUBMITTED', 'c3000000-0000-4000-8000-000000000001', NULL, 'PENDING',
     'Guideline inconsistency reported.', now() - interval '20 days'),
    ('e5000000-0000-4000-8000-000000000013', 'd4000000-0000-4000-8000-000000000009',
     'CLOSED', 'c3000000-0000-4000-8000-000000000015', 'RESOLVED', 'CLOSED',
     'Prospectus wording corrected; complaint closed.', now() - interval '6 days')
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------
-- ESCALATIONS (for the two escalated complaints)
-- ---------------------------------------------------------------------
INSERT INTO escalations
    (id, complaint_id, escalated_by, escalated_to, reason,
     previous_status, status, created_at, resolved_at)
VALUES
    ('f6000000-0000-4000-8000-000000000001', 'd4000000-0000-4000-8000-000000000003',
     'c3000000-0000-4000-8000-000000000003', NULL,
     'Institution did not respond within SLA.', 'IN_PROGRESS', 'ESCALATED',
     now() - interval '1 day', NULL),
    ('f6000000-0000-4000-8000-000000000002', 'd4000000-0000-4000-8000-000000000005',
     'c3000000-0000-4000-8000-000000000003', NULL,
     'Repeated complainant follow-ups and SLA breach.', 'IN_PROGRESS', 'ESCALATED',
     now() - interval '2 days', NULL)
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------
-- NOTIFICATIONS (demo)
-- ---------------------------------------------------------------------
INSERT INTO notifications
    (id, user_id, title, message, type, is_read, complaint_id, created_at)
VALUES
    ('f7000000-0000-4000-8000-000000000001', 'c3000000-0000-4000-8000-000000000011',
     'Complaint assigned', 'CMP-10241 has been assigned to you.', 'COMPLAINT_ASSIGNED',
     FALSE, 'd4000000-0000-4000-8000-000000000001', now() - interval '1 day'),
    ('f7000000-0000-4000-8000-000000000002', 'c3000000-0000-4000-8000-000000000014',
     'SLA breach', 'CMP-10245 has exceeded its SLA deadline.', 'SLA_BREACH',
     FALSE, 'd4000000-0000-4000-8000-000000000005', now() - interval '6 hours'),
    ('f7000000-0000-4000-8000-000000000003', 'c3000000-0000-4000-8000-000000000001',
     'Complaint resolved', 'CMP-10247 was resolved within SLA.', 'RESOLUTION',
     TRUE, 'd4000000-0000-4000-8000-000000000007', now() - interval '1 day'),
    ('f7000000-0000-4000-8000-000000000004', 'c3000000-0000-4000-8000-000000000012',
     'Escalation', 'CMP-10243 was escalated to the bureau head.', 'ESCALATION',
     FALSE, 'd4000000-0000-4000-8000-000000000003', now() - interval '1 day')
ON CONFLICT (id) DO NOTHING;

COMMIT;
