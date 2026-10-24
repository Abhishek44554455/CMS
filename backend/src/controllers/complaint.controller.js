import * as complaintService from '../services/complaint.service.js';

/**
 * POST /api/complaints
 * Required: title, description, category, priority, institution_id
 */
export async function createComplaint(req, res) {
  const complaint = await complaintService.createComplaint(req.body || {}, req.user);
  res.status(201).json({
    success: true,
    message: 'Complaint created successfully',
    data: { complaint },
  });
}

/** GET /api/complaints */
export async function getComplaints(req, res) {
  const result = await complaintService.getComplaints(req.query);
  res.status(200).json({
    success: true,
    message: 'Complaints fetched successfully',
    data: result,
  });
}

/** GET /api/complaints/:id */
export async function getComplaintById(req, res) {
  const complaint = await complaintService.getComplaintById(req.params.id, req.user);
  res.status(200).json({
    success: true,
    message: 'Complaint fetched successfully',
    data: { complaint },
  });
}

/** PUT /api/complaints/:id */
export async function updateComplaint(req, res) {
  const complaint = await complaintService.updateComplaint(
    req.params.id,
    req.body || {},
    req.user
  );
  res.status(200).json({
    success: true,
    message: 'Complaint updated successfully',
    data: { complaint },
  });
}

/** DELETE /api/complaints/:id */
export async function deleteComplaint(req, res) {
  await complaintService.deleteComplaint(req.params.id);
  res.status(200).json({
    success: true,
    message: 'Complaint deleted successfully',
    data: {},
  });
}

/** PUT /api/complaints/:id/assign */
export async function assignComplaint(req, res) {
  const complaint = await complaintService.assignComplaint(
    req.params.id,
    req.body || {},
    req.user
  );
  res.status(200).json({
    success: true,
    message: 'Complaint assigned successfully',
    data: { complaint },
  });
}

/** PUT /api/complaints/:id/status */
export async function updateComplaintStatus(req, res) {
  const complaint = await complaintService.updateComplaintStatus(
    req.params.id,
    req.body || {},
    req.user
  );
  res.status(200).json({
    success: true,
    message: 'Complaint status updated successfully',
    data: { complaint },
  });
}

/** POST /api/complaints/:id/escalate */
export async function escalateComplaint(req, res) {
  const complaint = await complaintService.escalateComplaint(
    req.params.id,
    req.body || {},
    req.user
  );
  res.status(200).json({
    success: true,
    message: 'Complaint escalated successfully',
    data: { complaint },
  });
}

/** GET /api/complaints/:id/history */
export async function getComplaintHistory(req, res) {
  const history = await complaintService.getComplaintHistory(req.params.id, req.user);
  res.status(200).json({
    success: true,
    message: 'Complaint history fetched successfully',
    data: { history },
  });
}

/**
 * GET /api/complaints/track/:trackingId (PUBLIC — no session required)
 * Sanitized complaint + timeline for the citizen tracking page.
 */
export async function trackComplaint(req, res) {
  const result = await complaintService.trackComplaint(req.params.trackingId);
  res.status(200).json({
    success: true,
    message: 'Complaint fetched successfully',
    data: result,
  });
}
