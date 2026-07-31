# JeevaLink V2 - REST API Specification

## Base URL
```http
http://127.0.0.1:8000/api/v1
```

## Authentication Header
All authenticated endpoints require a JWT Bearer Token in the HTTP Authorization header:
```http
Authorization: Bearer <your_jwt_token>
```

---

## 1. Authentication Endpoints

### Register User
- **URL**: `POST /auth/register`
- **Access**: Public
- **Content-Type**: `multipart/form-data`
- **Body Parameters**:
  - `full_name` (string, required)
  - `email` (string, required, unique)
  - `mobile` (string, required)
  - `password` (string, required, min: 6)
  - `city` (string, optional)
  - `district` (string, optional)
  - `blood_group` (string, optional: `A+`, `A-`, `B+`, `B-`, `AB+`, `AB-`, `O+`, `O-`)
  - `dob` (date, optional)
  - `id_proof_front` (file, required, max: 2048KB)
  - `id_proof_back` (file, required, max: 2048KB)
- **Response (201 Created)**:
```json
{
  "success": true,
  "message": "Registration submitted successfully! Pending volunteer approval.",
  "data": {
    "user": {
      "id": 12,
      "full_name": "Athul Krishna",
      "email": "user@example.com",
      "status": "Pending Approval"
    }
  }
}
```

### Login User
- **URL**: `POST /auth/login`
- **Access**: Public
- **Body**:
```json
{
  "email": "user@example.com",
  "password": "secretpassword"
}
```
- **Response (200 OK)**:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 12,
      "full_name": "Athul Krishna",
      "email": "user@example.com",
      "role": "user"
    }
  }
}
```

### Get Authenticated User Profile
- **URL**: `GET /auth/me`
- **Access**: Authenticated (`jwt.auth`)

---

## 2. Technical Admin Endpoints (Level 1)
*Middleware Requirements*: `jwt.auth`, `jwt.role:technical_admin`

- `GET /technical-admin/dashboard` - Get system metrics, tech report summaries.
- `GET /technical-admin/super-admins` - List all Super Admins across districts.
- `POST /technical-admin/super-admins` - Provision a new Super Admin account.
- `GET /technical-admin/activity-logs` - System-wide audit logs.

---

## 3. Super Admin Endpoints (Level 2)
*Middleware Requirements*: `jwt.auth`, `jwt.role:super_admin`

- `GET /super-admin/dashboard` - District analytics & volunteer count.
- `GET /super-admin/block-admins` - List Block Committee Admins.
- `POST /super-admin/block-admins` - Create Block Admin account & generate auto-password.
- `PUT /super-admin/block-admins/{id}` - Update Block Admin profile or status.
- `DELETE /super-admin/block-admins/{id}` - Remove Block Admin.

---

## 4. Block Admin Endpoints (Level 3)
*Middleware Requirements*: `jwt.auth`, `jwt.role:block_admin`

- `GET /block-admin/dashboard` - Block level stats.
- `GET /block-admin/volunteers` - List Meghala Volunteers in Block.
- `POST /block-admin/volunteers` - Register new Meghala Volunteer.

---

## 5. Volunteer Endpoints (Level 4)
*Middleware Requirements*: `jwt.auth`, `jwt.role:volunteer`

- `GET /volunteer/dashboard` - Meghala queue & pending user approvals.
- `POST /volunteer/users` - Register a local user/donor.
- `POST /volunteer/users/{id}/send-otp` - Dispatch OTP to user mobile.
- `POST /volunteer/users/{id}/verify-otp` - Verify OTP for secure profile edit.
- `PATCH /volunteer/users/{id}` - Update user profile after OTP verification.

---

## 6. Blood Requests & Emergency Endpoints

### Create Blood Request
- **URL**: `POST /requests`
- **Access**: Authenticated (`user`, `volunteer`, `block_admin`, `super_admin`)
- **Body**:
```json
{
  "patientName": "John Doe",
  "bloodGroup": "O+",
  "unitsRequired": 2,
  "hospitalName": "City Medical Center",
  "location": "Kozhikode Main",
  "contactNumber": "9876543210",
  "urgencyLevel": "Immediate"
}
```

### Trigger Emergency SOS
- **URL**: `POST /emergency/request`
- **Access**: Authenticated
- **Body**:
```json
{
  "blood_group": "A+",
  "latitude": 11.2588,
  "longitude": 75.7804,
  "radius_km": 15
}
```
