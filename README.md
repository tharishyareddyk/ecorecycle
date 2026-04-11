# EcoRecycle - Full Stack E-Waste Management Platform

## Tech Stack
- **Frontend**: React + Vite + TailwindCSS
- **Backend**: Node.js + Express
- **Database**: MongoDB (Mongoose)
- **Auth**: JWT
- **Maps**: Leaflet.js (OpenStreetMap - free)
- **Notifications**: Socket.io (real-time)

## Project Structure
```
ecorecycle/
├── backend/
│   ├── config/
│   │   └── db.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── roleCheck.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Facility.js
│   │   ├── WasteRequest.js
│   │   ├── TrackingUpdate.js
│   │   └── Notification.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── user.js
│   │   ├── facility.js
│   │   ├── waste.js
│   │   ├── tracking.js
│   │   ├── recycler.js
│   │   └── admin.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── facilityController.js
│   │   ├── wasteController.js
│   │   ├── trackingController.js
│   │   ├── recyclerController.js
│   │   └── adminController.js
│   ├── utils/
│   │   └── generateTrackingId.js
│   ├── .env
│   ├── server.js
│   └── package.json
└── frontend/
    ├── src/
    │   ├── components/
    │   ├── pages/
    │   ├── context/
    │   ├── hooks/
    │   ├── utils/
    │   └── App.jsx
    ├── index.html
    └── package.json
```
