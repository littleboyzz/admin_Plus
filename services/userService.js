import api from '../services/api';

/**
 * normalizeUser
 * Ensure UI always has `id` field (either id or _id from backend)
 */
function normalizeUser(u = {}) {
  return {
    ...u,
    id: u.id || u._id || null,
  };
}

// =========================
// 📌 Lấy danh sách nhân viên
// =========================
export async function getEmployees({
  page = 1,
  limit = 20,
  search = "",
  role = null,         // "admin" | "staff" | null
  active = null,       // true | false | null
  branchId = null,
} = {}) {
  try {
    const params = { page, limit };

    // IMPORTANT: backend expects 'q' for search
    if (search) params.q = search.trim();

    // ✔ role chỉ được gửi nếu là "admin" hoặc "staff"
    if (role === "admin" || role === "staff") {
      params.role = role;
    }

    // ✔ active chỉ gửi nếu là true/false
    if (active === true || active === false) {
      params.active = active;
    }

    if (branchId) params.branchId = branchId;

    const res = await api.get("/users", { params });

    // Backend trả: { status, message, data: { items, page, limit, total, sort } }
    const data = res?.data?.data ?? { items: [], pagination: {} };

    // Normalize items
    const items = (data.items || []).map(normalizeUser);

    return { ...data, items };
  } catch (err) {
    console.error("❌ [User] getEmployees error:", err?.response?.data || err);
    throw err;
  }
}

// =========================
// 📌 Lấy chi tiết 1 nhân viên
// =========================
export async function getEmployeeById(id) {
  try {
    const res = await api.get(`/users/${id}`);
    const data = res?.data?.data ?? null;
    return normalizeUser(data);
  } catch (err) {
    console.error('❌ [User] getEmployeeById error:', err?.response?.data || err);
    throw err;
  }
}

// =========================
// 📌 Tạo nhân viên
// =========================
export async function createEmployee(payload) {
  // Payload hợp lệ backend yêu cầu:
  // { username, password, name, email?, phone?, role?, active?, branchId?, avatar? }
  const body = {
    username: payload.username?.trim(),
    password: payload.password,
    name: payload.name?.trim(),
    email: payload.email ? payload.email.trim() : undefined,
    phone: payload.phone ?? undefined,
    role: payload.role ?? "staff",
    active: typeof payload.active === 'boolean' ? payload.active : true,
    branchId: typeof payload.branchId !== 'undefined' ? payload.branchId : null,
    avatar: payload.avatar ?? null,
  };

  // Remove undefined keys so backend Joi `sparse` rules work better
  Object.keys(body).forEach(k => body[k] === undefined && delete body[k]);

  try {
    const res = await api.post('/users', body);
    const data = res?.data?.data ?? null;
    return normalizeUser(data);
  } catch (err) {
    console.error('❌ [User] createEmployee error:', err?.response?.data || err);
    throw err;
  }
}

// =========================
// 📌 Cập nhật nhân viên
// =========================
// Note: backend PUT /users/:id allows only specific fields:
// { name, email, phone, avatar, role, active, branchId }
export async function updateEmployee(id, payload) {
  const body = {
    name: payload.name?.trim(),
    email: payload.email ? payload.email.trim() : undefined,
    phone: payload.phone ?? undefined,
    avatar: payload.avatar ?? null,
    role: payload.role,
    active: typeof payload.active !== 'undefined' ? !!payload.active : undefined,
    branchId: typeof payload.branchId !== 'undefined' ? payload.branchId : undefined,
  };

  // Remove undefined keys
  Object.keys(body).forEach(k => body[k] === undefined && delete body[k]);

  try {
    const res = await api.put(`/users/${id}`, body);
    const data = res?.data?.data ?? null;
    return normalizeUser(data);
  } catch (err) {
    console.error('❌ [User] updateEmployee error:', err?.response?.data || err);
    throw err;
  }
}

// =========================
// 📌 Đổi vai trò
// =========================
export async function changeRole(id, role) {
  try {
    const res = await api.patch(`/users/${id}/role`, { role });
    const data = res?.data?.data ?? null;
    return normalizeUser(data);
  } catch (err) {
    console.error('❌ [User] changeRole error:', err?.response?.data || err);
    throw err;
  }
}

// =========================
// 📌 Kích hoạt / vô hiệu hóa
// =========================
export async function setActive(id, active) {
  try {
    const res = await api.patch(`/users/${id}/active`, { active });
    const data = res?.data?.data ?? null;
    return normalizeUser(data);
  } catch (err) {
    console.error('❌ [User] setActive error:', err?.response?.data || err);
    throw err;
  }
}

// =========================
// 📌 Reset mật khẩu
// =========================
export async function resetPassword(id, newPassword) {
  try {
    // Validator trên backend yêu cầu confirmNewPassword → gửi luôn
    const res = await api.patch(`/users/${id}/reset-password`, {
      newPassword,
      confirmNewPassword: newPassword,
    });
    return res?.data ?? null;
  } catch (err) {
    console.error('❌ [User] resetPassword error:', err?.response?.data || err);
    throw err;
  }
}

// =========================
// 📌 Xóa nhân viên
// =========================
export async function deleteEmployee(id) {
  try {
    const res = await api.delete(`/users/${id}`);
    // backend có thể trả 204 No Content hoặc 200
    return res?.status === 204 || res?.status === 200;
  } catch (err) {
    console.error('❌ [User] deleteEmployee error:', err?.response?.data || err);
    throw err;
  }
}
