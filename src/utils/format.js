export const PHONE_ERROR = 'Please enter a valid 10-digit phone number.';

export function cleanPhone(value) {
  return String(value || '').replace(/\D+/g, '').slice(0, 10);
}

export function isValidPhone(value) {
  return /^\d{10}$/.test(String(value || '').trim());
}

export function formatINR(value) {
  if (value === null || value === undefined || isNaN(Number(value))) return '—';
  return '₹' + Number(value).toLocaleString('en-IN');
}

export function formatDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatDateTime(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export const STATUS_LABEL = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  new: 'New',
  replied: 'Replied',
  available: 'Available',
  booked: 'Booked',
  registered: 'Registered',
  blocked: 'Booked',
  sold: 'Sold',
};

export const STATUS_CLASS = {
  pending: 'badge badge-pending',
  approved: 'badge badge-approved',
  rejected: 'badge badge-rejected',
  new: 'badge badge-pending',
  replied: 'badge badge-approved',
  available: 'badge badge-approved',
  booked: 'badge badge-pending',
  registered: 'badge badge-info',
  blocked: 'badge badge-pending',
  sold: 'badge badge-rejected',
};