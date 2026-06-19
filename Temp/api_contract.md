# TrustedCars API Contract (OpenAPI Specification Style)

## Global Specifications
- **Base URL**: `/api/v1`
- **Content-Type**: `application/json` (except file uploads)
- **Authentication Header**: `Authorization: Bearer <access_token>`

---

## 1. Auth & Users Module (`/auth`, `/users`)

### `POST /auth/register`
Creates a new user or dealer account.
- **Auth Requirements**: Public
- **Request Body**:
  ```json
  {
    "email": "string (email)",
    "password": "string (min: 8 chars)",
    "full_name": "string",
    "phone": "string",
    "role": "enum[user, dealer]" 
  }
  ```
- **Success Response (201 Created)**:
  ```json
  {
    "user": { "id": "uuid", "email": "...", "role": "..." },
    "access_token": "string (jwt)",
    "refresh_token": "string (uuid)"
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: `{"detail": "Email already registered"}`
  - `422 Unprocessable Entity`: Validation error (e.g., weak password).

### `POST /auth/login`
- **Auth Requirements**: Public
- **Request Body**:
  ```json
  { "email": "string", "password": "string" }
  ```
- **Success Response (200 OK)**:
  ```json
  { "access_token": "string", "refresh_token": "string" }
  ```
- **Error Responses**:
  - `401 Unauthorized`: `{"detail": "Invalid credentials"}`

### `POST /auth/refresh`
- **Auth Requirements**: Refresh Token in Body or HttpOnly Cookie.
- **Request Body**: `{ "refresh_token": "string" }`
- **Success Response (200 OK)**: `{ "access_token": "string", "refresh_token": "string (rotated)" }`
- **Error Responses**: `401 Unauthorized`: `{"detail": "Invalid or expired refresh token"}`

### `GET /users/me`
- **Auth Requirements**: Bearer Token (Any Role)
- **Success Response (200 OK)**:
  ```json
  {
    "id": "uuid", "email": "string", "full_name": "string",
    "role": "string", "is_verified": "boolean"
  }
  ```
- **Error Responses**: `401 Unauthorized`

---

## 2. Inventory Module (`/cars`)

### `GET /cars`
Fetches a paginated list of active inventory.
- **Auth Requirements**: Public
- **Query Parameters**: 
  - `make` (string), `model` (string), `year_min` (int), `year_max` (int)
  - `price_max` (int), `status` (default: 'active'), `page` (int), `limit` (int)
- **Success Response (200 OK)**:
  ```json
  {
    "data": [
      {
        "id": "uuid", "make": "string", "model": "string", "year": 2020,
        "asking_price": 500000, "status": "active",
        "images": [{"url": "string", "is_primary": true}]
      }
    ],
    "meta": { "total": 1250, "page": 1, "pages": 125 }
  }
  ```

### `POST /cars`
Creates a new vehicle listing.
- **Auth Requirements**: Bearer Token (`user` or `dealer`)
- **Request Body**:
  ```json
  {
    "make": "string", "model": "string", "year": "int",
    "fuel_type": "enum", "transmission": "enum", "odometer_km": "int",
    "asking_price": "int", "city": "string", "state": "string",
    "description": "string"
  }
  ```
- **Success Response (201 Created)**: Returns created `Car` schema (status = `pending`).

### `PUT /cars/{id}`
- **Auth Requirements**: Bearer Token (Owner or `admin`)
- **Error Responses**: 
  - `403 Forbidden`: User does not own the listing.
  - `404 Not Found`.

### `DELETE /cars/{id}`
- **Auth Requirements**: Bearer Token (Owner or `admin`)
- **Success Response (204 No Content)**: (Executes Soft Delete)

### `POST /cars/{id}/images`
- **Auth Requirements**: Bearer Token (Owner or `admin`)
- **Content-Type**: `multipart/form-data`
- **Request**: `file: Binary[]`
- **Success Response (201 Created)**: List of uploaded image URLs and metadata.

---

## 3. Interactions Module (`/inquiries`)

### `POST /inquiries`
- **Auth Requirements**: Bearer Token (`user` or `dealer`)
- **Request Body**:
  ```json
  { "car_id": "uuid", "initial_message": "string" }
  ```
- **Success Response (201 Created)**:
  ```json
  { "id": "uuid", "car_id": "uuid", "seller_id": "uuid", "status": "open" }
  ```

### `GET /inquiries`
Returns inquiries where the user is either the buyer or the seller.
- **Auth Requirements**: Bearer Token
- **Success Response (200 OK)**: List of `Inquiry` items.

---

## 4. Admin Module (`/admin`)

### `GET /admin/cars`
- **Auth Requirements**: Bearer Token (`admin` only)
- **Query Parameters**: `status=pending`
- **Success Response (200 OK)**: List of pending cars awaiting approval.
- **Error Responses**: `403 Forbidden` if user is not an admin.

### `PATCH /admin/cars/{id}/status`
- **Auth Requirements**: Bearer Token (`admin` only)
- **Request Body**: `{ "status": "enum[active, rejected]", "notes": "string" }`
- **Success Response (200 OK)**: Updated `Car` schema.
