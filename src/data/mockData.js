/**
 * Central mock dataset for the AICTE Complaint Management System.
 *
 * Every page/component reads from here while the backend is being built.
 * Target flow later:
 *   React -> src/services/api.js -> Node/Express -> Supabase (PostgreSQL)
 *
 * All dates are ISO strings (YYYY-MM-DD). Complaint records are generated
 * deterministically from fixed lists below, so the dataset is stable across
 * reloads and no complaint object is duplicated between components.
 */

/* ------------------------------------------------------------------ */
/* Date helpers                                                        */
/* ------------------------------------------------------------------ */

const DAY_MS = 24 * 60 * 60 * 1000;

const _now = new Date();
const _today = new Date(_now.getFullYear(), _now.getMonth(), _now.getDate());

function toIsoDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function dateDaysAgo(days) {
  return toIsoDate(new Date(_today.getTime() - days * DAY_MS));
}

function addDaysIso(iso, days) {
  const [y, m, d] = iso.split('-').map(Number);
  return toIsoDate(new Date(y, m - 1, d + days));
}

function daysBetween(fromIso, toIso) {
  const [fy, fm, fd] = fromIso.split('-').map(Number);
  const [ty, tm, td] = toIso.split('-').map(Number);
  const from = new Date(fy, fm - 1, fd);
  const to = new Date(ty, tm - 1, td);
  return Math.round((to - from) / DAY_MS);
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatDate(iso) {
  if (!iso) return '—';
  const str = String(iso);
  // Date-only values (YYYY-MM-DD): use the calendar parts directly so the
  // day never shifts with the viewer's timezone.
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const [y, m, d] = str.split('-').map(Number);
    return `${String(d).padStart(2, '0')} ${MONTH_NAMES[m - 1]} ${y}`;
  }
  // Full timestamps (2026-10-23T09:01:45+00:00): parse and format in UTC
  // so the stored calendar day renders consistently for every viewer.
  const parsed = new Date(str);
  if (Number.isNaN(parsed.getTime())) return '—';
  return `${String(parsed.getUTCDate()).padStart(2, '0')} ${MONTH_NAMES[parsed.getUTCMonth()]} ${parsed.getUTCFullYear()}`;
}

/* ------------------------------------------------------------------ */
/* Reference lists                                                     */
/* ------------------------------------------------------------------ */

export const CATEGORIES = [
  'Academics',
  'Infrastructure',
  'Fees & Finance',
  'Examination',
  'Hostel',
  'Harassment',
  'Transport',
  'IT Services',
  'Library',
  'Placements',
  'Administration',
  'Other',
];

export const PRIORITIES = ['Critical', 'High', 'Medium', 'Low'];

export const STATUSES = ['Pending', 'In Progress', 'Resolved', 'Escalated'];

const SLA_DAYS_BY_PRIORITY = { Critical: 3, High: 5, Medium: 10, Low: 15 };

