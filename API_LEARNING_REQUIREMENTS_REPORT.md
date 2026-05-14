# Bao cao danh gia API TicketRush theo noi dung bai hoc

## 1. Ket luan tong quan

He thong TicketRush hien tai **chua thoa man day du toan bo yeu cau cua noi dung bai hoc**, nhung da co nen tang API kha tot de trinh bay va demo:

- Da co 3 backend service co API ro rang: `User Service`, `Event Service`, `Booking Service`.
- Da ap dung REST cho cac resource chinh nhu users, events, bookings, showtimes, seats, reviews, roles, notifications.
- Da co JWT bearer authentication, refresh token rotation, OAuth login qua Google/Facebook, role/admin protection.
- Da co Swagger/OpenAPI cho ca 3 service, nhung tai lieu chua day du so voi route thuc te.
- Da co database integration voi PostgreSQL, Redis cho seat locking/virtual queue, MinIO cho media upload.
- Da co Prometheus metrics endpoint `/metrics`, request logging, Docker Compose deploy.
- Da co test files cho nhieu tang handler/service/repository/middleware, nhung moi truong hien tai chua chay duoc test command.

Phan can bo sung truoc khi noi la "day du theo bai hoc": chuan hoa versioning cho User Service, bo sung OpenAPI cho cac endpoint thieu, them deprecation/migration plan, Postman/Newman collection, load testing chuan hoa, rate limit cho Event/Booking, circuit breaker, webhook/HATEOAS, developer portal/sandbox/API analytics.

## 2. Pham vi phan tich

Pham vi chinh gom 3 backend services:

| Service | Cong nghe | Vai tro API |
| --- | --- | --- |
| `TicketRushPlatform_User_Service` | Flask/Python | Xac thuc, user profile, roles, notifications, media upload |
| `TicketRushPlatform_Event_Service` | Gin/Go | Events, movies, reviews, showtimes, seat maps |
| `TicketRushPlatform_Booking_Service` | Gin/Go | Booking workflow, seat status, virtual queue, admin dashboard |

`TicketRushPlatform_Web`, `TicketRushPlatform_Migration_Service`, va `deploy/docker-compose.yaml` chi duoc dung lam bang chung phu ve client integration, database migration va deployment.

## 3. Inventory API hien co

### 3.1 User Service

Base path hien tai: khong co `/api/v1`, cac route duoc mount truc tiep tu Flask blueprint.

| Nhom | Endpoint tieu bieu | Method | Nhan xet |
| --- | --- | --- | --- |
| Auth | `/auth/register` | POST | Dang ky user, co rate limit `5 per minute` |
| Auth | `/auth/login` | POST | Dang nhap, tra access token + refresh token, co rate limit `10 per minute` |
| Auth | `/auth/refresh` | POST | Rotate refresh token |
| Auth | `/auth/logout` | POST | Revoke refresh token |
| Auth | `/auth/forgot-password`, `/auth/reset-password` | POST | Password reset, co rate limit |
| OAuth | `/auth/oauth/google`, `/auth/oauth/facebook` | POST | OAuth login |
| Current user | `/users/me` | GET, PATCH | Xem/cap nhat profile dang dang nhap |
| Media | `/users/me/media` | POST | Upload avatar/video len object storage |
| Admin users | `/users`, `/users/{user_id}` | GET, POST, PATCH, DELETE | Quan tri user |
| User roles | `/users/{user_id}/roles`, `/users/{user_id}/roles/{role_name}` | GET, POST, DELETE | Gan/go role cho user |
| Roles | `/roles`, `/roles/{role_name}` | GET, POST, PATCH | Quan ly role va permissions |
| Notifications | `/notifications`, `/notifications/{id}` | GET, PATCH, DELETE | Thong bao cua user |
| Docs/health | `/openapi.json`, `/docs`, `/healthz`, `/metrics` | GET | OpenAPI, Swagger UI, health check, Prometheus metrics |

Danh gia nhanh:

- Dat: co auth workflow, JWT bearer token, refresh token, role/admin, rate limit o nhom auth, OpenAPI/Swagger UI.
- Dat mot phan: REST resource naming kha tot nhung User Service chua co versioning `/api/v1`.
- Chua dat: OpenAPI sinh tu docstring nen mot so route thieu docstring se khong xuat hien day du trong spec.

### 3.2 Event Service

Base path: `/api/v1`.

