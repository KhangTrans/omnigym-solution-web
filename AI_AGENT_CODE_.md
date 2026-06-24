# AI Agent Code Style Guide - OmniGym Project

> File này là chuẩn làm việc cho AI Agent/dev khi code hoặc refactor OmniGym. Chuẩn hiện tại ưu tiên kiến trúc **middleware-first**: auth, role check và input validation nằm ở middleware; controller mỏng; service giữ business logic và persistence.
>
> Khi có mâu thuẫn giữa code cũ và file này, ưu tiên refactor dần về file này. Không cần sửa toàn bộ project một lần nếu task nhỏ, nhưng code mới phải đi theo chuẩn này.

---

## 1. Core Principles

- Luồng chuẩn: **Frontend Page/Component -> API layer -> Backend Route -> Middlewares -> Controller -> Service -> Entity/Database**.
- **Route** khai báo endpoint và thứ tự middleware.
- **Middleware** xử lý request-level concerns: auth, role, params/query/body validation, normalize dữ liệu.
- **Controller** chỉ orchestration: lấy dữ liệu đã qua middleware, gọi service, trả response, catch error.
- **Service** xử lý domain-level concerns: business rule, ownership/resource scope nếu cần DB, transaction, persistence.
- Mỗi loại check chỉ nằm ở một tầng để tránh duplicate và lệch message/status.
- Dùng `enum` cho status nghiệp vụ nếu đã có enum; không hard-code string rải rác.
- Ưu tiên tiếng Việt cho backend response/toast nếu màn hình đang tiếng Việt.
- Hạn chế `any`; ưu tiên `type`/`interface`, `unknown` + narrowing cho error.

---

## 2. Single Source Of Truth - Middleware First

### 2.1. Phân tầng trách nhiệm

```txt
Route       -> khai báo endpoint + middleware chain + handler
Middleware  -> auth + pure role gate + request validation + normalization
Controller  -> gọi service + response
Service     -> business rule + DB + transaction
Entity/DTO   -> data model / TypeScript contract
```

### 2.2. Bảng phân loại check

| Loại check               | Ví dụ                                       | Tầng chuẩn                               |
| ------------------------ | ------------------------------------------- | ---------------------------------------- |
| Auth                     | Có Bearer token hợp lệ không                | Middleware `isAuthenticated`             |
| Pure role gate           | Chỉ `Admin`, `Staff` được vào route         | Middleware `authorizeRole([...])`        |
| Params validation        | `:id` phải là số nguyên dương               | Middleware `validateParams(...)`         |
| Query validation         | `page`, `limit`, `date`, `status`           | Middleware `validateQuery(...)`          |
| Body validation          | Required/type/format của payload            | Middleware `validateBody(...)`           |
| Normalize request        | trim string, Number(id), default page/limit | Middleware validation                    |
| Ownership/resource scope | User chỉ sửa dữ liệu của mình               | Service hoặc middleware preload resource |
| Branch scope             | BranchManager chỉ xử lý branch mình quản lý | Service hoặc middleware preload resource |
| State transition         | Chỉ approve khi `pending`                   | Service                                  |
| Unique/FK constraint     | Email trùng, branch không tồn tại           | Service                                  |
| Cross-table rule         | Trùng lịch, vượt hạn mức nghỉ               | Service                                  |
| Transaction              | Tạo/cập nhật nhiều bảng                     | Service                                  |

### 2.3. `authorizeRole([...])` có còn dùng không?

Có. `authorizeRole(["Admin", "BranchManager", "Staff"])` vẫn là cách đúng vì đây là **middleware configuration**, không phải controller/service tự check role.

Ví dụ đúng:

```ts
router.get(
  "/approved",
  isAuthenticated,
  authorizeRole(["Admin", "BranchManager", "Staff"]),
  getApprovedTrainersHandler,
);
```

Giải thích:

- `authorizeRole([...])` là middleware nhận danh sách role được phép.
- Mảng `[...]` chỉ là config cho middleware.
- Không được hiểu là router đang tự business-check; router chỉ khai báo middleware chain.
- Cái cần tránh là check tay trong controller/service kiểu:

```ts
if (req.user?.role !== "Admin") {
  return res.status(403).json({ message: "Bạn không có quyền." });
}
```

hoặc duplicate trong service:

```ts
if (currentUser.role !== "Admin" && currentUser.role !== "BranchManager") {
  throw new Error("Bạn không có quyền.");
}
```

### 2.4. Pure role gate vs resource scope

Phân biệt rõ:

```txt
Pure role gate       -> middleware authorizeRole([...])
Ownership/resource   -> service hoặc middleware preload resource
Branch scope         -> service hoặc middleware preload resource
```

Ví dụ pure role gate:

```ts
router.patch(
  "/:id/approve",
  isAuthenticated,
  authorizeRole(["Admin", "BranchManager"]),
  validateParams(idParamSchema),
  approveTrainerApplicationHandler,
);
```

Ví dụ resource scope vẫn có thể ở service:

```ts
if (
  currentUser.role === "BranchManager" &&
  application.branch_id !== managerBranchId
) {
  throw new AppError(
    "Bạn chỉ được xử lý hồ sơ thuộc chi nhánh mình quản lý.",
    403,
  );
}
```

Nếu muốn scope cũng ở middleware, phải có middleware preload resource rõ ràng:

```ts
router.put(
  "/:id",
  isAuthenticated,
  authorizeRole(["Admin", "BranchManager"]),
  validateParams(idParamSchema),
  loadBranchById,
  checkBranchManagerScope,
  updateBranchHandler,
);
```

Không preload resource thì scope check nên để service để tránh query DB trùng/lệch logic.

---

## 3. Backend Architecture

### 3.1. File structure khi thêm feature

```txt
src/routes/feature.routes.ts
src/controllers/feature.controller.ts
src/services/feature.service.ts
src/dtos/feature.dto.ts
src/models/feature.entity.ts
src/middlewares/validators/feature.validator.ts   // nếu validate nhiều hoặc schema lớn
```

Mount route trong `src/app.ts`:

```ts
app.use("/api/features", featureRoutes);
```

### 3.2. Route style

Route là nơi nhìn vào phải thấy endpoint cần auth/role/validate gì.

```ts
router.post(
  "/",
  isAuthenticated,
  authorizeRole(["Admin"]),
  validateBody(createFeatureSchema),
  createFeatureHandler,
);

router.get(
  "/",
  isAuthenticated,
  authorizeRole(["Admin", "Staff"]),
  validateQuery(listFeatureQuerySchema),
  getFeaturesHandler,
);

router.patch(
  "/:id/approve",
  isAuthenticated,
  authorizeRole(["Admin", "BranchManager"]),
  validateParams(idParamSchema),
  approveFeatureHandler,
);
```

Quy tắc route:

- Public thật sự -> không dùng `isAuthenticated`.
- Chỉ cần đăng nhập -> `isAuthenticated`.
- Cần role -> `isAuthenticated` + `authorizeRole([...])`.
- Có `:id` -> thêm `validateParams(...)`.
- Có query filter/pagination -> thêm `validateQuery(...)`.
- Có body -> thêm `validateBody(...)`.
- Không viết logic `if` trong route file.

### 3.3. Middleware style

Các middleware chuẩn nên có:

```txt
isAuthenticated
authorizeRole([...])
validateBody(schemaOrFn)
validateParams(schemaOrFn)
validateQuery(schemaOrFn)
```

Middleware validate chịu trách nhiệm:

- Check required/type/format.
- Convert string query/params sang type đúng nếu cần.
- Trim/normalize field đơn giản.
- Gắn dữ liệu đã validate vào `req.body`, `req.query`, `req.params` hoặc `req.validated` tùy convention project.
- Trả `400` nếu input sai.

Ví dụ middleware validate dạng function:

```ts
type Validator<T> = (input: unknown) => T;

export const validateBody = <T>(validator: Validator<T>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = validator(req.body);
      next();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Dữ liệu không hợp lệ.";
      return res.status(400).json({ message });
    }
  };
};
```

