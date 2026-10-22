import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Mail,
  MapPin,
  Paperclip,
  Phone,
  RefreshCw,
  Send,
  TriangleAlert,
  UserPlus,
  UserRound,
} from 'lucide-react';

import Button from '../components/common/Button.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import Modal from '../components/common/Modal.jsx';
import ComplaintPriorityBadge from '../components/complaints/ComplaintPriorityBadge.jsx';
import ComplaintStatusBadge from '../components/complaints/ComplaintStatusBadge.jsx';
import ComplaintTimeline from '../components/complaints/ComplaintTimeline.jsx';

// Mock data import — replace with api.complaints.getById(id) later.
import { ADMIN_USER, OFFICERS, STATUSES, formatDate, getComplaintById } from '../data/mockData.js';

function todayIso() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

function withNewStep(timeline, step) {
  const cleared = timeline.map((s) => ({ ...s, current: false }));
  return [...cleared, { date: todayIso(), completed: true, ...step }];
}

function Section({ title, children }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-5 py-4">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="mt-0.5 text-sm text-slate-800">{children}</dd>
    </div>
  );
}

/**
 * Shared complaint detail page — opened from Complaints, Dashboard and Escalated.
 * Actions (assign / status / escalate / resolve / comments) update local state only
 * until the Express backend exists.
 */