| Nhom | Endpoint tieu bieu | Method | Nhan xet |
| --- | --- | --- | --- |
| Events | `/api/v1/events` | GET, POST | List co pagination/filter, create can auth |
| Event detail | `/api/v1/events/{id}` | GET, PUT, DELETE | CRUD event/movie |
| Reviews | `/api/v1/events/{id}/reviews` | GET, POST | Nested resource theo event |
| Showtimes | `/api/v1/events/{id}/showtimes` | GET, PUT | Lay/thay the showtime theo event |
| Showtime detail | `/api/v1/showtimes/{id}` | GET | Lay chi tiet showtime |
| Seat maps | `/api/v1/seat-maps` | GET, POST | Quan ly seat map |
| Docs/metrics | `/swagger/*any`, `/metrics` | GET | Swagger UI va Prometheus metrics |

Danh gia nhanh:

- Dat: co `/api/v1`, resource tree hop ly, pagination `page/page_size`, CRUD event, nested reviews/showtimes, JWT auth cho write operations.
- Dat mot phan: Swagger JSON hien tai moi thay ro `/events` va `/events/{id}`, thieu reviews/showtimes/seat-maps so voi route trong code.
- Chua dat: chua co deprecation policy, chua co webhook/HATEOAS, chua co rate limiting/circuit breaker.

### 3.3 Booking Service

Base path: `/api/v1`.

| Nhom | Endpoint tieu bieu | Method | Nhan xet |
| --- | --- | --- | --- |
| Seat hold | `/api/v1/bookings/hold` | POST | Tao booking dang HOLDING, co conflict handling |
| Booking detail | `/api/v1/bookings/{id}` | GET | Chi user so huu hoac admin duoc xem |
| Booking actions | `/api/v1/bookings/{id}/confirm`, `/api/v1/bookings/{id}/cancel` | POST | Action endpoint cho workflow nghiep vu |
| User bookings | `/api/v1/bookings/user/{user_id}` | GET | List booking theo user, co pagination |
| Seat status | `/api/v1/showtimes/{showtime_id}/seats` | GET | Public read seat status |
| Realtime seats | `/api/v1/showtimes/{showtime_id}/seats/ws` | GET/WebSocket | Stream thay doi seat status |
| Virtual queue | `/api/v1/showtimes/{showtime_id}/queue/join`, `/heartbeat`, `/leave`, `/status` | POST/GET | Hang doi ao khi mua ve |
| Admin | `/api/v1/admin/dashboard`, `/api/v1/bookings/release-expired` | GET/POST | Admin stats va release expired holds |
| Docs/metrics | `/swagger/*any`, `/metrics` | GET | Swagger UI va Prometheus metrics |

Danh gia nhanh:

- Dat: workflow booking co y nghia thuc te, status code ro, JWT auth, admin guard, pagination, Redis seat lock, virtual queue, realtime WebSocket.
- Dat mot phan: action endpoint `confirm/cancel` dung POST la chap nhan duoc cho domain action, nhung khong phai CRUD REST thuan tuy.
- Chua dat: Swagger JSON hien tai thieu queue/WebSocket/admin endpoints; chua co rate limit/circuit breaker; load test moi co script `wrk`, chua co bo cong cu chuan hoa nhu Postman/Newman.

## 4. Doi chieu voi noi dung bai hoc