Ví dụ validator:

```ts
export const createFeatureBody = (body: unknown): CreateFeatureDto => {
  const data = body as Partial<CreateFeatureDto>;

  if (!data.name || !data.name.trim()) {
    throw new Error("Vui lòng nhập tên.");
  }

  return {
    name: data.name.trim(),
    description: data.description?.trim(),
  };
};
```

> Nếu sau này dùng `zod`/`class-validator`, vẫn giữ nguyên nguyên tắc: validate chạy ở middleware, controller không validate tay.

### 3.4. Controller style

Controller chỉ làm 4 việc:

1. Lấy dữ liệu đã qua middleware (`req.user`, `req.body`, `req.params`, `req.query`).
2. Gọi service.
3. Trả response `{ message, data }`.
4. Catch error và map status.

```ts
export const createFeatureHandler = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const result = await createFeature(userId, req.body);

    return res.status(201).json({
      message: "Tạo dữ liệu thành công.",
      data: result,
    });
  } catch (error: unknown) {
    return handleControllerError(error, res);
  }
};
```

Controller không nên:

```ts
// Sai: validate tay trong controller
if (!req.body.name) return res.status(400).json(...);

// Sai: role check tay trong controller
if (req.user?.role !== "Admin") return res.status(403).json(...);

// Sai: business rule trong controller
if (item.status !== "pending") return res.status(400).json(...);
```

### 3.5. Service style

Service giữ domain logic:

- Đọc/ghi DB.
- Transaction.
- Business rule.
- Ownership/resource scope nếu cần DB.
- Unique/FK/cross-table constraints.
- Throw typed error (`AppError`, `NotFoundError`) hoặc Error theo convention hiện tại.

Service không nên:

```ts
// Sai nếu middleware đã validate body
if (!dto.name?.trim()) throw new Error("Thiếu name");

// Sai nếu route đã authorizeRole
if (currentUser.role !== "Admin") throw new Error("Bạn không có quyền");
```

Service đúng:

```ts
export const approveFeature = async (id: number, reviewerId: number) => {
  return AppDataSource.transaction(async (manager) => {
    const repo = manager.getRepository(Feature);
    const item = await repo.findOne({ where: { id } });

    if (!item) throw new NotFoundError("Không tìm thấy dữ liệu.");
    if (item.status !== FeatureStatus.Pending) {
      throw new AppError("Chỉ có thể duyệt dữ liệu đang chờ duyệt.", 400);
    }

    item.status = FeatureStatus.Approved;
    item.reviewed_by = reviewerId;
    item.reviewed_at = new Date();
    return repo.save(item);
  });
};
```

---

## 4. Validation Convention

### 4.1. Validation nằm ở middleware

Project ưu tiên validate request ở middleware:

```txt
validateParams -> req.params
validateQuery  -> req.query
validateBody   -> req.body
```

Controller không tự viết `validateXxxBody` local nữa.

### 4.2. Validator placement

Nếu validator nhỏ, có thể đặt gần route/domain:

```txt
src/middlewares/validators/feature.validator.ts
```

Nếu project chưa có folder validators, tạo theo domain:

```txt
src/middlewares/validators/trainer-application.validator.ts
src/middlewares/validators/work-shift.validator.ts
src/middlewares/validators/common.validator.ts
```

Không đặt validation trong controller.

### 4.3. Common validators

Nên có common validator cho ID:

```ts
export const idParam = (params: unknown) => {
  const data = params as { id?: string };
  const id = Number(data.id);

  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("ID không hợp lệ.");
  }

  return { id };
};
```

Query pagination:

```ts
export const paginationQuery = (query: unknown) => {
  const data = query as { page?: string; limit?: string; search?: string };

  return {
    page: data.page ? Math.max(1, Number(data.page)) : 1,
    limit: data.limit ? Math.min(100, Math.max(1, Number(data.limit))) : 10,
    search: data.search?.trim() || undefined,
  };
};
```

### 4.4. Request normalization

Middleware có thể normalize:

