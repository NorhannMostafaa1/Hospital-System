const APPOINTMENT_STATUSES = [
  'pending',
  'confirmed',
  'completed',
  'cancelled',
  'rejected',
  'no-show',
  'rescheduled',
];

const ACTIVE_APPOINTMENT_STATUSES = ['pending', 'confirmed'];

const APPOINTMENT_TRANSITIONS = {
  pending: ['confirmed', 'cancelled', 'rejected', 'rescheduled'],
  confirmed: ['completed', 'cancelled', 'no-show', 'rescheduled'],
  completed: [],
  cancelled: [],
  rejected: [],
  'no-show': [],
  rescheduled: ['confirmed', 'cancelled'],
};

const assertTransition = (from, to) => {
  if (from === to) return;
  if (!APPOINTMENT_TRANSITIONS[from] || !APPOINTMENT_TRANSITIONS[from].includes(to)) {
    const err = new Error(`Invalid appointment transition from ${from} to ${to}.`);
    err.status = 409;
    throw err;
  }
};

module.exports = {
  ACTIVE_APPOINTMENT_STATUSES,
  APPOINTMENT_STATUSES,
  APPOINTMENT_TRANSITIONS,
  assertTransition,
};
