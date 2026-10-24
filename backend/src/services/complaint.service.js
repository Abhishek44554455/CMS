import { db } from '../config/supabase.js';
import {
  badRequest,
  notFoundError,
  handleSupabaseError,
  assertValidUuid,
} from '../middleware/error.middleware.js';

/* ------------------------------------------------------------------ */
/* Domain constants (must match database CHECK constraints)            */
/* ------------------------------------------------------------------ */
export const CATEGORIES = [
  'FEE',
  'ACADEMIC',
  'APPROVAL',
  'INFRASTRUCTURE',
  'LEGAL',
  'ADMINISTRATION',
  'OTHER',
];
export const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
export const STATUSES = ['PENDING', 'IN_PROGRESS', 'ESCALATED', 'RESOLVED', 'CLOSED'];
export const HISTORY_ACTIONS = [
  'SUBMITTED',
  'REVIEWED',
  'ASSIGNED',
  'STATUS_CHANGED',
  'ESCALATED',
  'COMMENT_ADDED',
  'RESOLVED',
  'CLOSED',
];

/** SLA window per priority, in days (same as the frontend uses). */
const SLA_DAYS_BY_PRIORITY = { CRITICAL: 3, HIGH: 5, MEDIUM: 10, LOW: 15 };

const COMPLAINT_SELECT = `
  *,
  institutions:institution_id (name, institution_code, state, district, type),
  complainant:user_id (name, email),
  bureau:assigned_bureau_id (name),
  assigned_officer:assigned_officer_id (name, email, bureaus:bureau_id (name))
`;

