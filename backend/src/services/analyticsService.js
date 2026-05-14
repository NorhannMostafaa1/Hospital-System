const Appointment = require('../models/Appointment');

const getAppointmentAnalytics = async () => {
  const [byStatus, busiestDoctors, peakHours] = await Promise.all([
    Appointment.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Appointment.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: '$doctor', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),
    Appointment.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: { $hour: '$startsAt' }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
  ]);

  const total = byStatus.reduce((sum, item) => sum + item.count, 0);
  const cancelled = byStatus.find((item) => item._id === 'cancelled')?.count || 0;
  const noShow = byStatus.find((item) => item._id === 'no-show')?.count || 0;
  return {
    totalAppointments: total,
    byStatus,
    cancellationRate: total ? cancelled / total : 0,
    noShowRate: total ? noShow / total : 0,
    busiestDoctors,
    peakHours,
  };
};

module.exports = { getAppointmentAnalytics };
