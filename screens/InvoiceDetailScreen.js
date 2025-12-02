import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getBillDetail } from "../services/billService";

const InvoiceDetailScreen = ({ route, navigation }) => {
  const { billId } = route.params;

  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDetail();
  }, []);

  const loadDetail = async () => {
    try {
      const data = await getBillDetail(billId);
      console.log("📌 Chi tiết hóa đơn:", data);
      setBill(data);
    } catch (error) {
      console.log("❌ Lỗi tải chi tiết hóa đơn:", error);
    } finally {
      setLoading(false);
    }
  };

  // ⭐ Tính giờ chơi fallback nếu không có start/end
  const getPlayTime = (bill) => {
    if (bill.startTime && bill.endTime) {
      const s = new Date(bill.startTime);
      const e = new Date(bill.endTime);
      const minutes = Math.round((e - s) / 60000);
      return `${s.getHours()}:${String(s.getMinutes()).padStart(2, "0")} → ${e.getHours()}:${String(e.getMinutes()).padStart(2, "0")} (${minutes} phút)`;
    }

    // fallback từ item type play
    const playItem = bill.items?.find((i) => i.type === "play");
    if (playItem) {
      const minutes = playItem.minutes || 0;
      const h = Math.floor(minutes / 60);
      const m = minutes % 60;
      return `${h}h${m}m (${minutes} phút)`;
    }

    return "Không có dữ liệu";
  };

  const getItemName = (i) => {
    return (
      i.nameSnapshot ||
      i.name ||
      i.product?.name ||
      (i.type === "play" ? "Tiền giờ chơi" : null) ||
      "Không rõ"
    );
  };

  const getStaffName = (staff) => {
    if (!staff) return "Không rõ";
    if (typeof staff === "string") return staff;
    return staff.name || staff.username || "Không rõ";
  };

  if (loading) {
    return (
      <View style={styles.loadingBox}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text>Đang tải chi tiết hóa đơn...</Text>
      </View>
    );
  }

  if (!bill) {
    return (
      <View style={styles.emptyBox}>
        <Text>Không tìm thấy hóa đơn!</Text>
      </View>
    );
  }

  const tableName =
    bill.table?.name ||
    bill.tableName ||
    "Không rõ";

  const totalDiscount = Array.isArray(bill.discounts)
    ? bill.discounts.reduce((sum, d) => sum + (d.amount || 0), 0)
    : 0;

  const products = bill.items?.filter((i) => i.type === "product") || [];
  const playItem = bill.items?.find((i) => i.type === "play");

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chi tiết hóa đơn</Text>
        <View style={{ width: 26 }} />
      </View>

      {/* THÔNG TIN CƠ BẢN */}
      <View style={styles.box}>
        <Text style={styles.title}>Mã hóa đơn</Text>
        <Text style={styles.value}>{bill.code}</Text>

        <Text style={styles.title}>Bàn</Text>
        <Text style={styles.value}>{tableName}</Text>

        <Text style={styles.title}>Giờ chơi</Text>
        <Text style={styles.value}>{getPlayTime(bill)}</Text>
      </View>

      {/* SẢN PHẨM */}
      <View style={styles.box}>
        <Text style={styles.boxTitle}>Sản phẩm / dịch vụ</Text>

        {products.length > 0 ? (
          products.map((p, index) => (
            <View key={index} style={styles.productRow}>
              <Text style={styles.productName}>
                {getItemName(p)} x{p.qty || p.quantity || 1}
              </Text>
              <Text style={styles.productPrice}>
                {(p.amount || 0).toLocaleString()} đ
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.value}>Không có sản phẩm</Text>
        )}
      </View>

      {/* TIỀN GIỜ CHƠI */}
      <View style={styles.box}>
        <Text style={styles.title}>Tiền giờ chơi</Text>
        <Text style={styles.value}>
          {(playItem?.amount || bill.playAmount || 0).toLocaleString()} đ
        </Text>

        <Text style={styles.title}>Tiền dịch vụ</Text>
        <Text style={styles.value}>
          {(bill.serviceAmount || 0).toLocaleString()} đ
        </Text>

        <Text style={styles.title}>Tạm tính</Text>
        <Text style={styles.value}>
          {(bill.subTotal || 0).toLocaleString()} đ
        </Text>

        <Text style={styles.title}>Phụ thu</Text>
        <Text style={styles.value}>
          {(bill.surcharge || 0).toLocaleString()} đ
        </Text>

        <Text style={styles.title}>Giảm giá</Text>
        <Text style={styles.value}>{totalDiscount.toLocaleString()} đ</Text>

        <Text style={styles.totalLabel}>Tổng tiền</Text>
        <Text style={styles.totalValue}>
          {(bill.total || 0).toLocaleString()} đ
        </Text>
      </View>

      {/* THANH TOÁN */}
      <View style={styles.box}>
        <Text style={styles.title}>Trạng thái thanh toán</Text>
        {bill.paid ? (
          <Text style={[styles.value, { color: "#28a745" }]}>
            Đã thanh toán
            {bill.paidAt ? ` • ${new Date(bill.paidAt).toLocaleString()}` : ""}
          </Text>
        ) : (
          <Text style={[styles.value, { color: "#d9534f" }]}>
            Chưa thanh toán
          </Text>
        )}

        <Text style={styles.title}>Phương thức thanh toán</Text>
        <Text style={styles.value}>
          {bill.paymentMethod?.toUpperCase() || "KHÔNG RÕ"}
        </Text>
      </View>

      {/* THÔNG TIN KHÁC */}
      <View style={styles.box}>
        <Text style={styles.title}>Nhân viên xử lý</Text>
        <Text style={styles.value}>{getStaffName(bill.staff)}</Text>

        <Text style={styles.title}>Ghi chú</Text>
        <Text style={styles.value}>{bill. note || "—"}</Text>

        <Text style={styles.title}>Ngày tạo</Text>
        <Text style={styles.value}>
          {bill.createdAt
            ? new Date(bill.createdAt).toLocaleString()
            : "Không rõ"}
        </Text>

        <Text style={styles.title}>Ngày cập nhật</Text>
        <Text style={styles.value}>
          {bill.updatedAt
            ? new Date(bill.updatedAt).toLocaleString()
            : "Không rõ"}
        </Text>
      </View>
    </ScrollView>
  );
};

export default InvoiceDetailScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F5" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  headerTitle: { fontSize: 18, fontWeight: "600" },
  box: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 10,
    marginBottom: 16,
    elevation: 2,
  },
  boxTitle: { fontSize: 16, fontWeight: "600", marginBottom: 10 },
  title: { fontSize: 14, fontWeight: "600", marginTop: 8 },
  value: { fontSize: 14, marginTop: 2 },
  productRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  productName: { fontSize: 14 },
  productPrice: { fontSize: 14, fontWeight: "600" },
  totalLabel: { marginTop: 10, fontSize: 16, fontWeight: "700", color: "#d9534f" },
  totalValue: { fontSize: 18, fontWeight: "700", color: "#d9534f", marginTop: 4 },
  loadingBox: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyBox: { flex: 1, justifyContent: "center", alignItems: "center" },
});
