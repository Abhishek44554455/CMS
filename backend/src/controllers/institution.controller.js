import { db } from '../config/supabase.js';
import {
  badRequest,
  notFoundError,
  handleSupabaseError,
  assertValidUuid,
} from '../middleware/error.middleware.js';

const ALLOWED_STATUSES = ['ACTIVE', 'INACTIVE'];

function assertInstitutionPayload(payload, { partial = false } = {}) {
  const { name, institution_code, state, district, type, status } = payload || {};
  const errors = [];

  if (!partial || name !== undefined) {
    if (!name || !String(name).trim()) errors.push('name is required');
  }
  if (!partial || institution_code !== undefined) {
    if (!institution_code || !String(institution_code).trim()) {
      errors.push('institution_code is required');
    }
  }
  if (!partial || state !== undefined) {
    if (!state || !String(state).trim()) errors.push('state is required');
  }
  if (!partial || district !== undefined) {
    if (!district || !String(district).trim()) errors.push('district is required');
  }
  if (!partial || type !== undefined) {
    if (!type || !String(type).trim()) errors.push('type is required');
  }
  if (status !== undefined && !ALLOWED_STATUSES.includes(status)) {
    errors.push(`status must be one of: ${ALLOWED_STATUSES.join(', ')}`);
  }
  if (errors.length) throw badRequest(errors.join('; '));
}

/**
 * Complaint counts per institution (total / pending / resolved), computed in
 * one pass so the table can show real numbers.
 */
async function getInstitutionCounts() {
  const { data, error } = await db().from('complaints').select('institution_id, status');
  if (error) throw handleSupabaseError(error);

  const counts = {};
  for (const row of data || []) {
    const entry = (counts[row.institution_id] ||= {
      totalComplaints: 0,
      pending: 0,
      resolved: 0,
    });
    entry.totalComplaints++;
    if (['PENDING', 'IN_PROGRESS', 'ESCALATED'].includes(row.status)) entry.pending++;
    if (['RESOLVED', 'CLOSED'].includes(row.status)) entry.resolved++;
  }
  return counts;
}

/** GET /api/institutions */
export async function getInstitutions(req, res) {
  const client = db();
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));
  const offset = (page - 1) * limit;

  let builder = client.from('institutions').select('*', { count: 'exact' });

  if (req.query.state) builder = builder.eq('state', req.query.state);
  if (req.query.status) {
    if (!ALLOWED_STATUSES.includes(req.query.status)) {
      throw badRequest(`status must be one of: ${ALLOWED_STATUSES.join(', ')}`);
    }
    builder = builder.eq('status', req.query.status);
  }
  if (req.query.type) builder = builder.eq('type', req.query.type);
  if (req.query.search) {
    const term = String(req.query.search).replace(/[,%_]/g, ' ').trim();
    if (term) builder = builder.or(`name.ilike.%${term}%,institution_code.ilike.%${term}%`);
  }

  const { data, error, count } = await builder
    .order('name', { ascending: true })
    .range(offset, offset + limit - 1);
  if (error) throw handleSupabaseError(error);

  const counts = await getInstitutionCounts();
  const institutions = (data || []).map((row) => ({
    ...row,
    ...(counts[row.id] || { totalComplaints: 0, pending: 0, resolved: 0 }),
  }));

  res.status(200).json({
    success: true,
    message: 'Institutions fetched successfully',
    data: {
      institutions,
      pagination: {
        page,
        limit,
        total: count ?? (data?.length || 0),
        totalPages: Math.max(1, Math.ceil((count ?? 0) / limit)),
      },
    },
  });
}

/** GET /api/institutions/:id */
export async function getInstitutionById(req, res) {
  assertValidUuid(req.params.id, 'institution id');
  const { data, error } = await db()
    .from('institutions')
    .select('*')
    .eq('id', req.params.id)
    .maybeSingle();
  if (error) throw handleSupabaseError(error);
  if (!data) throw notFoundError('Institution not found');

  const counts = await getInstitutionCounts();

  res.status(200).json({
    success: true,
    message: 'Institution fetched successfully',
    data: { institution: { ...data, ...(counts[data.id] || { totalComplaints: 0, pending: 0, resolved: 0 }) } },
  });
}

/** POST /api/institutions (ADMIN) */
export async function createInstitution(req, res) {
  const payload = req.body || {};
  assertInstitutionPayload(payload);

  const { data, error } = await db()
    .from('institutions')
    .insert([
      {
        name: String(payload.name).trim(),
        institution_code: String(payload.institution_code).trim().toUpperCase(),
        state: String(payload.state).trim(),
        district: String(payload.district).trim(),
        type: String(payload.type).trim(),
        status: payload.status || 'ACTIVE',
      },
    ])
    .select('*')
    .single();
  if (error) throw handleSupabaseError(error);

  res.status(201).json({
    success: true,
    message: 'Institution created successfully',
    data: { institution: data },
  });
}

/** PUT /api/institutions/:id (ADMIN) */
export async function updateInstitution(req, res) {
  assertValidUuid(req.params.id, 'institution id');
  const payload = req.body || {};
  assertInstitutionPayload(payload, { partial: true });

  const { data: existing, error: findError } = await db()
    .from('institutions')
    .select('id')
    .eq('id', req.params.id)
    .maybeSingle();
  if (findError) throw handleSupabaseError(findError);
  if (!existing) throw notFoundError('Institution not found');

  const updates = {};
  if (payload.name !== undefined) updates.name = String(payload.name).trim();
  if (payload.institution_code !== undefined) {
    updates.institution_code = String(payload.institution_code).trim().toUpperCase();
  }
  if (payload.state !== undefined) updates.state = String(payload.state).trim();
  if (payload.district !== undefined) updates.district = String(payload.district).trim();
  if (payload.type !== undefined) updates.type = String(payload.type).trim();
  if (payload.status !== undefined) updates.status = payload.status;

  if (Object.keys(updates).length === 0) throw badRequest('No valid fields to update');

  const { data, error } = await db()
    .from('institutions')
    .update(updates)
    .eq('id', req.params.id)
    .select('*')
    .single();
  if (error) throw handleSupabaseError(error);

  res.status(200).json({
    success: true,
    message: 'Institution updated successfully',
    data: { institution: data },
  });
}

/** DELETE /api/institutions/:id (ADMIN) */
export async function deleteInstitution(req, res) {
  assertValidUuid(req.params.id, 'institution id');

  const { data: existing, error: findError } = await db()
    .from('institutions')
    .select('id')
    .eq('id', req.params.id)
    .maybeSingle();
  if (findError) throw handleSupabaseError(findError);
  if (!existing) throw notFoundError('Institution not found');

  const { error } = await db().from('institutions').delete().eq('id', req.params.id);
  if (error) {
    if (error.code === '23503') {
      throw badRequest('Cannot delete an institution that still has complaints or users');
    }
    throw handleSupabaseError(error);
  }

  res.status(200).json({
    success: true,
    message: 'Institution deleted successfully',
    data: {},
  });
}
