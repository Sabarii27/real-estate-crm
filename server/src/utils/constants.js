const ROLES = Object.freeze({
  ADMIN: 'admin',
  SALES: 'sales',
});

const LEAD_STAGES = Object.freeze([
  'New',
  'Contacted',
  'Site Visit',
  'Interested',
  'Negotiation',
  'Booked',
  'Lost',
]);

const UNIT_STATUS = Object.freeze({
  AVAILABLE: 'Available',
  BOOKED: 'Booked',
});

const BOOKING_STATUS = Object.freeze({
  CONFIRMED: 'Confirmed',
  CANCELLED: 'Cancelled',
});

const UNIT_TYPES = Object.freeze([
  '1BHK',
  '2BHK',
  '3BHK',
  '4BHK',
  'Studio',
  'Penthouse',
  'Villa',
  'Office',
  'Shop',
]);

const LEAD_SOURCES = Object.freeze([
  'Website',
  'Referral',
  'Walk-in',
  'Phone Inquiry',
  'Social Media',
  'Property Portal',
  'Other',
]);

module.exports = {
  ROLES,
  LEAD_STAGES,
  UNIT_STATUS,
  BOOKING_STATUS,
  UNIT_TYPES,
  LEAD_SOURCES,
};
