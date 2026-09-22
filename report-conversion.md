# Converting the Academic Project to React.js

## 1. Project Title
Emergency Room Patient Management System

## 2. New Technology
The original implementation used C, structures, a priority queue and min-heap operations. The converted implementation uses React.js for the web interface and Node.js/Express for the API. MongoDB can be used for persistent patient records.

## 3. Core Logic
Severity remains 1–5, where 1 represents the highest urgency. Patients are ordered first by severity and then by admission time. This preserves the purpose of the original min-heap priority queue.

## 4. Main Modules
- Dashboard
- Patient admission
- Priority queue
- Patient discharge
- Waiting patient list
- Search/filter
- Patient history
- REST API
- Optional MongoDB persistence

## 5. Mapping from C to React/Web
- `struct Patient` -> JavaScript patient object / MongoDB Patient model
- `PriorityQueue` -> server-side severity ordering
- `admitPatient()` -> POST `/api/patients`
- `dischargePatient()` -> POST `/api/patients/:id/discharge`
- `showPatients()` -> GET `/api/patients?status=waiting`
- Console output -> React dashboard/table

## 6. Future Extensions
The original project identifies GUI integration, database support, multi-user access, patient history/reporting and automated severity assessment as possible future enhancements. These can be added to this web version as later modules.
