# EcoTrek — Working MERN Prototype

EcoTrek is an AI-assisted smart municipal waste-management and citizen-engagement prototype aligned with SDG 11/12 and SIH-25060.

## Modules included
- React + Vite citizen UI
- JWT/Bcrypt authentication
- AI waste identification endpoint (prototype classifier, AI-ready interface)
- Geo-tagged waste reporting with image upload
- Leaflet/OpenStreetMap incident map
- Doorstep pickup scheduling and status flow
- Training quiz + Eco-Points
- Admin dashboard for reports and pickups
- MongoDB/Mongoose models
- Automatic in-memory fallback if MongoDB is not available, so the demo can run without a database

## Run locally
Requirements: Node.js 18+.

### 1. Backend
```bash
cd backend
cp .env.example .env
npm install
npm run dev
```
API: http://localhost:5000/api/health

### 2. Frontend
Open another terminal:
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```
Open the Vite URL shown in terminal (normally http://localhost:5173).

## MongoDB
For persistent storage, start MongoDB locally or use MongoDB Atlas and put the connection string in `backend/.env` as `MONGO_URI`.

## Admin
Register a user normally. When using MongoDB, change that user's `role` from `Citizen` to `Admin` in the `users` collection, then log in again. The Admin page becomes available.

For a quick prototype demonstration without MongoDB, the app uses an in-memory store. Restarting the backend clears demo data.

## AI note
The endpoint is intentionally separated as `/api/ai/identify`. The current prototype uses a deterministic item-keyword classifier so the full workflow works without downloading a large ML model. For the final research-grade system, replace `controllers/aiController.js` with a TensorFlow.js/MobileNet/custom waste-classification model while keeping the same API response shape.

## Suggested guide demo flow
1. Register/login.
2. Identify waste with an image whose filename contains an item keyword such as `plastic-bottle.jpg`, `battery.jpg`, `banana.jpg`, or `laptop.jpg`.
3. Submit a geo-tagged report and click the map to select coordinates.
4. Schedule a pickup.
5. Complete the segregation quiz and show Eco-Points.
6. Promote a user to Admin in MongoDB and demonstrate report/pickup status management.
