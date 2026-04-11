# EcoRecycle — Complete Setup Guide
# Step-by-Step Instructions to Run the Full Stack Project

=======================================================
## PREREQUISITES — Install these first
=======================================================

1. Node.js (v18 or higher): https://nodejs.org
2. MongoDB (Community Edition): https://www.mongodb.com/try/download/community
3. Git (optional): https://git-scm.com

Verify installations:
  node -v       (should show v18+)
  npm -v        (should show v9+)
  mongod --version

=======================================================
## STEP 1 — Start MongoDB
=======================================================

### Option A: Local MongoDB (recommended for dev)

On Windows:
  - MongoDB is usually set as a Windows Service and auto-starts.
  - Or manually: net start MongoDB
  - Or: mongod --dbpath "C:\data\db"

On macOS:
  brew services start mongodb-community

On Linux (Ubuntu/Debian):
  sudo systemctl start mongod
  sudo systemctl enable mongod

Verify MongoDB is running:
  mongosh
  (You should see a shell. Type `exit` to quit.)

### Option B: MongoDB Atlas (cloud - free tier)
  1. Go to https://cloud.mongodb.com
  2. Create a free cluster
  3. Get your connection string:
     mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/ecorecycle
  4. Replace the MONGO_URI in backend/.env with your Atlas URI

=======================================================
## STEP 2 — Set Up Backend
=======================================================

Open a terminal and run:

  cd ecorecycle/backend
  npm install

This installs:
  - express         (web server)
  - mongoose        (MongoDB ODM)
  - bcryptjs        (password hashing)
  - jsonwebtoken    (JWT auth)
  - socket.io       (real-time notifications)
  - nanoid          (unique ID generation)
  - cors, dotenv, express-validator

=======================================================
## STEP 3 — Configure Environment Variables
=======================================================

The file `backend/.env` already exists. Edit it:

  PORT=5000
  MONGO_URI=mongodb://localhost:27017/ecorecycle
  JWT_SECRET=change_this_to_a_long_random_string_in_production
  JWT_EXPIRE=7d
  NODE_ENV=development
  FRONTEND_URL=http://localhost:5173

IMPORTANT: Change JWT_SECRET to something long and random before deploying!

=======================================================
## STEP 4 — Create MongoDB Indexes (REQUIRED for GPS)
=======================================================

The app uses MongoDB's 2dsphere index for GPS-based facility search.
This is already defined in the models, but run this to ensure:

Open a terminal and run:
  mongosh ecorecycle

Then paste this in the MongoDB shell:
  db.users.createIndex({ location: "2dsphere" })
  db.facilities.createIndex({ location: "2dsphere" })
  db.wasterequests.createIndex({ pickupLocation: "2dsphere" })
  exit

=======================================================
## STEP 5 — Seed the Database (Demo Data)
=======================================================

Create a file: backend/seed.js with this content and run it:

--- COPY THIS INTO backend/seed.js ---

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Facility = require('./models/Facility');

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  // Clear existing data
  await User.deleteMany({});
  await Facility.deleteMany({});

  // Create Admin
  const admin = await User.create({
    name: 'Admin User',
    email: 'admin@demo.com',
    password: 'password123',
    phone: '9000000001',
    role: 'admin',
    address: { city: 'Hyderabad', state: 'Telangana' }
  });
  console.log('Admin created:', admin.email);

  // Create Recycler
  const recycler = await User.create({
    name: 'GreenCycle Manager',
    email: 'recycler@demo.com',
    password: 'password123',
    phone: '9000000002',
    role: 'recycler',
    companyName: 'GreenCycle Solutions',
    address: { street: 'Madhapur', city: 'Hyderabad', state: 'Telangana', pincode: '500081' }
  });
  console.log('Recycler created:', recycler.email);

  // Create Individual User
  const user = await User.create({
    name: 'Ravi Kumar',
    email: 'user@demo.com',
    password: 'password123',
    phone: '9000000003',
    role: 'individual',
    address: { street: 'Banjara Hills', city: 'Hyderabad', state: 'Telangana', pincode: '500034' }
  });
  console.log('Individual user created:', user.email);

  // Create Company User
  const company = await User.create({
    name: 'TechCorp Admin',
    email: 'company@demo.com',
    password: 'password123',
    phone: '9000000004',
    role: 'company',
    companyName: 'TechCorp India Pvt Ltd',
    gstNumber: '36AABCT1234F1ZB',
    address: { street: 'HITEC City', city: 'Hyderabad', state: 'Telangana', pincode: '500081' }
  });
  console.log('Company user created:', company.email);

  // Create Facilities
  const facility1 = await Facility.create({
    name: 'GreenCycle Solutions',
    registeredBy: recycler._id,
    email: 'contact@greencycle.in',
    phone: '040-12345678',
    address: { street: 'Plot 42, IDA Nacharam', city: 'Hyderabad', state: 'Telangana', pincode: '500076' },
    location: { type: 'Point', coordinates: [78.5467, 17.4065] },
    acceptedWasteTypes: ['mobile_phones', 'laptops', 'computers', 'tablets', 'batteries', 'printers', 'cables_accessories'],
    isVerified: true,
    isActive: true,
    operatingHours: { weekdays: '9:00 AM - 6:00 PM', weekends: '10:00 AM - 3:00 PM' },
    certifications: [{ name: 'CPCB Authorization', issuedBy: 'Central Pollution Control Board', validUntil: new Date('2026-12-31') }],
    compensationRates: { mobile_phones: 60, laptops: 90, computers: 70, tablets: 65, batteries: 45, printers: 50, cables_accessories: 20 },
    collectionEvents: [{
      title: 'E-Waste Collection Drive - Madhapur',
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      location: 'Cyber Towers Lawn, Madhapur',
      description: 'Drop your old electronics during the weekend drive. Free pickup within 2km radius.',
      maxCapacity: 500
    }]
  });
  console.log('Facility 1 created:', facility1.name);

  const facility2 = await Facility.create({
    name: 'EcoTech Recyclers',
    registeredBy: admin._id,
    email: 'info@ecotech.in',
    phone: '040-98765432',
    address: { street: 'Road No. 5, Banjara Hills', city: 'Hyderabad', state: 'Telangana', pincode: '500034' },
    location: { type: 'Point', coordinates: [78.4482, 17.4239] },
    acceptedWasteTypes: ['televisions', 'refrigerators', 'washing_machines', 'air_conditioners', 'audio_equipment', 'cameras', 'other'],
    isVerified: true,
    isActive: true,
    operatingHours: { weekdays: '8:00 AM - 5:00 PM', weekends: 'Closed' },
    certifications: [{ name: 'ISO 14001', issuedBy: 'Bureau of Indian Standards', validUntil: new Date('2025-12-31') }],
    compensationRates: { televisions: 35, refrigerators: 30, washing_machines: 25, air_conditioners: 40, audio_equipment: 35, cameras: 65, other: 15 }
  });
  console.log('Facility 2 created:', facility2.name);

  // Update recycler with facilityId
  await User.findByIdAndUpdate(recycler._id, { facilityId: facility1._id });

  console.log('\n✅ Seed complete!');
  console.log('Login credentials:');
  console.log('  Admin:   admin@demo.com / password123');
  console.log('  Recycler: recycler@demo.com / password123');
  console.log('  User:    user@demo.com / password123');
  console.log('  Company: company@demo.com / password123');

  mongoose.disconnect();
};

seed().catch(err => { console.error(err); mongoose.disconnect(); });

--- END OF seed.js ---

Run the seed file:
  node seed.js


=======================================================
## STEP 6 — Start the Backend
=======================================================

In the backend folder:

For development (auto-restart on changes):
  npm run dev

For production:
  npm start

You should see:
  ✅ MongoDB Connected: localhost
  🚀 EcoRecycle server running on http://localhost:5000