export const INSTITUTIONS = [
  { id: 'inst-01', name: 'Delhi Institute of Technology', shortName: 'Delhi Tech', code: 'AICTE-DL-1042', state: 'Delhi', district: 'New Delhi', type: 'Engineering College', status: 'Active', totalComplaints: 1420, pending: 212, resolved: 1088 },
  { id: 'inst-02', name: 'Mumbai College of Engineering', shortName: 'Mumbai Engg', code: 'AICTE-MH-2231', state: 'Maharashtra', district: 'Mumbai', type: 'Engineering College', status: 'Active', totalComplaints: 1286, pending: 174, resolved: 1042 },
  { id: 'inst-03', name: 'Bangalore Polytechnic Institute', shortName: 'Blr Poly', code: 'AICTE-KA-3187', state: 'Karnataka', district: 'Bengaluru', type: 'Polytechnic', status: 'Active', totalComplaints: 1104, pending: 131, resolved: 912 },
  { id: 'inst-04', name: 'Chennai School of Management', shortName: 'Chennai Mgnt', code: 'AICTE-TN-1455', state: 'Tamil Nadu', district: 'Chennai', type: 'Management Institute', status: 'Active', totalComplaints: 842, pending: 96, resolved: 704 },
  { id: 'inst-05', name: 'Hyderabad Institute of Pharmacy', shortName: 'Hyd Pharmacy', code: 'AICTE-TS-2098', state: 'Telangana', district: 'Hyderabad', type: 'Pharmacy College', status: 'Active', totalComplaints: 768, pending: 88, resolved: 640 },
  { id: 'inst-06', name: 'Kolkata Technological College', shortName: 'Kolkata Tech', code: 'AICTE-WB-1776', state: 'West Bengal', district: 'Kolkata', type: 'Engineering College', status: 'Active', totalComplaints: 962, pending: 121, resolved: 790 },
  { id: 'inst-07', name: 'Pune College of Architecture', shortName: 'Pune Arch', code: 'AICTE-MH-2452', state: 'Maharashtra', district: 'Pune', type: 'Architecture College', status: 'Inactive', totalComplaints: 410, pending: 47, resolved: 341 },
  { id: 'inst-08', name: 'Jaipur Engineering Institute', shortName: 'Jaipur Engg', code: 'AICTE-RJ-1320', state: 'Rajasthan', district: 'Jaipur', type: 'Engineering College', status: 'Active', totalComplaints: 888, pending: 105, resolved: 731 },
  { id: 'inst-09', name: 'Lucknow Polytechnic College', shortName: 'Lucknow Poly', code: 'AICTE-UP-2874', state: 'Uttar Pradesh', district: 'Lucknow', type: 'Polytechnic', status: 'Active', totalComplaints: 726, pending: 92, resolved: 598 },
  { id: 'inst-10', name: 'Ahmedabad Institute of Technology', shortName: 'Ahmedabad Tech', code: 'AICTE-GJ-1189', state: 'Gujarat', district: 'Ahmedabad', type: 'Engineering College', status: 'Active', totalComplaints: 814, pending: 98, resolved: 669 },
  { id: 'inst-11', name: 'Bhopal College of Engineering & Technology', shortName: 'Bhopal CET', code: 'AICTE-MP-1663', state: 'Madhya Pradesh', district: 'Bhopal', type: 'Engineering College', status: 'Active', totalComplaints: 692, pending: 84, resolved: 566 },
  { id: 'inst-12', name: 'Kochi Institute of Management', shortName: 'Kochi Mgnt', code: 'AICTE-KL-1247', state: 'Kerala', district: 'Kochi', type: 'Management Institute', status: 'Active', totalComplaints: 533, pending: 61, resolved: 441 },
];

export const OFFICERS = [
  { id: 'off-01', name: 'Rajesh Sharma', email: 'rajesh.sharma@aicte.gov.in', bureau: 'Infrastructure', assigned: 148, pending: 24, resolved: 118, slaBreaches: 6, status: 'Active' },
  { id: 'off-02', name: 'Priya Nair', email: 'priya.nair@aicte.gov.in', bureau: 'Academic Affairs', assigned: 132, pending: 18, resolved: 111, slaBreaches: 3, status: 'Active' },
  { id: 'off-03', name: 'Amit Verma', email: 'amit.verma@aicte.gov.in', bureau: 'Finance & Fees', assigned: 126, pending: 29, resolved: 93, slaBreaches: 9, status: 'Active' },
  { id: 'off-04', name: 'Sunita Reddy', email: 'sunita.reddy@aicte.gov.in', bureau: 'Examination', assigned: 118, pending: 15, resolved: 100, slaBreaches: 2, status: 'Active' },
  { id: 'off-05', name: 'Vikram Singh', email: 'vikram.singh@aicte.gov.in', bureau: 'Harassment Cell', assigned: 96, pending: 12, resolved: 81, slaBreaches: 1, status: 'Active' },
  { id: 'off-06', name: 'Anjali Mehta', email: 'anjali.mehta@aicte.gov.in', bureau: 'IT Services', assigned: 110, pending: 21, resolved: 85, slaBreaches: 5, status: 'Active' },
  { id: 'off-07', name: 'Karthik Iyer', email: 'karthik.iyer@aicte.gov.in', bureau: 'Hostel & Mess', assigned: 87, pending: 19, resolved: 64, slaBreaches: 7, status: 'Active' },
  { id: 'off-08', name: 'Deepa Joshi', email: 'deepa.joshi@aicte.gov.in', bureau: 'Transport', assigned: 74, pending: 9, resolved: 62, slaBreaches: 2, status: 'On Leave' },
  { id: 'off-09', name: 'Sanjay Gupta', email: 'sanjay.gupta@aicte.gov.in', bureau: 'Library', assigned: 68, pending: 8, resolved: 58, slaBreaches: 0, status: 'Active' },
  { id: 'off-10', name: 'Meena Krishnan', email: 'meena.krishnan@aicte.gov.in', bureau: 'Placements', assigned: 81, pending: 14, resolved: 64, slaBreaches: 3, status: 'Active' },
];

