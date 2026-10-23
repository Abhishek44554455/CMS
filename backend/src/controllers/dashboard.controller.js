import * as dashboardService from '../services/dashboard.service.js';

/** GET /api/dashboard/stats */
export async function getStats(req, res) {
  const stats = await dashboardService.getStats();
  res.status(200).json({
    success: true,
    message: 'Dashboard stats fetched successfully',
    data: stats,
  });
}

/** GET /api/dashboard/complaints */
export async function getComplaints(req, res) {
  const days = Math.min(90, Math.max(1, parseInt(req.query.days, 10) || 14));
  const result = await dashboardService.getComplaintTrends({ days });
  res.status(200).json({
    success: true,
    message: 'Dashboard complaints fetched successfully',
    data: result,
  });
}

/** GET /api/dashboard/categories */
export async function getCategories(req, res) {
  const categories = await dashboardService.getCategories();
  res.status(200).json({
    success: true,
    message: 'Category distribution fetched successfully',
    data: { categories },
  });
}

/** GET /api/dashboard/bureaus */
export async function getBureaus(req, res) {
  const bureaus = await dashboardService.getBureaus();
  res.status(200).json({
    success: true,
    message: 'Bureau summary fetched successfully',
    data: { bureaus },
  });
}