Test it:
  Open your browser → http://localhost:5000/api/health
  You should see: {"status":"ok","message":"EcoRecycle API is running"}

=======================================================
## STEP 7 — Set Up Frontend
=======================================================

Open a NEW terminal (keep backend running):

  cd ecorecycle/frontend
  npm install

This installs:
  - react, react-dom
  - react-router-dom  (routing)
  - axios             (API calls)
  - leaflet + react-leaflet  (maps)
  - socket.io-client  (real-time)
  - tailwindcss       (styling)
  - vite              (build tool)

=======================================================
## STEP 8 — Start the Frontend
=======================================================

  npm run dev

You should see:
  VITE v5.x.x  ready in XXX ms
  ➜  Local:   http://localhost:5173/

Open browser → http://localhost:5173

=======================================================
## STEP 9 — Test the Application
=======================================================

1. LANDING PAGE
   → Visit http://localhost:5173
   → You should see the EcoRecycle landing page

2. REGISTER & LOGIN
   → Click "Get Started" to register
   → Or use demo accounts (after seeding):
     user@demo.com / password123
     recycler@demo.com / password123
     admin@demo.com / password123

3. USER FLOW (login as user@demo.com)
   a. Dashboard → See stats
   b. Find Facilities → GPS map with nearby facilities
   c. Submit E-Waste → 4-step form
      - Select facility
      - Add items (choose category, weight)
      - Schedule (date, drop-off or pickup)
      - Review & submit
   d. My Requests → See your request (status: Pending)
   e. Notifications → Empty for now

4. RECYCLER FLOW (login as recycler@demo.com)
   a. Recycler Dashboard → See stats
   b. Requests → See the submitted request
   c. Click on the request
   d. Click "Confirm Request" → status becomes Confirmed
   e. Click "Mark as Collected & Generate Tracking ID"
      → Enter actual weights
      → TRACKING ID IS NOW GENERATED (e.g. ECO-LQ3KF2-AB7C)
      → User receives notification
   f. Click "Mark as Processing"
   g. Enter final compensation → "Mark as Recycled"

5. TRACK WASTE (public page)
   → Go to http://localhost:5173/track
   → Enter the Tracking ID
   → See full lifecycle timeline

6. ADMIN FLOW (login as admin@demo.com)
   a. Dashboard → System stats
   b. Users → Manage all users
   c. Facilities → Verify/unverify facilities
   d. Requests → View all requests

=======================================================
## PROJECT STRUCTURE SUMMARY
=======================================================

ecorecycle/
├── backend/
│   ├── .env                    ← Configuration
│   ├── server.js               ← Main entry point
│   ├── config/db.js            ← MongoDB connection
│   ├── middleware/
│   │   ├── auth.js             ← JWT verification
│   │   └── roleCheck.js        ← Role-based access
│   ├── models/
│   │   ├── User.js             ← User schema
│   │   ├── Facility.js         ← Facility schema
│   │   ├── WasteRequest.js     ← Request schema
│   │   └── Notification.js     ← Notification schema
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── facilityController.js
│   │   ├── wasteController.js
│   │   ├── recyclerController.js
│   │   └── adminController.js
│   ├── routes/
│   │   ├── auth.js             → POST /api/auth/register, /login, GET /me
│   │   ├── user.js             → PUT /api/users/profile, GET /history, notifications
│   │   ├── facility.js         → GET /api/facilities/nearby, POST, PUT
│   │   ├── waste.js            → POST /api/waste, GET /my, /track/:id
│   │   ├── recycler.js         → GET/PUT /api/recycler/requests
│   │   └── admin.js            → GET /api/admin/stats, users, facilities
│   └── utils/
│       └── generateTrackingId.js
│
└── frontend/
    └── src/
        ├── pages/
        │   ├── Landing.jsx
        │   ├── Login.jsx
        │   ├── Register.jsx
        │   ├── Dashboard.jsx
        │   ├── SubmitWaste.jsx     ← 4-step form
        │   ├── FindFacilities.jsx  ← GPS map
        │   ├── TrackWaste.jsx      ← Public tracking page
        │   ├── MyRequests.jsx
        │   ├── Notifications.jsx
        │   ├── Profile.jsx
        │   ├── recycler/
        │   │   ├── RecyclerDashboard.jsx
        │   │   ├── RecyclerRequests.jsx
        │   │   ├── RecyclerRequestDetail.jsx  ← Generates Tracking ID
        │   │   └── FacilitySetup.jsx
        │   └── admin/
        │       ├── AdminDashboard.jsx
        │       ├── AdminUsers.jsx
        │       ├── AdminFacilities.jsx
        │       └── AdminRequests.jsx
        ├── components/
        │   ├── Layout.jsx          ← Sidebar navigation
        │   ├── StatusBadge.jsx
        │   └── TrackingTimeline.jsx
        ├── context/
        │   ├── AuthContext.jsx     ← Auth state
        │   └── SocketContext.jsx   ← Real-time
        └── utils/
            ├── api.js              ← Axios instance
            └── constants.js        ← Waste categories, helpers

