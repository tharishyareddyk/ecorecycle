require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Facility = require('./models/Facility');

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  await User.deleteMany({});
  await Facility.deleteMany({});

  const admin = await User.create({
    name: 'Admin User', email: 'admin@demo.com', password: 'password123',
    phone: '9000000001', role: 'admin',
    address: { city: 'Hyderabad', state: 'Telangana' }
  });

  const recycler = await User.create({
    name: 'GreenCycle Manager', email: 'recycler@demo.com', password: 'password123',
    phone: '9000000002', role: 'recycler', companyName: 'GreenCycle Solutions',
    address: { street: 'Madhapur', city: 'Hyderabad', state: 'Telangana', pincode: '500081' }
  });

  await User.create({
    name: 'Ravi Kumar', email: 'user@demo.com', password: 'password123',
    phone: '9000000003', role: 'individual',
    address: { street: 'Banjara Hills', city: 'Hyderabad', state: 'Telangana', pincode: '500034' }
  });

  await User.create({
    name: 'TechCorp Admin', email: 'company@demo.com', password: 'password123',
    phone: '9000000004', role: 'company', companyName: 'TechCorp India Pvt Ltd',
    gstNumber: '36AABCT1234F1ZB',
    address: { street: 'HITEC City', city: 'Hyderabad', state: 'Telangana', pincode: '500081' }
  });

  const facility1 = await Facility.create({
    name: 'GreenCycle Solutions', registeredBy: recycler._id,
    email: 'contact@greencycle.in', phone: '040-12345678',
    address: { street: 'Plot 42, IDA Nacharam', city: 'Hyderabad', state: 'Telangana', pincode: '500076' },
    location: { type: 'Point', coordinates: [78.5467, 17.4065] },
    acceptedWasteTypes: ['mobile_phones','laptops','computers','tablets','batteries','printers','cables_accessories'],
    isVerified: true, isActive: true,
    operatingHours: { weekdays: '9:00 AM - 6:00 PM', weekends: '10:00 AM - 3:00 PM' },
    certifications: [{ name: 'CPCB Authorization', issuedBy: 'Central Pollution Control Board', validUntil: new Date('2026-12-31') }],
    compensationRates: { mobile_phones: 60, laptops: 90, computers: 70, tablets: 65, batteries: 45, printers: 50, cables_accessories: 20 },
    collectionEvents: [{ title: 'E-Waste Collection Drive', date: new Date(Date.now() + 7*24*60*60*1000), location: 'Cyber Towers Lawn, Madhapur', description: 'Drop your old electronics during the weekend drive.', maxCapacity: 500 }]
  });

  await Facility.create({
    name: 'EcoTech Recyclers', registeredBy: admin._id,
    email: 'info@ecotech.in', phone: '040-98765432',
    address: { street: 'Road No. 5, Banjara Hills', city: 'Hyderabad', state: 'Telangana', pincode: '500034' },
    location: { type: 'Point', coordinates: [78.4482, 17.4239] },
    acceptedWasteTypes: ['televisions','refrigerators','washing_machines','air_conditioners','audio_equipment','cameras','other'],
    isVerified: true, isActive: true,
    operatingHours: { weekdays: '8:00 AM - 5:00 PM', weekends: 'Closed' },
    certifications: [{ name: 'ISO 14001', issuedBy: 'Bureau of Indian Standards', validUntil: new Date('2025-12-31') }],
    compensationRates: { televisions: 35, refrigerators: 30, washing_machines: 25, air_conditioners: 40, audio_equipment: 35, cameras: 65, other: 15 }
  });

  await User.findByIdAndUpdate(recycler._id, { facilityId: facility1._id });

  console.log('\n✅ Seed complete!');
  console.log('  admin@demo.com     / password123');
  console.log('  recycler@demo.com  / password123');
  console.log('  user@demo.com      / password123');
  console.log('  company@demo.com   / password123');
  mongoose.disconnect();
};

seed().catch(err => { console.error(err); mongoose.disconnect(); });