/* ------------------------------------------------------------------ */
/* Complaint generation                                                */
/* ------------------------------------------------------------------ */

const TITLES_BY_CATEGORY = {
  Academics: [
    'Outdated syllabus for 2025 CSE batch',
    'Missing lab sessions for third-year students',
    'Irregular attendance marking in morning section',
  ],
  Infrastructure: [
    'Damaged classroom flooring in Block C',
    'Non-functional elevator in main building',
    'Water leakage in the laboratory wing',
  ],
  'Fees & Finance': [
    'Excess fee charged beyond approved structure',
    'Delay in refund after seat cancellation',
    'No receipt issued for semester fee payment',
  ],
  Examination: [
    'Incorrect marks published in end-semester result',
    'Late release of hall tickets for examination',
    'Unfair evaluation of answer booklet (Set B)',
  ],
  Hostel: [
    'Poor food quality served in hostel mess',
    'Overcrowded rooms in Boys Hostel Block 2',
    'Inconsistent power supply in hostel block',
  ],
  Harassment: [
    'Complaint of ragging by senior students',
    'Inappropriate behaviour by staff member',
    'Safety concerns on campus after dark',
  ],
  Transport: [
    'Bus route changed without prior notice',
    'Overcrowding on college bus route 7',
    'Delayed pickup from the city centre stop',
  ],
  'IT Services': [
    'College portal down during fee submission',
    'Wi-Fi not working in the library area',
    'LMS not accepting assignment uploads',
  ],
  Library: [
    'Insufficient copies of reference books',
    'Library closed before scheduled hours',
    'Air conditioning non-functional in reading hall',
  ],
  Placements: [
    'Placement cell not sharing company details',
    'Discrepancies in published placement statistics',
    'No response from the placement coordinator',
  ],
  Administration: [
    'RTI request pending beyond stipulated time',
    'Delay in issuing migration certificate',
    'No action on earlier grievance submission',
  ],
  Other: [
    'Unsafe construction work near campus boundary',
    'Encroachment on campus boundary land',
    'Noise disturbance from adjacent construction site',
  ],
};

const PRIORITY_CYCLE = ['High', 'Medium', 'Critical', 'Low', 'Medium', 'High', 'Medium', 'Critical', 'Low', 'High', 'Medium', 'Low'];

const STATUS_CYCLE = [
  'In Progress', 'Pending', 'Resolved', 'In Progress', 'Resolved', 'Escalated',
  'Pending', 'Resolved', 'In Progress', 'Pending', 'Resolved', 'In Progress',
  'Pending', 'Resolved', 'Escalated', 'Pending', 'Resolved', 'In Progress',
  'Resolved', 'Pending',
];

const COMPLAINANT_NAMES = [
  'Rohan Gupta', 'Sneha Patel', 'Arjun Kumar', 'Fatima Sheikh', 'Manoj Tiwari',
  'Lakshmi Narayan', 'Vivek Chauhan', 'Priyanka Das', 'Imran Qureshi', 'Neha Rastogi',
  'Sagar Pawar', 'Kavya Menon',
];

