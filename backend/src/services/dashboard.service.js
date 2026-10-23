import { db } from '../config/supabase.js';
import { handleSupabaseError } from '../middleware/error.middleware.js';

/**
 * All dashboard/aggregation logic lives here — controllers stay thin.
 * Aggregations are computed in Node from indexed column selects
 * (no RPC/SQL functions were added to the schema).
 */

const OPEN_STATUSES = ['PENDING', 'IN_PROGRESS', 'ESCALATED'];

async function fetchComplaintRows(columns = 'id, status, priority, category, created_at, sla_due_at, resolved_at') {
  const client = db();
  const { data, error } = await client
    .from('complaints')
    .select(columns);
  if (error) throw handleSupabaseError(error);
  return data || [];
}

/** GET /api/dashboard/stats */
export async function getStats() {
  const rows = await fetchComplaintRows();
  const now = Date.now();

  const byStatus = {};
  const byPriority = {};
  let pending = 0;
  let inProgress = 0;
  let resolved = 0;
  let closed = 0;
  let escalated = 0;
  let critical = 0;
  let slaBreached = 0;

  for (const row of rows) {
    byStatus[row.status] = (byStatus[row.status] || 0) + 1;
    byPriority[row.priority] = (byPriority[row.priority] || 0) + 1;
    if (row.status === 'PENDING') pending++;
    if (row.status === 'IN_PROGRESS') inProgress++;
    if (row.status === 'RESOLVED') resolved++;
    if (row.status === 'CLOSED') closed++;
    if (row.status === 'ESCALATED') escalated++;
    if (row.priority === 'CRITICAL') critical++;
    if (
      OPEN_STATUSES.includes(row.status) &&
      row.sla_due_at &&
      new Date(row.sla_due_at).getTime() < now
    ) {
      slaBreached++;
    }
  }

  return {
    total: rows.length,
    pending,
    inProgress,
    resolved,
    closed,
    escalated,
    critical,
    slaBreached,
    byStatus: Object.entries(byStatus).map(([status, count]) => ({ status, count })),
    byPriority: Object.entries(byPriority).map(([priority, count]) => ({ priority, count })),
  };
}

/** GET /api/dashboard/complaints — recent + daily trend + SLA breaches. */
export async function getComplaintTrends({ days = 14, recentLimit = 10 } = {}) {
  const client = db();
  const windowStart = Date.now() - days * 24 * 60 * 60 * 1000;

  const startIso = new Date(windowStart).toISOString();

  const [recentRes, createdRes, resolvedRes, breachedRes, criticalRes] = await Promise.all([
    client
      .from('complaints')
      .select(
        'id, complaint_number, title, status, priority, category, created_at, ' +
          'institutions:institution_id (name), complainant:user_id (name)'
      )
      .order('created_at', { ascending: false })
      .limit(recentLimit),
    client.from('complaints').select('created_at').gte('created_at', startIso),
    client.from('complaints').select('resolved_at').gte('resolved_at', startIso),
    client
      .from('complaints')
      .select(
        'id, complaint_number, title, status, priority, category, sla_due_at, created_at, ' +
          'institutions:institution_id (name), complainant:user_id (name)'
      )
      .in('status', OPEN_STATUSES)
      .not('sla_due_at', 'is', null)
      .lt('sla_due_at', new Date().toISOString())
      .order('sla_due_at', { ascending: true })
      .limit(20),
    client
      .from('complaints')
      .select(
        'id, complaint_number, title, status, priority, category, sla_due_at, created_at, ' +
          'institutions:institution_id (name), complainant:user_id (name)'
      )
      .eq('priority', 'CRITICAL')
      .in('status', OPEN_STATUSES)
      .order('created_at', { ascending: false })
      .limit(20),
  ]);

  if (recentRes.error) throw handleSupabaseError(recentRes.error);
  if (createdRes.error) throw handleSupabaseError(createdRes.error);
  if (resolvedRes.error) throw handleSupabaseError(resolvedRes.error);
  if (breachedRes.error) throw handleSupabaseError(breachedRes.error);
  if (criticalRes.error) throw handleSupabaseError(criticalRes.error);

  // Bucket submissions (created_at) and resolutions (resolved_at) per day (UTC),
  // including empty days so the trend chart keeps a continuous axis.
  const submitted = {};
  const resolved = {};
  for (let i = 0; i < days; i++) {
    const d = new Date(windowStart + i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    submitted[key] = 0;
    resolved[key] = 0;
  }
  for (const row of createdRes.data || []) {
    if (!row.created_at) continue;
    const key = new Date(row.created_at).toISOString().slice(0, 10);
    if (key in submitted) submitted[key] += 1;
  }
  for (const row of resolvedRes.data || []) {
    if (!row.resolved_at) continue;
    const key = new Date(row.resolved_at).toISOString().slice(0, 10);
    if (key in resolved) resolved[key] += 1;
  }
  const trends = Object.keys(submitted).map((date) => ({
    date,
    submitted: submitted[date],
    resolved: resolved[date],
  }));

  return {
    recent: recentRes.data || [],
    trends,
    slaBreached: breachedRes.data || [],
    critical: criticalRes.data || [],
  };
}

/** GET /api/dashboard/categories — complaint counts grouped by category. */
export async function getCategories() {
  const rows = await fetchComplaintRows('category, status, priority');

  const map = {};
  for (const row of rows) {
    const entry = (map[row.category] ||= {
      category: row.category,
      total: 0,
      pending: 0,
      inProgress: 0,
      resolved: 0,
      escalated: 0,
      critical: 0,
    });
    entry.total++;
    if (row.status === 'PENDING') entry.pending++;
    if (row.status === 'IN_PROGRESS') entry.inProgress++;
    if (row.status === 'RESOLVED' || row.status === 'CLOSED') entry.resolved++;
    if (row.status === 'ESCALATED') entry.escalated++;
    if (row.priority === 'CRITICAL') entry.critical++;
  }

  return Object.values(map).sort((a, b) => b.total - a.total);
}

/** GET /api/dashboard/bureaus — bureaus with complaint + officer counts. */
export async function getBureaus() {
  const client = db();

  const [bureauRes, complaintRes, officerRes] = await Promise.all([
    client.from('bureaus').select('*').order('name'),
    client.from('complaints').select('assigned_bureau_id, status'),
    client.from('users').select('bureau_id').in('role', ['OFFICER', 'BUREAU_HEAD']),
  ]);
  if (bureauRes.error) throw handleSupabaseError(bureauRes.error);
  if (complaintRes.error) throw handleSupabaseError(complaintRes.error);
  if (officerRes.error) throw handleSupabaseError(officerRes.error);

  return (bureauRes.data || []).map((bureau) => {
    const assigned = (complaintRes.data || []).filter(
      (c) => c.assigned_bureau_id === bureau.id
    );
    return {
      ...bureau,
      totalComplaints: assigned.length,
      pending: assigned.filter((c) => c.status === 'PENDING').length,
      resolved: assigned.filter((c) => c.status === 'RESOLVED' || c.status === 'CLOSED')
        .length,
      escalated: assigned.filter((c) => c.status === 'ESCALATED').length,
      officers: (officerRes.data || []).filter((o) => o.bureau_id === bureau.id).length,
    };
  });
}