| Yeu cau bai hoc | Trang thai | Bang chung trong he thong | Can bo sung |
| --- | --- | --- | --- |
| Hieu API, Web Services, REST/SOAP/GraphQL/gRPC | Dat mot phan | He thong trien khai RESTful Web APIs bang Flask/Gin | Bao cao/docs nen co muc so sanh REST voi SOAP/GraphQL/gRPC va ly do chon REST |
| Vai tro API trong he sinh thai phan mem | Dat | Web client goi User/Event/Booking APIs; deploy gom nhieu service | Co the them so do integration giua Web, APIs, DB, Redis, MinIO |
| 6 nguyen tac REST | Dat mot phan | Client-server, stateless JWT, layered Docker/nginx/service, uniform interface o nhieu route | Cacheable chua ro; Code on Demand khong ap dung; can ghi ro trong docs |
| HTTP methods/status codes/headers | Dat | GET/POST/PUT/PATCH/DELETE, status 200/201/204/400/401/403/404/409/429/500; `Authorization: Bearer`, `X-Request-ID`, CORS | Nen chuan hoa response envelope/error schema giua cac service |
| Naming conventions: plural nouns, lowercase, hyphens, versioning | Dat mot phan | `/events`, `/bookings`, `/showtimes`, `/seat-maps`, `/notifications`; Event/Booking co `/api/v1` | User chua co `/api/v1`; mot so endpoint action nhu `/bookings/user/{user_id}` nen can nhac `/users/{id}/bookings` neu refactor |
| OpenAPI/Swagger | Dat mot phan | User co `/openapi.json` va `/docs`; Event/Booking co `/swagger/*any` va docs generated | Specs thieu nhieu endpoint thuc te; can bo sung schemas/security cho tat ca route |
| Viet OpenAPI spec cho API don gian 5 endpoints | Dat | Moi service da co nhieu hon 5 endpoint duoc document mot phan | Can dam bao spec sinh ra day du va dung voi route thuc te |
| Resource tree | Dat | `/events/{id}/reviews`, `/events/{id}/showtimes`, `/showtimes/{id}/seats`, `/users/{id}/roles` | Booking list theo user co the cai tien naming |
| Pagination | Dat mot phan | Event list va bookings-by-user dung `page/page_size` | User list, reviews, notifications chua co pagination |
| JWT vs OAuth 2.0, bearer token, refresh token, roles | Dat | JWT access token, refresh token rotation/reuse detection, Google/Facebook OAuth, roles/permissions | Chua thay scopes dung nghia OAuth; can docs ve token leakage/replay mitigation |
| Backend tu OpenAPI spec | Chua dat | Co OpenAPI/Swagger docs | Chua thay codegen/backend generated tu OpenAPI spec |
| Ket noi database | Dat | PostgreSQL qua SQLAlchemy/GORM; migrations SQL; Redis/MinIO phu tro | Khong can bo sung lon |
| Unit/integration/performance tests | Dat mot phan | Nhieu Go test files; User auth tests; `wrk` script cho seat hold conflict | Chua co Postman/Newman collection; test command chua verify duoc trong moi truong hien tai |
| Versioning, breaking changes, deprecation | Dat mot phan | Event/Booking co `/api/v1` | User chua versioning; chua co deprecation header, changelog, migration plan |
| Production deploy, monitoring, logs, metrics, rate limit, circuit breaker | Dat mot phan | Docker Compose, healthcheck, JSON logs, `/metrics`, User auth rate limit | Event/Booking chua rate limit; chua co circuit breaker/WAF/audit logs/tracing |
| API design patterns: CRUD, Query, HATEOAS, Event-driven, Webhook | Dat mot phan | CRUD, query pagination/filter, WebSocket realtime seat status, virtual queue | Chua co HATEOAS links; chua co webhook integration |
| Khi nao dung REST/gRPC/GraphQL | Chua dat trong docs | He thong dang chon REST | Can them muc giai thich: REST phu hop CRUD/public web, gRPC cho internal high-performance, GraphQL cho client-driven query |
| API la san pham: DX, monetization, analytics, KPIs | Chua dat | Co Swagger UI co ban | Chua co developer portal, sandbox, API key analytics, call volume/error dashboard, monetization model |

## 5. Danh gia RESTful chi tiet

### Diem manh

- Dung plural nouns va lowercase cho nhieu resource: `/events`, `/bookings`, `/users`, `/roles`, `/notifications`, `/seat-maps`.
- Dung HTTP methods phu hop o CRUD:
  - `GET /api/v1/events`: list events.
  - `POST /api/v1/events`: create event.
  - `GET /api/v1/events/{id}`: get detail.
  - `PUT /api/v1/events/{id}`: update full event payload.
  - `DELETE /api/v1/events/{id}`: soft-delete event.
- Dung nested resource hop ly:
  - `/api/v1/events/{id}/reviews`
  - `/api/v1/events/{id}/showtimes`
  - `/api/v1/showtimes/{showtime_id}/seats`
  - `/users/{user_id}/roles`
- Stateless authentication bang bearer token: request tu client gui `Authorization: Bearer <access_token>`, server khong can session cookie.

### Diem can cai thien

- User Service chua co prefix `/api/v1`, lam versioning khong dong nhat voi Event/Booking.
- Mot so action endpoint nhu `/bookings/{id}/confirm`, `/bookings/{id}/cancel`, `/notifications/{id}/read`, `/notifications/read-all` la domain action. Cach nay thuc dung, nhung khi trinh bay REST can giai thich day la action/resource state transition, khong phai CRUD thuan.
- Cacheable principle chua ro: chua thay `Cache-Control`, `ETag`, `Last-Modified` cho public GET endpoints.
- Code on Demand la optional REST constraint, he thong khong ap dung; nen ghi ro "khong can thiet cho bai toan TicketRush".