/** Accepts a UUID or a complaint number (CMP-10245). */
export function isComplaintNumber(value) {
  return typeof value === 'string' && /^CMP-\d{5}$/i.test(value.trim());
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function assertValidUuidOrNumber(value, label = 'complaint id') {
  const v = String(value || '').trim();
  if (UUID_RE.test(v) || isComplaintNumber(v)) return;
  throw badRequest(`Invalid ${label}`);
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */
function assertComplaintPayload(payload) {
  const { title, description, category, priority, institution_id } = payload || {};
  if (!title || !String(title).trim()) throw badRequest('title is required');
  if (!description || !String(description).trim()) {
    throw badRequest('description is required');
  }
  if (!category) throw badRequest('category is required');
  if (!priority) throw badRequest('priority is required');
  if (!institution_id) throw badRequest('institution_id is required');

  if (!CATEGORIES.includes(category)) {
    throw badRequest(`category must be one of: ${CATEGORIES.join(', ')}`);
  }
  if (!PRIORITIES.includes(priority)) {
    throw badRequest(`priority must be one of: ${PRIORITIES.join(', ')}`);
  }
  assertValidUuid(institution_id, 'institution_id');
}

/** Citizens may only see/modify their own complaints. */
export function assertOwnership(user, complaint) {
  if (user.role === 'CITIZEN' && complaint.user_id !== user.id) {
    const err = new Error('You do not have access to this complaint');
    err.statusCode = 403;
    throw err;
  }
}

async function addHistory(client, {
  complaint_id,
  action,
  performed_by = null,
  old_status = null,
  new_status = null,
  comment = null,
}) {
  const { error } = await client.from('complaint_history').insert([
    { complaint_id, action, performed_by, old_status, new_status, comment },
  ]);
  if (error) throw handleSupabaseError(error);
}

async function addNotification(client, {
  user_id,
  title,
  message,
  type,
  complaint_id = null,
}) {
  if (!user_id) return;
  const { error } = await client
    .from('notifications')
    .insert([{ user_id, title, message, type, complaint_id }]);
  if (error) throw handleSupabaseError(error);
}

async function generateComplaintNumber(client) {
  const { data, error } = await client
    .from('complaints')
    .select('complaint_number')
    .like('complaint_number', 'CMP-%')
    .order('complaint_number', { ascending: false })
    .limit(1);
  if (error) throw handleSupabaseError(error);

  const last = data?.[0]?.complaint_number;
  const lastNum = last ? parseInt(String(last).split('-')[1], 10) : 10240;
  const next = Number.isFinite(lastNum) ? lastNum + 1 : 10241;
  return `CMP-${String(next).padStart(5, '0')}`;
}

/**
 * Resolves a :id route parameter that may be either the UUID id or the
 * human-readable complaint number (CMP-10245) used across the UI.
 * Returns the matching row, or null when nothing matches.
 */
async function findComplaint(client, id, select = '*') {
  assertValidUuidOrNumber(id, 'complaint id');
  let query = client.from('complaints').select(select);
  query = isComplaintNumber(id)
    ? query.eq('complaint_number', id.trim().toUpperCase())
    : query.eq('id', id);
  const { data, error } = await query.maybeSingle();
  if (error) throw handleSupabaseError(error);
  return data;
}

async function getExisting(id) {
  const client = db();
  const complaint = await findComplaint(client, id);
  if (!complaint) throw notFoundError('Complaint not found');
  return { client, complaint };
}

/* ------------------------------------------------------------------ */
/* Service functions                                                   */
/* ------------------------------------------------------------------ */

/** POST — creates the complaint plus its SUBMITTED history entry. */
export async function createComplaint(payload, user) {
  assertComplaintPayload(payload);
  const client = db();

  const slaDays = SLA_DAYS_BY_PRIORITY[payload.priority];
  const complaintNumber = await generateComplaintNumber(client);

  const record = {
    complaint_number: complaintNumber,
    user_id: user.id,
    institution_id: payload.institution_id,
    title: String(payload.title).trim(),
    description: String(payload.description).trim(),
    category: payload.category,
    priority: payload.priority,
    status: 'PENDING',
    assigned_bureau_id: payload.assigned_bureau_id || null,
    assigned_officer_id: payload.assigned_officer_id || null,
    sla_days: slaDays,
    sla_due_at: new Date(Date.now() + slaDays * 24 * 60 * 60 * 1000).toISOString(),
  };

  const { data, error } = await client
    .from('complaints')
    .insert([record])
    .select(COMPLAINT_SELECT)
    .single();
  if (error) throw handleSupabaseError(error);

  await addHistory(client, {
    complaint_id: data.id,
    action: 'SUBMITTED',
    performed_by: user.id,
    new_status: 'PENDING',
    comment: 'Complaint submitted.',
  });

  return data;
}

/** GET — list with filters + pagination. */
export async function getComplaints(query = {}) {
  const client = db();

  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
  const offset = (page - 1) * limit;

  let builder = client
    .from('complaints')
    .select(COMPLAINT_SELECT, { count: 'exact' });

  if (query.status) {
    if (!STATUSES.includes(query.status)) throw badRequest('Invalid status filter');
    builder = builder.eq('status', query.status);
  }
  if (query.priority) {
    if (!PRIORITIES.includes(query.priority)) throw badRequest('Invalid priority filter');
    builder = builder.eq('priority', query.priority);
  }
  if (query.category) {
    if (!CATEGORIES.includes(query.category)) throw badRequest('Invalid category filter');
    builder = builder.eq('category', query.category);
  }
  if (query.institution_id) {
    assertValidUuid(query.institution_id, 'institution_id');
    builder = builder.eq('institution_id', query.institution_id);
  }
  if (query.assigned_officer_id) {
    assertValidUuid(query.assigned_officer_id, 'assigned_officer_id');
    builder = builder.eq('assigned_officer_id', query.assigned_officer_id);
  }
  if (query.assigned_bureau_id) {
    assertValidUuid(query.assigned_bureau_id, 'assigned_bureau_id');
    builder = builder.eq('assigned_bureau_id', query.assigned_bureau_id);
  }
  if (query.search) {
    const term = String(query.search).replace(/[,%_]/g, ' ').trim();
    if (term) {
      builder = builder.or(
        `title.ilike.%${term}%,complaint_number.ilike.%${term}%`
      );
    }
  }

  const { data, error, count } = await builder
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) throw handleSupabaseError(error);

  return {
    complaints: data || [],
    pagination: {
      page,
      limit,
      total: count ?? (data?.length || 0),
      totalPages: Math.max(1, Math.ceil((count ?? 0) / limit)),
    },
  };
}

/** GET :id — accepts a UUID or a complaint number. */
export async function getComplaintById(id, user) {
  const client = db();
  const complaint = await findComplaint(client, id, COMPLAINT_SELECT);
  if (!complaint) throw notFoundError('Complaint not found');
  if (user) assertOwnership(user, complaint);
  return complaint;
}

/** PUT :id — editable fields only. */
export async function updateComplaint(id, payload, user) {
  const { client, complaint } = await getExisting(id);
  if (user) assertOwnership(user, complaint);

  const allowed = {};
  if (payload.title !== undefined) {
    if (!String(payload.title).trim()) throw badRequest('title cannot be empty');
    allowed.title = String(payload.title).trim();
  }
  if (payload.description !== undefined) {
    if (!String(payload.description).trim()) throw badRequest('description cannot be empty');
    allowed.description = String(payload.description).trim();
  }
  if (payload.category !== undefined) {
    if (!CATEGORIES.includes(payload.category)) throw badRequest('Invalid category');
    allowed.category = payload.category;
  }
  if (payload.priority !== undefined) {
    if (!PRIORITIES.includes(payload.priority)) throw badRequest('Invalid priority');
    allowed.priority = payload.priority;
    // keep SLA in sync with the new priority
    const slaDays = SLA_DAYS_BY_PRIORITY[payload.priority];
    allowed.sla_days = slaDays;
    allowed.sla_due_at = new Date(
      new Date(complaint.created_at).getTime() + slaDays * 24 * 60 * 60 * 1000
    ).toISOString();
  }
  if (payload.institution_id !== undefined) {
    assertValidUuid(payload.institution_id, 'institution_id');
    allowed.institution_id = payload.institution_id;
  }

  if (Object.keys(allowed).length === 0) {
    throw badRequest('No valid fields to update');
  }

  const { data, error } = await client
    .from('complaints')
    .update(allowed)
    .eq('id', complaint.id)
    .select(COMPLAINT_SELECT)
    .single();
  if (error) throw handleSupabaseError(error);
  return data;
}

/** DELETE :id (admin) — history/notifications cascade in the database. */
export async function deleteComplaint(id) {
  const { client, complaint } = await getExisting(id);
  const { error } = await client.from('complaints').delete().eq('id', complaint.id);
  if (error) throw handleSupabaseError(error);
  return true;
}

/** PUT :id/assign — assigns bureau and/or officer, records ASSIGNED. */
export async function assignComplaint(id, payload, actor) {
  const { client, complaint } = await getExisting(id);

  const { assigned_officer_id, assigned_bureau_id, comment } = payload || {};
  if (!assigned_officer_id && !assigned_bureau_id) {
    throw badRequest('Provide assigned_officer_id and/or assigned_bureau_id');
  }

  const updates = {};
  if (assigned_officer_id) {
    assertValidUuid(assigned_officer_id, 'assigned_officer_id');
    const { data: officer, error } = await client
      .from('users')
      .select('id, role')
      .eq('id', assigned_officer_id)
      .maybeSingle();
    if (error) throw handleSupabaseError(error);
    if (!officer || !['OFFICER', 'BUREAU_HEAD'].includes(officer.role)) {
      throw badRequest('assigned_officer_id must reference an OFFICER or BUREAU_HEAD');
    }
    updates.assigned_officer_id = assigned_officer_id;
  }
  if (assigned_bureau_id) {
    assertValidUuid(assigned_bureau_id, 'assigned_bureau_id');
    const { data: bureau, error } = await client
      .from('bureaus')
      .select('id')
      .eq('id', assigned_bureau_id)
      .maybeSingle();
    if (error) throw handleSupabaseError(error);
    if (!bureau) throw badRequest('assigned_bureau_id does not exist');
    updates.assigned_bureau_id = assigned_bureau_id;
  }

  // a newly assigned pending complaint starts being worked on
  const newStatus = complaint.status === 'PENDING' ? 'IN_PROGRESS' : complaint.status;
  updates.status = newStatus;

  const { data, error } = await client
    .from('complaints')
    .update(updates)
    .eq('id', complaint.id)
    .select(COMPLAINT_SELECT)
    .single();
  if (error) throw handleSupabaseError(error);

  await addHistory(client, {
    complaint_id: complaint.id,
    action: 'ASSIGNED',
    performed_by: actor.id,
    old_status: complaint.status,
    new_status: newStatus,
    comment:
      comment ||
      `Assigned to ${updates.assigned_officer_id ? 'officer' : 'bureau'} by ${actor.name}.`,
  });

  if (updates.assigned_officer_id) {
    await addNotification(client, {
      user_id: updates.assigned_officer_id,
      title: 'Complaint assigned',
      message: `${complaint.complaint_number} has been assigned to you.`,
      type: 'COMPLAINT_ASSIGNED',
      complaint_id: complaint.id,
    });
  }

  return data;
}

/** PUT :id/status — status transitions + history + notifications. */
export async function updateComplaintStatus(id, payload, actor) {
  const { status, comment } = payload || {};
  if (!status) throw badRequest('status is required');
  if (!STATUSES.includes(status)) {
    throw badRequest(`status must be one of: ${STATUSES.join(', ')}`);
  }

  const { client, complaint } = await getExisting(id);
  if (complaint.status === status) {
    throw badRequest(`Complaint is already ${status}`);
  }

  const updates = { status };
  if (status === 'RESOLVED' || status === 'CLOSED') {
    updates.resolved_at = new Date().toISOString();
  } else {
    updates.resolved_at = null;
  }

  const { data, error } = await client
    .from('complaints')
    .update(updates)
    .eq('id', complaint.id)
    .select(COMPLAINT_SELECT)
    .single();
  if (error) throw handleSupabaseError(error);

  const action =
    status === 'RESOLVED' ? 'RESOLVED' : status === 'CLOSED' ? 'CLOSED' : 'STATUS_CHANGED';

  await addHistory(client, {
    complaint_id: complaint.id,
    action,
    performed_by: actor.id,
    old_status: complaint.status,
    new_status: status,
    comment: comment || `Status changed from ${complaint.status} to ${status}.`,
  });

  await addNotification(client, {
    user_id: complaint.user_id,
    title: status === 'RESOLVED' ? 'Complaint resolved' : 'Status changed',
    message: `${complaint.complaint_number} is now ${status}.`,
    type: status === 'RESOLVED' ? 'RESOLUTION' : 'STATUS_CHANGED',
    complaint_id: complaint.id,
  });

  return data;
}

/** POST :id/escalate — escalation record + history + notification. */
export async function escalateComplaint(id, payload, actor) {
  const { client, complaint } = await getExisting(id);
  if (complaint.status === 'ESCALATED') {
    throw badRequest('Complaint is already escalated');
  }

  const { reason, escalated_to } = payload || {};
  if (!reason || !String(reason).trim()) throw badRequest('reason is required');
  if (escalated_to) assertValidUuid(escalated_to, 'escalated_to');

  const { data: escalation, error: escError } = await client
    .from('escalations')
    .insert([
      {
        complaint_id: complaint.id,
        escalated_by: actor.id,
        escalated_to: escalated_to || null,
        reason: String(reason).trim(),
        previous_status: complaint.status,
        status: 'ESCALATED',
      },
    ])
    .select('id')
    .single();
  if (escError) throw handleSupabaseError(escError);

  const { data, error } = await client
    .from('complaints')
    .update({ status: 'ESCALATED' })
    .eq('id', complaint.id)
    .select(COMPLAINT_SELECT)
    .single();
  if (error) throw handleSupabaseError(error);

  await addHistory(client, {
    complaint_id: complaint.id,
    action: 'ESCALATED',
    performed_by: actor.id,
    old_status: complaint.status,
    new_status: 'ESCALATED',
    comment: String(reason).trim(),
  });

  await addNotification(client, {
    user_id: complaint.assigned_officer_id || complaint.user_id,
    title: 'Escalation',
    message: `${complaint.complaint_number} was escalated: ${String(reason).trim()}`,
    type: 'ESCALATION',
    complaint_id: complaint.id,
  });

  return { ...data, escalation_id: escalation.id };
}

/** GET :id/history — timeline entries, oldest first. */
export async function getComplaintHistory(id, user) {
  const client = db();
  const complaint = await findComplaint(client, id, 'id, user_id, status');
  if (!complaint) throw notFoundError('Complaint not found');
  if (user) assertOwnership(user, complaint);

  const { data, error } = await client
    .from('complaint_history')
    .select('*, performer:performed_by (name, role)')
    .eq('complaint_id', complaint.id)
    .order('created_at', { ascending: true });
  if (error) throw handleSupabaseError(error);

  return data || [];
}

/**
 * GET /api/complaints/track/:trackingId — PUBLIC citizen tracking lookup.
 * Deliberately excludes user_id, complainant PII and officer emails: anyone
 * holding a complaint number can see progress, but no personal data leaks.
 * Returns the mapped-ready complaint row plus its timeline in one response.
 */
export async function trackComplaint(trackingId) {
  const client = db();
  const complaint = await findComplaint(
    client,
    trackingId,
    `id, complaint_number, institution_id, assigned_officer_id, title, description,
     category, priority, status, sla_days, sla_due_at,
     created_at, updated_at, resolved_at,
     institutions:institution_id (name, institution_code, state, district, type),
     assigned_officer:assigned_officer_id (name)`
  );
  if (!complaint) throw notFoundError('Complaint not found');

  const { data: history, error } = await client
    .from('complaint_history')
    .select('action, old_status, new_status, comment, created_at, performer:performed_by (name)')
    .eq('complaint_id', complaint.id)
    .order('created_at', { ascending: true });
  if (error) throw handleSupabaseError(error);

  return { complaint, history: history || [] };
}
