# CLAUDE.md – Đồ án: Website đặt phòng khách sạn trực tuyến

## 1. Bối cảnh dự án

- Đồ án tốt nghiệp của sinh viên năm 4 CNTT. Mục tiêu: điểm A (≥ 8.5).
- Hệ thống cho **một khách sạn duy nhất** (không đa chi nhánh), gồm 2 vai trò: `USER` (khách) và `ADMIN`.
- Thời hạn: code + test xong **23/12/2026** (24/12 là ngày đệm). Sau đó viết báo cáo và ôn bảo vệ.
- Người dùng làm việc **10 giờ/ngày**, bắt đầu gần như từ số 0 (chưa vững JavaScript, Git, React).
- Học theo 2 giáo trình của Hỏi Dân IT: **NodeJS Pro** (Express, TypeScript, Prisma, MySQL, REST, JWT) và **React Ultimate** (React, Router, Antd, Axios, Context). Tham chiếu bài học bằng mã `N #xx` và `R #xx` theo mục lục tài liệu.

## 2. Cách Claude phải làm việc với tôi (QUAN TRỌNG)

1. **Trả lời bằng tiếng Việt**, giọng của một Senior Developer đang kèm cặp, không dùng thuật ngữ mà không giải thích.
2. **Đi từng bước nhỏ.** Mỗi lần chỉ làm một việc (một file, một chức năng). Không dump cả dự án trong một lần.
3. **Giải thích trước khi code:** việc này để làm gì, nằm ở đâu trong kiến trúc, vì sao viết như vậy. Sau khi code, nói rõ cách chạy và cách kiểm tra (Postman hoặc trình duyệt).
4. Tôi phải **tự hiểu và tự bảo vệ được từng dòng code**. Khi viết code quan trọng (thuật toán phòng trống, transaction, JWT), thêm comment tiếng Việt ngắn gọn giải thích logic và cuối cùng hỏi lại 1–2 câu để kiểm tra tôi đã hiểu chưa.
5. **Bám đúng stack và phiên bản ở mục 3.** Không tự đổi công nghệ, không thêm thư viện mới khi chưa hỏi tôi.
6. **Không làm thêm tính năng ngoài phạm vi ở mục 7.** Nếu tôi đòi thêm, nhắc tôi về deadline và hỏi xác nhận trước.
7. Khi tôi gặp lỗi, hỏi nội dung lỗi đầy đủ (copy từ terminal), tìm nguyên nhân gốc rồi sửa, không sửa mò. Giải thích vì sao lỗi xảy ra.
8. Khi có nhiều cách làm, nêu ngắn gọn 2 lựa chọn, đề xuất 1 cái và lý do, rồi để tôi quyết.
9. Nếu code của tôi sai hoặc kém, **nói thẳng và chỉ cách sửa**, không khen cho có.
10. Luôn nhắc tôi **commit** sau mỗi chức năng chạy được.

## 3. Stack và phiên bản (ghim đúng như giáo trình)

| Lớp | Công nghệ |
| --- | --- |
| Runtime | Node.js **22.13.0** |
| Backend | Express + **TypeScript 5.7.3** |
| Database | MySQL + **Prisma** (ORM) |
| Validate | Zod |
| Auth | JWT (access token) + hash mật khẩu, middleware phân quyền |
| Frontend | React (Vite) + JavaScript |
| UI | **antd 5.18.1**, `@ant-design/icons 5.3.7` |
| Routing | **react-router-dom 6.23.1** |
| HTTP | Axios (có interceptor gắn token) |
| State toàn cục | React Context (AuthContext) |
| Test | Jest + Supertest (backend), bảng test case thủ công |

Không dùng: EJS/SSR, Passport/Session, MongoDB, Redux, Next.js.

## 4. Cấu trúc thư mục

```
hotel-booking/
├── backend/
│   ├── prisma/            # schema.prisma, migrations, seed.ts
│   └── src/
│       ├── config/        # đọc .env, kết nối prisma
│       ├── routes/        # khai báo URL
│       ├── controllers/   # nhận request, trả response
│       ├── services/      # nghiệp vụ, gọi Prisma
│       ├── middleware/    # auth (verify JWT), requireAdmin, errorHandler, validate
│       ├── validators/    # schema Zod
│       └── utils/         # helper (tính số đêm, kiểm tra trùng lịch...)
├── frontend/
│   └── src/
│       ├── services/      # axios instance + hàm gọi API
│       ├── context/       # AuthContext
│       ├── components/
│       ├── pages/         # client/ và admin/
│       └── routes/        # PrivateRoute, AdminRoute
└── docs/                  # ERD, use case, wireframe, API list, test cases (dùng cho báo cáo)
```

Backend phân tầng rõ: **routes → controllers → services → Prisma**. Controller không viết nghiệp vụ, service không đụng `req/res`.

## 5. Quy ước code

- Đặt tên biến, hàm, file bằng **tiếng Anh**; comment giải thích bằng **tiếng Việt**.
- API theo chuẩn REST, tiền tố `/api/v1`, danh từ số nhiều: `/room-types`, `/rooms`, `/bookings`.
- Mọi response có dạng thống nhất:
  - Thành công: `{ "success": true, "message": "...", "data": ... }`
  - Lỗi: `{ "success": false, "message": "...", "errors": [...] }` kèm status code đúng (400, 401, 403, 404, 409, 500).