## 6. Danh gia OpenAPI/Swagger

### Da co

- User Service:
  - `app/openapi.py` dung `apispec`, `MarshmallowPlugin`, `FlaskPlugin`.
  - Co security scheme `BearerAuth`.
  - Co `/openapi.json` va Swagger UI `/docs`.
- Event Service:
  - Co generated docs trong `docs/swagger.json`, `docs/swagger.yaml`, `docs/docs.go`.
  - Co Swagger UI route `/swagger/*any`.
  - Co base path `/api/v1`.
- Booking Service:
  - Co generated docs trong `docs/swagger.json`, `docs/swagger.yaml`, `docs/docs.go`.
  - Co Swagger UI route `/swagger/*any`.
  - Co base path `/api/v1`.

### Thieu/chua dong bo

- Event Swagger JSON hien tai chi the hien cac path chinh:
  - `/events`
  - `/events/{id}`
- Trong khi route code con co:
  - `/events/{id}/reviews`
  - `/events/{id}/showtimes`
  - `/showtimes/{id}`
  - `/seat-maps`
- Booking Swagger JSON hien tai co cac path chinh:
  - `/bookings/hold`
  - `/bookings/release-expired`
  - `/bookings/user/{user_id}`
  - `/bookings/{id}`
  - `/bookings/{id}/cancel`
  - `/bookings/{id}/confirm`
  - `/showtimes/{showtime_id}/seats`
- Trong khi route code con co:
  - `/showtimes/{showtime_id}/seats/ws`
  - `/showtimes/{showtime_id}/queue/join`
  - `/showtimes/{showtime_id}/queue/heartbeat`
  - `/showtimes/{showtime_id}/queue/leave`
  - `/showtimes/{showtime_id}/queue/status`
  - `/admin/dashboard`
- User Service spec duoc generate tu docstring nen cac route khong co OpenAPI docstring se bi thieu, vi du mot so roles/notifications/user-role endpoints.

Ket luan: Swagger/OpenAPI **dat mot phan**, du de demo, nhung chua du de coi la tai lieu API day du.

## 7. Bao mat va authentication

### Diem da dat

- User Service issue token pair:
  - `access_token`
  - `refresh_token`
  - `token_type: Bearer`
- Access token co claims:
  - `sub`
  - `role`
  - `iat`
  - `exp`
  - `type: access`
- Refresh token duoc hash bang SHA-256 truoc khi luu database.
- Refresh token co rotate: token cu bi revoke, token moi duoc cap.
- Neu refresh token da revoke bi dung lai, service revoke tat ca session cua user.
- Event/Booking verify JWT bearer token voi secret va algorithm.
- Co role/admin check:
  - User: `require_auth(admin=True)`, dynamic roles/permissions.
  - Event/Booking: `RequireAdmin()`, role trong JWT.
- Co OAuth login:
  - `/auth/oauth/google`
  - `/auth/oauth/facebook`
- Co rate limit cho cac endpoint nhay cam trong User Auth:
  - register: `5 per minute`
  - login: `10 per minute`
  - refresh: `30 per minute`
  - forgot/reset password: `5 per minute`

### Rui ro/can bo sung

- JWT secret co default `dev-only-secret`; production bat buoc set secret manh qua environment.
- Event/Booking chua co rate limit rieng cho booking/queue endpoints.
- Chua co scopes OAuth dung nghia, hien chu yeu dung role/permission.
- Chua thay audit logs rieng cho hanh dong admin nhu xoa user, sua role, confirm/cancel booking.
- Chua co WAF/circuit breaker/tracing trong deploy.
- WebSocket seat status dang cho `CheckOrigin` tra `true`; production nen gioi han origin hop le.

## 8. Testing va verification

### Test hien co trong repo

| Service | Bang chung test | Nhan xet |
| --- | --- | --- |
| User | `tests/test_auth.py`, `tests/conftest.py` | Test register/login, OAuth, refresh rotation, logout, password reset |
| Event | `internal/handler/*_test.go`, `internal/services/*_test.go`, `internal/repository/*_test.go`, middleware/config/server tests | Coverage kha rong theo tang handler/service/repository |
| Booking | handler/service/repository/middleware/realtime/redislock tests | Co test conflict seat hold, concurrent users, virtual queue, websocket |
| Performance | `scripts/run_wrk_hold_conflict.sh`, `scripts/wrk_hold_same_seat.lua` | Load/conflict test cho case nhieu request giu cung mot seat |