const COMMENT_TEXTS = [
  'Complaint verified against institutional records.',
  'Institution contacted for a written explanation.',
  'Site inspection scheduled with the bureau team.',
  'Interim response received; awaiting supporting documents.',
  'Referred to the regional office for ground verification.',
];

const ESCALATION_REASONS = [
  'SLA deadline exceeded without resolution',
  'Repeated complaint filed by the same complainant',
  'High-impact issue flagged by regional office',
  'Pending beyond the escalation review window',
];

const _ATTACHMENT_NAMES = ['site-photograph.jpg', 'supporting-document.pdf', 'fee-receipt.pdf', 'inspection-report.pdf', 'student-statement.docx'];

function buildComplaints() {
  const list = [];
  const TOTAL = 64;
  const todayIso = toIsoDate(_today);

  for (let i = 0; i < TOTAL; i += 1) {
    const id = `CMP-${10245 - i}`;
    const category = CATEGORIES[i % CATEGORIES.length];
    const institution = INSTITUTIONS[(i * 5) % INSTITUTIONS.length];
    const priority = PRIORITY_CYCLE[i % PRIORITY_CYCLE.length];
    const status = STATUS_CYCLE[i % STATUS_CYCLE.length];
    const title = TITLES_BY_CATEGORY[category][i % 3];

    const createdAt = dateDaysAgo(2 + i * 3 + (i % 4));
    const slaDays = SLA_DAYS_BY_PRIORITY[priority];
    const slaDueDate = addDaysIso(createdAt, slaDays);

    const isResolved = status === 'Resolved';
    const updatedAt = isResolved
      ? addDaysIso(createdAt, Math.max(1, slaDays - ((i % 3) + 1)))
      : dateDaysAgo(i % 5);

    const overdueDays = daysBetween(slaDueDate, todayIso);
    const daysOverdue = !isResolved && overdueDays > 0 ? overdueDays : 0;

    const officer = status === 'Pending' && i % 3 === 0 ? null : OFFICERS[(i * 3) % OFFICERS.length];

    const complainantName = COMPLAINANT_NAMES[i % COMPLAINANT_NAMES.length];
    const complainant = {
      name: complainantName,
      email: `${complainantName.toLowerCase().replace(/\s+/g, '.')}@gmail.com`,
      phone: `+91 9${String(800000000 + i * 11111111).slice(0, 9)}`,
    };

    let escalationReason = null;
    if (status === 'Escalated') {
      escalationReason = ESCALATION_REASONS[i % ESCALATION_REASONS.length];
    } else if (daysOverdue > 0) {
      escalationReason = 'SLA deadline exceeded without resolution';
    } else if (priority === 'Critical') {
      escalationReason = 'Critical priority — requires senior intervention';
    }

    const attachments = i % 3 === 0
      ? Array.from({ length: (i % 2) + 1 }, (_, a) => ({
          name: `${_ATTACHMENT_NAMES[(i + a) % _ATTACHMENT_NAMES.length]}`,
          size: `${(0.4 + ((i + a) % 8) * 0.35).toFixed(1)} MB`,
        }))
      : [];

    const comments = i % 2 === 0
      ? Array.from({ length: (i % 2) + 1 }, (_, c) => ({
          id: `${id}-c${c}`,
          author: OFFICERS[(i + c) % OFFICERS.length].name,
          role: 'Section Officer',
          text: COMMENT_TEXTS[(i + c) % COMMENT_TEXTS.length],
          date: addDaysIso(createdAt, c + 1),
        }))
      : [];

    const complaint = {
      id,
      title,
      description: `${title} at ${institution.name} (${institution.code}). Reported through the AICTE grievance portal on ${formatDate(createdAt)}. The matter has been categorised under ${category} with ${priority.toLowerCase()} priority and requires review by the concerned bureau within the SLA window of ${slaDays} days.`,
      institution,
      institutionCode: institution.code,
      category,
      priority,
      status,
      assignedOfficer: officer,
      complainant,
      createdAt,
      updatedAt,
      slaDueDate,
      slaDays,
      daysOverdue,
      escalationReason,
      slaBreached: daysOverdue > 0,
      attachments,
      comments,
      timeline: [],
    };

    complaint.timeline = buildTimeline(complaint);
    list.push(complaint);
  }

  return list;
}

