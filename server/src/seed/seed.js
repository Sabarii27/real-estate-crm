/* eslint-disable no-console */
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');

const User = require('../models/User');
const Lead = require('../models/Lead');
const Project = require('../models/Project');
const Building = require('../models/Building');
const Unit = require('../models/Unit');
const Booking = require('../models/Booking');

const DEMO_PASSWORD = 'Sales@123';

const run = async () => {
  await connectDB();
  console.log('[Seed] Clearing existing data...');
  await Promise.all([
    User.deleteMany({}),
    Lead.deleteMany({}),
    Project.deleteMany({}),
    Building.deleteMany({}),
    Unit.deleteMany({}),
    Booking.deleteMany({}),
  ]);

  console.log('[Seed] Creating users...');
  const admin = await User.create({
    name: 'Admin User',
    email: 'admin@realestatecrm.com',
    password: 'Admin@123',
    role: 'admin',
  });

  const sales1 = await User.create({
    name: 'Priya Sharma',
    email: 'sales1@realestatecrm.com',
    password: DEMO_PASSWORD,
    role: 'sales',
  });

  const sales2 = await User.create({
    name: 'Arjun Mehta',
    email: 'sales2@realestatecrm.com',
    password: DEMO_PASSWORD,
    role: 'sales',
  });

  console.log('[Seed] Creating projects, buildings, units...');
  const project1 = await Project.create({
    name: 'Green Valley Residency',
    location: 'Salem, Tamil Nadu',
    description: 'A premium residential township with landscaped gardens and modern amenities.',
  });

  const project2 = await Project.create({
    name: 'Skyline Business Park',
    location: 'Chennai, Tamil Nadu',
    description: 'A commercial complex with office spaces and retail shops.',
  });

  const buildingA = await Building.create({ project: project1._id, name: 'Tower A', description: 'North wing, 12 floors' });
  const buildingB = await Building.create({ project: project1._id, name: 'Tower B', description: 'South wing, 10 floors' });
  const buildingC = await Building.create({ project: project2._id, name: 'Commercial Block C', description: 'Ground + 6 floors' });

  const unitDefs = [
    { building: buildingA, project: project1, unitNumber: 'A-101', floor: 1, type: '2BHK', price: 4500000 },
    { building: buildingA, project: project1, unitNumber: 'A-102', floor: 1, type: '2BHK', price: 4600000 },
    { building: buildingA, project: project1, unitNumber: 'A-201', floor: 2, type: '3BHK', price: 6200000 },
    { building: buildingA, project: project1, unitNumber: 'A-202', floor: 2, type: '3BHK', price: 6300000 },
    { building: buildingA, project: project1, unitNumber: 'A-301', floor: 3, type: 'Penthouse', price: 12000000 },
    { building: buildingB, project: project1, unitNumber: 'B-101', floor: 1, type: '1BHK', price: 3200000 },
    { building: buildingB, project: project1, unitNumber: 'B-102', floor: 1, type: '1BHK', price: 3250000 },
    { building: buildingB, project: project1, unitNumber: 'B-201', floor: 2, type: '2BHK', price: 4400000 },
    { building: buildingB, project: project1, unitNumber: 'B-202', floor: 2, type: '2BHK', price: 4450000 },
    { building: buildingC, project: project2, unitNumber: 'C-G01', floor: 0, type: 'Shop', price: 5000000 },
    { building: buildingC, project: project2, unitNumber: 'C-101', floor: 1, type: 'Office', price: 7500000 },
    { building: buildingC, project: project2, unitNumber: 'C-102', floor: 1, type: 'Office', price: 7600000 },
  ];

  const units = [];
  for (const def of unitDefs) {
    const unit = await Unit.create({
      project: def.project._id,
      building: def.building._id,
      unitNumber: def.unitNumber,
      floor: def.floor,
      type: def.type,
      price: def.price,
      status: 'Available',
    });
    units.push(unit);
  }

  console.log('[Seed] Creating leads...');
  const today = new Date();
  const inDays = (n) => new Date(today.getTime() + n * 24 * 60 * 60 * 1000);

  const leadDefs = [
    { name: 'Ramesh Kumar', phone: '9876543210', email: 'ramesh.k@example.com', source: 'Website', stage: 'New', assignedTo: sales1._id, followUpDate: inDays(1) },
    { name: 'Sunita Rao', phone: '9876543211', email: 'sunita.rao@example.com', source: 'Referral', stage: 'Contacted', assignedTo: sales1._id, followUpDate: inDays(0) },
    { name: 'Vikram Singh', phone: '9876543212', email: 'vikram.s@example.com', source: 'Walk-in', stage: 'Site Visit', assignedTo: sales1._id, followUpDate: inDays(3) },
    { name: 'Anita Desai', phone: '9876543213', email: 'anita.d@example.com', source: 'Property Portal', stage: 'Interested', assignedTo: sales2._id, followUpDate: inDays(0) },
    { name: 'Karthik Iyer', phone: '9876543214', email: 'karthik.i@example.com', source: 'Social Media', stage: 'Negotiation', assignedTo: sales2._id, followUpDate: inDays(2) },
    { name: 'Meena Pillai', phone: '9876543215', email: 'meena.p@example.com', source: 'Referral', stage: 'Lost', assignedTo: sales2._id, followUpDate: null },
    { name: 'Deepak Nair', phone: '9876543216', email: 'deepak.n@example.com', source: 'Website', stage: 'New', assignedTo: sales1._id, followUpDate: inDays(5) },
    { name: 'Kavya Reddy', phone: '9876543217', email: 'kavya.r@example.com', source: 'Phone Inquiry', stage: 'Contacted', assignedTo: sales2._id, followUpDate: inDays(-1) },
    { name: 'Suresh Babu', phone: '9876543218', email: 'suresh.b@example.com', source: 'Website', stage: 'New', assignedTo: null, followUpDate: null },
    { name: 'Lakshmi Narayan', phone: '9876543219', email: 'lakshmi.n@example.com', source: 'Walk-in', stage: 'Interested', assignedTo: sales1._id, followUpDate: inDays(0) },
  ];

  const leads = [];
  for (const def of leadDefs) {
    const lead = await Lead.create({
      name: def.name,
      phone: def.phone,
      email: def.email,
      source: def.source,
      stage: def.stage,
      assignedTo: def.assignedTo,
      followUpDate: def.followUpDate,
      createdBy: admin._id,
      notes: [{ text: `Initial inquiry logged for ${def.name}.`, addedBy: admin._id }],
      activity: [{ type: 'created', message: 'Lead created during seeding', by: admin._id }],
    });
    leads.push(lead);
  }

  console.log('[Seed] Creating sample bookings...');
  // Book two units for two leads to make dashboard + bookings page look realistic.
  const bookingPairs = [
    { lead: leads[4], unit: units[0], bookedBy: sales2._id }, // Karthik Iyer -> A-101
    { lead: leads[9], unit: units[7], bookedBy: sales1._id }, // Lakshmi Narayan -> B-202
  ];

  for (const pair of bookingPairs) {
    await Unit.findByIdAndUpdate(pair.unit._id, { status: 'Booked' });
    await Booking.create({
      lead: pair.lead._id,
      unit: pair.unit._id,
      project: pair.unit.project,
      building: pair.unit.building,
      price: pair.unit.price,
      bookedBy: pair.bookedBy,
      status: 'Confirmed',
      notes: 'Booking confirmed with 10% down payment.',
    });
    await Lead.findByIdAndUpdate(pair.lead._id, {
      stage: 'Booked',
      $push: {
        activity: {
          type: 'stage_change',
          message: `Lead booked into unit ${pair.unit.unitNumber}`,
          by: pair.bookedBy,
        },
      },
    });
  }

  console.log('\n[Seed] Done! Demo credentials:');
  console.log('  Admin:  admin@realestatecrm.com / Admin@123');
  console.log('  Sales1: sales1@realestatecrm.com / Sales@123');
  console.log('  Sales2: sales2@realestatecrm.com / Sales@123\n');

  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error('[Seed] Failed:', err);
  process.exit(1);
});
