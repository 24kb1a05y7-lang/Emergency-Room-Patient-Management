# Emergency Room Patient Management System

A React.js + Node.js/Express web version of the original C-based Emergency Room Patient Management System.

## Features
- Add/admit patients
- Severity levels 1–5 (1 = highest urgency)
- Priority queue behavior
- Discharge highest-priority patient
- Waiting-patient dashboard
- Search and severity filtering
- Patient history
- Responsive hospital-style UI
- REST API with an in-memory store by default
- Optional MongoDB persistence

## Tech Stack
Frontend: React, Vite, CSS
Backend: Node.js, Express
Database: MongoDB (optional; project runs without it)

## Run

### 1. Backend
```bash
cd server
npm install
npm run dev
```
Server runs on http://localhost:5000

### 2. Frontend
Open another terminal:
```bash
cd client
npm install
npm run dev
```
Open the Vite URL shown in the terminal (normally http://localhost:5173).

## MongoDB (optional)
Copy `server/.env.example` to `server/.env` and set:
MONGODB_URI=mongodb://127.0.0.1:27017/emergency_room

If MongoDB is unavailable, the server automatically uses in-memory data so the project can still be demonstrated.

## Original project mapping
- C `admitPatient()` -> POST /api/patients
- C min-heap / priority queue -> server priority ordering
- C `dischargePatient()` -> POST /api/patients/:id/discharge
- C `showPatients()` -> GET /api/patients?status=waiting

## Academic project
Original title: Emergency Room Patient Management System
Department: Computer Science Engineering
