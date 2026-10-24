/**
 * Temporary E2E probe for the final testing phase. Runs against
 * http://localhost:5000 with a freshly registered test admin.
 * Deleted after the test run — not part of the application.
 */
import { readFileSync } from 'node:fs';

const B = 'http://localhost:5000';

// Service key for direct DB cross-checks only (never printed).
const envText = readFileSync(new URL('./.env', import.meta.url), 'utf8');
const pick = (k) => (envText.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1] || '';
const SUPA_URL = pick('SUPABASE_URL').trim();
const SUPA_KEY = pick('SUPABASE_SERVICE_ROLE_KEY').trim();
const SERVICE_HEADERS = { apikey: SUPA_KEY, Authorization: 'Bearer ' + SUPA_KEY };

let pass = 0;
let fail = 0;
const ok = (label, cond, extra = '') => {
  if (cond) {
    pass++;
    console.log(`  PASS  ${label}${extra ? ' — ' + extra : ''}`);
  } else {
    fail++;
    console.log(`  FAIL  ${label}${extra ? ' — ' + extra : ''}`);
  }
};

async function call(path, { method = 'GET', token, body, headers = {} } = {}) {
  const h = { 'Content-Type': 'application/json', ...headers };
  if (token) h.Authorization = 'Bearer ' + token;
  let res;
  try {
    res = await fetch(B + path, {
      method,
      headers: h,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (e) {
    return { status: 0, json: null, err: e.message };
  }
  let json = null;
  try {
    json = await res.json();
  } catch {
    json = null;
  }
  return { status: res.status, json };
}

async function dbCount(path) {
  const res = await fetch(SUPA_URL + path, { headers: SERVICE_HEADERS });
  if (!res.ok) return { err: res.status };
  const rows = await res.json();
  return { rows };
}

/* 1. AUTH ------------------------------------------------------------- */
console.log('\n== AUTH ==');
const login = await call('/api/auth/login', {
  method: 'POST',
  body: { email: 'e2e.cms.admin.test@gmail.com', password: 'E2eTestAdmin123!' },
});
ok('admin login', login.status === 200 && Boolean(login.json?.data?.access_token));
const T = login.json?.data?.access_token;

const badLogin = await call('/api/auth/login', {
  method: 'POST',
  body: { email: 'e2e.cms.admin.test@gmail.com', password: 'wrong-password' },
});
ok('wrong password rejected', badLogin.status === 400 || badLogin.status === 401);

const noAuth = await call('/api/complaints');
ok('list without token -> 401', noAuth.status === 401);

/* 2. RBAC (citizen) ---------------------------------------------------- */
console.log('\n== RBAC ==');
const citizenEmail = 'e2e.citizen.test@gmail.com';
let citizenReg = await call('/api/auth/register', {
  method: 'POST',
  body: { name: 'E2E Citizen', email: citizenEmail, password: 'E2eCitizen123!', role: 'CITIZEN' },
});
if (citizenReg.status === 400 && /already/i.test(citizenReg.json?.message || '')) {
  citizenReg = await call('/api/auth/login', {
    method: 'POST',
    body: { email: citizenEmail, password: 'E2eCitizen123!' },
  });
}
const C = citizenReg.json?.data?.access_token;
ok('citizen session', Boolean(C));
const citizenList = await call('/api/complaints', { token: C });
ok('citizen blocked from admin list -> 403', citizenList.status === 403, `got ${citizenList.status}`);
const citizenCreateBody = {
  title: 'Citizen probe complaint here',
  description: 'Citizen probe description long enough to pass validation.',
  category: 'OTHER',
  priority: 'LOW',
  institution_id: null,
};

/* 3. INSTITUTIONS + BUG 1: submission with real institution UUIDs ------ */
console.log('\n== BUG 1: COMPLAINT SUBMISSION ==');
const instRes = await call('/api/institutions?limit=100', { token: T });
const institutions = instRes.json?.data?.institutions || [];
ok('institutions load', instRes.status === 200 && institutions.length >= 2, `${institutions.length} rows`);
const instIds = institutions.map((i) => i.id);
ok('institution ids are UUIDs', instIds.length >= 2 && instIds.every((x) => /^[0-9a-f-]{36}$/i.test(x)), instIds[0]);

const createBody = (iid, title) => ({
  title,
  description: 'E2E test complaint description that is long enough for validation.',
  category: 'FEE',
  priority: 'HIGH',
  institution_id: iid,
});

const a = await call('/api/complaints', { method: 'POST', token: T, body: createBody(instIds[0], 'E2E Alpha submission test') });
const b = await call('/api/complaints', { method: 'POST', token: T, body: createBody(instIds[1], 'E2E Beta submission test') });
const ca = a.json?.data?.complaint;
const cb = b.json?.data?.complaint;
ok('create with institution 1', a.status === 201 && Boolean(ca?.complaint_number), `${a.status} ${ca?.complaint_number || a.json?.message}`);
ok('create with institution 2', b.status === 201 && Boolean(cb?.complaint_number), `${b.status} ${cb?.complaint_number || b.json?.message}`);
ok('institution FK matches', ca?.institution_id === instIds[0]);

const invalidInst = await call('/api/complaints', {
  method: 'POST',
  token: T,
  body: createBody('Bangalore Polytechnic Institute', 'Bad institution probe'),
});
ok('name instead of UUID rejected 400', invalidInst.status === 400, invalidInst.json?.message);
const emptyInst = await call('/api/complaints', {
  method: 'POST',
  token: T,
  body: createBody('', 'Empty institution probe'),
});
ok('empty institution rejected 400', emptyInst.status === 400, emptyInst.json?.message);

// double-submit protection (two distinct submits, just verify no dup number)
ok('distinct complaint numbers', ca?.complaint_number !== cb?.complaint_number, `${ca?.complaint_number} / ${cb?.complaint_number}`);

/* 4. BUG 3: detail view by CMP number and UUID ------------------------- */
console.log('\n== BUG 3: COMPLAINT DETAILS ==');
const byNum = await call(`/api/complaints/${ca.complaint_number}`, { token: T });
ok('GET by CMP number', byNum.status === 200 && byNum.json?.data?.complaint?.complaint_number === ca.complaint_number, `got ${byNum.status}`);
const byUuid = await call(`/api/complaints/${ca.id}`, { token: T });
ok('GET by UUID', byUuid.status === 200 && byUuid.json?.data?.complaint?.id === ca.id, `got ${byUuid.status}`);
const detail = byNum.json?.data?.complaint || {};
ok('detail has institution relation', Boolean(detail.institutions?.name), detail.institutions?.name);
ok('detail has complainant', Boolean(detail.complainant?.name));
ok('detail has category/status/priority/SLA', Boolean(detail.category) && Boolean(detail.status) && Boolean(detail.priority) && Boolean(detail.sla_due_at), `${detail.category}/${detail.status}/${detail.priority}`);
const garbage = await call('/api/complaints/GARBAGE-ID', { token: T });
ok('garbage id -> 400 clean', garbage.status === 400 && !/stack|syntax|22P02/i.test(garbage.json?.message || ''), garbage.json?.message);
const unknown = await call('/api/complaints/CMP-99999', { token: T });
ok('unknown CMP -> 404', unknown.status === 404, `got ${unknown.status}`);

const hist0 = await call(`/api/complaints/${ca.complaint_number}/history`, { token: T });
ok('history by CMP number', hist0.status === 200 && (hist0.json?.data?.history || []).length >= 1, `${hist0.status}, ${(hist0.json?.data?.history || []).length} rows`);

/* 5. BUG 3 continued: mutations by CMP number --------------------------- */
console.log('\n== MANAGEMENT: ASSIGN / STATUS / ESCALATE ==');
const officersRes = await call('/api/officers?limit=100', { token: T });
const officers = officersRes.json?.data?.officers || [];
ok('officers list', officersRes.status === 200 && officers.length >= 1, `${officers.length} officers`);
const officer = officers.find((o) => o.roleKey === 'OFFICER' || o.role === 'Officer' || o.role === 'OFFICER') || officers[0];

const status1 = await call(`/api/complaints/${ca.complaint_number}/status`, {
  method: 'PUT',
  token: T,
  body: { status: 'IN_PROGRESS', comment: 'E2E started work' },
});
ok('status PENDING -> IN_PROGRESS', status1.status === 200 && status1.json?.data?.complaint?.status === 'IN_PROGRESS', `${status1.status} ${status1.json?.message}`);

const assign = await call(`/api/complaints/${ca.complaint_number}/assign`, {
  method: 'PUT',
  token: T,
  body: { assigned_officer_id: officer.id },
});
ok('assign by CMP number', assign.status === 200, `${assign.status} ${assign.json?.message}`);
ok('assigned officer stored', assign.json?.data?.complaint?.assigned_officer_id === officer.id);

const esc = await call(`/api/complaints/${ca.complaint_number}/escalate`, {
  method: 'POST',
  token: T,
  body: { reason: 'E2E escalation for verification' },
});
ok('escalate by CMP number', esc.status === 200 && esc.json?.data?.complaint?.status === 'ESCALATED', `${esc.status} ${esc.json?.message}`);

const res1 = await call(`/api/complaints/${ca.complaint_number}/status`, {
  method: 'PUT',
  token: T,
  body: { status: 'RESOLVED', comment: 'E2E resolution' },
});
ok('status -> RESOLVED', res1.status === 200 && res1.json?.data?.complaint?.status === 'RESOLVED');
ok('resolved_at populated', Boolean(res1.json?.data?.complaint?.resolved_at));

const sameStatus = await call(`/api/complaints/${ca.complaint_number}/status`, {
  method: 'PUT',
  token: T,
  body: { status: 'RESOLVED' },
});
ok('same-status rejected', sameStatus.status === 400, sameStatus.json?.message);

const closed = await call(`/api/complaints/${ca.complaint_number}/status`, {
  method: 'PUT',
  token: T,
  body: { status: 'CLOSED' },
});
ok('status -> CLOSED', closed.status === 200);

/* 6. HISTORY consistency ------------------------------------------------ */
console.log('\n== HISTORY ==');
const hist = await call(`/api/complaints/${ca.complaint_number}/history`, { token: T });
const rows = hist.json?.data?.history || [];
const actions = rows.map((r) => r.action);
ok('history rows accumulate', hist.status === 200 && rows.length >= 4, `${rows.length} rows: ${actions.join(',')}`);
ok('history has SUBMITTED', actions.includes('SUBMITTED'));
ok('history has ASSIGNED', actions.includes('ASSIGNED'));
ok('history has RESOLVED', actions.includes('RESOLVED'));
ok('history has ESCALATED', actions.includes('ESCALATED'));
ok('history entries have performer', rows.every((r) => r.performed_by === null || typeof r.performed_by === 'object' || Boolean(r.performer)), JSON.stringify(rows[0]?.performer));

/* 7. DB cross-checks (direct Supabase, service key) --------------------- */
console.log('\n== DB CROSS-CHECK ==');
const escRows = await dbCount(`/rest/v1/escalations?complaint_id=eq.${ca.id}&select=id,reason,escalated_by,status`);
ok('escalation row in DB', Array.isArray(escRows.rows) && escRows.rows.length === 1, escRows.rows?.[0]?.status);
const histDb = await dbCount(`/rest/v1/complaint_history?complaint_id=eq.${ca.id}&select=action`);
ok('history rows in DB match count', Array.isArray(histDb.rows) && histDb.rows.length === rows.length, `${histDb.rows?.length} db vs ${rows.length} api`);
const notifOfficer = await dbCount(`/rest/v1/notifications?user_id=eq.${officer.id}&type=eq.COMPLAINT_ASSIGNED&select=id`);
ok('assignment notification created', Array.isArray(notifOfficer.rows) && notifOfficer.rows.length >= 1, `${notifOfficer.rows?.length ?? notifOfficer.err}`);
const complaintDb = await dbCount(`/rest/v1/complaints?id=eq.${ca.id}&select=status,resolved_at,institution_id,complaint_number`);
const dbRow = complaintDb.rows?.[0];
ok('DB status CLOSED + resolved_at set', dbRow?.status === 'CLOSED' && Boolean(dbRow?.resolved_at), `${dbRow?.status}`);
ok('DB institution FK valid', dbRow?.institution_id === instIds[0]);

/* 8. LIST + filters ----------------------------------------------------- */
console.log('\n== LIST / FILTERS ==');
const listRes = await call('/api/complaints?limit=100', { token: T });
const all = listRes.json?.data?.complaints || [];
ok('list loads', listRes.status === 200 && all.length >= 12, `${all.length} complaints`);
ok('new complaints present', all.some((c) => c.complaint_number === ca.complaint_number) && all.some((c) => c.complaint_number === cb.complaint_number));
const searchRes = await call('/api/complaints?search=E2E%20Alpha', { token: T });
ok('search filter', searchRes.status === 200 && (searchRes.json?.data?.complaints || []).length >= 1, `${searchRes.json?.data?.complaints?.length} hits`);
const statusFilter = await call('/api/complaints?status=CLOSED', { token: T });
ok('status filter', statusFilter.status === 200 && (statusFilter.json?.data?.complaints || []).every((c) => c.status === 'CLOSED'));
const badFilter = await call('/api/complaints?status=NOT_A_STATUS', { token: T });
ok('invalid status filter -> 400', badFilter.status === 400);

/* 9. DASHBOARD / NOTIFICATIONS ----------------------------------------- */
console.log('\n== DASHBOARD / NOTIFICATIONS ==');
const dash = await call('/api/dashboard/stats', { token: T });
const stats = dash.json?.data?.overview || dash.json?.data || {};
ok('dashboard stats load', dash.status === 200, JSON.stringify(stats).slice(0, 120));
const dbTotal = await dbCount('/rest/v1/complaints?select=id');
const statsTotal = stats.total ?? stats.totalComplaints;
ok('dashboard total matches DB', Array.isArray(dbTotal.rows) && statsTotal === dbTotal.rows.length, `${statsTotal} vs ${dbTotal.rows?.length}`);

const notif = await call('/api/notifications', { token: T });
ok('notifications load', notif.status === 200 && Array.isArray(notif.json?.data?.notifications), `${notif.json?.data?.notifications?.length ?? '?'} items`);
const myNotif = (notif.json?.data?.notifications || [])[0];
if (myNotif) {
  const mark = await call(`/api/notifications/${myNotif.id}/read`, { method: 'PUT', token: T });
  ok('mark one read', mark.status === 200 && mark.json?.data?.notification?.is_read !== false, `${mark.status}`);
  const markAll = await call('/api/notifications/read-all', { method: 'PUT', token: T });
  ok('mark all read', markAll.status === 200, `${markAll.status}`);
}

/* 10. PUBLIC TRACKING (anonymous) -------------------------------------- */
console.log('\n== PUBLIC TRACKING (anonymous) ==');
const anonTrack = await call(`/api/complaints/track/${ca.complaint_number}`);
ok('anonymous track by CMP number', anonTrack.status === 200 && anonTrack.json?.data?.complaint?.complaint_number === ca.complaint_number, `got ${anonTrack.status}`);
const anonComplaint = anonTrack.json?.data?.complaint || {};
const anonHistory = anonTrack.json?.data?.history || [];
ok('track returns timeline', Array.isArray(anonHistory) && anonHistory.length >= 1, `${anonHistory.length} entries`);
ok('track has institution + status + SLA', Boolean(anonComplaint.institutions?.name) && Boolean(anonComplaint.status) && Boolean(anonComplaint.sla_due_at), `${anonComplaint.status}`);
ok('track leaks no complainant PII', !('complainant' in anonComplaint) && !('user_id' in anonComplaint) && JSON.stringify(anonComplaint).indexOf('@') === -1, 'no email/user_id');
const anonGarbage = await call('/api/complaints/track/BOGUS');
ok('anonymous track garbage -> 400', anonGarbage.status === 400, `got ${anonGarbage.status}`);
const anonUnknown = await call('/api/complaints/track/CMP-99999');
ok('anonymous track unknown -> 404', anonUnknown.status === 404, `got ${anonUnknown.status}`);
const anonAuthedDetail = await call(`/api/complaints/${ca.complaint_number}`);
ok('authenticated detail still 401 without token', anonAuthedDetail.status === 401, `got ${anonAuthedDetail.status}`);

/* 11. CITIZEN ownership ------------------------------------------------- */
console.log('\n== CITIZEN OWNERSHIP ==');
citizenCreateBody.institution_id = instIds[0];
const cCreate = await call('/api/complaints', { method: 'POST', token: C, body: citizenCreateBody });
ok('citizen can create own complaint', cCreate.status === 201, `${cCreate.status} ${cCreate.json?.message}`);
const ownNum = cCreate.json?.data?.complaint?.complaint_number;
if (ownNum) {
  const own = await call(`/api/complaints/${ownNum}`, { token: C });
  ok('citizen reads own complaint', own.status === 200, `${own.status}`);
  const foreign = await call(`/api/complaints/${ca.complaint_number}`, { token: C });
  ok("citizen blocked from admin's complaint -> 403", foreign.status === 403, `got ${foreign.status}`);
}

/* 12. INSTITUTIONS CRUD + FK safety -------------------------------------- */
console.log('\n== INSTITUTIONS ==');
const newInst = await call('/api/institutions', {
  method: 'POST',
  token: T,
  body: {
    name: 'E2E Test Institute ' + Date.now(),
    institution_code: 'AICTE-TT-' + Math.floor(1000 + Math.random() * 8999),
    state: 'Testland',
    district: 'Test District',
    type: 'Engineering',
    status: 'ACTIVE',
  },
});
ok('institution create', newInst.status === 201, `${newInst.status} ${newInst.json?.message}`);
const createdInst = newInst.json?.data?.institution;
if (createdInst) {
  const upd = await call(`/api/institutions/${createdInst.id}`, {
    method: 'PUT',
    token: T,
    body: { state: 'Testland Updated' },
  });
  ok('institution update', upd.status === 200 && upd.json?.data?.institution?.state === 'Testland Updated', `${upd.status}`);
  const del = await call(`/api/institutions/${createdInst.id}`, { method: 'DELETE', token: T });
  ok('institution delete (no complaints attached)', del.status === 200, `${del.status} ${del.json?.message}`);
}
const delUsed = await call(`/api/institutions/${instIds[0]}`, { method: 'DELETE', token: T });
ok('delete institution WITH complaints refused', delUsed.status >= 400, `${delUsed.status} ${delUsed.json?.message}`);

/* Summary --------------------------------------------------------------- */
console.log(`\n=== RESULT: ${pass} passed, ${fail} failed ===`);
process.exit(fail > 0 ? 1 : 0);
