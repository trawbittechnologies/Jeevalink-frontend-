# JeevaLink V2 - Application Lifecycle & Data Flow Documentation

This document describes the end-to-end user workflows, authorization verification pipelines, and blood request lifecycles in JeevaLink V2.

---

## 1. Authentication & Session Flow

```
[ User ] --(Enters Email/Password)--> [ POST /v1/auth/login ]
                                              |
                                      (Validates Credentials)
                                              |
                                     [ Generates JWT Token ]
                                              |
                                              v
                              [ Returns Token & User Details ]
                                              |
                                 (Stored in localStorage)
                                              |
                             [ Included in Bearer Header ]
```

1. **Registration**: User registers with contact information, location (district, city), and ID proof attachments. Account status defaults to `Pending Approval`.
2. **Volunteer Verification**: The local Meghala Volunteer reviews submitted details, verifies age (>= 18 years) and location, and approves the account. An automated password is dispatched to the user's email.
3. **Login & Session Management**: Authenticated requests carry a JWT token (`Bearer <token>`). Frontend Zustand store (`authStore.js`) synchronizes authentication state across all routes.

---

## 2. Blood Request Lifecycle

```
[ User Submission ]
       |
       v
[ POST /v1/user/blood-requests ] --> Status: "Pending Approval"
       |
       v
[ Volunteer Approval ] ------------> Status: "Approved / Published"
       |                                   |
       v                                   v
[ Rejection / Request Edit ]        [ Live Broadcast & Poster Generated ]
                                           |
                                           v
                                    [ Donor Fulfill / Accept ]
                                           |
                                           v
                                    [ Completed / Points Awarded ]
```

1. **Creation**: User creates a blood request specifying patient name, blood group, hospital name, location, units needed, and urgency level (Standard, Critical, Immediate).
2. **Volunteer Review**: Requests enter the pending queue of the assigned Meghala Volunteer.
3. **Publication & Poster Generation**: Once approved by the Volunteer, the request is published to the public request feed, nearby eligible donors receive push notifications, and a downloadable poster canvas is dynamically compiled.
4. **Fulfillment & Rewards**: Donors accept or fulfill the request. Upon verification, reward points are credited to the donor and the volunteer.

---

## 3. Emergency SOS Flow

1. **Trigger**: User taps the floating SOS button on mobile or web dashboard.
2. **Geolocation**: Browser/Device coordinates (latitude, longitude) are extracted.
3. **Broadcasting**: Emergency request is dispatched to `POST /v1/emergency/request`. Nearby available donors within configured search radius (e.g. 15 km) receive high-priority alerts.
4. **Response & Tracking**: Responding donors accept the alert and emergency contact numbers are shared directly with the verified volunteer in charge.

---

## 4. Role Hierarchy & Administrative Scope

| Role | Scope | Permissions |
| :--- | :--- | :--- |
| **Technical Admin** | System-wide | Super Admin management, technical error reports, global metrics, system logs |
| **Super Admin** | District Level | Block Admin management, district donor directory, high-level reporting |
| **Block Admin** | Block Level | Volunteer management, block data analytics, ticket/feedback response |
| **Volunteer** | Meghala Level | Member registration, User verification, blood request approval, poster creation |
| **Unit Squad** | Unit Level | Local donor registration, unit committee management |
| **User** | Self | Blood request creation, donor availability toggle, complaint filing |
