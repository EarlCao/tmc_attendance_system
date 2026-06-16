# TMC Choir Attendance System — API Documentation

**Base URL:** `http://localhost:3002`

---

## Table of Contents

- [Authentication](#authentication)
- [Rate Limiting](#rate-limiting)
- [Response Format](#response-format)
- [Endpoints](#endpoints)
  - [Health Check](#health-check)
  - [Auth](#auth)
  - [Semesters](#semesters)
  - [Members](#members)
  - [Sessions](#sessions)
  - [Attendance](#attendance)
  - [Excuses](#excuses)
  - [Officers](#officers)
  - [Judges](#judges)
  - [Auditions](#auditions)
  - [Rules & Regulations](#rules--regulations)

---

## Authentication

All endpoints except `/health` and `/api/auth/login` require a valid JWT token.

Include the token in the `Authorization` header:

```
Authorization: Bearer <your_jwt_token>
```

Tokens are obtained from the `/api/auth/login` endpoint and expire based on the `JWT_EXPIRES_IN` environment variable (default: `7d`).

---

## Rate Limiting

| Scope | Limit | Window |
|---|---|---|
| **Global** (`/api/*`) | 150 requests per IP | 15 minutes |
| **Login** (`/api/auth/login`) | 10 requests per IP | 15 minutes |

Rate limit headers are included in responses (`RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`).

---

## Response Format

All responses follow this structure:

### Success

```json
{
  "status": "success",
  "data": { ... }
}
```

### Error

```json
{
  "status": "fail",
  "message": "Descriptive error message"
}
```

```json
{
  "status": "error",
  "message": "Internal server error"
}
```

---

## Endpoints

---

### Health Check

#### `GET /health`

> **Auth required:** No

Check if the server is running.

**Response:**
```json
{
  "status": "ok"
}
```

---

### Auth

#### `POST /api/auth/login`

> **Auth required:** No  
> **Rate limited:** 10 requests / 15 min per IP

Authenticate a user and receive a JWT token.

**Request Body:**
```json
{
  "username": "admin",
  "password": "<your-password>"
}
```

> The seed admin password is set via the `SEED_ADMIN_PASSWORD` environment
> variable. Auto-generated member accounts receive a unique one-time temporary
> password returned once in the create-account response (see the Accounts
> endpoints) — there is no shared default password.

**Success Response (200):**
```json
{
  "status": "success",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "data": {
    "user": {
      "id": 1,
      "username": "admin",
      "email": "admin@tmc.com",
      "role": "ADMIN",
      "isActive": true,
      "createdAt": "2026-05-27T00:00:00.000Z",
      "updatedAt": "2026-05-27T00:00:00.000Z"
    }
  }
}
```

**Error Responses:**
- `400` — Missing username or password
- `401` — Incorrect credentials

---

#### `GET /api/auth/me`

> **Auth required:** Yes

Get the currently authenticated user's profile.

**Success Response (200):**
```json
{
  "status": "success",
  "data": {
    "user": {
      "id": 1,
      "username": "admin",
      "email": "admin@tmc.com",
      "role": "ADMIN",
      "isActive": true,
      "createdAt": "2026-05-27T00:00:00.000Z",
      "updatedAt": "2026-05-27T00:00:00.000Z"
    }
  }
}
```

---

### Semesters

> **Auth required:** Yes (Admin only)

#### `GET /api/semesters`

Get all semesters ordered by start date (descending).

**Success Response (200):**
```json
{
  "status": "success",
  "data": {
    "semesters": [
      {
        "id": 1,
        "name": "1st Semester",
        "startDate": "2026-08-01T00:00:00.000Z",
        "endDate": "2026-12-15T00:00:00.000Z",
        "notes": "Initial semester setup",
        "createdAt": "2026-05-27T00:00:00.000Z",
        "updatedAt": "2026-05-27T00:00:00.000Z"
      }
    ]
  }
}
```

---

#### `POST /api/semesters`

Create a new semester.

**Request Body:**
```json
{
  "name": "2nd Semester SY 2025-2026",
  "startDate": "2026-01-06",
  "endDate": "2026-05-30"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | string | ✅ | Semester name |
| `startDate` | string (date) | ✅ | Start date |
| `endDate` | string (date) | ❌ | End date |

**Success Response (201):**
```json
{
  "status": "success",
  "data": {
    "semester": { ... }
  }
}
```

---

#### `PUT /api/semesters/:id`

Update a semester by ID.

**URL Params:** `id` — Semester ID (integer)

**Request Body:**
```json
{
  "name": "Updated Name",
  "startDate": "2026-01-06",
  "endDate": "2026-06-15"
}
```

**Success Response (200):** Updated semester object.

---

#### `POST /api/semesters/:id/end`

End a semester (sets `endDate` to now).

**URL Params:** `id` — Semester ID (integer)

**Success Response (200):** Updated semester with `endDate` set.

---

#### `DELETE /api/semesters/:id`

Delete a semester by ID.

**URL Params:** `id` — Semester ID (integer)

**Success Response (200):**
```json
{
  "status": "success",
  "message": "Semester deleted successfully",
  "data": null
}
```

---

### Members

> **Auth required:** Yes (Admin only)

#### `GET /api/members`

Get all members ordered by full name (ascending).

**Success Response (200):**
```json
{
  "status": "success",
  "data": {
    "members": [
      {
        "id": 1,
        "fullName": "Earl Francis Cao",
        "voiceType": "BASS",
        "contactNo": "09201234016",
        "address": "Trinidad, Bohol",
        "religion": "Roman Catholic",
        "course": "BSED Mathematics",
        "yearLevel": "3rd Year",
        "emailOrFacebook": "earl.cao@email.com",
        "status": "ACTIVE",
        "notes": "President",
        "createdAt": "2026-05-27T00:00:00.000Z",
        "updatedAt": "2026-05-27T00:00:00.000Z"
      }
    ]
  }
}
```

---

#### `POST /api/members`

Create a new member.

**Request Body:**
```json
{
  "name": "Maria Santos",
  "voicePart": "Soprano",
  "course": "BSED Music",
  "yearLevel": "3rd Year",
  "status": "active",
  "religionDenomination": "Roman Catholic",
  "email": "maria@email.com",
  "phone": "09171234001",
  "address": "Trinidad, Bohol",
  "notes": ""
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `name` / `fullName` | string | ✅ | Full name |
| `voicePart` / `voiceType` | string | ✅ | `Soprano`, `Alto`, `Tenor`, or `Bass` |
| `course` | string | ✅ | Course name |
| `yearLevel` | string | ✅ | e.g. `1st Year` |
| `status` | string | ✅ | `active` or `inactive` |
| `religionDenomination` / `religion` | string | ❌ | Religion |
| `email` / `emailOrFacebook` | string | ❌ | Email or Facebook account |
| `phone` / `contactNo` | string | ❌ | Contact number |
| `address` | string | ❌ | Address |
| `notes` | string | ❌ | Additional notes |

> **Note:** The controller accepts both frontend-friendly names (`name`, `voicePart`, `phone`, `email`, `religionDenomination`) and database field names (`fullName`, `voiceType`, `contactNo`, `emailOrFacebook`, `religion`).

**Success Response (201):** Created member object.

---

#### `PUT /api/members/:id`

Update a member by ID.

**URL Params:** `id` — Member ID (integer)

**Request Body:** Same fields as `POST` (all optional for partial updates).

**Success Response (200):** Updated member object.

---

#### `DELETE /api/members/:id`

Delete a member by ID.

**URL Params:** `id` — Member ID (integer)

**Success Response (204):** No content.

---

#### `GET /api/members/search`

Search members by name.

**Query Params:**

| Param | Type | Required | Description |
|---|---|---|---|
| `query` | string | ✅ | Search term (matched against `fullName`) |

**Success Response (200):** Filtered array of members.

---

#### `GET /api/members/filter`

Filter members by voice type and/or status.

**Query Params:**

| Param | Type | Required | Description |
|---|---|---|---|
| `voiceType` | string | ❌ | `SOPRANO`, `ALTO`, `TENOR`, or `BASS` |
| `status` | string | ❌ | `ACTIVE` or `INACTIVE` |

**Success Response (200):** Filtered array of members.

---

### Sessions

> **Auth required:** Yes (Admin only)

#### `GET /api/sessions`

Get all sessions with attendance summary counts.

**Query Params:**

| Param | Type | Required | Description |
|---|---|---|---|
| `semesterId` | integer | ❌ | Filter by semester |
| `type` | string | ❌ | Filter by type: `Practice`, `Performance`, `Audition`, `Meeting`, `Other` |
| `search` | string | ❌ | Search in title, location, description |

**Success Response (200):**
```json
{
  "status": "success",
  "data": {
    "sessions": [
      {
        "id": 1,
        "semesterId": 1,
        "title": "Weekly Choir Practice",
        "sessionDate": "2025-08-04T00:00:00.000Z",
        "description": "Opening rehearsal",
        "type": "Practice",
        "location": "TMC Music Room",
        "createdAt": "2026-05-27T00:00:00.000Z",
        "counts": {
          "Present": 12,
          "Late": 1,
          "Absent": 3,
          "Excused": 0
        }
      }
    ]
  }
}
```

---

#### `GET /api/sessions/:id`

Get a single session with full attendance records (including member details).

**URL Params:** `id` — Session ID (integer)

**Success Response (200):** Session object with nested attendance and member data.

**Error:** `404` — Session not found.

---

#### `POST /api/sessions`

Create a new attendance session. Automatically generates `PRESENT` attendance records for all active members.

**Request Body:**
```json
{
  "semesterId": 1,
  "title": "Weekly Practice",
  "date": "2025-10-06",
  "type": "Practice",
  "location": "TMC Music Room",
  "notes": "Opening rehearsal"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `semesterId` | integer | ✅ | Associated semester |
| `title` | string | ✅ | Session title |
| `date` | string (date) | ✅ | Session date |
| `type` | string | ❌ | Default: `Practice` |
| `location` | string | ❌ | Default: `TMC Music Room` |
| `notes` / `description` | string | ❌ | Session description |

**Success Response (201):** Created session object.

---

#### `PUT /api/sessions/:id`

Update a session by ID.

**URL Params:** `id` — Session ID (integer)

**Request Body:** Same fields as `POST` (all optional).

**Success Response (200):** Updated session object.

---

#### `DELETE /api/sessions/:id`

Delete a session and all associated attendance records.

**URL Params:** `id` — Session ID (integer)

**Success Response (200):**
```json
{
  "status": "success",
  "message": "Session deleted successfully",
  "data": null
}
```

---

### Attendance

> **Auth required:** Yes (Admin only)

#### `GET /api/attendance/session/:sessionId`

Get all attendance records for a specific session.

**URL Params:** `sessionId` — Session ID (integer)

**Success Response (200):**
```json
{
  "status": "success",
  "data": {
    "records": [
      {
        "id": 1,
        "sessionId": 1,
        "memberId": 1,
        "memberName": "Earl Francis Cao",
        "voicePart": "Bass",
        "status": "Present",
        "notes": "",
        "excuseStatus": "Pending",
        "excuseReason": ""
      }
    ]
  }
}
```

---

#### `POST /api/attendance/session/:sessionId`

Bulk save/upsert attendance records for a session. Uses a Prisma transaction.

**URL Params:** `sessionId` — Session ID (integer)

**Request Body:**
```json
{
  "records": [
    {
      "memberId": 1,
      "status": "Present",
      "notes": ""
    },
    {
      "memberId": 2,
      "status": "Late",
      "notes": "Arrived after warm-up"
    },
    {
      "memberId": 3,
      "status": "Excused",
      "excuseReason": "Medical appointment",
      "excuseStatus": "Pending"
    }
  ]
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `records` | array | ✅ | Array of attendance records |
| `records[].memberId` | integer | ✅ | Member ID |
| `records[].status` | string | ✅ | `Present`, `Late`, `Absent`, or `Excused` |
| `records[].notes` | string | ❌ | Attendance note |
| `records[].excuseReason` | string | ❌ | Reason for excused absence |
| `records[].excuseStatus` | string | ❌ | `Pending`, `Approved`, `Rejected` |

**Success Response (200):**
```json
{
  "status": "success",
  "message": "Attendance saved successfully"
}
```

---

### Excuses

> **Auth required:** Yes (Admin only)

#### `GET /api/attendance/excuses`

Get all excused attendance records for review.

**Query Params:**

| Param | Type | Required | Description |
|---|---|---|---|
| `status` | string | ❌ | `Pending`, `Approved`, or `Rejected` |
| `voicePart` | string | ❌ | `Soprano`, `Alto`, `Tenor`, `Bass`, or `All` |

**Success Response (200):**
```json
{
  "status": "success",
  "data": {
    "excuses": [
      {
        "id": 1,
        "memberId": 4,
        "memberName": "Grace Dela Cruz",
        "voicePart": "Soprano",
        "date": "2025-08-25",
        "reason": "Family emergency",
        "status": "Pending",
        "submittedAt": "2025-08-24",
        "reviewedAt": null,
        "notes": ""
      }
    ]
  }
}
```

---

#### `PUT /api/attendance/excuses/:id`

Approve or reject an excuse request.

**URL Params:** `id` — Attendance Record ID (integer)

**Request Body:**
```json
{
  "status": "Approved",
  "notes": "Medical certificate verified."
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `status` | string | ✅ | `Approved` or `Rejected` |
| `notes` | string | ❌ | Admin review notes |

**Success Response (200):** Updated attendance record.

**Error:** `404` — Record not found.

---

### Officers

> **Auth required:** Yes (Admin only)

#### `GET /api/officers`

Get all officers.

**Query Params:**

| Param | Type | Required | Description |
|---|---|---|---|
| `semesterId` | integer | ❌ | Filter by semester |

**Success Response (200):**
```json
{
  "status": "success",
  "data": {
    "officers": [
      {
        "id": 1,
        "semesterId": 1,
        "fullName": "Earl Francis Cao",
        "position": "President",
        "contactNo": "09201234016",
        "email": "earl.cao@email.com",
        "facebookAccount": "",
        "dutiesNotes": "Primary contact for semester planning",
        "status": "ACTIVE",
        "createdAt": "2026-05-27T00:00:00.000Z",
        "semester": { ... }
      }
    ]
  }
}
```

---

#### `POST /api/officers`

Add a new officer.

**Request Body:**
```json
{
  "semesterId": 1,
  "fullName": "Earl Francis Cao",
  "position": "President",
  "contactNo": "09201234016",
  "email": "earl.cao@email.com",
  "facebookAccount": "",
  "dutiesNotes": "Primary contact",
  "status": "active"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `semesterId` | integer | ✅ | Associated semester |
| `fullName` | string | ✅ | Officer full name |
| `position` | string | ✅ | e.g. `President`, `Secretary` |
| `contactNo` | string | ❌ | Contact number |
| `email` | string | ❌ | Email address |
| `facebookAccount` | string | ❌ | Facebook account |
| `dutiesNotes` | string | ❌ | Duties and responsibilities |
| `status` | string | ❌ | Default: `ACTIVE` |

**Success Response (201):** Created officer object.

---

#### `PUT /api/officers/:id`

Update an officer by ID.

**URL Params:** `id` — Officer ID (integer)

**Request Body:** Same fields as `POST` (all optional).

**Success Response (200):** Updated officer object.

---

#### `DELETE /api/officers/:id`

Delete an officer assignment.

**URL Params:** `id` — Officer ID (integer)

**Success Response (200):**
```json
{
  "status": "success",
  "message": "Officer deleted successfully",
  "data": null
}
```

---

### Judges

> **Auth required:** Yes (Admin only)

#### `GET /api/judges`

Get all audition judges with evaluation count.

**Success Response (200):**
```json
{
  "status": "success",
  "data": {
    "judges": [
      {
        "id": 1,
        "name": "Dr. Melanie Uy",
        "title": "Professor of Music",
        "specialization": "Vocal Performance",
        "contact": "09171110001",
        "email": "melanie.uy@tmc.edu.ph",
        "facebookAccount": "",
        "notes": "",
        "ratingsGiven": 12,
        "createdAt": "2026-05-27T00:00:00.000Z"
      }
    ]
  }
}
```

---

#### `POST /api/judges`

Add a new judge.

**Request Body:**
```json
{
  "name": "Dr. Melanie Uy",
  "title": "Professor of Music",
  "specialization": "Vocal Performance",
  "contact": "09171110001",
  "email": "melanie.uy@tmc.edu.ph",
  "notes": ""
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `name` / `fullName` | string | ✅ | Full name |
| `title` / `titleRole` | string | ❌ | Title or role |
| `specialization` | string | ❌ | Area of expertise |
| `contact` / `contactNo` | string | ❌ | Contact number |
| `email` | string | ❌ | Email address |
| `facebookAccount` | string | ❌ | Facebook account |
| `notes` | string | ❌ | Additional notes |

**Success Response (201):** Created judge object.

---

#### `PUT /api/judges/:id`

Update a judge by ID.

**URL Params:** `id` — Judge ID (integer)

**Request Body:** Same fields as `POST` (all optional).

**Success Response (200):** Updated judge object.

---

#### `DELETE /api/judges/:id`

Delete a judge and all associated evaluations/scores.

**URL Params:** `id` — Judge ID (integer)

**Success Response (200):**
```json
{
  "status": "success",
  "message": "Judge deleted successfully",
  "data": null
}
```

---

### Auditions

> **Auth required:** Yes (Admin only)

#### `GET /api/auditions`

Get all auditionees with judge evaluations and ratings.

**Query Params:**

| Param | Type | Required | Description |
|---|---|---|---|
| `semesterId` | integer | ❌ | Filter by semester |
| `status` | string | ❌ | `Passed`, `Failed`, `Pending`, or `All` |
| `targetPart` | string | ❌ | `Soprano`, `Alto`, `Tenor`, `Bass`, or `All` |
| `search` | string | ❌ | Search by name, email, course |

**Success Response (200):**
```json
{
  "status": "success",
  "data": {
    "auditionees": [
      {
        "id": 1,
        "name": "Bianca Lim",
        "targetPart": "Soprano",
        "age": 19,
        "course": "BEED",
        "yearLevel": "2nd Year",
        "religionDenomination": "Roman Catholic",
        "contact": "09271110001",
        "email": "bianca@example.com",
        "address": "Trinidad, Bohol",
        "notes": "Clear soprano tone",
        "status": "Passed",
        "auditionDate": "2025-08-02",
        "averageRating": 8.5,
        "ratings": [
          {
            "judgeId": 1,
            "judgeName": "Dr. Melanie Uy",
            "vocalQuality": 9,
            "pitchAccuracy": 8,
            "tone": 9,
            "rhythm": 8,
            "confidence": 9,
            "stagePresence": 8,
            "comments": "Excellent range, clean head voice."
          }
        ]
      }
    ]
  }
}
```

---

#### `POST /api/auditions`

Register a new auditionee.

**Request Body:**
```json
{
  "semesterId": 1,
  "name": "Bianca Lim",
  "targetPart": "Soprano",
  "age": 19,
  "course": "BEED",
  "yearLevel": "2nd Year",
  "religionDenomination": "Roman Catholic",
  "contact": "09271110001",
  "email": "bianca@example.com",
  "address": "Trinidad, Bohol",
  "notes": "Clear soprano tone",
  "auditionDate": "2025-08-02"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `semesterId` | integer | ✅ | Associated semester |
| `name` / `fullName` | string | ✅ | Full name |
| `auditionDate` | string (date) | ✅ | Audition date |
| `targetPart` / `targetVoiceType` | string | ❌ | Default: `Soprano` |
| `age` | integer | ❌ | Age |
| `course` | string | ❌ | Course |
| `yearLevel` | string | ❌ | Year level |
| `religionDenomination` / `religion` | string | ❌ | Religion |
| `contact` / `contactNo` | string | ❌ | Contact number |
| `email` | string | ❌ | Email address |
| `address` | string | ❌ | Address |
| `notes` / `registryNotes` | string | ❌ | Notes |
| `status` | string | ❌ | Default: `Pending` |

**Success Response (201):** Created auditionee object.

---

#### `PUT /api/auditions/:id`

Update an auditionee's registry info.

**URL Params:** `id` — Auditionee ID (integer)

**Request Body:** Same fields as `POST` (all optional).

**Success Response (200):** Updated auditionee object.

---

#### `DELETE /api/auditions/:id`

Delete an auditionee and all associated evaluations/scores.

**URL Params:** `id` — Auditionee ID (integer)

**Success Response (200):**
```json
{
  "status": "success",
  "message": "Auditionee deleted successfully",
  "data": null
}
```

---

#### `PUT /api/auditions/:id/status`

Change an auditionee's status (Passed / Failed / Pending).

**URL Params:** `id` — Auditionee ID (integer)

**Request Body:**
```json
{
  "status": "Passed"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `status` | string | ✅ | `Passed`, `Failed`, or `Pending` |

**Success Response (200):** Updated auditionee object.

---

#### `POST /api/auditions/evaluations`

Add or update a judge's evaluation for an auditionee. Automatically recalculates the auditionee's `averageRating`.

**Request Body:**
```json
{
  "auditioneeId": 1,
  "judgeId": 1,
  "vocalQuality": 9,
  "pitchAccuracy": 8,
  "tone": 9,
  "rhythm": 8,
  "confidence": 9,
  "stagePresence": 8,
  "comments": "Excellent range, clean head voice."
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `auditioneeId` | integer | ✅ | Auditionee ID |
| `judgeId` | integer | ✅ | Judge ID |
| `vocalQuality` | number (0-10) | ❌ | Vocal quality score |
| `pitchAccuracy` | number (0-10) | ❌ | Pitch accuracy score |
| `tone` | number (0-10) | ❌ | Tone quality score |
| `rhythm` | number (0-10) | ❌ | Rhythm score |
| `confidence` | number (0-10) | ❌ | Confidence score |
| `stagePresence` | number (0-10) | ❌ | Stage presence score |
| `comments` | string | ❌ | Judge comments |
| `overallNotes` | string | ❌ | Overall evaluation notes |

> **Note:** If an evaluation for the same auditionee + judge already exists, it will be updated (upsert).

**Success Response (200):**
```json
{
  "status": "success",
  "message": "Evaluation saved successfully",
  "data": {
    "averageRating": 8.5
  }
}
```

---

### Rules & Regulations

> **Auth required:** Yes (Admin only)

#### `GET /api/rules`

Get all choir rules and regulations.

**Query Params:**

| Param | Type | Required | Description |
|---|---|---|---|
| `semesterId` | integer | ❌ | Filter by semester |

**Success Response (200):**
```json
{
  "status": "success",
  "data": {
    "rules": [
      {
        "id": 1,
        "semesterId": 1,
        "title": "Attendance Policy",
        "description": "Members must attend at least 80% of rehearsals.",
        "content": "Members must attend at least 80% of rehearsals.",
        "category": "General",
        "status": "active",
        "createdAt": "2026-05-27T00:00:00.000Z"
      }
    ]
  }
}
```

---

#### `POST /api/rules`

Create a new rule.

**Request Body:**
```json
{
  "semesterId": 1,
  "title": "Attendance Requirement",
  "description": "Members must attend at least 80% of rehearsals.",
  "category": "General",
  "status": "active"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `title` | string | ✅ | Rule title |
| `content` / `description` | string | ✅ | Rule body text |
| `semesterId` | integer | ❌ | Link to a semester |
| `category` | string | ❌ | Default: `General`. Options: `General`, `Attendance`, `Performance`, `Conduct` |
| `status` | string | ❌ | Default: `active` |

**Success Response (201):** Created rule object.

---

#### `PUT /api/rules/:id`

Update a rule by ID.

**URL Params:** `id` — Rule ID (integer)

**Request Body:** Same fields as `POST` (all optional).

**Success Response (200):** Updated rule object.

---

#### `DELETE /api/rules/:id`

Delete a rule by ID.

**URL Params:** `id` — Rule ID (integer)

**Success Response (200):**
```json
{
  "status": "success",
  "message": "Rule deleted successfully",
  "data": null
}
```

---

## Error Codes Reference

| Code | Meaning |
|---|---|
| `200` | OK — Request succeeded |
| `201` | Created — Resource created |
| `204` | No Content — Resource deleted |
| `400` | Bad Request — Missing/invalid fields |
| `401` | Unauthorized — Invalid or missing token |
| `403` | Forbidden — Insufficient permissions |
| `404` | Not Found — Resource does not exist |
| `429` | Too Many Requests — Rate limit exceeded |
| `500` | Internal Server Error |
