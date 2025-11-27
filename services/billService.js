import api from "./api";
import { ENDPOINTS } from "../constants/config";

// Lấy danh sách hóa đơn
export const getBills = async () => {
  try {
    const res = await api.get(ENDPOINTS.bills);

    console.log("📌 RAW RES:", res.data);

    // Backend trả về { data: { items, ... }, ... }
    return res.data.data?.items;

  } catch (err) {
    console.log("❌ Lỗi getBills:", err.response?.data || err.message);
    throw err;
  }
};

// Lấy chi tiết hóa đơn
export const getBillDetail = async (billId) => {
  try {
    const res = await api.get(ENDPOINTS.billDetail(billId));

    // R.ok trả về { success: true, data: {...} }
    return res.data.data;

  } catch (err) {
    console.log("❌ Lỗi getBillDetail:", err.response?.data || err.message);
    throw err;
  }
};

// Tạo bill mới từ session  
export const createBillFromSession = async (sessionData, paymentData) => {
  try {
    console.log('💳 Creating bill from session:', sessionData._id);
    console.log('💳 Session data:', sessionData);
    console.log('💳 Payment data:', paymentData);
    
    // Chuẩn bị data theo format backend
    const billData = {
      session: sessionData._id,
      table: sessionData.table._id || sessionData.table,
      tableName: sessionData.table.name || paymentData.tableName,
      areaId: sessionData.table.area || null,
      
      // Tạo items array từ session
      items: [],
      
      // Payment info
      paymentMethod: paymentData.paymentMethod || 'cash',
      paid: true,
      paidAt: new Date().toISOString(),
      
      // Staff - lấy từ auth context hoặc set default
      staff: paymentData.staffId || sessionData.staff || null,
      
      note: paymentData.note || ''
    };

    // Tính thời gian chơi và tạo item 'play'
    if (sessionData.startTime) {
      const startTime = new Date(sessionData.startTime);
      const endTime = new Date();
      const totalMinutes = Math.floor((endTime - startTime) / (1000 * 60));
      const ratePerHour = sessionData.pricingSnapshot?.ratePerHour || paymentData.ratePerHour || 40000;
      const playAmount = Math.ceil(totalMinutes / 60) * ratePerHour;

      billData.items.push({
        type: 'play',
        minutes: totalMinutes,
        ratePerHour: ratePerHour,
        amount: playAmount,
        note: `Chơi bida ${Math.floor(totalMinutes / 60)}h${totalMinutes % 60}m`
      });
    }

    // Thêm các items sản phẩm từ session
    if (sessionData.items && sessionData.items.length > 0) {
      sessionData.items.forEach(item => {
        billData.items.push({
          type: 'product',
          productId: item.product,
          nameSnapshot: item.nameSnapshot || 'Sản phẩm',
          priceSnapshot: item.priceSnapshot || 0,
          qty: item.qty || 0,
          amount: (item.priceSnapshot || 0) * (item.qty || 0),
          note: item.note || ''
        });
      });
    }

    console.log('📝 Bill data to send:', billData);

    // Gọi API tạo bill - sử dụng endpoint đúng
    const response = await api.post(ENDPOINTS.bills, billData);
    
    console.log('✅ Bill created successfully:', response.data);
    return response.data.data || response.data;

  } catch (err) {
    console.error('❌ Lỗi createBillFromSession:', err.response?.data || err.message);
    console.error('❌ Full error:', err);
    throw err;
  }
};

// Đánh dấu bill đã thanh toán
export const markBillAsPaid = async (billId, paymentData) => {
  try {
    const response = await api.patch(`${ENDPOINTS.bills}/${billId}/pay`, {
      paymentMethod: paymentData.paymentMethod || 'cash',
      paidAt: new Date().toISOString()
    });
    
    return response.data.data || response.data;
  } catch (err) {
    console.error('❌ Lỗi markBillAsPaid:', err.response?.data || err.message);
    throw err;
  }
};

export default {
  getBills,
  getBillDetail,
  createBillFromSession,
  markBillAsPaid,
};