- `id: "12"` -> `id: 12`
- `email` -> lowercase + trim
- empty string -> `undefined` nếu field optional
- date string format `YYYY-MM-DD`

Nhưng middleware không được query nhiều bảng để quyết định business flow, trừ khi middleware đó được đặt tên rõ là preload/scope middleware.

---

## 5. Auth & Role

### 5.1. Standard chain

```ts
router.post(
  "/admin-only",
  isAuthenticated,
  authorizeRole(["Admin"]),
  validateBody(payloadValidator),
  handler,
);
```

### 5.2. Role checklist

- Role thuần -> `authorizeRole([...])`.
- Không check role tay trong controller.
- Không duplicate role check y hệt middleware trong service.
- Scope theo resource -> service hoặc middleware preload resource.
- Route admin/staff/manager luôn phải đọc lại role list đúng nghiệp vụ.

### 5.3. Trainer role flow

```txt
Register account -> Customer mặc định
Submit Trainer Application -> application pending
Approve Trainer Application -> update role_id = Trainer + activate trainer profile
```

Không cho user tự thành Trainer chính thức chỉ bằng register.

---

## 6. Response & Error Convention

### 6.1. Success response

```ts
return res.status(200).json({ message: "Thao tác thành công.", data: result });
return res
  .status(201)
  .json({ message: "Tạo dữ liệu thành công.", data: result });
```

List có pagination:

```ts
return res.json({
  data: items,
  pagination: { page, limit, total, totalPages },
});
```

### 6.2. Error status

| Code | Ý nghĩa                                |
| ---- | -------------------------------------- |
| 400  | Validation input / business rule fail  |
| 401  | Chưa đăng nhập / token không hợp lệ    |
| 403  | Sai role / không có quyền với resource |
| 404  | Không tìm thấy resource                |
| 500  | Lỗi server                             |

### 6.3. AppError recommendation

Nên chuẩn hóa error thay vì `throw new Error(...)` mọi nơi.

```ts
export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Không tìm thấy dữ liệu.") {
    super(message, 404);
  }
}
```

Controller dùng helper chung:

```ts
export const handleControllerError = (error: unknown, res: Response) => {
  const statusCode =
    typeof error === "object" && error !== null && "statusCode" in error
      ? Number((error as { statusCode?: number }).statusCode) || 500
      : 500;

  const message = error instanceof Error ? error.message : "Thao tác thất bại.";
  return res.status(statusCode).json({ message });
};
```

---

## 7. Transaction

Dùng `AppDataSource.transaction` khi:

- Tạo record cha + record con.
- Approve/reject cập nhật nhiều bảng.
- Copy dữ liệu từ application sang bảng chính thức.
- Delete dữ liệu cũ rồi insert mới.
- Update user role kèm tạo/cập nhật hồ sơ liên quan.

```ts
return AppDataSource.transaction(async (manager) => {
  const parentRepo = manager.getRepository(Parent);
  const childRepo = manager.getRepository(Child);

  const parent = await parentRepo.save(parentRepo.create({ name: dto.name }));
  const children = dto.items.map((item) =>
    childRepo.create({ parent_id: parent.id, name: item.name }),
  );

  await childRepo.save(children);
  return { ...parent, children };
});
```

Không cần transaction cho đọc đơn giản hoặc update 1 bảng không liên quan dữ liệu khác.

---

## 8. Frontend Style

### 8.1. Flow chuẩn

```txt
Page/Component -> API layer -> Backend API -> toast/message
```

Không gọi `axios` trực tiếp rải rác trong page cho cùng một domain.

### 8.2. API layer

```ts
import api from "./axios";

export const featureAPI = {
  create: (payload: CreateFeaturePayload) => api.post("/features", payload),
  update: (id: number, payload: UpdateFeaturePayload) =>
    api.put(`/features/${id}`, payload),
  getAll: (params?: Record<string, string | number>) =>
    api.get("/features", { params }),
  getOne: (id: number) => api.get(`/features/${id}`),
  remove: (id: number) => api.delete(`/features/${id}`),
};
```

### 8.3. Page/component order

Trong page nên tách rõ:

1. State.
2. Derived values.
3. Load data `useEffect`.
4. Helpers `setField`, `buildPayload`.
5. Handlers `submit`, `update`, `delete`.
6. Render loading/empty/error/success.

### 8.4. Upload ảnh

Dùng `ImageUpload` + `uploadImageToCloudinary`; backend chỉ nhận URL.

```tsx
<ImageUpload
  value={form.image_url}
  onChange={(value) => setField("image_url", value)}
/>
```

---

## 9. TypeScript & Naming

### 9.1. TypeScript

Ưu tiên:

1. `type`/`interface` rõ ràng.
2. `unknown` + narrowing.
3. Generic đơn giản.
4. `any` chỉ khi bridge code cũ hoặc data quá động.

```ts
catch (error: unknown) {
  const message = error instanceof Error ? error.message : "Đã có lỗi xảy ra.";
}
```

### 9.2. Naming

| Loại                       | Convention                     | Ví dụ                            |
| -------------------------- | ------------------------------ | -------------------------------- |
| Backend file               | `kebab-case`                   | `trainer-application.service.ts` |
| Entity class               | `PascalCase`                   | `TrainerApplication`             |
| Function                   | `camelCase`                    | `submitTrainerApplication`       |
| API object frontend        | `camelCaseAPI`                 | `trainerApplicationAPI`          |
| DB column                  | `snake_case`                   | `created_at`, `user_id`          |
| Frontend field map backend | `snake_case` nếu map trực tiếp | `form.phone_number`              |

---

## 10. Project Folder Mapping

### Backend

| Loại                 | Folder / Pattern                        |
| -------------------- | --------------------------------------- |
| Route                | `src/routes/feature.routes.ts`          |
| Controller           | `src/controllers/feature.controller.ts` |
| Service              | `src/services/feature.service.ts`       |
| DTO                  | `src/dtos/feature.dto.ts`               |
| Entity               | `src/models/feature.entity.ts`          |
| Enum nhỏ             | `src/models/feature-status.enum.ts`     |
| Middleware           | `src/middlewares/`                      |
| Validator middleware | `src/middlewares/validators/`           |
| Mount route          | `src/app.ts`                            |

### Frontend

| Loại                      | Folder                 |
| ------------------------- | ---------------------- |
| API domain                | `src/api/`             |
| Public pages              | `src/pages/pubblic/`   |
| Customer pages            | `src/pages/customers/` |
| Admin/staff/manager pages | `src/pages/admin/`     |
| Shared components         | `src/components/site/` |
| UI primitive              | `src/components/ui/`   |
| Utils                     | `src/utils/`           |
| Shared types              | `src/types/`           |

---

## 11. Module Reference

Khi code feature mới, đọc các file cùng domain trước. Nếu cần module tham chiếu:

```txt
Backend:
src/routes/trainer-application.routes.ts
src/controllers/trainer-application.controller.ts
src/services/trainer-application.service.ts
src/models/trainer-application.entity.ts
src/models/trainer-application-certificate.entity.ts
src/models/trainer-status.enum.ts
src/middlewares/auth.middleware.ts
src/app.ts

Frontend:
omnigym-solution-web/src/api/trainerApplications.ts
omnigym-solution-web/src/pages/pubblic/TrainerJoin.tsx
omnigym-solution-web/src/components/site/ImageUpload.tsx
omnigym-solution-web/src/utils/cloudinary.ts
```

> Lưu ý: một số module cũ chưa đúng chuẩn middleware-first. Code mới/refactor mới ưu tiên chuẩn trong file này.

---

## 12. Standard Templates

### 12.1. CRUD route template