export default function ComplaintDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [complaint, setComplaint] = useState(() => getComplaintById(id));
  const [modal, setModal] = useState(null); // 'assign' | 'status' | 'escalate' | 'resolve'
  const [assignOfficerId, setAssignOfficerId] = useState('');
  const [nextStatus, setNextStatus] = useState('');
  const [escalationReason, setEscalationReason] = useState('');
  const [resolutionNote, setResolutionNote] = useState('');
  const [newComment, setNewComment] = useState('');

  // Reset local state if the user navigates between complaints.
  useEffect(() => {
    setComplaint(getComplaintById(id));
    setModal(null);
  }, [id]);

  const handleBack = () => {
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate('/admin/complaints');
    }
  };

  if (!complaint) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <EmptyState
          title="Complaint not found"
          message={`No complaint exists with the ID "${id}".`}
          action={
            <Link
              to="/admin/complaints"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Complaints
            </Link>
          }
        />
      </div>
    );
  }

  const isResolved = complaint.status === 'Resolved';

  const openAssign = () => {
    setAssignOfficerId(complaint.assignedOfficer ? complaint.assignedOfficer.id : '');
    setModal('assign');
  };
  const openStatus = () => {
    setNextStatus(complaint.status);
    setModal('status');
  };
  const openEscalate = () => {
    setEscalationReason(complaint.escalationReason || '');
    setModal('escalate');
  };
  const openResolve = () => {
    setResolutionNote('');
    setModal('resolve');
  };

  const handleAssign = () => {
    const officer = OFFICERS.find((o) => o.id === assignOfficerId);
    if (!officer) return;
    setComplaint((prev) => ({
      ...prev,
      assignedOfficer: officer,
      timeline: withNewStep(prev.timeline, {
        title: 'Officer Assigned',
        description: `${officer.name} (${officer.bureau}) assigned for investigation.`,
        current: true,
      }),
    }));
    setModal(null);
  };

  const handleStatusChange = () => {
    if (!nextStatus || nextStatus === complaint.status) {
      setModal(null);
      return;
    }
    setComplaint((prev) => ({
      ...prev,
      status: nextStatus,
      timeline: withNewStep(prev.timeline, {
        title: 'Status Updated',
        description: `Status changed from ${prev.status} to ${nextStatus}.`,
        current: true,
      }),
    }));
    setModal(null);
  };

  const handleEscalate = () => {
    const reason = escalationReason.trim() || 'Escalated for senior intervention';
    setComplaint((prev) => ({
      ...prev,
      status: 'Escalated',
      escalationReason: reason,
      timeline: withNewStep(prev.timeline, {
        title: 'Escalated',
        description: reason,
        current: true,
      }),
    }));
    setModal(null);
  };

  const handleResolve = () => {
    setComplaint((prev) => ({
      ...prev,
      status: 'Resolved',
      daysOverdue: 0,
      slaBreached: false,
      updatedAt: todayIso(),
      timeline: [
        ...withNewStep(prev.timeline, {
          title: 'Resolved',
          description: resolutionNote.trim() || 'Final resolution recorded and closed.',
          current: false,
        }),
      ],
    }));
    setModal(null);
  };

  const handleAddComment = () => {
    const text = newComment.trim();
    if (!text) return;
    setComplaint((prev) => ({
      ...prev,
      comments: [
        ...prev.comments,
        {
          id: `${prev.id}-c${prev.comments.length + 1}`,
          author: ADMIN_USER.name,
          role: ADMIN_USER.role,
          text,
          date: todayIso(),
        },
      ],
    }));
    setNewComment('');
  };

  const selectClass =
    'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600';

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <button
          type="button"
          onClick={handleBack}
          className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Complaints
        </button>

        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-lg font-semibold text-slate-900">{complaint.id}</h2>
              <ComplaintStatusBadge status={complaint.status} />
              <ComplaintPriorityBadge priority={complaint.priority} />
              {complaint.slaBreached ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-200">
                  <TriangleAlert className="h-3 w-3" />
                  SLA Breached
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-sm text-slate-600">{complaint.title}</p>
            <p className="mt-0.5 text-sm text-slate-500">
              {complaint.category} · {complaint.institution.name}
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" icon={<UserPlus className="h-4 w-4" />} onClick={openAssign}>
              Assign Officer
            </Button>
            <Button variant="secondary" icon={<RefreshCw className="h-4 w-4" />} onClick={openStatus}>
              Change Status
            </Button>
            <Button
              variant="warning"
              icon={<TriangleAlert className="h-4 w-4" />}
              onClick={openEscalate}
              disabled={isResolved}
            >
              Escalate
            </Button>
            <Button
              variant="primary"
              icon={<CheckCircle2 className="h-4 w-4" />}
              onClick={openResolve}
              disabled={isResolved}
            >
              Resolve
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        {/* Left column */}
        <div className="space-y-5 xl:col-span-2">
          <Section title="Complaint Information">
            <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Complaint ID"><span className="font-medium text-blue-700">{complaint.id}</span></Field>
              <Field label="Category">{complaint.category}</Field>
              <Field label="Priority"><ComplaintPriorityBadge priority={complaint.priority} /></Field>
              <Field label="Status"><ComplaintStatusBadge status={complaint.status} /></Field>
              <Field label="Assigned Officer">
                {complaint.assignedOfficer ? (
                  <span className="inline-flex items-center gap-1.5">
                    <UserRound className="h-4 w-4 text-slate-400" />
                    {complaint.assignedOfficer.name}
                  </span>
                ) : (
                  <span className="text-slate-400">Unassigned</span>
                )}
              </Field>
              <Field label="Created Date">{formatDate(complaint.createdAt)}</Field>
            </dl>
          </Section>

          <Section title="Complaint Description">
            <p className="text-sm leading-relaxed text-slate-700">{complaint.description}</p>
          </Section>

          <Section title="Internal Comments">
            {complaint.comments.length === 0 ? (
              <p className="text-sm text-slate-500">No internal comments yet.</p>
            ) : (
              <ul className="mb-4 space-y-4">
                {complaint.comments.map((comment) => (
                  <li key={comment.id} className="border-l-2 border-slate-200 pl-3">
                    <div className="flex flex-wrap items-center gap-x-2">
                      <p className="text-sm font-medium text-slate-800">{comment.author}</p>
                      <span className="text-xs text-slate-400">{comment.role}</span>
                      <span className="text-xs text-slate-400">· {formatDate(comment.date)}</span>
                    </div>
                    <p className="mt-0.5 text-sm text-slate-600">{comment.text}</p>
                  </li>
                ))}
              </ul>
            )}

            <div className="flex flex-col gap-2 sm:flex-row">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={2}
                placeholder="Add an internal comment (visible to admins only)…"
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
              <Button
                variant="secondary"
                icon={<Send className="h-4 w-4" />}
                onClick={handleAddComment}
                disabled={!newComment.trim()}
                className="self-start sm:self-stretch"
              >
                Add Comment
              </Button>
            </div>
          </Section>

          <Section title="Complaint Timeline">
            <ComplaintTimeline timeline={complaint.timeline} />
          </Section>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          <Section title="SLA Information">
            <dl className="space-y-4">
              <Field label="SLA Window">{complaint.slaDays} days</Field>
              <Field label="SLA Due Date">
                <span className={complaint.slaBreached ? 'font-medium text-red-600' : ''}>
                  {formatDate(complaint.slaDueDate)}
                </span>
              </Field>
              <Field label="Last Updated">{formatDate(complaint.updatedAt)}</Field>
              <Field label="SLA Status">
                {isResolved ? (
                  <span className="inline-flex rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-200">
                    Resolved
                  </span>
                ) : complaint.slaBreached ? (
                  <span className="inline-flex rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-200">
                    Breached · {complaint.daysOverdue} days overdue
                  </span>
                ) : (
                  <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-200">
                    On track
                  </span>
                )}
              </Field>
            </dl>
          </Section>

          <Section title="Complainant Information">
            <dl className="space-y-4">
              <Field label="Name">{complaint.complainant.name}</Field>
              <Field label="Email">
                <span className="inline-flex items-center gap-1.5 break-all">
                  <Mail className="h-4 w-4 flex-shrink-0 text-slate-400" />
                  {complaint.complainant.email}
                </span>
              </Field>
              <Field label="Phone">
                <span className="inline-flex items-center gap-1.5">
                  <Phone className="h-4 w-4 text-slate-400" />
                  {complaint.complainant.phone}
                </span>
              </Field>
            </dl>
          </Section>

          <Section title="Institution Information">
            <dl className="space-y-4">
              <Field label="Institution">
                <span className="inline-flex items-start gap-1.5">
                  <Building2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400" />
                  {complaint.institution.name}
                </span>
              </Field>
              <Field label="Institution Code">{complaint.institutionCode}</Field>
              <Field label="State / District">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  {complaint.institution.district}, {complaint.institution.state}
                </span>
              </Field>
              <Field label="Type">{complaint.institution.type}</Field>
            </dl>
          </Section>

          <Section title="Attachments">
            {complaint.attachments.length === 0 ? (
              <p className="text-sm text-slate-500">No attachments on this complaint.</p>
            ) : (
              <ul className="space-y-2">
                {complaint.attachments.map((file) => (
                  <li
                    key={file.name}
                    className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2"
                  >
                    <span className="flex min-w-0 items-center gap-2 text-sm text-slate-700">
                      <Paperclip className="h-4 w-4 flex-shrink-0 text-slate-400" />
                      <span className="truncate">{file.name}</span>
                    </span>
                    <span className="flex-shrink-0 text-xs text-slate-400">{file.size}</span>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>
      </div>

      {/* Action modals */}
      <Modal
        open={modal === 'assign'}
        title="Assign Officer"
        onClose={() => setModal(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModal(null)}>Cancel</Button>
            <Button onClick={handleAssign} disabled={!assignOfficerId}>Assign Officer</Button>
          </>
        }
      >
        <label className="block text-sm font-medium text-slate-700" htmlFor="assign-officer">
          Select an officer
        </label>
        <select
          id="assign-officer"
          value={assignOfficerId}
          onChange={(e) => setAssignOfficerId(e.target.value)}
          className={`${selectClass} mt-2`}
        >
          <option value="">Choose an officer…</option>
          {OFFICERS.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name} — {o.bureau} ({o.pending} pending)
            </option>
          ))}
        </select>
        <p className="mt-3 text-xs text-slate-500">
          The officer will be responsible for investigating and resolving this complaint.
        </p>
      </Modal>

      <Modal
        open={modal === 'status'}
        title="Change Status"
        onClose={() => setModal(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModal(null)}>Cancel</Button>
            <Button onClick={handleStatusChange}>Update Status</Button>
          </>
        }
      >
        <label className="block text-sm font-medium text-slate-700" htmlFor="change-status">
          New status
        </label>
        <select
          id="change-status"
          value={nextStatus}
          onChange={(e) => setNextStatus(e.target.value)}
          className={`${selectClass} mt-2`}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </Modal>

      <Modal
        open={modal === 'escalate'}
        title="Escalate Complaint"
        onClose={() => setModal(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModal(null)}>Cancel</Button>
            <Button variant="warning" onClick={handleEscalate}>Escalate</Button>
          </>
        }
      >
        <label className="block text-sm font-medium text-slate-700" htmlFor="escalation-reason">
          Escalation reason
        </label>
        <textarea
          id="escalation-reason"
          rows={3}
          value={escalationReason}
          onChange={(e) => setEscalationReason(e.target.value)}
          placeholder="e.g. SLA deadline exceeded without resolution"
          className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
        />
        <p className="mt-2 text-xs text-slate-500">
          Escalated complaints appear on the Escalated page for senior intervention.
        </p>
      </Modal>

      <Modal
        open={modal === 'resolve'}
        title="Resolve Complaint"
        onClose={() => setModal(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModal(null)}>Cancel</Button>
            <Button icon={<CheckCircle2 className="h-4 w-4" />} onClick={handleResolve}>
              Mark as Resolved
            </Button>
          </>
        }
      >
        <label className="block text-sm font-medium text-slate-700" htmlFor="resolution-note">
          Resolution summary
        </label>
        <textarea
          id="resolution-note"
          rows={3}
          value={resolutionNote}
          onChange={(e) => setResolutionNote(e.target.value)}
          placeholder="Describe how the complaint was resolved…"
          className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
        />
      </Modal>
    </div>
  );
}