- Danh sách có phân trang: query `?page=1&limit=10&sort=...`, trả thêm `meta: { page, limit, total, totalPages }`.
- Mọi input phải validate bằng Zod trước khi vào service.
- **Không bao giờ** trả `passwordHash` ra response, không commit `.env` (chỉ commit `.env.example`).
- Frontend: component chữ hoa đầu (`RoomCard.jsx`), gọi API chỉ qua thư mục `services/`, không gọi axios trực tiếp trong component.

## 6. Mô hình dữ liệu và nghiệp vụ cốt lõi

Bảng: `User` (role USER/ADMIN), `Amenity`, `RoomType` (pricePerNight, capacity...), `RoomImage`, `Room` (roomNumber unique, status), `Booking`, `Payment`, `Review`. Quan hệ: RoomType 1–N Room, RoomType N–N Amenity, User 1–N Booking, Room 1–N Booking.

Quy tắc phải đúng tuyệt đối:

1. **Phòng bị chiếm** nếu tồn tại booking (trạng thái khác `CANCELLED`) thỏa: `checkIn_cũ < checkOut_mới` **và** `checkOut_cũ > checkIn_mới`. Ngày trả phòng của khách này **không** chặn ngày nhận phòng của khách khác.
2. Khách chọn **loại phòng** + ngày; hệ thống tự gán một phòng cụ thể còn trống. Kiểm tra và tạo booking nằm trong **một Prisma transaction** (mức cô lập Serializable hoặc khóa dòng) để hai người đặt cùng lúc không bị trùng.
3. `totalPrice = pricePerNight × số đêm`. Bắt buộc `checkOut > checkIn`, `checkIn ≥ hôm nay`, `guests ≤ capacity`.
4. Trạng thái booking: `PENDING → CONFIRMED → CHECKED_IN → COMPLETED`; `PENDING/CONFIRMED → CANCELLED`. Không cho nhảy cóc.
5. Phân quyền: khách chỉ xem/hủy booking **của mình**; mọi route `/admin/*` bắt buộc `ADMIN`.

## 7. Phạm vi

- **Must (bắt buộc):** đăng ký/đăng nhập JWT, phân quyền; tìm phòng theo ngày + số khách + giá, có phân trang; chi tiết loại phòng; đặt phòng chống trùng; xem lịch sử và hủy booking; admin CRUD loại phòng/phòng/tiện nghi (ảnh nhập bằng URL); admin quản lý booking và đổi trạng thái; dashboard dạng thẻ số liệu + bảng.
- **Chỉ làm nếu dư thời gian sau 17/12:** thanh toán mock, đánh giá, quản lý người dùng, upload file, email xác nhận, VNPay, mã giảm giá.
- **Không làm:** nhiều khách sạn, chat, app mobile, đa ngôn ngữ.
- **Nếu trễ, cắt theo thứ tự:** deploy cloud → dashboard thẻ → lọc/sắp xếp nâng cao → giảm test tự động. Không bao giờ cắt: đăng nhập + phân quyền, tìm phòng trống, đặt phòng chống trùng, CRUD admin, test.

## 8. Lộ trình và mốc

| Mốc | Nội dung |
| --- | --- |
| 24–26/11 | Nền tảng: JavaScript, Git, HTML/CSS, TypeScript cơ bản |
| 27/11–30/11 | Express + TS, thiết kế DB, Prisma schema, migrate, seed (mốc 30/11) |
| 1/12–7/12 | Backend v1: CRUD, auth, tìm kiếm, phòng trống, đặt phòng, admin (tag `backend-v1`) |
| 8/12–14/12 | React nền tảng, giao diện khách, luồng đặt phòng (mốc 14/12) |
| 15/12–16/12 | Giao diện admin, **đóng băng tính năng 16/12** |
| 17/12–21/12 | Hoàn thiện UI, test tự động ≥ 15, test thủ công ≥ 30, deploy |
| 22/12–23/12 | Tài liệu cho báo cáo, tag `v1.0`, backup DB, video demo |

Chủ nhật (29/11, 6/12, 13/12, 20/12) làm nhẹ ~5 giờ để ôn và bù việc trễ. Đầu mỗi phiên, hỏi tôi đang ở ngày nào để làm đúng việc của ngày đó.

## 9. Git

- Nhánh `main` ổn định; làm việc trên `feature/<tên>`; merge khi chạy được.
- Commit nhỏ, thường xuyên, tiền tố: `feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:`.
- Gắn tag tại các mốc: `backend-v1`, `v1.0`.

## 10. Lệnh thường dùng (cập nhật khi dự án có script thật)

```bash
# Backend (thư mục backend/)
npm run dev                      # chạy server có tự reload
npx prisma migrate dev           # tạo/áp dụng migration
npx prisma db seed               # nạp dữ liệu mẫu
npx prisma studio                # xem DB bằng giao diện
npm test                         # chạy test

# Frontend (thư mục frontend/)
npm run dev                      # chạy Vite dev server
npm run lint                     # kiểm tra ESLint
```

## 11. Định nghĩa "xong" cho mỗi chức năng

- Chạy được, đã test bằng Postman (backend) hoặc trên trình duyệt (frontend), có xử lý lỗi.
- Có validate input và kiểm tra quyền.
- Đã commit với message rõ ràng.
- Tôi giải thích lại được chức năng đó bằng lời của mình.
- Ảnh chụp màn hình hoặc ghi chú ngắn đã bỏ vào `docs/` để dùng cho báo cáo.