### Lenh da thu trong moi truong hien tai

Trong qua trinh phan tich, cac lenh verification sau da duoc thu nhung **khong chay duoc do moi truong local thieu runtime/dependency**:

```powershell
cd E:\Code\Collab\2526II_INT3505_1_Nhom8\TicketRushPlatform_Event_Service
go test ./...
```

Ket qua: `go` khong co trong PATH.

```powershell
cd E:\Code\Collab\2526II_INT3505_1_Nhom8\TicketRushPlatform_Booking_Service
go test ./...
```

Ket qua: `go` khong co trong PATH.

```powershell
cd E:\Code\Collab\2526II_INT3505_1_Nhom8\TicketRushPlatform_User_Service
python -m pytest -q
```

Ket qua: Python hien tai chua co module `pytest`.

Vi vay, bao cao nay chi ghi nhan "co test files va test scenarios trong repo", khong ket luan "test da pass" trong moi truong hien tai.

## 9. Vi du API co the demo theo bai hoc

### Demo 1: Event list API - REST, query, pagination

Endpoint:

```http
GET /api/v1/events?page=1&page_size=20&type=MOVIE&search=avatar
Accept: application/json
```

Y nghia demo:

- `GET` dung de doc resource, khong lam thay doi server state.
- `/events` la plural noun, lowercase, dung resource collection.
- `page` va `page_size` minh hoa page-based pagination.
- `type` va `search` minh hoa query/filter pattern.
- Response co envelope phan trang:

```json
{
  "data": [
    {
      "id": "event-uuid",
      "name": "Avatar",
      "event_type": "MOVIE",
      "duration_minutes": 120
    }
  ],
  "page": 1,
  "page_size": 20,
  "total_items": 1,
  "total_pages": 1
}
```

Noi dung trinh bay:

- API nay phu hop REST vi client yeu cau danh sach resource events.
- Pagination giup tranh tra ve qua nhieu data.
- Neu mo rong co the them `sort`, `status`, `city`, `date_from`, `date_to`.

### Demo 2: Booking workflow - auth, status code, conflict handling

Buoc 1: Giu ghe.

```http
POST /api/v1/bookings/hold
Authorization: Bearer <access_token>
Content-Type: application/json
Accept: application/json

{
  "showtime_id": "showtime-uuid",
  "seat_ids": ["seat-uuid-1", "seat-uuid-2"]
}
```

Response thanh cong:

```http
201 Created
```

```json
{
  "message": "seats held successfully",
  "data": {
    "id": "booking-uuid",
    "status": "HOLDING",
    "showtime_id": "showtime-uuid",
    "items": [
      {
        "seat_id": "seat-uuid-1",
        "row": "A",
        "number": 1,
        "price": "120000"
      }
    ],
    "total_amount": "120000"
  }
}
```

Neu hai user giu cung mot ghe, service co conflict handling va co the tra:

```http
409 Conflict
```

Buoc 2: Confirm booking.

```http
POST /api/v1/bookings/{booking_id}/confirm
Authorization: Bearer <access_token>
Accept: application/json
```

Buoc 3: Xem seat status.

```http
GET /api/v1/showtimes/{showtime_id}/seats
Accept: application/json
```

Y nghia demo:

- Minh hoa JWT bearer authentication.
- Minh hoa workflow state transition: `HOLDING` -> `PAID` hoac `CANCELED/EXPIRED`.
- Minh hoa status code `201`, `200`, `401`, `403`, `409`.
- Minh hoa Redis/DB locking de tranh ban trung ghe.
- Co script performance/conflict test bang `wrk` de demo tinh dung dan khi nhieu request cung luc.

### Demo 3: User auth API - JWT, refresh token, role

Buoc 1: Login.

```http
POST /auth/login
Content-Type: application/json
Accept: application/json

{
  "email": "user@example.com",
  "password": "correct-password"
}
```

Response:

```json
{
  "access_token": "<jwt>",
  "refresh_token": "<refresh-token>",
  "token_type": "Bearer"
}
```

Buoc 2: Dung access token de lay profile.

```http
GET /users/me
Authorization: Bearer <access_token>
Accept: application/json
```

Buoc 3: Rotate refresh token.

```http
POST /auth/refresh
Content-Type: application/json
Accept: application/json

{
  "refresh_token": "<refresh-token>"
}
```

Y nghia demo:

- Access token ngan han dung cho API call.
- Refresh token dung de xin cap token moi ma khong can login lai.
- Refresh token reuse se bi phat hien va revoke sessions.
- Role trong JWT duoc cac service Event/Booking dung de kiem tra admin.
- Login/register co rate limit, giam brute force risk.

## 10. Danh sach viec can lam de dat day du yeu cau bai hoc

### Uu tien cao

1. Them versioning cho User Service:
   - Chuyen route public sang `/api/v1/auth`, `/api/v1/users`, `/api/v1/roles`, `/api/v1/notifications`.
   - Neu can tuong thich nguoc, giu alias route cu trong thoi gian migration.

2. Hoan thien OpenAPI/Swagger:
   - Bo sung docstring/annotation cho tat ca User routes.
   - Bo sung Swagger annotations cho Event reviews/showtimes/seat-maps.
   - Bo sung Swagger annotations cho Booking queue/WebSocket/admin dashboard.
   - Dam bao security scheme `BearerAuth` xuat hien dung o cac endpoint can auth.

3. Tao Postman collection va Newman script:
   - Auth flow: register/login/refresh/me.
   - Event flow: create/list/get/update/delete.
   - Booking flow: hold/confirm/cancel/seat status.
   - Negative tests: 400/401/403/404/409.

4. Them rate limiting cho Event/Booking:
   - Dac biet cac endpoint write: create/update/delete event, hold seats, confirm booking, queue join/heartbeat.

5. Viet migration/deprecation plan:
   - Quy uoc `/api/v1` -> `/api/v2`.
   - Deprecation header, changelog, deadline, compatibility notes.

### Uu tien trung binh

6. Bo sung cache strategy cho public GET:
   - `Cache-Control` cho event catalog neu phu hop.
   - `ETag`/`Last-Modified` cho endpoints it thay doi.

7. Bo sung observability production:
   - Centralized logs.
   - Tracing request qua cac service.
   - Audit logs cho admin actions.
   - Dashboard error rate, p95 latency, call volume.

8. Bo sung circuit breaker/retry policy cho service-to-service hoac external calls:
   - OAuth provider calls.
   - SMTP/email dispatch.
   - Object storage upload.

9. Gioi han WebSocket origin:
   - Khong de `CheckOrigin` always true trong production.

10. Them pagination cho cac list endpoint con thieu:
    - `/users`
    - `/notifications`
    - `/events/{id}/reviews`
    - `/roles`

### Uu tien thap nhung can cho bai hoc nang cao

11. Them webhook pattern:
    - Vi du webhook `booking.paid`, `booking.canceled`, `event.updated`.
    - Co retry, signing secret, delivery logs.

12. Them HATEOAS links neu muon demo REST maturity:
    - Response booking co `_links.confirm`, `_links.cancel`, `_links.self`.

13. Viet tai lieu so sanh REST/GraphQL/gRPC/SOAP:
    - TicketRush dung REST vi phu hop CRUD + web app.
    - GraphQL phu hop neu frontend can query linh hoat nhieu resource.
    - gRPC phu hop internal service-to-service high throughput.
    - SOAP khong phu hop he thong hien tai, thuong gap trong enterprise legacy.

14. Xay developer portal/sandbox:
    - Trang docs tong hop.
    - API examples.
    - Sandbox test token.
    - KPI dashboard: developer registrations, call volume, error rate.

15. De xuat API monetization:
    - Freemium cho public event catalog.
    - Pay-per-call cho partner ticket inventory/realtime seat status.
    - Enterprise plan cho webhook + analytics + higher rate limit.

## 11. Ket luan de trinh bay tren lop

Co the trinh bay rang he thong TicketRush da dat duoc cac yeu cau cot loi cua API/Web Services o muc ung dung thuc te:

- Co REST APIs tach theo domain service.
- Co request/response HTTP ro rang.
- Co JWT authentication, refresh token, roles.
- Co OpenAPI/Swagger UI de demo docs.
- Co PostgreSQL/Redis/MinIO integration.
- Co metrics/logging/deploy Docker.
- Co test files va mot script load/conflict test cho booking.

Tuy nhien, neu cham theo toan bo checklist bai hoc, he thong chi nen duoc danh gia la **dat mot phan/kha tot**, chua phai day du. Cac diem thieu quan trong nhat la OpenAPI chua phu het route, versioning User Service chua dong nhat, chua co deprecation plan, chua co Postman/Newman, Event/Booking chua co rate limit/circuit breaker, va chua co developer portal/API-as-product strategy.