```ts
import { Router } from "express";
import {
  createFeatureHandler,
  getFeaturesHandler,
  getFeatureByIdHandler,
  updateFeatureHandler,
  deleteFeatureHandler,
} from "../controllers/feature.controller.js";
import {
  isAuthenticated,
  authorizeRole,
} from "../middlewares/auth.middleware.js";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../middlewares/validate.middleware.js";
import {
  createFeatureBody,
  updateFeatureBody,
  featureIdParams,
  listFeatureQuery,
} from "../middlewares/validators/feature.validator.js";

const router = Router();

router.get(
  "/",
  isAuthenticated,
  authorizeRole(["Admin", "Staff"]),
  validateQuery(listFeatureQuery),
  getFeaturesHandler,
);

router.get(
  "/:id",
  isAuthenticated,
  validateParams(featureIdParams),
  getFeatureByIdHandler,
);

router.post(
  "/",
  isAuthenticated,
  authorizeRole(["Admin"]),
  validateBody(createFeatureBody),
  createFeatureHandler,
);

router.put(
  "/:id",
  isAuthenticated,
  authorizeRole(["Admin"]),
  validateParams(featureIdParams),
  validateBody(updateFeatureBody),
  updateFeatureHandler,
);

router.delete(
  "/:id",
  isAuthenticated,
  authorizeRole(["Admin"]),
  validateParams(featureIdParams),
  deleteFeatureHandler,
);

export default router;
```

### 12.2. Controller template

```ts
export const createFeatureHandler = async (req: Request, res: Response) => {
  try {
    const result = await createFeature(req.user!.id, req.body);
    return res.status(201).json({
      message: "Tạo dữ liệu thành công.",
      data: result,
    });
  } catch (error: unknown) {
    return handleControllerError(error, res);
  }
};
```

### 12.3. Middleware validator template

```ts
export const createFeatureBody = (input: unknown): CreateFeatureDto => {
  const body = input as Partial<CreateFeatureDto>;

  if (!body.name || !body.name.trim()) {
    throw new Error("Vui lòng nhập tên.");
  }

  return {
    name: body.name.trim(),
    description: body.description?.trim(),
  };
};
```

### 12.4. Service template

```ts
export const createFeature = async (userId: number, dto: CreateFeatureDto) => {
  const repo = AppDataSource.getRepository(Feature);

  const item = repo.create({
    user_id: userId,
    name: dto.name,
    description: dto.description,
    status: FeatureStatus.Draft,
  });

  return repo.save(item);
};
```

---

## 13. Pre-Commit Checklist

- [ ] Route đã gắn `isAuthenticated` đúng chưa?
- [ ] Route đã gắn `authorizeRole([...])` đúng chưa?
- [ ] Route có `validateParams(...)` cho `:id` chưa?
- [ ] Route có `validateQuery(...)` cho filter/pagination chưa?
- [ ] Route có `validateBody(...)` cho request body chưa?
- [ ] Controller có còn validate tay không?
- [ ] Controller có còn role check tay không?
- [ ] Service có còn check lại role y hệt middleware không?
- [ ] Service chỉ còn business rule + DB + transaction chưa?
- [ ] Có duplicate check giữa middleware/controller/service không?
- [ ] Response thành công có `{ message, data }` chưa?
- [ ] Error có status code phù hợp chưa?
- [ ] Status nghiệp vụ dùng enum chưa?
- [ ] Multi-table action có transaction chưa?
- [ ] Frontend gọi qua API layer chưa?
- [ ] Frontend có loading/submitting/error handling chưa?
- [ ] Upload ảnh dùng Cloudinary/ImageUpload chưa?
- [ ] Có mount route mới trong `app.ts` chưa?

---

## 14. Do / Don't

### Do

- Khai báo role bằng `authorizeRole([...])` trong route.
- Validate request bằng middleware.
- Giữ controller mỏng.
- Giữ service là nơi xử lý domain logic.
- Dùng transaction khi đụng nhiều bảng.
- Dùng enum cho status.
- Tách API layer frontend.
- Lấy error message từ backend để hiển thị toast.

### Don't

- Không viết `if (req.user.role...)` trong controller.
- Không validate required/type/format trong controller nếu đã có middleware.
- Không duplicate role check y hệt middleware trong service.
- Không để controller làm business logic.
- Không gọi `axios` trực tiếp rải rác trong page.
- Không upload binary về backend nếu flow đang dùng Cloudinary.
- Không tạo Trainer chính thức ngay lúc register.
- Không hard-code status string nếu đã có enum.
