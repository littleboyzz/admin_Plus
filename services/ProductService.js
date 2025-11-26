// services/product.service.js
import api from './api';

// Lấy tất cả sản phẩm (hoặc phân trang tuỳ bạn)
export async function getAllProducts(params = {}) {
  try {
    const res = await api.get('/products', {
      params: {
        page: 1,
        limit: 100,
        ...params,      // có thể truyền thêm category, q,...
      },
    });

    // Nếu backend dùng R.paged:
    // { data: { items: [...], page, limit, total }, message, status }
    const list = res?.data?.data?.items ?? [];

    return list;
  } catch (err) {
    console.error('❌ [Product] getAllProducts error:', err);
    throw err;
  }
}

// Lấy sản phẩm theo category
export async function getMenuItemsByCategory(categoryId) {
  return getAllProducts({ category: categoryId });
}
// ⚠️ category là bắt buộc trong schema backend,
// nên tạm truyền từ FE vào (hoặc dùng 1 category mặc định)
export async function createProduct({ name, price, note, categoryId, imagePath}) {
  // tuỳ backend bạn có dùng unit/isService/tags... thì gửi thêm
  const body = {
    name,
    category: categoryId,     // 🔥 bắt buộc
    price: Number(price) || 0,
    unit: 'ly',               // tạm default, bạn đổi tuỳ ý
    isService: false,
    images: imagePath ? [imagePath] : [], // sử dụng imagePath nếu có
    tags: [],
    active: true,
    note: note || '',
  };

  const res = await api.post('/products', body);

  // Nếu backend dùng R.created:
  // { data: { ...product }, message, status }
  return res?.data?.data ?? res.data;
}
// Lấy danh sách categories (dùng cho Picker)
export async function getMenuCategories() {
  const res = await api.get('/categories');

  // Backend kiểu R.paged:
  // { data: { items: [...], page, limit, total }, message, status }
  const list = res?.data?.data?.items ?? [];

  // Mỗi category thường có: id, name, code, ...
  return list;
}
// Upload 1 ảnh, trả về đường dẫn trên server
export async function uploadProductImage(localUri) {
  const formData = new FormData();

  // Đoán MIME type
  const fileName = localUri.split('/').pop() || 'image.jpg';
  const match = /\.(\w+)$/.exec(fileName);
  const ext = match ? match[1].toLowerCase() : 'jpg';
  const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';

  formData.append('image', {
    uri: localUri,
    name: fileName,
    type: mimeType,
  });

  const res = await api.post('/products/upload-image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data', // override JSON
    },
  });

  return res?.data?.data?.path; // '/uploads/products/...'
}
// Cập nhật sản phẩm
export async function updateProduct(id, { name, price, note, images }) {
  const body = {
    name,
    price: Number(price) || 0,
    note: note || '',
  };
   if (Array.isArray(images)) {
    body.images = images; // backend update đã hỗ trợ field images
  }

  const res = await api.put(`/products/${id}`, body);

  // Backend R.ok:
  // { status, message, data: { ...product } }
  return res?.data?.data ?? res.data;
}

// Xóa sản phẩm
export async function deleteProduct(id) {
  // Backend R.noContent → 204
  const res = await api.delete(`/products/${id}`);
  return res.status; // chỉ để biết là 204
}