function buildTimeline(c) {
  const steps = [
    {
      title: 'Complaint Submitted',
      date: c.createdAt,
      description: 'Complaint registered on the AICTE grievance portal.',
      completed: true,
    },
  ];

  if (c.status !== 'Pending') {
    steps.push({
      title: 'Complaint Reviewed',
      date: addDaysIso(c.createdAt, 1),
      description: 'Verified and categorised by the review desk.',
      completed: true,
    });
  }

  if (c.assignedOfficer) {
    steps.push({
      title: 'Officer Assigned',
      date: addDaysIso(c.createdAt, 2),
      description: `${c.assignedOfficer.name} (${c.assignedOfficer.bureau}) assigned for investigation.`,
      completed: true,
    });
  }

  if (c.status === 'In Progress' || c.status === 'Escalated' || c.status === 'Resolved') {
    steps.push({
      title: 'Investigation',
      date: addDaysIso(c.createdAt, 3),
      description: 'Evidence collected and institution response under review.',
      completed: true,
    });
  }

  if (c.status === 'Escalated') {
    steps.push({
      title: 'Escalated',
      date: addDaysIso(c.createdAt, 4),
      description: c.escalationReason || 'Escalated for senior intervention.',
      completed: true,
    });
  }

  if (c.status === 'In Progress') {
    steps.push({
      title: 'Status Updated',
      date: c.updatedAt,
      description: 'Resolution in progress with the assigned officer.',
      completed: true,
    });
  }

  if (c.status === 'Resolved') {
    steps.push({
      title: 'Status Updated',
      date: addDaysIso(c.createdAt, Math.max(2, c.slaDays - 1)),
      description: 'Complaint marked resolved after verification.',
      completed: true,
    });
    steps.push({
      title: 'Resolved',
      date: c.updatedAt,
      description: 'Final resolution recorded and closed.',
      completed: true,
    });
  }

  const last = steps[steps.length - 1];
  last.current = c.status !== 'Resolved';

  return steps;
}

export const COMPLAINTS = buildComplaints();

/* ------------------------------------------------------------------ */
/* Derived complaint helpers                                           */
/* ------------------------------------------------------------------ */

export function getComplaintById(id) {
  if (!id) return null;
  const normalized = id.trim().toUpperCase();
  return COMPLAINTS.find((c) => c.id === normalized) || null;
}

export function getRecentComplaints(limit = 8) {
  return COMPLAINTS.slice(0, limit);
}

export function getCriticalComplaints(limit = 6) {
  return COMPLAINTS.filter((c) => c.status !== 'Resolved' && (c.slaBreached || c.priority === 'Critical'))
    .sort((a, b) => b.daysOverdue - a.daysOverdue)
    .slice(0, limit);
}

export function getEscalatedComplaints() {
  return COMPLAINTS.filter(
    (c) => c.status === 'Escalated' || c.slaBreached || (c.priority === 'Critical' && c.status !== 'Resolved')
  ).sort((a, b) => b.daysOverdue - a.daysOverdue);
}

/* ------------------------------------------------------------------ */
/* Dashboard statistics                                                */
/* ------------------------------------------------------------------ */

export const DASHBOARD_STATS = {
  totalComplaints: 12845,
  pending: 3421,
  resolved: 8910,
  critical: 514,
  slaBreached: 231,
  escalated: 439,
  resolutionRate: 69.4,
  avgResolutionDays: 6.2,
  totalDelta: '+4.2%',
  pendingDelta: '-2.1%',
  resolvedDelta: '+6.8%',
  criticalDelta: '+1.4%',
};

export const ADMIN_USER = {
  name: 'Ananya Iyer',
  email: 'admin@aicte.gov.in',
  role: 'System Administrator',
  initials: 'AI',
};

/* ------------------------------------------------------------------ */
/* Analytics datasets                                                  */
/* ------------------------------------------------------------------ */

