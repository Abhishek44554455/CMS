import { db } from '../config/supabase.js';
import {
  badRequest,
  notFoundError,
  handleSupabaseError,
  assertValidUuid,
} from '../middleware/error.middleware.js';

const OFFICER_SELECT = `
  id, name, email, role, institution_id, bureau_id, created_at, updated_at,
  institutions:institution_id (id, name, institution_code),
  bureaus:bureau_id (id, name)
`;

/**
 * Per-officer complaint statistics (assigned / pending / resolved / SLA breaches).
 * Computed once from the complaints table and joined onto each officer row.
 */
async function getOfficerStats() {
  const { data, error } = await db()
    .from('complaints')
    .select('assigned_officer_id, status, sla_due_at');
  if (error) throw handleSupabaseError(error);

  const now = Date.now();
  const stats = {};
  for (const row of data || []) {
    const key = row.assigned_officer_id;
    if (!key) continue;
    const entry = (stats[key] ||= { assigned: 0, pending: 0, resolved: 0, slaBreaches: 0 });
    entry.assigned++;
    if (row.status === 'PENDING' || row.status === 'IN_PROGRESS') entry.pending++;
    if (row.status === 'RESOLVED' || row.status === 'CLOSED') entry.resolved++;
    if (
      ['PENDING', 'IN_PROGRESS', 'ESCALATED'].includes(row.status) &&
      row.sla_due_at &&
      new Date(row.sla_due_at).getTime() < now
    ) {
      entry.slaBreaches++;
    }
  }
  return stats;
}

/**
 * GET /api/officers
 * Lists officer accounts (OFFICER / BUREAU_HEAD).
 * Officer management operations can be added later.
 */
export async function getOfficers(req, res) {
  const client = db();
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));
  const offset = (page - 1) * limit;

  let builder = client
    .from('users')
    .select(OFFICER_SELECT, { count: 'exact' })
    .in('role', ['OFFICER', 'BUREAU_HEAD']);

  if (req.query.institution_id) {
    builder = builder.eq('institution_id', req.query.institution_id);
  }
  if (req.query.bureau_id) builder = builder.eq('bureau_id', req.query.bureau_id);
  if (req.query.role) {
    if (!['OFFICER', 'BUREAU_HEAD'].includes(req.query.role)) {
      throw badRequest('role must be OFFICER or BUREAU_HEAD');
    }
    builder = builder.eq('role', req.query.role);
  }

  const { data, error, count } = await builder
    .order('name', { ascending: true })
    .range(offset, offset + limit - 1);
  if (error) throw handleSupabaseError(error);

  const stats = await getOfficerStats();
  const officers = (data || []).map((row) => ({ ...row, ...(stats[row.id] || {}) }));

  res.status(200).json({
    success: true,
    message: 'Officers fetched successfully',
    data: {
      officers,
      pagination: {
        page,
        limit,
        total: count ?? (data?.length || 0),
        totalPages: Math.max(1, Math.ceil((count ?? 0) / limit)),
      },
    },
  });
}

/** GET /api/officers/:id */
export async function getOfficerById(req, res) {
  assertValidUuid(req.params.id, 'officer id');

  const { data, error } = await db()
    .from('users')
    .select(OFFICER_SELECT)
    .eq('id', req.params.id)
    .in('role', ['OFFICER', 'BUREAU_HEAD'])
    .maybeSingle();
  if (error) throw handleSupabaseError(error);
  if (!data) throw notFoundError('Officer not found');

  const stats = await getOfficerStats();

  res.status(200).json({
    success: true,
    message: 'Officer fetched successfully',
    data: { officer: { ...data, ...(stats[data.id] || {}) } },
  });
}