=======================================================
## API ENDPOINTS REFERENCE
=======================================================

AUTH:
  POST   /api/auth/register
  POST   /api/auth/login
  GET    /api/auth/me

USER:
  PUT    /api/users/profile
  PUT    /api/users/password
  GET    /api/users/notifications
  PUT    /api/users/notifications/read-all
  GET    /api/users/history

FACILITIES:
  GET    /api/facilities                    → All facilities
  GET    /api/facilities/nearby?lat=&lng=   → GPS-based search
  GET    /api/facilities/:id
  POST   /api/facilities                    → Create (recycler)
  PUT    /api/facilities/:id                → Update (recycler)
  POST   /api/facilities/:id/events         → Add collection event

WASTE:
  POST   /api/waste                         → Submit request
  GET    /api/waste/my                      → User's requests
  GET    /api/waste/track/:trackingId       → Public tracking (no auth)
  GET    /api/waste/:id
  PUT    /api/waste/:id/cancel

RECYCLER:
  GET    /api/recycler/requests             → All facility requests
  GET    /api/recycler/stats
  PUT    /api/recycler/requests/:id/confirm → Accept request
  PUT    /api/recycler/requests/:id/collect → Mark collected + generate Tracking ID
  PUT    /api/recycler/requests/:id/process → Mark processing
  PUT    /api/recycler/requests/:id/recycle → Mark recycled + set compensation

ADMIN:
  GET    /api/admin/stats
  GET    /api/admin/users
  PUT    /api/admin/users/:id/toggle
  PUT    /api/admin/facilities/:id/verify
  GET    /api/admin/requests

=======================================================
## COMMON ISSUES & FIXES
=======================================================

Q: MongoDB connection refused
A: Make sure mongod is running: sudo systemctl start mongod

Q: CORS error in browser
A: Make sure backend .env FRONTEND_URL=http://localhost:5173

Q: Map not showing
A: The leaflet CSS is loaded from unpkg CDN in index.html. Ensure internet access.

Q: GPS not working
A: Browsers require HTTPS for geolocation except on localhost. This works on localhost.

Q: "Facility not found" on Submit page
A: Run the seed.js file first to create demo facilities.

Q: Tracking ID not showing
A: The tracking ID is ONLY generated when the recycler clicks "Mark as Collected". 
   It's not auto-generated on submission — this is by design.

=======================================================
## PRODUCTION DEPLOYMENT NOTES
=======================================================

1. Backend: Deploy to Railway, Render, or AWS EC2
   - Set NODE_ENV=production
   - Set MONGO_URI to Atlas connection string
   - Set JWT_SECRET to a long random string

2. Frontend: Deploy to Vercel or Netlify
   - Update vite.config.js proxy target to your backend URL
   - Or set VITE_API_URL env variable and update src/utils/api.js

3. MongoDB: Use MongoDB Atlas free tier for production

=======================================================