export const MONTHLY_TREND = [
  { month: 'Nov', submitted: 980, resolved: 845 },
  { month: 'Dec', submitted: 1042, resolved: 910 },
  { month: 'Jan', submitted: 1158, resolved: 986 },
  { month: 'Feb', submitted: 1096, resolved: 1002 },
  { month: 'Mar', submitted: 1240, resolved: 1088 },
  { month: 'Apr', submitted: 1187, resolved: 1120 },
  { month: 'May', submitted: 964, resolved: 942 },
  { month: 'Jun', submitted: 872, resolved: 890 },
  { month: 'Jul', submitted: 1124, resolved: 1015 },
  { month: 'Aug', submitted: 1268, resolved: 1098 },
  { month: 'Sep', submitted: 1205, resolved: 1142 },
  { month: 'Oct', submitted: 1309, resolved: 1186 },
];

export const CATEGORY_DISTRIBUTION = [
  { category: 'Academics', count: 2150 },
  { category: 'Infrastructure', count: 1980 },
  { category: 'Fees & Finance', count: 1640 },
  { category: 'Examination', count: 1320 },
  { category: 'IT Services', count: 1150 },
  { category: 'Hostel', count: 1080 },
  { category: 'Administration', count: 895 },
  { category: 'Transport', count: 720 },
  { category: 'Harassment', count: 640 },
  { category: 'Library', count: 560 },
  { category: 'Placements', count: 480 },
  { category: 'Other', count: 230 },
];

export const ANALYTICS = {
  statusDistribution: [
    { name: 'Pending', value: 2310 },
    { name: 'In Progress', value: 1186 },
    { name: 'Escalated', value: 439 },
    { name: 'Resolved', value: 8910 },
  ],
  pendingVsResolved: [
    { name: 'Pending', value: 3421 },
    { name: 'Resolved', value: 8910 },
  ],
  institutionVolume: INSTITUTIONS
    .slice()
    .sort((a, b) => b.totalComplaints - a.totalComplaints)
    .map((inst) => ({ name: inst.shortName, complaints: inst.totalComplaints })),
  slaPerformance: MONTHLY_TREND.map((m, idx) => ({
    month: m.month,
    withinSla: 82 + ((idx * 7) % 14),
    breached: 18 - ((idx * 7) % 14),
  })),
  resolutionRateTrend: [
    { month: 'Nov', rate: 63.2 },
    { month: 'Dec', rate: 64.8 },
    { month: 'Jan', rate: 65.1 },
    { month: 'Feb', rate: 66.4 },
    { month: 'Mar', rate: 66.0 },
    { month: 'Apr', rate: 67.2 },
    { month: 'May', rate: 68.5 },
    { month: 'Jun', rate: 69.9 },
    { month: 'Jul', rate: 69.4 },
    { month: 'Aug', rate: 70.2 },
    { month: 'Sep', rate: 71.0 },
    { month: 'Oct', rate: 71.6 },
  ],
};

/* ------------------------------------------------------------------ */
/* Notifications                                                       */
/* ------------------------------------------------------------------ */

export const NOTIFICATIONS = [
  { id: 'ntf-01', title: 'SLA breach', message: 'CMP-10245 has exceeded its SLA deadline.', time: '12 min ago', type: 'critical', read: false },
  { id: 'ntf-02', title: 'New complaint', message: 'A harassment complaint was filed against Jaipur Engineering Institute.', time: '38 min ago', type: 'info', read: false },
  { id: 'ntf-03', title: 'Officer assigned', message: 'Rajesh Sharma was assigned to CMP-10239 (Infrastructure).', time: '1 hr ago', type: 'info', read: false },
  { id: 'ntf-04', title: 'Escalation', message: 'CMP-10233 escalated after repeated complainant follow-ups.', time: '3 hrs ago', type: 'warning', read: false },
  { id: 'ntf-05', title: 'Complaint resolved', message: 'CMP-10230 was resolved within SLA by Priya Nair.', time: '5 hrs ago', type: 'success', read: true },
  { id: 'ntf-06', title: 'Weekly report', message: 'Weekly grievance summary is ready for review.', time: '1 day ago', type: 'info', read: true },
];
